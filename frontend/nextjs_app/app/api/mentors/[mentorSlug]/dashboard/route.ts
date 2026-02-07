import { NextRequest, NextResponse } from 'next/server'
import { apiGateway } from '@/services/apiGateway'

/**
 * GET /api/mentors/[mentorSlug]/dashboard
 * Fetch mentor dashboard data from Django backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorSlug: string }> }
) {
  try {
    const { mentorSlug } = await params;

    if (!mentorSlug) {
      return NextResponse.json(
        { error: 'Mentor slug is required' },
        { status: 400 }
      )
    }

    // Fetch mentor dashboard data from Django
    // Authentication is handled by apiGateway via tokens in cookies
    const dashboardData = await apiGateway.get(`/mentors/${mentorSlug}/dashboard/`)

    return NextResponse.json(dashboardData)

  } catch (error: any) {
    console.error('Mentor dashboard API error:', error)

    // Handle specific error types
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view this mentor dashboard.' },
        { status: 403 }
      )
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Mentor not found or dashboard not available.' },
        { status: 404 }
      )
    }

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to load mentor dashboard data' },
      { status: 500 }
    )
  }
}
