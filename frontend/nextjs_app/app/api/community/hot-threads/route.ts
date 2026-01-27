import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with database queries and analytics
const mockHotThreads = [
  {
    id: 'thread-1',
    title: 'Help with Windows Event Viewer',
    channel_title: '#defender-beginner-help',
    space_slug: 'defender-beginner',
    message_count: 12,
    last_message_at: '2026-01-27T10:30:00Z',
    track_code: 'defender',
    level_slug: 'beginner',
    thread_type: 'generic'
  },
  {
    id: 'thread-3',
    title: 'Discussion: Failed Login Hunt',
    channel_title: '#defender-beginner-missions',
    space_slug: 'defender-beginner',
    message_count: 25,
    last_message_at: '2026-01-27T11:00:00Z',
    track_code: 'defender',
    level_slug: 'beginner',
    thread_type: 'mission',
    mission_id: 'failed-logon-hunt-mission'
  },
  {
    id: 'recipe-thread-1',
    title: 'Log Parsing Basics - Questions?',
    channel_title: '#defender-beginner-recipes',
    space_slug: 'defender-beginner',
    message_count: 8,
    last_message_at: '2026-01-27T09:00:00Z',
    track_code: 'defender',
    level_slug: 'beginner',
    thread_type: 'recipe',
    recipe_slug: 'defender-log-parsing-basics'
  }
];

/**
 * GET /api/community/hot-threads
 * Returns trending/active threads for coaching recommendations
 * Query params: track_code?, level_slug?, limit?
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackCode = searchParams.get('track_code');
    const levelSlug = searchParams.get('level_slug');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Filter threads based on parameters
    let filteredThreads = mockHotThreads;

    if (trackCode) {
      filteredThreads = filteredThreads.filter(t => t.track_code === trackCode);
    }

    if (levelSlug) {
      filteredThreads = filteredThreads.filter(t => t.level_slug === levelSlug);
    }

    // Sort by activity (message count and recency)
    const sortedThreads = filteredThreads
      .sort((a, b) => {
        const aScore = a.message_count + (new Date(a.last_message_at).getTime() / 1000000000);
        const bScore = b.message_count + (new Date(b.last_message_at).getTime() / 1000000000);
        return bScore - aScore;
      })
      .slice(0, limit);

    return NextResponse.json({
      threads: sortedThreads,
      filters_applied: {
        track_code: trackCode,
        level_slug: levelSlug
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch hot threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hot threads' },
      { status: 500 }
    );
  }
}
