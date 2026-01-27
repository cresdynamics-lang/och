import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with database queries
const mockThreads = {
  'help-channel': [
    {
      id: 'thread-1',
      title: 'Help with Windows Event Viewer',
      created_by: {
        id: 'user-1',
        email: 'student1@och.edu',
        display_name: 'Alex Johnson'
      },
      thread_type: 'generic',
      is_locked: false,
      is_pinned: true,
      message_count: 12,
      last_message_at: '2026-01-27T10:30:00Z',
      created_at: '2026-01-27T08:00:00Z',
      last_message_preview: 'Thanks for the help! That worked perfectly.'
    },
    {
      id: 'thread-2',
      title: 'Understanding Failed Logon Events',
      created_by: {
        id: 'user-2',
        email: 'student2@och.edu',
        display_name: 'Maria Garcia'
      },
      thread_type: 'module',
      module_id: 'log-analysis-module',
      is_locked: false,
      is_pinned: false,
      message_count: 8,
      last_message_at: '2026-01-27T09:15:00Z',
      created_at: '2026-01-26T14:30:00Z',
      last_message_preview: 'The event ID 4625 indicates failed authentication.'
    }
  ],
  'missions-channel': [
    {
      id: 'thread-3',
      title: 'Discussion: Failed Login Hunt',
      created_by: {
        id: 'user-3',
        email: 'student3@och.edu',
        display_name: 'David Chen'
      },
      thread_type: 'mission',
      mission_id: 'failed-logon-hunt-mission',
      is_locked: false,
      is_pinned: false,
      message_count: 25,
      last_message_at: '2026-01-27T11:00:00Z',
      created_at: '2026-01-25T10:00:00Z',
      last_message_preview: 'I found 15 failed logins from the same IP!'
    }
  ]
};

/**
 * GET /api/community/channels/[channelId]/threads
 * Returns threads for a specific channel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channelId = params.channelId;
    const threads = mockThreads[channelId as keyof typeof mockThreads] || [];

    // In production, add pagination, sorting, filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const paginatedThreads = threads.slice(offset, offset + limit);

    return NextResponse.json({
      threads: paginatedThreads,
      total_count: threads.length,
      has_more: offset + limit < threads.length
    });

  } catch (error: any) {
    console.error('Failed to fetch channel threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/channels/[channelId]/threads
 * Creates a new thread in the specified channel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const channelId = params.channelId;
    const body = await request.json();
    const { title, thread_type, mission_id, recipe_slug, module_id } = body;

    if (!title || !thread_type) {
      return NextResponse.json(
        { error: 'Title and thread_type are required' },
        { status: 400 }
      );
    }

    // Mock user authentication
    const userId = 'mock-user-id'; // In production: get from auth

    // Check permissions (can user create threads?)
    // Mock permission check
    const canCreateThreads = true;

    if (!canCreateThreads) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create threads' },
        { status: 403 }
      );
    }

    // Create thread (mock)
    const newThread = {
      id: `thread-${Date.now()}`,
      title,
      created_by: {
        id: userId,
        email: 'user@och.edu',
        display_name: 'Current User'
      },
      thread_type,
      mission_id,
      recipe_slug,
      module_id,
      is_locked: false,
      is_pinned: false,
      message_count: 0,
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString()
    };

    // In production: save to database and emit coaching event

    return NextResponse.json({
      thread: newThread,
      message: 'Thread created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
