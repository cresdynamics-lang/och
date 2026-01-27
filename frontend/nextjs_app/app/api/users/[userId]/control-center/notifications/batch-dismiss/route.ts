import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/users/:userId/control-center/notifications/batch-dismiss
 * Dismiss multiple notifications at once
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const body = await request.json();
    const { notification_ids } = body;

    if (!userId || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json(
        { error: 'User ID and non-empty notification_ids array are required' },
        { status: 400 }
      );
    }

    // In production, this would update multiple user_notifications records
    console.log(`Dismissing ${notification_ids.length} notifications for user ${userId}:`, notification_ids);

    // Mock successful batch dismiss
    const dismissed_at = new Date().toISOString();
    const mockResult = {
      user_id: userId,
      notification_ids,
      dismissed_count: notification_ids.length,
      dismissed_at,
      success: true
    };

    return NextResponse.json(mockResult);

  } catch (error: any) {
    console.error('Batch dismiss notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss notifications' },
      { status: 500 }
    );
  }
}
