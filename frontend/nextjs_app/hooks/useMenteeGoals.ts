'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { MenteeGoal } from '@/services/types/mentor'

const USE_MOCK_DATA = false // Backend is ready

export function useMenteeGoals(mentorId: string | undefined, params?: {
  mentee_id?: string
  goal_type?: 'monthly' | 'weekly'
  status?: 'pending' | 'in_progress' | 'completed'
}) {
  const [goals, setGoals] = useState<MenteeGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getMenteeGoals(mentorId, params)
      setGoals(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load goals')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId, params?.mentee_id, params?.goal_type, params?.status])

  useEffect(() => {
    load()
  }, [load])

  const provideFeedback = useCallback(async (goalId: string, feedback: string) => {
    try {
      const updated = await mentorClient.provideGoalFeedback(goalId, { feedback })
      await load()
      return updated
    } catch (err: any) {
      setError(err.message || 'Failed to provide feedback')
      throw err
    }
  }, [load])

  return { goals, isLoading, error, reload: load, provideFeedback }
}


