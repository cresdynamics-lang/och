import { NextRequest, NextResponse } from 'next/server';
import { emitCurriculumVideoCompleted, emitCurriculumQuizCompleted } from '@/lib/coaching-events';

interface CurriculumProgressUpdate {
  content_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  quiz_score?: number;
}

/**
 * POST /api/users/:userId/curriculum-progress
 * Update curriculum content progress and emit coaching events
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const body: CurriculumProgressUpdate = await request.json();

    const { content_id, status, quiz_score } = body;

    if (!content_id || !status) {
      return NextResponse.json(
        { error: 'content_id and status are required' },
        { status: 400 }
      );
    }

    // For now, we'll mock the database update since the backend isn't running
    // In production, this would update the user_content_progress table
    console.log(`Updating curriculum progress for user ${userId}:`, {
      content_id,
      status,
      quiz_score
    });

    // Mock successful database update
    const mockUpdateResult = {
      user_id: userId,
      content_id,
      status,
      quiz_score,
      updated_at: new Date().toISOString()
    };

    // Emit coaching events based on completion type
    if (status === 'completed') {
      // Parse content_id to extract metadata (in production this would come from DB)
      // For now, we'll use mock data to demonstrate the concept
      const mockContentMetadata = parseContentIdForMetadata(content_id);

      if (mockContentMetadata) {
        if (mockContentMetadata.type === 'video') {
          await emitCurriculumVideoCompleted(
            userId,
            mockContentMetadata.track_slug,
            mockContentMetadata.level_slug,
            mockContentMetadata.module_slug,
            mockContentMetadata.content_slug
          );
        } else if (mockContentMetadata.type === 'quiz' && quiz_score !== undefined) {
          await emitCurriculumQuizCompleted(
            userId,
            mockContentMetadata.track_slug,
            mockContentMetadata.level_slug,
            mockContentMetadata.module_slug,
            mockContentMetadata.content_slug,
            quiz_score
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      progress: mockUpdateResult
    });

  } catch (error: any) {
    console.error('Curriculum progress update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update curriculum progress' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to parse content_id and extract metadata
 * In production, this information would be retrieved from the database
 */
function parseContentIdForMetadata(contentId: string) {
  // Mock parsing logic - in production this would query the curriculum_content table
  // to get track_slug, level_slug, module_slug, content_slug, and type

  // Example content_id format: "defender-beginner-log-analysis-fundamentals-what-are-logs-video"
  const parts = contentId.split('-');

  if (parts.length >= 6) {
    const [track_slug, level_slug, ...rest] = parts;
    const content_slug = rest.slice(-2, -1)[0]; // Second to last part
    const type = rest.slice(-1)[0]; // Last part (video/quiz)

    // Find module_slug (everything between level_slug and content_slug)
    const moduleParts = rest.slice(0, -2);
    const module_slug = moduleParts.join('-');

    return {
      track_slug,
      level_slug,
      module_slug,
      content_slug,
      type: type === 'video' ? 'video' : 'quiz'
    };
  }

  return null;
}
