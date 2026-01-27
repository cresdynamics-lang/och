import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/community/messages/[messageId]/reactions
 * Adds a reaction to a message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const messageId = params.messageId;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // Mock user authentication
    const userId = 'mock-user-id'; // In production: get from auth

    // Check permissions (can user react to messages?)
    const canReact = true; // Mock permission check

    if (!canReact) {
      return NextResponse.json(
        { error: 'Insufficient permissions to react to messages' },
        { status: 403 }
      );
    }

    // Create reaction (mock)
    const reaction = {
      id: `reaction-${Date.now()}`,
      message_id: messageId,
      user_id: userId,
      emoji,
      created_at: new Date().toISOString()
    };

    // In production: save to database and emit event

    return NextResponse.json({
      reaction,
      message: 'Reaction added successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to add reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/messages/[messageId]/reactions
 * Removes a reaction from a message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const messageId = params.messageId;
    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji parameter is required' },
        { status: 400 }
      );
    }

    // Mock user authentication
    const userId = 'mock-user-id'; // In production: get from auth

    // Remove reaction (mock)
    // In production: delete from database where message_id, user_id, emoji match

    return NextResponse.json({
      message: 'Reaction removed successfully'
    });

  } catch (error: any) {
    console.error('Failed to remove reaction:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}
