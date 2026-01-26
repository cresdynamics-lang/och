'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGateway } from '@/services/apiGateway'
import type { Mission, MissionFunnel, MissionSubmission, MissionArtifact } from '../types'

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001'

export function useMissionFunnel() {
  return useQuery<MissionFunnel>({
    queryKey: ['student', 'missions', 'funnel'],
    queryFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/missions/funnel`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch mission funnel')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useMissionsList(filters?: {
  status?: string
  difficulty?: string
  track_key?: string
}) {
  return useQuery<Mission[]>({
    queryKey: ['student', 'missions', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.difficulty) params.append('difficulty', filters.difficulty)
      if (filters?.track_key) params.append('track_key', filters.track_key)
      
      const response = await fetch(`${FASTAPI_URL}/api/student/missions?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch missions')
      return response.json()
    },
    staleTime: 60000,
  })
}

export function useMissionDetail(missionId: string | null) {
  return useQuery<Mission>({
    queryKey: ['student', 'missions', missionId],
    queryFn: async () => {
      if (!missionId) throw new Error('Mission ID required')
      const response = await fetch(`${FASTAPI_URL}/api/student/missions/${missionId}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch mission detail')
      return response.json()
    },
    enabled: !!missionId,
    staleTime: 30000,
  })
}

export function useCreateSubmission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ missionId, notes }: { missionId: string; notes?: string }) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/missions/${missionId}/submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) throw new Error('Failed to create submission')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'missions'] })
    },
  })
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ submissionId, notes, status }: { 
      submissionId: string
      notes?: string
      status?: string 
    }) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/missions/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes, status }),
      })
      if (!response.ok) throw new Error('Failed to update submission')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'missions'] })
    },
  })
}

export function useAddArtifact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ submissionId, artifact }: { 
      submissionId: string
      artifact: { kind: string; url: string; filename?: string; size_bytes?: number }
    }) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/missions/submissions/${submissionId}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(artifact),
      })
      if (!response.ok) throw new Error('Failed to add artifact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'missions'] })
    },
  })
}

export function useSubmitForAI() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/missions/submissions/${submissionId}/submit-ai`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to submit for AI review')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'missions'] })
    },
  })
}

export function useSubmitForMentor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/missions/submissions/${submissionId}/submit-mentor`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to submit for mentor review')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'missions'] })
    },
  })
}

