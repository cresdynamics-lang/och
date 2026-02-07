import { NextRequest, NextResponse } from 'next/server';

// Mock Innovation progress data - replace with database queries
const mockInnovationProgress = {
  track_slug: 'innovation',
  level_progress: [
    {
      level_slug: 'beginner',
      title: 'Beginner',
      videos_completed: 0,
      quizzes_completed: 0,
      assessment_completed: false,
      total_videos: 9,
      total_quizzes: 3,
      percent_complete: 0,
      last_activity: null
    },
    {
      level_slug: 'intermediate',
      title: 'Intermediate',
      videos_completed: 0,
      quizzes_completed: 0,
      assessment_completed: false,
      total_videos: 9,
      total_quizzes: 3,
      percent_complete: 0,
      last_activity: null
    },
    {
      level_slug: 'advanced',
      title: 'Advanced',
      videos_completed: 0,
      quizzes_completed: 0,
      assessment_completed: false,
      total_videos: 9,
      total_quizzes: 3,
      percent_complete: 0,
      last_activity: null
    },
    {
      level_slug: 'mastery',
      title: 'Mastery',
      videos_completed: 0,
      quizzes_completed: 0,
      assessment_completed: false,
      total_videos: 9,
      total_quizzes: 3,
      percent_complete: 0,
      last_activity: null
    }
  ],
  overall_progress: {
    videos_completed: 0,
    quizzes_completed: 0,
    assessments_completed: 0,
    total_videos: 36,
    total_quizzes: 12,
    total_assessments: 4,
    percent_complete: 0
  }
};

/**
 * GET /api/users/[userId]/curriculum/innovation/progress
 * Returns user's progress in the Innovation curriculum track
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // In production, this would query the database for user progress
    // const progress = await getUserInnovationProgress(userId);

    return NextResponse.json(mockInnovationProgress);

  } catch (error: any) {
    console.error('Failed to fetch Innovation progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Innovation progress' },
      { status: 500 }
    );
  }
}
