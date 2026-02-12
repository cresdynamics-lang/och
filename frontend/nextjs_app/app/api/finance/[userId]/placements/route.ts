import { NextRequest, NextResponse } from 'next/server';

/**
 * Finance placements API
 *
 * For now this endpoint returns an empty list but is wired to real auth and
 * Django so we can later attach a dedicated placements endpoint without
 * shipping any dummy candidate data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // We intentionally don't fabricate placement records here – the frontend
  // components will treat an empty array as "no placement data yet".
  try {
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error('Finance placements API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

