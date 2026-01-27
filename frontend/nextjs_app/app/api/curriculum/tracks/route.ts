import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with database queries
const mockTracks = [
  {
    slug: 'defender',
    title: 'Defender Track',
    description: 'Comprehensive cybersecurity defense training from fundamentals to advanced techniques.',
    icon_key: 'defender',
    level_count: 4,
    total_hours: 32,
    is_active: true
  },
  {
    slug: 'grc',
    title: 'GRC Track',
    description: 'Governance, Risk, and Compliance for modern cyber programs.',
    icon_key: 'grc',
    level_count: 4,
    total_hours: 48,
    is_active: true
  }
];

/**
 * GET /api/curriculum/tracks
 * Returns all available curriculum tracks with summary information
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would query the database
    // const tracks = await getCurriculumTracks();

    return NextResponse.json({
      tracks: mockTracks
    });

  } catch (error: any) {
    console.error('Failed to fetch curriculum tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curriculum tracks' },
      { status: 500 }
    );
  }
}
