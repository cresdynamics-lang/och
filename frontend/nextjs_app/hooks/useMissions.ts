'use client'

import { useState, useEffect, useCallback } from 'react'
import { missionsClient } from '@/services/missionsClient'
import type { Mission, RecommendedMission } from '@/services/types/missions'

export function useMissions(menteeId: string | undefined) {
  const [inProgress, setInProgress] = useState<Mission[]>([])
  const [nextRecommended, setNextRecommended] = useState<RecommendedMission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [inProgressData, recommendedData] = await Promise.all([
        missionsClient.getInProgressMissions(menteeId),
        missionsClient.getNextRecommended(menteeId),
      ])

      setInProgress(inProgressData)
      setNextRecommended(recommendedData)
    } catch (err: any) {
      setError(err.message || 'Failed to load missions')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const startMission = useCallback(async (missionId: string) => {
    if (!menteeId) return

    try {
      const mission = await missionsClient.startMission(menteeId, missionId)
      await loadData() // Refresh list
      return mission
    } catch (err: any) {
      throw new Error(err.message || 'Failed to start mission')
    }
  }, [menteeId, loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    inProgress,
    nextRecommended,
    isLoading,
    error,
    reload: loadData,
    startMission,
  }
}
