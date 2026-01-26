"use client"

import { useState, useEffect, useMemo } from "react"

/**
 * User Circle/Phase badge information from Profiler
 */
export interface UserCircleBadge {
  circleLevel: number
  phaseName: string
  phaseNumber: number
  badgeColor: string
  badgeIcon: string
  isAdvanced: boolean
}

/**
 * Achievement badge from Missions/Profiler
 */
export interface AchievementBadge {
  id: string
  name: string
  description: string
  iconUrl?: string
  type: 'mission' | 'circle' | 'certification' | 'special' | 'community'
  earnedAt: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

/**
 * User profiler data aggregated for community display
 */
export interface UserProfilerData {
  userId: string
  circleInfo: UserCircleBadge | null
  badges: AchievementBadge[]
  totalScore: number
  missionsCompleted: number
  activeMissionId?: string
}

// Circle badge configurations
const CIRCLE_BADGES: Record<number, Omit<UserCircleBadge, 'phaseName' | 'phaseNumber'>> = {
  1: { circleLevel: 1, badgeColor: 'from-emerald-400 to-green-600', badgeIcon: '🌱', isAdvanced: false },
  2: { circleLevel: 2, badgeColor: 'from-blue-400 to-indigo-600', badgeIcon: '🔵', isAdvanced: false },
  3: { circleLevel: 3, badgeColor: 'from-purple-400 to-violet-600', badgeIcon: '💜', isAdvanced: false },
  4: { circleLevel: 4, badgeColor: 'from-amber-400 to-orange-600', badgeIcon: '🔶', isAdvanced: true },
  5: { circleLevel: 5, badgeColor: 'from-rose-400 to-red-600', badgeIcon: '🏆', isAdvanced: true },
}

const PHASE_NAMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Building',
  3: 'Mastery',
  4: 'Expert',
}

/**
 * Hook to fetch and manage user profiler data for community display
 */
export function useProfilerIntegration(userId: string | null) {
  const [profilerData, setProfilerData] = useState<UserProfilerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setProfilerData(null)
      return
    }

    const fetchProfilerData = async () => {
      setLoading(true)
      setError(null)

      try {
        // In production, this would call the actual Profiler/Missions API
        // For now, we simulate the data structure
        const response = await simulateProfilerFetch(userId)
        setProfilerData(response)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profiler data'))
      } finally {
        setLoading(false)
      }
    }

    fetchProfilerData()
  }, [userId])

  return { profilerData, loading, error }
}

/**
 * Hook to get a user's circle badge display
 */
export function useCircleBadge(circleLevel: number | null, phaseNumber: number | null): UserCircleBadge | null {
  return useMemo(() => {
    if (circleLevel === null || phaseNumber === null) return null

    const circleConfig = CIRCLE_BADGES[circleLevel]
    if (!circleConfig) return null

    return {
      ...circleConfig,
      phaseName: PHASE_NAMES[phaseNumber] || 'Unknown',
      phaseNumber,
    }
  }, [circleLevel, phaseNumber])
}

/**
 * Hook to check if user has earned specific badges
 */
export function useUserBadges(userId: string | null) {
  const [badges, setBadges] = useState<AchievementBadge[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setBadges([])
      return
    }

    const fetchBadges = async () => {
      setLoading(true)
      try {
        // In production, fetch from Missions/Portfolio API
        const data = await simulateBadgeFetch(userId)
        setBadges(data)
      } catch (err) {
        console.error('Failed to fetch badges:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [userId])

  return { badges, loading }
}

/**
 * Get badge rarity color class
 */
export function getBadgeRarityColor(rarity: AchievementBadge['rarity']): string {
  switch (rarity) {
    case 'legendary': return 'from-amber-400 via-yellow-300 to-amber-500'
    case 'epic': return 'from-purple-400 via-violet-400 to-purple-500'
    case 'rare': return 'from-blue-400 via-cyan-400 to-blue-500'
    case 'uncommon': return 'from-green-400 via-emerald-400 to-green-500'
    default: return 'from-slate-400 via-gray-400 to-slate-500'
  }
}

/**
 * Format circle badge for display
 */
export function formatCircleBadge(badge: UserCircleBadge): string {
  return `Circle ${badge.circleLevel} - ${badge.phaseName}`
}

// Simulation functions (to be replaced with actual API calls)
async function simulateProfilerFetch(userId: string): Promise<UserProfilerData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))

  // Generate mock data based on userId hash
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  const circleLevel = (hash % 5) + 1
  const phaseNumber = (hash % 4) + 1

  return {
    userId,
    circleInfo: {
      ...CIRCLE_BADGES[circleLevel],
      phaseName: PHASE_NAMES[phaseNumber],
      phaseNumber,
    },
    badges: await simulateBadgeFetch(userId),
    totalScore: (hash * 100) % 10000,
    missionsCompleted: (hash % 50) + 1,
  }
}

async function simulateBadgeFetch(userId: string): Promise<AchievementBadge[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  const badges: AchievementBadge[] = []

  // Generate 1-5 badges based on user
  const count = (hash % 5) + 1
  const types: AchievementBadge['type'][] = ['mission', 'circle', 'certification', 'special', 'community']
  const rarities: AchievementBadge['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

  for (let i = 0; i < count; i++) {
    badges.push({
      id: `badge-${userId}-${i}`,
      name: `Achievement ${i + 1}`,
      description: `Earned through dedication and hard work`,
      type: types[(hash + i) % types.length],
      rarity: rarities[(hash + i) % rarities.length],
      earnedAt: new Date(Date.now() - (i * 86400000)).toISOString(),
    })
  }

  return badges
}

/**
 * Hook to listen for achievement events to auto-create posts
 */
export function useAchievementListener(
  onAchievement: (achievement: { type: string; data: any }) => void
) {
  useEffect(() => {
    // In production, this would connect to a WebSocket or event bus
    // to receive real-time achievement notifications from Missions/Portfolio
    
    const handleAchievementEvent = (event: CustomEvent<{ type: string; data: any }>) => {
      onAchievement(event.detail)
    }

    window.addEventListener('och:achievement', handleAchievementEvent as EventListener)
    
    return () => {
      window.removeEventListener('och:achievement', handleAchievementEvent as EventListener)
    }
  }, [onAchievement])
}

/**
 * Emit an achievement event (for testing/dev purposes)
 */
export function emitAchievementEvent(type: string, data: any) {
  const event = new CustomEvent('och:achievement', {
    detail: { type, data }
  })
  window.dispatchEvent(event)
}

