'use client'

import { useState, useEffect, useCallback } from 'react'
import { gamificationClient } from '@/services/gamificationClient'
import type { GamificationBadge, Streak, GamificationLeaderboardEntry, Points } from '@/services/types/gamification'

export function useGamification(menteeId: string | undefined) {
  const [badges, setBadges] = useState<GamificationBadge[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [leaderboard, setLeaderboard] = useState<GamificationLeaderboardEntry[]>([])
  const [points, setPoints] = useState<Points | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [badgesData, streaksData, pointsData] = await Promise.all([
        gamificationClient.getBadges(menteeId),
        gamificationClient.getStreaks(menteeId),
        gamificationClient.getPoints(menteeId),
      ])

      setBadges(badgesData)
      setStreaks(streaksData)
      setPoints(pointsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load gamification data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const loadLeaderboard = useCallback(async (trackId?: string, category?: string) => {
    try {
      const data = await gamificationClient.getLeaderboard(trackId, category)
      setLeaderboard(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    badges,
    streaks,
    leaderboard,
    points,
    isLoading,
    error,
    reload: loadData,
    loadLeaderboard,
  }
}

