"use client"

import { useState, useCallback, useEffect } from "react"
import type { CommunityEvent } from "@/services/types/community"

/**
 * Competition/Event registration status
 */
export type RegistrationStatus = 'not_registered' | 'pending' | 'registered' | 'waitlisted' | 'cancelled'

/**
 * Competition details from Competitions engine
 */
export interface CompetitionDetails {
  id: string
  title: string
  description: string
  type: 'ctf' | 'hackathon' | 'webinar' | 'workshop' | 'challenge' | 'tournament'
  startTime: string
  endTime: string
  registrationDeadline?: string
  maxParticipants?: number
  currentParticipants: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  prizes?: string[]
  requirements?: string[]
  hostUniversity?: string
  isGlobal: boolean
  registrationUrl?: string
  competitionUrl?: string
  rules?: string
  categories?: string[]
}

/**
 * User's registration for a competition
 */
export interface UserRegistration {
  competitionId: string
  userId: string
  status: RegistrationStatus
  registeredAt?: string
  teamId?: string
  teamName?: string
}

/**
 * Hook to integrate with Competitions engine for event registration
 */
export function useCompetitionsIntegration(userId: string | null) {
  const [registrations, setRegistrations] = useState<Map<string, UserRegistration>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [error, setError] = useState<Error | null>(null)

  // Check registration status for a competition
  const checkRegistration = useCallback(async (competitionId: string): Promise<UserRegistration | null> => {
    if (!userId) return null

    // Check cache first
    if (registrations.has(competitionId)) {
      return registrations.get(competitionId)!
    }

    try {
      // In production, this would call the Competitions API
      // GET /api/competitions/{competitionId}/registration/{userId}
      const response = await simulateCheckRegistration(competitionId, userId)
      
      if (response) {
        setRegistrations(prev => new Map(prev).set(competitionId, response))
      }
      
      return response
    } catch (err) {
      console.error('Failed to check registration:', err)
      return null
    }
  }, [userId, registrations])

  // Register for a competition
  const registerForCompetition = useCallback(async (
    competitionId: string,
    teamId?: string
  ): Promise<boolean> => {
    if (!userId) {
      setError(new Error('Must be logged in to register'))
      return false
    }

    setLoading(prev => new Set(prev).add(competitionId))
    setError(null)

    try {
      // In production, this would call the Competitions API
      // POST /api/competitions/{competitionId}/register
      const registration = await simulateRegister(competitionId, userId, teamId)
      
      setRegistrations(prev => new Map(prev).set(competitionId, registration))
      
      // Emit event for analytics/TalentScope
      window.dispatchEvent(new CustomEvent('och:competition-register', {
        detail: { competitionId, userId, teamId }
      }))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Registration failed'))
      return false
    } finally {
      setLoading(prev => {
        const next = new Set(prev)
        next.delete(competitionId)
        return next
      })
    }
  }, [userId])

  // Cancel registration
  const cancelRegistration = useCallback(async (competitionId: string): Promise<boolean> => {
    if (!userId) return false

    setLoading(prev => new Set(prev).add(competitionId))

    try {
      // In production: DELETE /api/competitions/{competitionId}/registration/{userId}
      await simulateCancelRegistration(competitionId, userId)
      
      setRegistrations(prev => {
        const next = new Map(prev)
        const current = next.get(competitionId)
        if (current) {
          next.set(competitionId, { ...current, status: 'cancelled' })
        }
        return next
      })
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Cancellation failed'))
      return false
    } finally {
      setLoading(prev => {
        const next = new Set(prev)
        next.delete(competitionId)
        return next
      })
    }
  }, [userId])

  // Get registration status
  const getRegistrationStatus = useCallback((competitionId: string): RegistrationStatus => {
    return registrations.get(competitionId)?.status || 'not_registered'
  }, [registrations])

  // Check if currently loading
  const isLoading = useCallback((competitionId: string): boolean => {
    return loading.has(competitionId)
  }, [loading])

  return {
    registrations,
    loading,
    error,
    checkRegistration,
    registerForCompetition,
    cancelRegistration,
    getRegistrationStatus,
    isLoading,
  }
}

/**
 * Convert a CommunityEvent to CompetitionDetails for display
 */
export function eventToCompetition(event: CommunityEvent): CompetitionDetails | null {
  if (!(event as any).is_competition) return null

  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    type: (event.event_type as CompetitionDetails['type']) || 'challenge',
    startTime: (event as any).start_time,
    endTime: (event as any).end_time || (event as any).start_time,
    maxParticipants: (event as any).max_participants || undefined,
    currentParticipants: (event as any).participant_count,
    isGlobal: (event as any).is_global,
    registrationUrl: (event as any).registration_url || undefined,
    hostUniversity: (event as any).university_name || undefined,
  }
}

/**
 * Get competition type badge color
 */
export function getCompetitionTypeColor(type: CompetitionDetails['type']): string {
  switch (type) {
    case 'ctf': return 'bg-red-500/20 text-red-400'
    case 'hackathon': return 'bg-purple-500/20 text-purple-400'
    case 'webinar': return 'bg-blue-500/20 text-blue-400'
    case 'workshop': return 'bg-green-500/20 text-green-400'
    case 'challenge': return 'bg-amber-500/20 text-amber-400'
    case 'tournament': return 'bg-rose-500/20 text-rose-400'
    default: return 'bg-slate-500/20 text-slate-400'
  }
}

/**
 * Get registration status badge color
 */
export function getRegistrationStatusColor(status: RegistrationStatus): string {
  switch (status) {
    case 'registered': return 'bg-emerald-500/20 text-emerald-400'
    case 'pending': return 'bg-amber-500/20 text-amber-400'
    case 'waitlisted': return 'bg-blue-500/20 text-blue-400'
    case 'cancelled': return 'bg-red-500/20 text-red-400'
    default: return 'bg-slate-500/20 text-slate-400'
  }
}

// Simulation functions (replace with actual API calls)
async function simulateCheckRegistration(
  competitionId: string, 
  userId: string
): Promise<UserRegistration | null> {
  await new Promise(r => setTimeout(r, 200))
  
  // Simulate 30% chance of being registered
  if (Math.random() > 0.7) {
    return {
      competitionId,
      userId,
      status: 'registered',
      registeredAt: new Date().toISOString(),
    }
  }
  
  return null
}

async function simulateRegister(
  competitionId: string,
  userId: string,
  teamId?: string
): Promise<UserRegistration> {
  await new Promise(r => setTimeout(r, 500))
  
  // Simulate 5% failure rate
  if (Math.random() < 0.05) {
    throw new Error('Registration is currently unavailable')
  }
  
  return {
    competitionId,
    userId,
    status: 'registered',
    registeredAt: new Date().toISOString(),
    teamId,
  }
}

async function simulateCancelRegistration(
  competitionId: string,
  userId: string
): Promise<void> {
  await new Promise(r => setTimeout(r, 300))
}

