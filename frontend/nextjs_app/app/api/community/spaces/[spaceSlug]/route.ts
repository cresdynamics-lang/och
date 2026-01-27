import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with database queries
const mockSpaces = {
  'defender-beginner': {
    id: 'defender-beginner-space',
    slug: 'defender-beginner',
    title: 'Defender Beginner',
    track_code: 'defender',
    level_slug: 'beginner',
    description: 'Community space for Defender track beginners',
    is_global: false,
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
  'announcements': {
    id: 'announcements-space',
    slug: 'announcements',
    title: 'OCH Announcements',
    description: 'Official announcements and updates',
    is_global: true,
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
};

/**
 * GET /api/community/spaces/[spaceSlug]
 * Returns detailed space information with channels
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { spaceSlug: string } }
) {
  try {
    const spaceSlug = params.spaceSlug;
    const space = mockSpaces[spaceSlug as keyof typeof mockSpaces];

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    // In production, check user permissions for this space
    // const userId = getAuthenticatedUserId(request);
    // const hasAccess = await checkSpaceAccess(userId, space.id);

    return NextResponse.json({
      space: {
        ...space,
        user_role: 'student', // Mock user role
        member_count: 150, // Mock member count
        is_member: true // Mock membership status
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch space details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch space details' },
      { status: 500 }
    );
  }
}
