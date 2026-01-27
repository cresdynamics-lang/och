import { NextRequest, NextResponse } from 'next/server';

interface Recommendation {
  type: 'video' | 'recipe' | 'mission';
  level_slug?: string;
  module_slug?: string;
  content_slug?: string;
  recipe_slug?: string;
  mission_slug?: string;
  reason: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_time?: string;
}

/**
 * GET /api/users/:userId/coaching/recommendations
 * Returns AI coach recommendations for next best actions
 * Query params: track_slug? (defaults to defender)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { searchParams } = new URL(request.url);
    const trackSlug = searchParams.get('track_slug') || 'defender';

    if (trackSlug !== 'defender' && trackSlug !== 'grc') {
      return NextResponse.json(
        { error: 'Only defender and GRC track recommendations are currently supported' },
        { status: 400 }
      );
    }

    // In production, this would query the database for actual user progress
    // For now, we'll use mock logic based on the user's progress state
    const recommendations = await generateRecommendations(userId, trackSlug);

    return NextResponse.json({
      user_id: userId,
      track_slug: trackSlug,
      recommendations: recommendations.slice(0, 3), // Return up to 3 recommendations
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Failed to generate recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Generate heuristic-based recommendations
 * In production, this would use AI/ML to provide personalized recommendations
 */
async function generateRecommendations(userId: string, trackSlug: string): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Mock user progress data - in production this would come from database queries
  const mockUserProgress = {
    beginner: {
      videos_completed: 4,
      quizzes_completed: 2,
      assessment_completed: false,
      total_videos: 9,
      total_quizzes: 3
    },
    intermediate: {
      videos_completed: 0,
      quizzes_completed: 0,
      assessment_completed: false,
      total_videos: 9,
      total_quizzes: 3
    }
  };

  // Priority 1: Incomplete videos in current level
  if (mockUserProgress.beginner.videos_completed < mockUserProgress.beginner.total_videos) {
    recommendations.push({
      type: 'video',
      level_slug: 'beginner',
      module_slug: 'log-analysis-fundamentals',
      content_slug: 'common-security-event-ids',
      reason: 'Continue building foundational log analysis skills',
      priority: 'high',
      estimated_time: '7 min'
    });
  }

  // Priority 2: Supporting recipes for current level
  const beginnerRecipes = ['defender-log-parsing-basics', 'defender-siem-search-basics'];
  recommendations.push({
    type: 'recipe',
    recipe_slug: 'defender-log-parsing-basics',
    reason: 'Practice hands-on log parsing techniques from the videos',
    priority: 'medium',
    estimated_time: '20 min'
  });

  // Priority 3: Next level preparation or assessment
  if (mockUserProgress.beginner.videos_completed >= mockUserProgress.beginner.total_videos &&
      mockUserProgress.beginner.quizzes_completed >= mockUserProgress.beginner.total_quizzes) {

    // Assessment if not completed
    if (!mockUserProgress.beginner.assessment_completed) {
      recommendations.push({
        type: 'mission',
        mission_slug: 'failed-logon-hunt',
        reason: 'Apply your beginner skills in a real-world scenario',
        priority: 'high',
        estimated_time: '30 min'
      });
    } else {
      // Next level first video
      recommendations.push({
        type: 'video',
        level_slug: 'intermediate',
        module_slug: 'advanced-log-correlation',
        content_slug: 'correlation-basics',
        reason: 'Advance to intermediate level content',
        priority: 'medium',
        estimated_time: '10 min'
      });
    }
  }

  // Priority 4: Additional recipes if user has completed some content
  if (mockUserProgress.beginner.videos_completed >= 3) {
    recommendations.push({
      type: 'recipe',
      recipe_slug: 'defender-siem-search-basics',
      reason: 'Reinforce SIEM search concepts with practical exercises',
      priority: 'low',
      estimated_time: '15 min'
    });
  }

  return recommendations;
}
