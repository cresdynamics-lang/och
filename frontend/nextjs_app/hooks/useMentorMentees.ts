'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { AssignedMentee } from '@/services/types/mentor'

export function useMentorMentees(mentorId: string | undefined) {
  const [mentees, setMentees] = useState<AssignedMentee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message
    if (typeof err === 'string') return err
    if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as { message?: unknown }).message
      if (typeof msg === 'string') return msg
    }
    return 'Failed to load mentees'
  }

  const extractResults = (data: unknown): AssignedMentee[] => {
    if (Array.isArray(data)) return data as AssignedMentee[]
    if (data && typeof data === 'object' && 'results' in data) {
      const results = (data as { results?: unknown }).results
      if (Array.isArray(results)) return results as AssignedMentee[]
    }
    return []
  }

  const load = useCallback(async () => {
    if (!mentorId) {
      setMentees([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getAssignedMentees(mentorId)
      // Support both array and paginated responses
      const extractedMentees = extractResults(data)
      // CRITICAL: Ensure we always set an array, never undefined
      setMentees(Array.isArray(extractedMentees) ? extractedMentees : [])
    } catch (err: unknown) {
      console.error('[useMentorMentees] Failed to load mentees:', err)
      setError(getErrorMessage(err))
      // CRITICAL: Set empty array on error to prevent undefined map calls
      setMentees([])
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  return { mentees, isLoading, error, reload: load }
}


