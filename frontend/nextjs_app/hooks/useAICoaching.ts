'use client'

import { useState, useEffect, useCallback } from 'react'
import { coachingClient } from '@/services/coachingClient'
import { cacheManager, STORES } from '@/utils/cache'
import type { DailyNudge, SentimentAnalysis, AICoachMessage, LearningPlan } from '@/services/types/coaching'

export function useAICoaching(menteeId: string | undefined) {
  const [nudges, setNudges] = useState<DailyNudge[]>([])
  const [coachMessages, setCoachMessages] = useState<AICoachMessage[]>([])
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNudges = useCallback(async () => {
    if (!menteeId) return

    try {
      // Try cache first
      const cached = await cacheManager.get<DailyNudge[]>(STORES.COACHING, `nudges_${menteeId}`)
      if (cached) {
        setNudges(cached)
      }

      // Fetch fresh data
      const data = await coachingClient.getDailyNudges(menteeId)
      setNudges(data)
      await cacheManager.set(STORES.COACHING, `nudges_${menteeId}`, data, 60) // Cache for 1 hour
    } catch (err: any) {
      setError(err.message || 'Failed to load nudges')
      // Use cached data if available
      const cached = await cacheManager.get<DailyNudge[]>(STORES.COACHING, `nudges_${menteeId}`)
      if (cached) setNudges(cached)
    }
  }, [menteeId])

  const loadCoachMessages = useCallback(async () => {
    if (!menteeId) return

    try {
      const data = await coachingClient.getCoachMessages(menteeId)
      setCoachMessages(data)
      await cacheManager.set(STORES.COACHING, `messages_${menteeId}`, data, 30)
    } catch (err: any) {
      setError(err.message || 'Failed to load coach messages')
    }
  }, [menteeId])

  const analyzeSentiment = useCallback(async (reflectionId: string, content: string): Promise<SentimentAnalysis> => {
    try {
      const analysis = await coachingClient.analyzeSentiment(reflectionId, content)
      return analysis
    } catch (err: any) {
      throw new Error(err.message || 'Failed to analyze sentiment')
    }
  }, [])

  const requestNewPlan = useCallback(async (preferences?: any) => {
    if (!menteeId) return

    try {
      const plan = await coachingClient.requestLearningPlan(menteeId, preferences)
      setLearningPlan(plan)
      await cacheManager.set(STORES.COACHING, `plan_${menteeId}`, plan, 120)
      return plan
    } catch (err: any) {
      throw new Error(err.message || 'Failed to request learning plan')
    }
  }, [menteeId])

  const refreshRecommendations = useCallback(async () => {
    if (!menteeId) return

    try {
      const result = await coachingClient.refreshRecommendations(menteeId)
      if (result.learning_plan) {
        setLearningPlan(result.learning_plan)
        await cacheManager.set(STORES.COACHING, `plan_${menteeId}`, result.learning_plan, 120)
      }
      return result
    } catch (err: any) {
      throw new Error(err.message || 'Failed to refresh recommendations')
    }
  }, [menteeId])

  useEffect(() => {
    if (menteeId) {
      setIsLoading(true)
      Promise.all([loadNudges(), loadCoachMessages()]).finally(() => {
        setIsLoading(false)
      })
    }
  }, [menteeId, loadNudges, loadCoachMessages])

  return {
    nudges,
    coachMessages,
    learningPlan,
    isLoading,
    error,
    analyzeSentiment,
    requestNewPlan,
    refreshRecommendations,
    reload: () => {
      if (menteeId) {
        loadNudges()
        loadCoachMessages()
      }
    },
  }
}

