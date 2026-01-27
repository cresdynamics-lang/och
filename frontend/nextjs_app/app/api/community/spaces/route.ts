import { NextRequest, NextResponse } from 'next/server';

// Mock data for development - replace with actual database calls
const mockSpaces = [
  {
    id: 'defender-beginner-space',
    slug: 'defender-beginner',
    title: 'Defender Beginner',
    track_code: 'defender',
    level_slug: 'beginner',
    description: 'Community space for Defender track beginners',
    is_global: false,
    user_role: 'student',
    channels: [
      {
        id: 'help-channel',
        slug: 'help',
        title: '#defender-beginner-help',
        description: 'Get help with Defender concepts',
        channel_type: 'text',
        sort_order: 1,
        is_hidden: false
      },
      {
        id: 'missions-channel',
        slug: 'missions',
        title: '#defender-beginner-missions',
        description: 'Discuss missions and share solutions',
        channel_type: 'text',
        sort_order: 2,
        is_hidden: false
      },
      {
        id: 'recipes-channel',
        slug: 'recipes',
        title: '#defender-beginner-recipes',
        description: 'Recipe discussions and tips',
        channel_type: 'text',
        sort_order: 3,
        is_hidden: false
      }
    ]
  },
  {
    id: 'announcements-space',
    slug: 'announcements',
    title: 'OCH Announcements',
    description: 'Official announcements and updates',
    is_global: true,
    user_role: 'student',
    channels: [
      {
        id: 'general-announcements',
        slug: 'general',
        title: '#announcements',
        description: 'General announcements',
        channel_type: 'announcement',
        sort_order: 1,
        is_hidden: false
      }
    ]
  }
];

/**
 * GET /api/community/spaces
 * Returns user's accessible community spaces with roles
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would:
    // 1. Get authenticated user
    // 2. Query CommunitySpaceMember for user's spaces and roles
    // 3. Include channel information
    // 4. Check permissions and entitlements

    // Mock implementation
    const userId = request.headers.get('user-id') || 'mock-user';

    // Simulate user having access to defender spaces
    const userSpaces = mockSpaces.filter(space =>
      space.is_global || space.track_code === 'defender'
    ).map(space => ({
      ...space,
      user_role: 'student' // Mock role
    }));

    return NextResponse.json({
      spaces: userSpaces,
      user_id: userId
    });

  } catch (error: any) {
    console.error('Failed to fetch community spaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community spaces' },
      { status: 500 }
    );
  }
}
