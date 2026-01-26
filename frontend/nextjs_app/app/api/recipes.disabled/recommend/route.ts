import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { grok } from '@/lib/ai/grok-client';

export async function POST(request: NextRequest) {
  const { context_type, context_id, user_id, track_code } = await request.json();

  try {
    const supabase = createClient();

    // 1. Get library recipes matching context
    let query = supabase
      .from('recipes')
      .select(`
        *,
        context_links:recipe_context_links!recipe_id (
          context_type, context_id
        ),
        progress:user_recipe_progress!user_id=eq.${user_id}(status, rating)
      `)
      .eq('track_codes', `cs.${track_code}`)
      .eq('is_active', true)
      .order('avg_rating', { ascending: false });

    // 2. AI ranking boost
    const { data: candidates } = await query.limit(20);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ recommendations: [], message: 'No recipes found for this context' });
    }

    // Get context data for AI ranking
    let contextData: any = {};
    if (context_type === 'mission') {
      const { data } = await supabase
        .from('missions')
        .select('title, instructions, required_skills, common_failures')
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

    const aiRanking = await grokRankRecipes(candidates, context_type, contextData, track_code);

    // 3. Generate new if gaps found
    if (aiRanking.gaps.length > 0) {
      try {
        const newRecipes = await generateGapRecipes(aiRanking.gaps, track_code, context_type, context_id, user_id);
        if (newRecipes && newRecipes.length > 0) {
          aiRanking.top_recipes.unshift(...newRecipes);
        }
      } catch (error) {
        console.error('Failed to generate gap recipes:', error);
        // Continue with existing recipes
      }
    }

    return NextResponse.json({ recommendations: aiRanking.top_recipes });

  } catch (error) {
    console.error('Contextual recommendations failed:', error);
    return NextResponse.json({ error: 'Recommendations failed' }, { status: 500 });
  }
}

async function grokRankRecipes(candidates: any[], contextType: string, contextData: any, trackCode: string) {
  // Fallback if Grok not available
  if (!grok) {
    console.warn('Grok client not available, using fallback ranking');
    return {
      top_recipes: candidates.slice(0, 5).map(c => ({ ...c, ai_relevance: 0.7 })),
      gaps: [],
      reasons: {}
    };
  }

  try {
    const grokPrompt = `Rank these recipes for ${contextType} context:

Context: ${JSON.stringify(contextData, null, 2)}

Track: ${trackCode}

Recipes: ${JSON.stringify(candidates.map(c => ({
      id: c.id,
      title: c.title,
      difficulty: c.difficulty,
      avg_rating: c.avg_rating,
      usage_count: c.usage_count
    })), null, 2)}

Output JSON: {"ranked_ids": ["id1", "id2"], "gaps": ["missing_skill_areas"], "reasons": {...}}`;

    const grokResponse = await grok.chatCompletion([
      {
        role: "system",
        content: "You are an AI that ranks cybersecurity recipes based on contextual relevance. Output ONLY valid JSON."
      },
      { role: "user", content: grokPrompt }
    ], {
      model: "grok-beta",
      temperature: 0.1,
      max_tokens: 1000
    });

    const ranking = JSON.parse(grokResponse.choices[0].message.content);

    const topRecipes = ranking.ranked_ids
      .map((id: string) => candidates.find(c => c.id === id))
      .filter(Boolean)
      .slice(0, 5);

    return {
      top_recipes: topRecipes,
      gaps: ranking.gaps || []
    };

  } catch (error) {
    console.error('Grok ranking failed, using fallback:', error);
    // Fallback: return top rated recipes
    return {
      top_recipes: candidates.slice(0, 5),
      gaps: []
    };
  }
}

async function generateGapRecipes(gaps: string[], trackCode: string, contextType: string, contextId: string, userId: string) {
  try {
    const gapPrompt = `Generate recipes to fill these gaps: ${gaps.join(', ')}

Track: ${trackCode}
Context Type: ${contextType}

Output 1-2 recipes in the same JSON format.`;

    const grokResponse = await grok.chatCompletion([
      {
        role: "system",
        content: "Generate cybersecurity recipes to fill skill gaps. Output ONLY valid JSON array."
      },
      { role: "user", content: gapPrompt }
    ], {
      model: "grok-beta",
      temperature: 0.2,
      max_tokens: 2000
    });

    const newRecipes = JSON.parse(grokResponse.choices[0].message.content);

    // Save new recipes
    const supabase = createClient();
    const validatedRecipes = newRecipes.map((recipe: any) => ({
      ...recipe,
      validated: true,
      created_by: userId,
      is_active: true
    }));

    const { data: savedRecipes } = await supabase
      .from('recipes')
      .insert(validatedRecipes)
      .select();

    if (savedRecipes && savedRecipes.length > 0) {
      // Link to context
      await supabase.from('recipe_context_links').insert(
        savedRecipes.map((r: any) => ({
          recipe_id: r.id,
          context_type: contextType,
          context_id: contextId,
          position_order: 0
        }))
      );
    }

    return savedRecipes || [];

  } catch (error) {
    console.error('Gap recipe generation failed:', error);
    return [];
  }
}
