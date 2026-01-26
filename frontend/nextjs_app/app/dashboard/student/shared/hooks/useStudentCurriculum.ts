'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Track, CurriculumModule, Lesson } from '../types'

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001'

export function useTrack() {
  return useQuery<Track>({
    queryKey: ['student', 'curriculum', 'track'],
    queryFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/curriculum/track`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch track')
      return response.json()
    },
    staleTime: 300000,
  })
}

export function useModules() {
  return useQuery<CurriculumModule[]>({
    queryKey: ['student', 'curriculum', 'modules'],
    queryFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/curriculum/modules`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch modules')
      return response.json()
    },
    staleTime: 300000,
  })
}

export function useModuleDetail(moduleId: string | null) {
  return useQuery<CurriculumModule>({
    queryKey: ['student', 'curriculum', 'modules', moduleId],
    queryFn: async () => {
      if (!moduleId) throw new Error('Module ID required')
      const response = await fetch(`${FASTAPI_URL}/api/student/curriculum/modules/${moduleId}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch module detail')
      return response.json()
    },
    enabled: !!moduleId,
    staleTime: 300000,
  })
}

export function useCompleteLesson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/curriculum/lessons/${lessonId}/complete`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to complete lesson')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'curriculum'] })
    },
  })
}

