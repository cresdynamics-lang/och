import { NextRequest, NextResponse } from 'next/server'
import { apiGateway } from '@/services/apiGateway'

/**
 * POST /api/mentors/[mentorSlug]/students/[studentId]/notes
 * Add a note to a student
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mentorSlug: string; studentId: string }> }
) {
  try {
    const { mentorSlug, studentId } = params

    if (!mentorSlug || !studentId) {
      return NextResponse.json(
        { error: 'Mentor slug and student ID are required' },
        { status: 400 }
      )
    }

    // Parse request body
    // Authentication is handled by apiGateway via tokens in cookies
    const body = await request.json()
    const { note_type, content } = body

    if (!note_type || !content) {
      return NextResponse.json(
        { error: 'Note type and content are required' },
        { status: 400 }
      )
    }

    // Validate note type
    const validTypes = ['strength', 'improvement', 'action_item']
    if (!validTypes.includes(note_type)) {
      return NextResponse.json(
        { error: 'Invalid note type. Must be: strength, improvement, or action_item' },
        { status: 400 }
      )
    }

    // Add note via Django API
    const noteData = await apiGateway.post(`/mentors/${mentorSlug}/students/${studentId}/notes/`, {
      note_type,
      content,
    })

    return NextResponse.json(noteData)

  } catch (error: any) {
    console.error('Add student note API error:', error)

    // Handle specific error types
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to add notes for this student.' },
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
      { error: 'Failed to add note' },
      { status: 500 }
    )
  }
}
