import { NextRequest, NextResponse } from 'next/server'
import { apiGateway } from '@/services/apiGateway'

/**
 * GET /api/mentors/[mentorSlug]/students/[studentId]
 * Fetch detailed student information for mentor view
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorSlug: string; studentId: string }> }
) {
  try {
    const { mentorSlug, studentId } = await params

    if (!mentorSlug || !studentId) {
      return NextResponse.json(
        { error: 'Mentor slug and student ID are required' },
        { status: 400 }
      )
    }

    // Fetch student detail data from Django
    // Authentication is handled by apiGateway via tokens in cookies
    const studentData = await apiGateway.get(`/mentors/${mentorSlug}/students/${studentId}/`)

    return NextResponse.json(studentData)

  } catch (error: any) {
    console.error('Mentor student detail API error:', error)

    // Handle specific error types
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view this student.' },
        { status: 403 }
      )
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Student not found or not assigned to this mentor.' },
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
      { error: 'Failed to load student details' },
      { status: 500 }
    )
  }
}
