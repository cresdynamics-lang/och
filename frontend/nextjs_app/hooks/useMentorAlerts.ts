'use client'

import { useState, useEffect, useCallback } from 'react'
import { mentorClient } from '@/services/mentorClient'
import type { MentorAlert } from '@/services/types/mentor'

export function useMentorAlerts(mentorId: string | undefined) {
  const [alerts, setAlerts] = useState<MentorAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await mentorClient.getAlerts(mentorId)
      setAlerts(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load alerts')
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  return { alerts, isLoading, error, reload: load }
}


