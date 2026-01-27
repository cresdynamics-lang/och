import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/users/:userId/notifications
 * Create a new notification for a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const notificationData = await request.json();

    const {
      title,
      body,
      type,
      track_slug,
      level_slug,
      source_id,
      action_url,
      priority = 3,
      expires_in_days = 7
    } = notificationData;

    if (!userId || !title || !body || !type) {
      return NextResponse.json(
        { error: 'user_id, title, body, and type are required' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const expires_at = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // In production, this would insert into user_notifications table
    console.log(`Creating notification for user ${userId}:`, {
      title,
      body,
      type,
      priority,
      expires_at
    });

    // Mock notification creation
    const mockNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      title,
      body,
      type,
      track_slug,
      level_slug,
      source_id,
      action_url,
      priority,
      is_read: false,
      created_at: new Date().toISOString(),
      expires_at,
      dismissed_at: null
    };

    return NextResponse.json({
      success: true,
      notification: mockNotification
    });

  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
