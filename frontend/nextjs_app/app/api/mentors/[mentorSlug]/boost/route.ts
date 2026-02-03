import { NextRequest, NextResponse } from 'next/server'
import { apiGateway } from '@/services/apiGateway'

/**
 * POST /api/mentors/[mentorSlug]/boost
 * Trigger AI interventions for students or cohorts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { mentorSlug: string } }
) {
  try {
    const mentorSlug = params.mentorSlug

    if (!mentorSlug) {
      return NextResponse.json(
        { error: 'Mentor slug is required' },
        { status: 400 }
      )
    }

    // Parse request body
    // Authentication is handled by apiGateway via tokens in cookies
    const body = await request.json()
    const { type, target_ids, track_slug } = body

    if (!type || !target_ids || !Array.isArray(target_ids)) {
      return NextResponse.json(
        { error: 'Type and target_ids array are required' },
        { status: 400 }
      )
    }

    if (!['student', 'cohort'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "student" or "cohort"' },
        { status: 400 }
      )
    }

    if (target_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one target ID is required' },
        { status: 400 }
      )
    }

    // Trigger boost via Django API
    const boostResult = await apiGateway.post(`/mentors/${mentorSlug}/boost/`, {
      type,
      target_ids,
      track_slug,
    })

    return NextResponse.json(boostResult)

  } catch (error: any) {
    console.error('Mentor boost API error:', error)

    // Handle specific error types
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to boost students.' },
        { status: 403 }
      )
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Mentor not found or boost target not available.' },
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
      { error: 'Failed to trigger boost interventions' },
      { status: 500 }
    )
  }
}
