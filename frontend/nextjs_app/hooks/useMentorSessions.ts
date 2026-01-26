'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { GroupMentorshipSession } from '@/services/types/mentor'

const USE_MOCK_DATA = false // Backend is ready

export function useMentorSessions(mentorId: string | undefined, params?: {
  status?: 'scheduled' | 'completed' | 'all'
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) {
  const [sessions, setSessions] = useState<GroupMentorshipSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    count: number
    page: number
    page_size: number
    total_pages: number
    next: string | null
    previous: string | null
  } | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getGroupSessions(mentorId, params)
      const sessions = Array.isArray(data) ? data : ((data as any).results || [])
      setSessions(sessions)
      if ((data as any).count !== undefined) {
        setPagination({
          count: (data as any).count,
          page: (data as any).page || 1,
          page_size: (data as any).page_size || 10,
          total_pages: (data as any).total_pages || 1,
          next: (data as any).next || null,
          previous: (data as any).previous || null,
        })
      } else {
        // Handle non-paginated response (backward compatibility)
        setPagination(null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.status, params?.start_date, params?.end_date, params?.page, params?.page_size])

  useEffect(() => {
    load()
  }, [load])

  const createSession = useCallback(async (data: {
    title: string
    description: string
    scheduled_at: string
    duration_minutes: number
    meeting_type: 'zoom' | 'google_meet' | 'in_person'
    meeting_link?: string
    track_assignment?: string
    cohort_id?: string
  }) => {
    if (!mentorId) {
      const errorMsg = 'Mentor ID is required to create a session'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      console.log('useMentorSessions: Creating session with mentorId:', mentorId, 'data:', data)
      const newSession = await mentorClient.createGroupSession(mentorId, data)
      console.log('useMentorSessions: Session created successfully:', newSession)
      await load()
      return newSession
    } catch (err: any) {
      console.error('useMentorSessions: Error creating session:', err)
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data,
        response: err.response,
        stack: err.stack
      })
      // Log the full error object
      if (err.data) {
        console.error('Error data from backend:', err.data)
      }
      const errorMsg = err.message || err.data?.error || err.data?.details || 'Failed to create session'
      setError(errorMsg)
      throw err
    }
  }, [mentorId, load])

  const updateSession = useCallback(async (sessionId: string, data: {
    recording_url?: string
    transcript_url?: string
    attendance?: Array<{
      mentee_id: string
      attended: boolean
      joined_at?: string
      left_at?: string
    }>
    structured_notes?: {
      key_takeaways?: string[]
      action_items?: Array<{ item: string; assignee?: string }>
      discussion_points?: string
      challenges?: string
      wins?: string
      next_steps?: string
      mentor_reflections?: string
      linked_goals?: string[]
      attached_files?: Array<{ name: string; url: string }>
    }
    scheduled_at?: string
    duration_minutes?: number
    is_closed?: boolean
    attended?: boolean
    cancelled?: boolean
    cancellation_reason?: string
  }) => {
    try {
      const updated = await mentorClient.updateGroupSession(sessionId, data)
      await load()
      return updated
    } catch (err: any) {
      setError(err.message || 'Failed to update session')
      throw err
    }
  }, [load])

  return { sessions, isLoading, error, reload: load, createSession, updateSession, pagination }
}


