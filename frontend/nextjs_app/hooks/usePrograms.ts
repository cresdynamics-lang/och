/**
 * React hooks for Programs management
 * Uses useState/useEffect pattern consistent with other hooks in the project
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { programsClient, type Program, type Track, type Cohort, type ProgramRule, type CohortDashboard, type DirectorDashboard, type Specialization, type Milestone, type Module } from '@/services/programsClient'

// Programs
export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPrograms = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Loading programs from API...')
      const data = await programsClient.getPrograms()
      console.log('✅ Programs loaded:', {
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : 0,
        data: data
      })
      
      if (Array.isArray(data)) {
      setPrograms(data)
        console.log(`✅ Set ${data.length} programs in state`)
      } else {
        console.warn('⚠️ API returned non-array data:', data)
        setPrograms([])
        setError('Invalid response format from server')
      }
    } catch (err: any) {
      console.error('❌ Failed to load programs:', err)
      const errorMessage = err?.message || err?.data?.detail || 'Failed to load programs'
      setError(errorMessage)
      setPrograms([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrograms()
  }, [])

  return { programs, isLoading, error, reload: loadPrograms }
}

export function useProgram(id: string) {
  const [program, setProgram] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProgram = useCallback(async () => {
    if (!id) {
      console.warn('useProgram: No ID provided')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      console.log(`🔄 Loading program ${id}...`)
      const data = await programsClient.getProgram(id)
      console.log(`✅ Program loaded:`, { 
        hasData: !!data, 
        dataType: typeof data,
        keys: data ? Object.keys(data) : [],
        data 
      })
      
      if (data) {
        setProgram(data)
      } else {
        console.warn('⚠️ API returned null/undefined data')
        setError('Program data is empty')
        setProgram(null)
      }
    } catch (err: any) {
      console.error(`❌ Failed to load program ${id}:`, err)
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      })
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to load program'
      setError(errorMessage)
      setProgram(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProgram()
  }, [loadProgram])

  return { program, isLoading, error, reload: loadProgram }
}

export function useCreateProgram() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProgram = useCallback(async (data: Partial<Program>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.createProgram(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create program')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createProgram, isLoading, error }
}

export function useUpdateProgram() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProgram = useCallback(async (id: string, data: Partial<Program>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.updateProgram(id, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update program')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateProgram, isLoading, error }
}

export function useDeleteProgram() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteProgram = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await programsClient.deleteProgram(id)
    } catch (err: any) {
      setError(err.message || 'Failed to delete program')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { deleteProgram, isLoading, error }
}

// Tracks
export function useTracks(programId?: string) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTracks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Loading tracks from API...', { programId })
      const data = await programsClient.getTracks(programId)
      console.log('✅ Tracks loaded:', {
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : 0,
        data: data
      })
      setTracks(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('❌ Failed to load tracks:', err)
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      })
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to load tracks'
      setError(errorMessage)
      setTracks([])
    } finally {
      setIsLoading(false)
    }
  }, [programId])

  useEffect(() => {
    loadTracks()
  }, [loadTracks])

  return { tracks, isLoading, error, reload: loadTracks }
}

export function useTrack(id: string) {
  const [track, setTrack] = useState<Track | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTrack = useCallback(async () => {
    if (!id) {
      console.warn('useTrack: No ID provided')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      console.log(`🔄 Loading track ${id}...`)
      const data = await programsClient.getTrack(id)
      console.log(`✅ Track loaded:`, { 
        hasData: !!data, 
        dataType: typeof data,
        keys: data ? Object.keys(data) : [],
        data 
      })
      
      if (data) {
        setTrack(data)
      } else {
        console.warn('⚠️ API returned null/undefined data')
        setError('Track data is empty')
        setTrack(null)
      }
    } catch (err: any) {
      console.error(`❌ Failed to load track ${id}:`, err)
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      })
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to load track'
      setError(errorMessage)
      setTrack(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTrack()
  }, [loadTrack])

  return { track, isLoading, error, reload: loadTrack }
}

export function useCreateTrack() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTrack = useCallback(async (data: Partial<Track>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.createTrack(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create track')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createTrack, isLoading, error }
}

export function useUpdateTrack() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTrack = useCallback(async (id: string, data: Partial<Track>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.updateTrack(id, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update track')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateTrack, isLoading, error }
}

export function useDeleteTrack() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTrack = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await programsClient.deleteTrack(id)
    } catch (err: any) {
      setError(err.message || 'Failed to delete track')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { deleteTrack, isLoading, error }
}

// Cohorts with pagination
export function useCohorts(params?: {
  trackId?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [pagination, setPagination] = useState<{
    count: number
    next: string | null
    previous: string | null
  }>({
    count: 0,
    next: null,
    previous: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCohorts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getCohorts(params)
      // Handle both paginated response and direct array (for backward compatibility)
      if (data && typeof data === 'object' && 'results' in data) {
        setCohorts(Array.isArray(data.results) ? data.results : [])
        setPagination({
          count: data.count || 0,
          next: data.next || null,
          previous: data.previous || null
        })
      } else if (Array.isArray(data)) {
        // Fallback for non-paginated responses
        const dataArray = data as any[]
        setCohorts(dataArray)
        setPagination({
          count: dataArray.length,
          next: null,
          previous: null
        })
      } else {
        setCohorts([])
        setPagination({ count: 0, next: null, previous: null })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cohorts')
      setCohorts([])
      setPagination({ count: 0, next: null, previous: null })
    } finally {
      setIsLoading(false)
    }
  }, [params?.trackId, params?.status, params?.page, params?.pageSize])

  useEffect(() => {
    loadCohorts()
  }, [loadCohorts])

  return { 
    cohorts, 
    pagination,
    isLoading, 
    error, 
    reload: loadCohorts 
  }
}

export function useCohort(id: string) {
  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCohort = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getCohort(id)
      setCohort(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load cohort')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCohort()
  }, [loadCohort])

  return { cohort, isLoading, error, reload: loadCohort }
}

export function useCohortDashboard(cohortId: string) {
  const [dashboard, setDashboard] = useState<CohortDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!cohortId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getCohortDashboard(cohortId)
      setDashboard(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [cohortId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return { dashboard, isLoading, error, reload: loadDashboard }
}

export function useCreateCohort() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCohort = useCallback(async (data: Partial<Cohort>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.createCohort(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create cohort')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createCohort, isLoading, error }
}

export function useUpdateCohort() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCohort = useCallback(async (id: string, data: Partial<Cohort>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.updateCohort(id, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update cohort')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateCohort, isLoading, error }
}

export function useUpdateCohortDirector() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCohort = useCallback(async (id: string, data: Partial<Cohort>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.updateCohortDirector(id, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update cohort')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateCohort, isLoading, error }
}

export function useDeleteCohort() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteCohort = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await programsClient.deleteCohort(id)
    } catch (err: any) {
      setError(err.message || 'Failed to delete cohort')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { deleteCohort, isLoading, error }
}

// Program Rules
export function useProgramRules(programId?: string) {
  const [rules, setRules] = useState<ProgramRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getProgramRules(programId)
      setRules(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load rules')
      setRules([])
    } finally {
      setIsLoading(false)
    }
  }, [programId])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  return { rules, isLoading, error, reload: loadRules }
}

export function useCreateProgramRule() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRule = useCallback(async (data: Partial<ProgramRule>) => {
    setIsLoading(true)
    setError(null)
    try {
      const rule = await programsClient.createProgramRule(data)
      return rule
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to create program rule'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createRule, isLoading, error }
}

export function useUpdateProgramRule() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRule = useCallback(async (id: string, data: Partial<ProgramRule>) => {
    setIsLoading(true)
    setError(null)
    try {
      const rule = await programsClient.updateProgramRule(id, data)
      return rule
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to update program rule'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateRule, isLoading, error }
}

export function useDeleteProgramRule() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteRule = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await programsClient.deleteProgramRule(id)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to delete program rule'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { deleteRule, isLoading, error }
}

// Director Dashboard
export function useDirectorDashboard() {
  const [dashboard, setDashboard] = useState<DirectorDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Loading director dashboard...')
      const data = await programsClient.getDirectorDashboard()
      console.log('✅ Director dashboard loaded:', data)
      setDashboard(data)
    } catch (err: any) {
      console.error('❌ Failed to load director dashboard:', err)
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to load director dashboard'
      setError(errorMessage)
      setDashboard(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return { dashboard, isLoading, error, reload: loadDashboard }
}
