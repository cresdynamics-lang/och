'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { MissionSubmission } from '@/services/types/mentor'

const USE_MOCK_DATA = false // Backend is ready

export function useMentorMissions(mentorId: string | undefined, params?: {
  status?: 'pending_review' | 'in_review' | 'all'
  limit?: number
  offset?: number
}) {
  const [missions, setMissions] = useState<MissionSubmission[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getMissionSubmissionQueue(mentorId, params)
      setMissions(data.results)
      setCount(data.count)
    } catch (err: any) {
      setError(err.message || 'Failed to load missions')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.status, params?.limit, params?.offset])

  const updateMissionStatus = useCallback(async (submissionId: string, status: 'approved' | 'needs_revision') => {
    try {
      if (status === 'approved') {
        await mentorClient.submitMissionReview(submissionId, {
          overall_status: 'pass',
          feedback: { written: 'Approved' }
        })
      } else {
        await mentorClient.submitMissionReview(submissionId, {
          overall_status: 'needs_revision',
          feedback: { written: 'Please resubmit with improvements' }
        })
      }
      await load()
      return { success: true }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update mission status')
    }
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  return { missions, totalCount: count, isLoading, error, reload: load, updateMissionStatus }
}


