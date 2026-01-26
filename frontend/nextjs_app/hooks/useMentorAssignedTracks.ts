'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { programsClient, type Cohort, type MentorAssignment, type Track } from '@/services/programsClient'

/**
 * Resolve mentor -> (cohorts, tracks) by scanning cohorts and checking cohort mentors.
 *
 * This is not the most efficient approach, but works with the current backend without
 * needing new endpoints. We can replace later with a dedicated /mentor/assignments endpoint.
 */
export function useMentorAssignedTracks(mentorId: string | undefined) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) {
      console.log('[useMentorAssignedTracks] No mentorId provided')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      console.log('[useMentorAssignedTracks] Loading assignments for mentor:', mentorId)
      
      // Fetch mentor assignments directly (more efficient than checking each cohort)
      const [assignments, tracksResponse] = await Promise.all([
        programsClient.getMentorAssignments(mentorId),
        programsClient.getTracks(),
      ])

      console.log('[useMentorAssignedTracks] Raw assignments:', assignments)
      console.log('[useMentorAssignedTracks] Assignments count:', Array.isArray(assignments) ? assignments.length : 'not an array')
      console.log('[useMentorAssignedTracks] Raw tracks response:', tracksResponse)
      console.log('[useMentorAssignedTracks] Tracks response type:', typeof tracksResponse, 'isArray:', Array.isArray(tracksResponse))

      // Handle tracks response - could be array or paginated object
      let allTracks: Track[] = []
      if (Array.isArray(tracksResponse)) {
        allTracks = tracksResponse
      } else if (tracksResponse && typeof tracksResponse === 'object' && 'results' in tracksResponse && Array.isArray((tracksResponse as any).results)) {
        allTracks = (tracksResponse as any).results
      } else if (tracksResponse && typeof tracksResponse === 'object' && 'data' in tracksResponse && Array.isArray((tracksResponse as any).data)) {
        allTracks = (tracksResponse as any).data
      } else {
        console.warn('[useMentorAssignedTracks] Unexpected tracks response format:', tracksResponse)
        allTracks = []
      }

      console.log('[useMentorAssignedTracks] Processed tracks count:', allTracks.length)

      // Filter to only active assignments
      const activeAssignments = (assignments as MentorAssignment[]).filter(a => {
        const isActive = a.active !== false
        console.log(`[useMentorAssignedTracks] Assignment ${a.id}: mentor=${a.mentor}, cohort=${a.cohort}, active=${a.active}, isActive=${isActive}`)
        return isActive
      })
      
      console.log('[useMentorAssignedTracks] Active assignments:', activeAssignments.length)
      
      if (activeAssignments.length === 0) {
        console.warn('[useMentorAssignedTracks] No active assignments found for mentor:', mentorId)
        setCohorts([])
        setTracks([])
        setIsLoading(false)
        return
      }

      // Get unique cohort IDs from assignments
      const cohortIds = Array.from(new Set(activeAssignments.map(a => String(a.cohort))))
      console.log('[useMentorAssignedTracks] Cohort IDs to fetch:', cohortIds)
      
      // Fetch cohort details in parallel
      const cohortPromises = cohortIds.map(async (cohortId) => {
        try {
          const cohort = await programsClient.getCohort(cohortId)
          console.log(`[useMentorAssignedTracks] Loaded cohort ${cohortId}:`, cohort.name)
          return cohort
        } catch (err) {
          console.error(`[useMentorAssignedTracks] Failed to load cohort ${cohortId}:`, err)
          return null
        }
      })

      const assignedCohorts = (await Promise.all(cohortPromises)).filter(Boolean) as Cohort[]
      console.log('[useMentorAssignedTracks] Final assigned cohorts:', assignedCohorts.map(c => ({ id: c.id, name: c.name })))

      // Get unique track IDs from assigned cohorts
      const assignedTrackIds = new Set(assignedCohorts.map((c) => String(c.track)).filter(Boolean))
      const assignedTracks = allTracks.filter((t) => assignedTrackIds.has(String(t.id)))

      console.log('[useMentorAssignedTracks] Final assigned tracks:', assignedTracks.map(t => ({ id: t.id, name: t.name })))

      setCohorts(assignedCohorts)
      setTracks(assignedTracks)
    } catch (err: any) {
      console.error('[useMentorAssignedTracks] Failed to load mentor assigned tracks:', err)
      console.error('[useMentorAssignedTracks] Error details:', {
        message: err?.message,
        data: err?.data,
        response: err?.response,
        stack: err?.stack
      })
      setError(err?.message || 'Failed to load mentor assigned tracks')
      setCohorts([])
      setTracks([])
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  const trackIds = useMemo(() => tracks.map((t) => String(t.id)), [tracks])
  const trackKeys = useMemo(() => tracks.map((t: any) => String(t.key)).filter(Boolean), [tracks])

  return { tracks, cohorts, trackIds, trackKeys, isLoading, error, reload: load }
}
