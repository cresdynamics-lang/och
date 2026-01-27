import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with database queries
const mockMessages = {
  'thread-1': [
    {
      id: 'msg-1',
      author: {
        id: 'user-1',
        email: 'student1@och.edu',
        display_name: 'Alex Johnson'
      },
      body: 'Hi everyone! I\'m having trouble with Windows Event Viewer. When I try to open it, I get an error. Has anyone seen this before?',
      reply_to_message_id: null,
      has_ai_flag: false,
      metadata: {},
      created_at: '2026-01-27T08:00:00Z',
      reactions: [
        { emoji: '👍', count: 2, users: ['user-2', 'user-3'] }
      ]
    },
    {
      id: 'msg-2',
      author: {
        id: 'mentor-1',
        email: 'mentor@och.edu',
        display_name: 'Sarah Mentor'
      },
      body: 'Hi Alex! Are you running Event Viewer as Administrator? Right-click on Event Viewer and select "Run as administrator". That usually fixes permission issues.',
      reply_to_message_id: null,
      has_ai_flag: false,
      metadata: {},
      created_at: '2026-01-27T08:05:00Z',
      reactions: [
        { emoji: '✅', count: 1, users: ['user-1'] }
      ]
    },
    {
      id: 'msg-3',
      author: {
        id: 'user-1',
        email: 'student1@och.edu',
        display_name: 'Alex Johnson'
      },
      body: 'Thanks Sarah! That worked perfectly. I can see all the events now.',
      reply_to_message_id: 'msg-2',
      has_ai_flag: false,
      metadata: {},
      created_at: '2026-01-27T08:10:00Z',
      reactions: []
    }
  ],
  'thread-2': [
    {
      id: 'msg-4',
      author: {
        id: 'user-2',
        email: 'student2@och.edu',
        display_name: 'Maria Garcia'
      },
      body: 'Can someone explain the difference between Event ID 4624 and 4625?',
      reply_to_message_id: null,
      has_ai_flag: false,
      metadata: {},
      created_at: '2026-01-26T14:30:00Z',
      reactions: []
    }
  ]
};

/**
 * GET /api/community/threads/[threadId]/messages
 * Returns messages for a specific thread with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const threadId = params.threadId;
    const messages = mockMessages[threadId as keyof typeof mockMessages] || [];

    // Handle pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor'); // For cursor-based pagination

    // Simple pagination for mock data
    const startIndex = cursor ? parseInt(cursor) : 0;
    const paginatedMessages = messages.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < messages.length;
    const nextCursor = hasMore ? (startIndex + limit).toString() : null;

    return NextResponse.json({
      messages: paginatedMessages,
      has_more: hasMore,
      next_cursor: nextCursor,
      total_count: messages.length
    });

  } catch (error: any) {
    console.error('Failed to fetch thread messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/threads/[threadId]/messages
 * Creates a new message in the specified thread
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const threadId = params.threadId;
    const body = await request.json();
    const { body: messageBody, reply_to_message_id } = body;

    if (!messageBody || messageBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message body is required' },
        { status: 400 }
      );
    }

    // Mock user authentication
    const userId = 'mock-user-id'; // In production: get from auth

    // Check if thread exists and user can post
    const threadMessages = mockMessages[threadId as keyof typeof mockMessages];
    if (!threadMessages) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Check permissions (can user post messages?)
    const canPostMessages = true; // Mock permission check

    if (!canPostMessages) {
      return NextResponse.json(
        { error: 'Insufficient permissions to post messages' },
        { status: 403 }
      );
    }

    // AI moderation check (mock)
    const hasAiFlag = messageBody.toLowerCase().includes('cheat') ||
                     messageBody.toLowerCase().includes('hack');
    const aiFlagReason = hasAiFlag ? 'Potential policy violation detected' : null;

    // Create message (mock)
    const newMessage = {
      id: `msg-${Date.now()}`,
      author: {
        id: userId,
        email: 'user@och.edu',
        display_name: 'Current User'
      },
      body: messageBody,
      reply_to_message_id: reply_to_message_id || null,
      has_ai_flag: hasAiFlag,
      ai_flag_reason: aiFlagReason,
      metadata: {},
      created_at: new Date().toISOString(),
      reactions: []
    };

    // In production:
    // 1. Save to database
    // 2. Update thread last_message_at and message_count
    // 3. Emit coaching event for community.message.created
    // 4. Run AI moderation if needed

    return NextResponse.json({
      message: newMessage,
      status: 'Message posted successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to post message' },
      { status: 500 }
    );
  }
}
