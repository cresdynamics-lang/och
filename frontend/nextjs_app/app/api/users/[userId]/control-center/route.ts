import { NextRequest, NextResponse } from 'next/server';
import {
  computeNextActions,
  getControlCenterNotifications,
  getControlCenterSummary,
  type ControlCenterData
} from '@/lib/control-center';

/**
 * GET /api/users/:userId/control-center
 * Returns unified control center feed with next actions, notifications, and summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Compute next actions from various sources
    const next_actions = await computeNextActions(userId);

    // Get notifications feed
    const notifications = await getControlCenterNotifications(userId);

    // Get summary statistics
    const summary = await getControlCenterSummary(userId);

    const response: ControlCenterData = {
      userId,
      next_actions,
      notifications,
      summary
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Control center API error:', error);
    return NextResponse.json(
      { error: 'Failed to load control center data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/:userId/control-center/notifications/:notificationId/read
 * Mark a specific notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; notificationId: string }> }
) {
  try {
    const { userId } = await params;
    const { notificationId } = await params;

    if (!userId || !notificationId) {
      return NextResponse.json(
        { error: 'User ID and notification ID are required' },
        { status: 400 }
      );
    }

    // In production, this would update the user_notifications table
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);

    // Mock successful update
    return NextResponse.json({
      success: true,
      notification_id: notificationId,
      marked_read: true
    });

  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/:userId/control-center/notifications/batch-dismiss
 * Dismiss multiple notifications
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { notification_ids } = body;

    if (!userId || !Array.isArray(notification_ids)) {
      return NextResponse.json(
        { error: 'User ID and notification_ids array are required' },
        { status: 400 }
      );
    }

    // In production, this would update multiple user_notifications records
    console.log(`Dismissing ${notification_ids.length} notifications for user ${userId}:`, notification_ids);

    // Mock successful batch dismiss
    return NextResponse.json({
      success: true,
      dismissed_count: notification_ids.length,
      notification_ids
    });

  } catch (error: any) {
    console.error('Batch dismiss notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss notifications' },
      { status: 500 }
    );
  }
}
