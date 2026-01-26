'use client'

import { useCallback, useEffect, useState } from 'react'
import { missionsClient, type MissionTemplate } from '@/services/missionsClient'

export function useTrackMissions(params: {
  track_id?: string
  track_key?: string
  search?: string
  page?: number
  page_size?: number
}) {
  const [results, setResults] = useState<MissionTemplate[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await missionsClient.getAllMissions({
        track_id: params.track_id,
        track_key: params.track_key,
        search: params.search,
        page: params.page,
        page_size: params.page_size,
      })
      setResults(data.results || [])
      setCount(data.count || 0)
    } catch (err: any) {
      setError(err?.message || 'Failed to load missions')
      setResults([])
      setCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [params.track_id, params.track_key, params.search, params.page, params.page_size])

  useEffect(() => {
    load()
  }, [load])

  return { missions: results, count, isLoading, error, reload: load }
}































