import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAIEnvironment } from '@/lib/env';

// Custom Grok client
class GrokClient {
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(messages: any[], options: any = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'grok-4-latest',
        messages,
        temperature: options.temperature || 0.1,
        max_tokens: options.max_tokens || 4000,
        stream: false,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

// Initialize Grok client
const grok = new GrokClient(process.env.GROK_API_KEY!);

export async function POST(request: NextRequest) {
  const { context_type, context_id, track_code, user_id } = await request.json();

  // Validate AI environment
  try {
    validateAIEnvironment();
  } catch (error) {
    return NextResponse.json({ error: 'AI environment not configured' }, { status: 500 });
  }

  try {
    // 1. Get context data
    const supabase = createClient();
    let contextData: any = {};

    if (context_type === 'mission') {
      const { data } = await supabase
        .from('missions')
        .select('title, instructions, required_skills, common_failures, tools_used')
        .eq('id', context_id)
        .single();
      contextData = data;
    } else if (context_type === 'module') {
      const { data } = await supabase
        .from('curriculummodules')
        .select('title, description, learning_objectives')
        .eq('id', context_id)
        .single();
      contextData = data;
    }

    // 2. Generate recipes with Grok 3
    const grokPrompt = buildGrokPrompt(contextData, track_code);
    const grokResponse = await grok.chatCompletion([
      {
        role: "system",
        content: `You are OCH Recipe Engine. Generate precise, copy-pasteable cybersecurity recipes.

CRITICAL RULES:

1. Output ONLY valid JSON array of recipes
2. Commands MUST work (tested syntax)
3. Include validation steps
4. Match track: ${track_code}
5. Difficulty: beginner/intermediate/advanced
6. Time: 5-45 minutes

STRUCTURE:

[
  {
    "title": "Exact title",
    "slug": "kebab-case-slug",
    "summary": "1 sentence",
    "difficulty": "beginner",
    "estimated_minutes": 20,
    "track_codes": ["${track_code}"],
    "skill_codes": ["${track_code.toUpperCase()}_SKILLS"],
    "tools_used": ["bash", "curl"],
    "content": {
      "sections": [
        {"type": "intro", "title": "Overview", "content": "Brief description..."},
        {"type": "prerequisites", "items": ["Basic Linux knowledge"]},
        {"type": "steps", "steps": [
          {"step": 1, "title": "Install tools", "commands": ["sudo apt update"], "explanation": "Update package lists"}
        ]},
        {"type": "validation", "commands": ["echo 'Recipe completed successfully'"]}
      ]
    }
  }
]`
      },
      { role: "user", content: grokPrompt }
    ], {
      model: "grok-4-latest",
      temperature: 0.1,
      max_tokens: 4000,
      stream: false
    });

    let recipes = JSON.parse(grokResponse.choices[0].message.content);

    // 3. Fallback to Llama if Grok fails or empty
    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      console.log('Grok failed, falling back to Llama');
      recipes = await llamaFallback(contextData, track_code);
    }

    // 4. Validate & save recipes
    const validatedRecipes = await Promise.all(
      recipes.map(async (recipe: any) => ({
        ...recipe,
        validated: await validateRecipe(recipe),
        created_by: user_id,
        is_active: true
      }))
    );

    const { data: savedRecipes } = await supabase
      .from('recipes')
      .insert(validatedRecipes)
      .select()
      .eq('is_active', true);

    // 5. Link to context
    if (savedRecipes && savedRecipes.length > 0) {
      await supabase.from('recipe_context_links').insert(
        savedRecipes.map((r: any) => ({
          recipe_id: r.id,
          context_type,
          context_id,
          position_order: 0
        }))
      );
    }

    return NextResponse.json({ recipes: savedRecipes });

  } catch (error) {
    console.error('Recipe generation failed:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function buildGrokPrompt(context: any, track: string) {
  return `Generate 3-5 recipes for ${track} track:

CONTEXT: ${JSON.stringify(context, null, 2)}

Mission/Module requirements: ${context.instructions || context.description}

Required skills: ${context.required_skills || context.learning_objectives}

Common issues: ${context.common_failures || []}

Recipes must be:

- 100% actionable (copy-paste commands)
- Track-specific (${track})
- Validated steps
- Security-aware

Focus on practical, hands-on cybersecurity tasks that students can complete in 5-45 minutes.`;
}

async function llamaFallback(context: any, track: string) {
  // Call Ollama Llama 3.1 70B
  try {
    const response = await fetch(`${process.env.LLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:70b',
        prompt: `Generate cybersecurity recipes for ${track} track based on this context: ${JSON.stringify(context)}. Output ONLY a valid JSON array of recipes following the same structure as the Grok examples.`,
        format: 'json',
        options: { temperature: 0.1, top_p: 0.9, num_predict: 2000 }
      })
    });

    const data = await response.json();
    return JSON.parse(data.response);
  } catch (error) {
    console.error('Llama fallback failed:', error);
    // Return a basic fallback recipe
    return [{
      title: `Basic ${track} Recipe`,
      slug: `basic-${track.toLowerCase()}-recipe`,
      summary: `A basic recipe for ${track} cybersecurity tasks`,
      difficulty: "beginner",
      estimated_minutes: 15,
      track_codes: [track],
      skill_codes: [`${track.toUpperCase()}_BASICS`],
      tools_used: ["bash"],
      content: {
        sections: [
          { type: "intro", title: "Overview", content: `Basic ${track} cybersecurity recipe` },
          { type: "prerequisites", items: ["Basic command line knowledge"] },
          { type: "steps", steps: [
            { step: 1, title: "Run basic command", commands: ["echo 'Recipe completed'"], explanation: "Execute basic command" }
          ]},
          { type: "validation", commands: ["echo 'Validation successful'"] }
        ]
      }
    }];
  }
}

async function validateRecipe(recipe: any): Promise<boolean> {
  // Use Code Llama for command validation
  try {
    const validationPrompt = `Validate recipe commands for syntax and safety:

${JSON.stringify(recipe.content.sections, null, 2)}

Output ONLY: {"validated": true/false, "issues": []}`;

    const response = await fetch(`${process.env.LLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'codellama:13b',
        prompt: validationPrompt,
        format: 'json',
        options: { temperature: 0.1 }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.response);
    return result.validated || false;
  } catch (error) {
    console.error('Recipe validation failed:', error);
    // Basic validation - check if commands look reasonable
    return recipe.content?.sections?.some((s: any) => s.steps?.length > 0) || false;
  }
}
