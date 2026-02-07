import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/community/messages/[messageId]/flag
 * Flags a message for moderation review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required for flagging' },
        { status: 400 }
      );
    }

    // Mock user authentication
    const userId = 'mock-user-id'; // In production: get from auth

    // Create moderation action (mock)
    const moderationAction = {
      id: `moderation-${Date.now()}`,
      moderator_id: userId,
      message_id: messageId,
      action_type: 'flag',
      reason,
      created_at: new Date().toISOString()
    };

    // In production:
    // 1. Update message.has_ai_flag = true if not already
    // 2. Create CommunityModerationAction record
    // 3. Emit ai.guardrail.breached event
    // 4. Notify moderators

    return NextResponse.json({
      moderation_action: moderationAction,
      message: 'Message flagged for moderation'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to flag message:', error);
    return NextResponse.json(
      { error: 'Failed to flag message' },
      { status: 500 }
    );
  }
}
