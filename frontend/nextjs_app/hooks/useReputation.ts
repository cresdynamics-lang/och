"use client"

import { useState, useEffect, useCallback } from "react"
import type { 
  CommunityReputation, 
  ReputationLeaderboard, 
  ReputationPublic 
} from "@/services/types/community"

interface UseReputationReturn {
  reputation: CommunityReputation | null
  loading: boolean
  error: string | null
  leaderboard: ReputationLeaderboard | null
  refreshReputation: () => Promise<void>
  fetchLeaderboard: (scope: 'global' | 'university', period: 'all' | 'weekly' | 'monthly') => Promise<void>
  fetchUserProfile: (userId: string) => Promise<ReputationPublic | null>
}

const API_BASE = '/api/community'

export function useReputation(userId?: string): UseReputationReturn {
  const [reputation, setReputation] = useState<CommunityReputation | null>(null)
  const [leaderboard, setLeaderboard] = useState<ReputationLeaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch current user's reputation
  const fetchReputation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/reputation/me/`)
      if (!response.ok) throw new Error('Failed to fetch reputation')
      
      const data = await response.json()
      setReputation(data)
    } catch (err: any) {
      console.error('Error fetching reputation:', err)
      setError(err.message)
    }
  }, [])

  // Refresh reputation data
  const refreshReputation = useCallback(async () => {
    setLoading(true)
    setError(null)
    await fetchReputation()
    setLoading(false)
  }, [fetchReputation])

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (
    scope: 'global' | 'university' = 'global',
    period: 'all' | 'weekly' | 'monthly' = 'all'
  ) => {
    try {
      const params = new URLSearchParams({ scope, period })
      const response = await fetch(`${API_BASE}/reputation/leaderboard/?${params}`)
      
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      
      const data = await response.json()
      setLeaderboard(data)
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err)
      setError(err.message)
    }
  }, [])

  // Fetch a specific user's public profile
  const fetchUserProfile = useCallback(async (targetUserId: string): Promise<ReputationPublic | null> => {
    try {
      const response = await fetch(`${API_BASE}/reputation/profile/?user_id=${targetUserId}`)
      
      if (!response.ok) throw new Error('Failed to fetch profile')
      
      return await response.json()
    } catch (err: any) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshReputation()
  }, [refreshReputation])

  // Set up real-time updates (polling for now, can be replaced with WebSocket)
  useEffect(() => {
    if (!userId) return

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchReputation()
    }, 30000)

    return () => clearInterval(interval)
  }, [userId, fetchReputation])

  return {
    reputation,
    loading,
    error,
    leaderboard,
    refreshReputation,
    fetchLeaderboard,
    fetchUserProfile,
  }
}

// Utility hook for displaying reputation changes
export function useReputationToast() {
  const [lastPoints, setLastPoints] = useState<number | null>(null)
  const [pointsDelta, setPointsDelta] = useState<number | null>(null)
  const [showToast, setShowToast] = useState(false)

  const trackPoints = useCallback((currentPoints: number) => {
    if (lastPoints !== null && currentPoints > lastPoints) {
      setPointsDelta(currentPoints - lastPoints)
      setShowToast(true)
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowToast(false)
        setPointsDelta(null)
      }, 3000)
    }
    setLastPoints(currentPoints)
  }, [lastPoints])

  return {
    pointsDelta,
    showToast,
    trackPoints,
    hideToast: () => setShowToast(false),
  }
}

