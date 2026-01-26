'use client'

import { useState, useEffect, useCallback } from 'react'
import { talentscopeClient } from '@/services/talentscopeClient'
import type { TalentscopeOverview } from '@/services/types/talentscope'

export function useTalentscope(menteeId: string | undefined) {
  const [overview, setOverview] = useState<TalentscopeOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await talentscopeClient.getOverview(menteeId)
      setOverview(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load readiness data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    overview,
    isLoading,
    error,
    reload: loadData,
  }
}

