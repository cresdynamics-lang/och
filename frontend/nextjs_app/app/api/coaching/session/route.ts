import { NextRequest, NextResponse } from 'next/server';
// Removed Supabase import - now using Django PostgreSQL APIs

// Custom Grok client (using direct API)
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
        temperature: options.temperature || 0.3,
        max_tokens: options.max_tokens || 2000,
        stream: false,
        ...options
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error: ${response.status} ${error}`);
    }

    return await response.json();
  }
}

// Claude client
class ClaudeClient {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(messages: any[], options: any = {}) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-5-sonnet-20241022',
        messages,
        max_tokens: options.max_tokens || 2000,
        temperature: options.temperature || 0.3,
        ...options
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} ${error}`);
    }

    return await response.json();
  }
}

// Groq client
class GroqClient {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

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
        model: options.model || 'llama-3.1-8b-instant',
        messages,
        max_tokens: options.max_tokens || 2000,
        temperature: options.temperature || 0.3,
        ...options
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} ${error}`);
    }

    return await response.json();
  }
}

// Secondary Groq client removed - most secondary models are decommissioned
// Will re-enable when new secondary models become available

// Initialize clients
const grok = process.env.GROK_API_KEY ? new GrokClient(process.env.GROK_API_KEY) : null;
const claude = process.env.ANTHROPIC_API_KEY ? new ClaudeClient(process.env.ANTHROPIC_API_KEY) : null;
const groqPrimary = process.env.GROQ_API_KEY ? new GroqClient(process.env.GROQ_API_KEY) : null;

interface StudentState {
  analytics?: any;
  recipe_coverage?: any;
  track_progress?: any;
  mission_stats?: any;
  community_activity?: any;
  mentorship_status?: any;
  track_code?: string;
  circle_level?: number;
  complexity?: number;
}

// Helper function to map track_key to track_code
function getTrackCode(trackKey: string | null | undefined): string {
  if (!trackKey) return 'SOCDEFENSE'; // Default fallback
  
  const trackKeyLower = trackKey.toLowerCase();
  const trackCodeMap: Record<string, string> = {
    'defender': 'SOCDEFENSE',
    'offensive': 'OFFENSIVE',
    'grc': 'GRC',
    'innovation': 'INNOVATION',
    'leadership': 'LEADERSHIP'
  };
  
  return trackCodeMap[trackKeyLower] || 'SOCDEFENSE';
}

// Helper function to get track display name from track_code
function getTrackDisplayName(trackCode: string | null | undefined): string {
  if (!trackCode) return 'your track';
  
  const trackCodeUpper = trackCode.toUpperCase();
  // Map track codes to display names
  const trackCodeToName: Record<string, string> = {
    'SOCDEFENSE': 'SOCDEFENSE',
    'OFFENSIVE': 'OFFENSIVE',
    'GRC': 'GRC',
    'INNOVATION': 'INNOVATION',
    'LEADERSHIP': 'LEADERSHIP'
  };
  
  return trackCodeToName[trackCodeUpper] || trackCode;
}

async function getStudentState(userId: string, accessToken: string = ''): Promise<StudentState> {
  try {
    // Fetch data from Django PostgreSQL APIs
    const djangoApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      authHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Fetch user data to get track_key
    const userResponse = await fetch(`${djangoApiUrl}/api/v1/users/${userId}`, { headers: authHeaders }).catch(() => ({ ok: false }));
    const userData = userResponse && userResponse.ok ? await userResponse.json() : null;
    const userTrackKey = userData?.track_key || userData?.recommended_track || null;
    const defaultTrackCode = getTrackCode(userTrackKey);

    const [
      analyticsResponse,
      recipeProgressResponse,
      trackProgressResponse,
      missionProgressResponse,
      communityResponse,
      mentorshipResponse,
      profilerResponse
    ] = await Promise.all([
      fetch(`${djangoApiUrl}/api/v1/coaching/student-analytics`, { headers: authHeaders }),
      fetch(`${djangoApiUrl}/api/v1/coaching/recipe-progress`, { headers: authHeaders }),
      fetch(`${djangoApiUrl}/api/v1/coaching/track-progress`, { headers: authHeaders }),
      fetch(`${djangoApiUrl}/api/v1/coaching/mission-progress`, { headers: authHeaders }),
      fetch(`${djangoApiUrl}/api/v1/coaching/community-activity`, { headers: authHeaders }),
      fetch(`${djangoApiUrl}/api/v1/coaching/mentorship-sessions`, { headers: authHeaders }),
      fetch(`${djangoApiUrl}/api/v1/profiler/mentees/${userId}/results`, { headers: authHeaders }).catch(() => ({ ok: false }))
    ]);

    // Parse responses (handle 404s gracefully)
    const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : null;
    const recipeData = recipeProgressResponse.ok ? await recipeProgressResponse.json() : [];
    const trackData = trackProgressResponse.ok ? await trackProgressResponse.json() : null;
    const missionData = missionProgressResponse.ok ? await missionProgressResponse.json() : [];
    const communityData = communityResponse.ok ? await (communityResponse as Response).json() : null;
    const mentorshipData = mentorshipResponse.ok ? await (mentorshipResponse as Response).json() : [];
    const profilerData = profilerResponse && profilerResponse.ok ? await (profilerResponse as Response).json() : null;
    
    // Extract profiler data from analytics if available (coaching OS includes it)
    // Note: profiler data is used for track_code determination but not stored in StudentState
    const profilerFromAnalytics = analyticsData?.profiler || null;

    // Calculate recipe coverage
    const completedRecipes = recipeData.filter((r: any) => r.status === 'completed').length;
    const totalRecipes = recipeData.length;
    const recipeCoverage = totalRecipes > 0 ? (completedRecipes / totalRecipes) * 100 : 0;

    // Calculate mission stats
    const completedMissions = missionData.filter((m: any) => m.status === 'completed').length;
    const failedMissions = missionData.filter((m: any) => m.status === 'failed').length;
    const totalMissions = missionData.length;
    const missionCompletionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    // Determine complexity (0-1 scale)
    const complexity = Math.min(
      (failedMissions / Math.max(totalMissions, 1)) * 0.5 +
      (missionCompletionRate < 50 ? 0.3 : 0) +
      (recipeCoverage < 30 ? 0.2 : 0),
      1
    );

    // Determine track_code from multiple sources, with user track_key as priority
    const finalTrackCode = trackData?.track_code || 
                          getTrackCode(userTrackKey) ||
                          getTrackCode(profilerData?.recommended_track?.track_id) ||
                          defaultTrackCode;

    return {
      analytics: analyticsData || {
        total_missions_completed: completedMissions,
        average_score: missionData.length > 0 ? missionData.reduce((sum: number, m: any) => sum + (m.score || 0), 0) / missionData.length : 0,
        track_code: finalTrackCode,
        circle_level: trackData?.circle_level || 1
      },
      recipe_coverage: {
        percentage: recipeCoverage,
        completed: completedRecipes,
        total: totalRecipes,
        recipes: recipeData
      },
      track_progress: trackData || {
        track_code: finalTrackCode,
        circle_level: 1,
        progress_percentage: 0
      },
      mission_stats: {
        completed: completedMissions,
        failed: failedMissions,
        total: totalMissions,
        completion_rate: missionCompletionRate,
        missions: missionData
      },
      community_activity: communityData || {
        posts_count: 0,
        replies_count: 0,
        helpful_votes_received: 0
      },
      mentorship_status: mentorshipData || [],
      track_code: finalTrackCode,
      circle_level: trackData?.circle_level || 1,
      complexity: complexity
    };
  } catch (error) {
    console.error('Error fetching student state from Django:', error);
    // Try to get user track_key even in error case
    let fallbackTrackCode = 'SOCDEFENSE';
    try {
      const djangoApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
      const userResponse = await fetch(`${djangoApiUrl}/api/v1/users/${userId}`, { 
        headers: { 'Content-Type': 'application/json' } 
      }).catch(() => null);
      if (userResponse && userResponse.ok) {
        const userData = await userResponse.json();
        fallbackTrackCode = getTrackCode(userData?.track_key || userData?.recommended_track);
      }
    } catch (e) {
      // Ignore errors, use default
    }
    
    // Return mock data as fallback
    return {
      analytics: {
        total_missions_completed: 0,
        average_score: 0,
        track_code: fallbackTrackCode,
        circle_level: 1
      },
      recipe_coverage: {
        percentage: 0,
        completed: 0,
        total: 0,
        recipes: []
      },
      track_progress: {
        track_code: fallbackTrackCode,
        circle_level: 1,
        progress_percentage: 0
      },
      mission_stats: {
        completed: 0,
        failed: 0,
        total: 0,
        completion_rate: 0,
        missions: []
      },
      community_activity: {
        posts_count: 0,
        replies_count: 0,
        helpful_votes_received: 0
      },
      mentorship_status: [],
      track_code: fallbackTrackCode,
      circle_level: 1,
      complexity: 0.5
    };
  }
}

function selectModel(trigger: string, complexity: number) {
  // Priority: Speed > Cost > Reliability

  // Use Groq for all cases (fastest inference - primary choice)
  if (groqPrimary) return { name: 'groq-llama', client: groqPrimary };

  // Fallback chain: Grok > Claude
  if (grok) return { name: 'grok3', client: grok };
  if (claude) return { name: 'claude-sonnet', client: claude };

  throw new Error('No AI models configured');
}

async function grokCoachingPrompt(studentState: StudentState, context: string) {
  if (!grok) throw new Error('Grok API not configured');

  const prompt = `Coach student (${studentState.track_code} Circle ${studentState.circle_level}):

ANALYTICS: ${JSON.stringify(studentState.analytics || {}, null, 2)}

MISSION STATS: ${studentState.mission_stats?.completed || 0}/${studentState.mission_stats?.total || 0} complete, ${studentState.mission_stats?.failed || 0} failed
Completion rate: ${studentState.mission_stats?.completion_rate?.toFixed(1) || 0}%

RECIPE COVERAGE: ${studentState.recipe_coverage?.percentage?.toFixed(1) || 0}% (${studentState.recipe_coverage?.completed || 0}/${studentState.recipe_coverage?.total || 0})

COMMUNITY: ${JSON.stringify(studentState.community_activity || {}, null, 2)}

MENTORSHIP: ${JSON.stringify(studentState.mentorship_status || [], null, 2)}

Context: ${context}

Generate coaching session with priorities and actions.`;

  const response = await grok.chatCompletion([
    {
      role: "system",
      content: `You are OCH Coaching OS - AI Mentor for cybersecurity students.

CRITICAL RULES:
1. ALWAYS be encouraging, specific, actionable
2. Reference exact missions/recipes/modules
3. Suggest 1-3 next actions MAX
4. Track-aware: tailor to ${studentState.track_code}
5. Data-driven: use provided analytics
6. MUST RETURN VALID JSON ONLY - NO MARKDOWN, NO CODE BLOCKS, NO EXPLANATORY TEXT

RESPONSE FORMAT - OUTPUT ONLY THIS JSON STRUCTURE:
{
  "greeting": "Warm, personal opener",
  "diagnosis": "Current state summary (1-2 sentences)",
  "priorities": [
    {
      "priority": "high/medium/low",
      "action": "Complete Mission X",
      "reason": "Failed twice, unlocks Module 2",
      "recipes": ["sigma-basics"],
      "deadline": "2026-01-05"
    }
  ],
  "encouragement": "Motivational close",
  "actions": [
    {
      "type": "send_nudge",
      "target": "mission_card",
      "payload": {}
    }
  ]
}

DO NOT wrap the JSON in markdown code blocks. Return ONLY the raw JSON object.`
    },
    {
      role: "user",
      content: prompt
    }
  ], {
    model: "grok-4-latest",
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" } as any  // Request JSON mode if available
  });

  return response;
}

async function claudeCoachingPrompt(studentState: StudentState, context: string) {
  if (!claude) throw new Error('Claude API not configured');

  const prompt = `Coach student (${studentState.track_code} Circle ${studentState.circle_level}):

ANALYTICS: ${JSON.stringify(studentState.analytics || {}, null, 2)}

MISSION STATS: ${studentState.mission_stats?.completed || 0}/${studentState.mission_stats?.total || 0} complete, ${studentState.mission_stats?.failed || 0} failed
Completion rate: ${studentState.mission_stats?.completion_rate?.toFixed(1) || 0}%

RECIPE COVERAGE: ${studentState.recipe_coverage?.percentage?.toFixed(1) || 0}%

Context: ${context}

Generate comprehensive coaching session with learning path adjustments.`;

  const response = await claude.chatCompletion([
    {
      role: "user",
      content: `You are OCH Coaching OS - AI Mentor for cybersecurity students.

${prompt}

Provide detailed coaching with:
1. Learning path adjustments
2. Skill gap analysis
3. Timeline recommendations
4. Track-specific advice

IMPORTANT: Return ONLY valid JSON. NO markdown code blocks, NO explanatory text.

Output JSON:
{
  "greeting": "...",
  "diagnosis": "...",
  "priorities": [...],
  "encouragement": "...",
  "actions": [...],
  "path_adjustments": {...}
}`
    }
  ], {
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.3,
    max_tokens: 2000
  });

  return response;
}

async function groqCoachingPrompt(studentState: StudentState, context: string, useSecondary: boolean = false) {
  // Note: Secondary groq models removed - parameter kept for backwards compatibility
  if (!groqPrimary) throw new Error('Groq API not configured');

  const prompt = `Coach student (${studentState.track_code} Circle ${studentState.circle_level}):

ANALYTICS: ${JSON.stringify(studentState.analytics || {}, null, 2)}

MISSION STATS: ${studentState.mission_stats?.completed || 0}/${studentState.mission_stats?.total || 0} complete, ${studentState.mission_stats?.failed || 0} failed
Completion rate: ${studentState.mission_stats?.completion_rate?.toFixed(1) || 0}%

RECIPE COVERAGE: ${studentState.recipe_coverage?.percentage?.toFixed(1) || 0}%

Context: ${context}

Generate coaching session with priorities and actions.`;

  const response = await groqPrimary.chatCompletion([
    {
      role: "system",
      content: `You are OCH Coaching OS - AI Mentor for cybersecurity students.

CRITICAL RULES:
1. ALWAYS be encouraging, specific, actionable
2. Reference exact missions/recipes/modules
3. Suggest 1-2 next actions MAX
4. Tie advice to Future-You alignment score
5. Be concise (max 150 tokens)
6. MUST RETURN VALID JSON ONLY - NO MARKDOWN, NO CODE BLOCKS, NO EXPLANATORY TEXT

RESPONSE FORMAT - OUTPUT ONLY THIS JSON STRUCTURE:
{
  "greeting": "Warm, personal opener",
  "diagnosis": "Current state summary (1-2 sentences)",
  "priorities": [
    {
      "priority": "high/medium/low",
      "action": "Complete Mission X",
      "reason": "Failed twice, unlocks Module 2",
      "recipes": ["sigma-basics"],
      "deadline": "2026-01-05"
    }
  ],
  "encouragement": "Motivational close",
  "actions": [
    {
      "type": "send_nudge",
      "target": "mission_card",
      "payload": {}
    }
  ]
}

DO NOT wrap the JSON in markdown code blocks. Return ONLY the raw JSON object.`
    },
    {
      role: "user",
      content: prompt
    }
  ], {
    temperature: 0.3,
    max_tokens: 1000,  // Smaller for faster inference
    response_format: { type: "json_object" } as any  // Request JSON mode if available
  });

  return response;
}

function parseCoachingResponse(response: any, modelName: string) {
  try {
    let content = '';
    if (modelName === 'grok3' || modelName === 'groq-llama' || modelName === 'groq-mixtral') {
      content = response.choices?.[0]?.message?.content || '';
    } else if (modelName === 'claude-sonnet') {
      content = response.content?.[0]?.text || '';
    }

    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    // Try parsing as JSON
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error('Failed to parse coaching response:', error);
    console.error('Raw response:', response);

    // Try to extract content as plain text and convert to fallback structure
    let content = '';
    if (modelName === 'grok3' || modelName === 'groq-llama' || modelName === 'groq-mixtral') {
      content = response.choices?.[0]?.message?.content || '';
    } else if (modelName === 'claude-sonnet') {
      content = response.content?.[0]?.text || '';
    }

    // Return fallback structure with raw content as diagnosis
    return {
      greeting: "Hello! Let's continue your cybersecurity journey.",
      diagnosis: content.substring(0, 200) || "Ready to help you progress.",
      priorities: [],
      encouragement: "You've got this!",
      actions: []
    };
  }
}

async function executeCoachingActions(actions: any[], userId: string) {
  // Execute actions like sending nudges, updating paths, etc.
  // This is a placeholder - implement based on your action types
  for (const action of actions) {
    console.log(`Executing action: ${action.type} for user ${userId}`, action);
    // TODO: Implement action execution
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, context = 'dashboard', trigger = 'daily' } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // 1. Aggregate student state (forward user's JWT from cookie)
    const accessToken = request.cookies.get('access_token')?.value || '';
    const studentState = await getStudentState(user_id, accessToken);

    // 2. Route to correct model (may be null if no keys configured)
    let model: { name: string; client: any } | null = null;
    try {
      model = selectModel(trigger, studentState.complexity || 0.5);
    } catch {
      // No AI models configured — fall through to static fallback
    }

    let parsedAdvice: any;

    if (model?.client) {
      // 3. Generate coaching response via AI
      let coachingResponse;
      if (model.name === 'grok3') {
        coachingResponse = await grokCoachingPrompt(studentState, context);
      } else if (model.name === 'groq-llama' || model.name === 'groq-mixtral') {
        const useSecondary = model.name === 'groq-mixtral';
        coachingResponse = await groqCoachingPrompt(studentState, context, useSecondary);
      } else if (model.name === 'claude-sonnet') {
        coachingResponse = await claudeCoachingPrompt(studentState, context);
      } else {
        throw new Error(`Unsupported model: ${model.name}`);
      }

      // 4. Parse & validate response
      parsedAdvice = parseCoachingResponse(coachingResponse, model.name);
    } else {
      // Static fallback when no AI model is available
      const missionsDone = studentState.mission_stats?.completed || 0;
      const recipesPercent = studentState.recipe_coverage?.percentage?.toFixed(0) || '0';
      const trackCode = studentState.track_code || 'your track';
      const trackDisplayName = getTrackDisplayName(studentState.track_code || null);
      const circleLevel = studentState.circle_level || 1;
      
      // Dynamic encouragement messages based on track and level
      const encouragementMessages: Record<string, Record<number, string>> = {
        'SOCDEFENSE': {
          1: "Every expert defender started by learning the basics. Keep building your defense skills!",
          2: "You're strengthening your defensive capabilities. Stay vigilant!",
          3: "Your defensive expertise is growing. Keep protecting systems!",
          4: "You're becoming a master defender. Excellence in defense awaits!",
          5: "You're an elite defender. Your skills protect organizations daily!"
        },
        'OFFENSIVE': {
          1: "Every ethical hacker started with curiosity. Keep exploring safely!",
          2: "Your offensive skills are developing. Think like an attacker!",
          3: "You're mastering penetration testing. Keep finding vulnerabilities!",
          4: "You're becoming a red team expert. Your skills are in high demand!",
          5: "You're an elite offensive security specialist. Keep pushing boundaries!"
        },
        'GRC': {
          1: "Every compliance expert started by understanding frameworks. Keep learning!",
          2: "Your GRC knowledge is expanding. Governance matters!",
          3: "You're mastering risk management. Keep ensuring compliance!",
          4: "You're becoming a GRC leader. Your expertise guides organizations!",
          5: "You're an elite GRC professional. Your strategic thinking shapes security!"
        },
        'INNOVATION': {
          1: "Every innovator started with an idea. Keep creating!",
          2: "Your innovation skills are growing. Build something amazing!",
          3: "You're mastering security innovation. Keep pushing boundaries!",
          4: "You're becoming a security innovator. Your creations protect millions!",
          5: "You're an elite security innovator. Your innovations shape the future!"
        },
        'LEADERSHIP': {
          1: "Every leader started by learning. Keep developing your leadership skills!",
          2: "Your leadership capabilities are expanding. Lead with purpose!",
          3: "You're mastering cybersecurity leadership. Keep inspiring teams!",
          4: "You're becoming a security executive. Your vision drives change!",
          5: "You're an elite cybersecurity leader. Your leadership transforms organizations!"
        }
      };
      
      const encouragement = encouragementMessages[trackCode]?.[circleLevel] || 
                           encouragementMessages[trackCode]?.[1] || 
                           "Every expert was once a beginner. Keep going!";

      parsedAdvice = {
        greeting: "Welcome back to your cybersecurity journey!",
        diagnosis: `You're on the ${trackDisplayName} track. ${missionsDone} mission${missionsDone !== 1 ? 's' : ''} completed, recipe coverage at ${recipesPercent}%.`,
        priorities: [
          {
            priority: 'high',
            action: 'Continue your next mission',
            reason: 'Missions are the fastest way to build hands-on skills',
            recipes: [],
            deadline: null
          },
          {
            priority: 'medium',
            action: `Explore recipes for your ${trackDisplayName} track`,
            reason: `Recipes reinforce the concepts needed for ${trackDisplayName}`,
            recipes: [],
            deadline: null
          }
        ],
        encouragement: encouragement,
        actions: [
          { type: 'send_nudge', target: 'missions', payload: {} },
          { type: 'send_nudge', target: 'recipes', payload: {} }
        ]
      };
    }

    // 5. Execute actions
    if (parsedAdvice.actions && Array.isArray(parsedAdvice.actions)) {
      await executeCoachingActions(parsedAdvice.actions, user_id);
    }

    // 6. Save session to Django PostgreSQL (always try)
    try {
      const djangoApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
      const saveHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) saveHeaders['Authorization'] = `Bearer ${accessToken}`;
      await fetch(`${djangoApiUrl}/api/v1/coaching/sessions`, {
        method: 'POST',
        headers: saveHeaders,
        body: JSON.stringify({
          user_id,
          trigger,
          context,
          advice: parsedAdvice,
          model_used: model?.name || 'static-fallback',
          complexity_score: studentState.complexity
        })
      });
    } catch (error) {
      console.warn('Failed to save coaching session to Django:', error);
    }

    return NextResponse.json({ 
      session: { user_id, trigger, context },
      advice: parsedAdvice,
      model: model?.name || 'static-fallback'
    });

  } catch (error: any) {
    console.error('Coaching session failed:', error);
    return NextResponse.json({ 
      error: 'Coaching failed',
      message: error.message 
    }, { status: 500 });
  }
}
