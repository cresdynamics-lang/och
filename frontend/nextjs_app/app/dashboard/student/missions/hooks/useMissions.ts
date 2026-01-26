'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGateway } from '@/services/apiGateway'
import type { Mission } from '../types'

interface MissionFunnelData {
  pending: number
  in_review: number
  in_ai_review: number
  in_mentor_review: number
  approved: number
  success_rate: number
  track_name?: string
  cohort_name?: string
}

export function useMissions() {
  const queryClient = useQueryClient()

  // Fetch mission funnel
  const funnelQuery = useQuery<MissionFunnelData>({
    queryKey: ['missions', 'funnel'],
    queryFn: async () => {
      const response = await apiGateway.get('/student/missions/funnel') as {
        funnel: {
          pending: number;
          in_ai_review: number;
          in_mentor_review: number;
          approved: number;
          approval_rate?: number;
        };
        track_name?: string;
        cohort_name?: string;
      }
      return {
        pending: response.funnel.pending,
        in_review: response.funnel.in_ai_review + response.funnel.in_mentor_review,
        in_ai_review: response.funnel.in_ai_review,
        in_mentor_review: response.funnel.in_mentor_review,
        approved: response.funnel.approved,
        success_rate: response.funnel.approval_rate || 0,
        track_name: response.track_name,
        cohort_name: response.cohort_name,
      }
    },
    staleTime: 30000, // 30 seconds
  })

  // Fetch missions list
  const missionsQuery = useQuery<Mission[]>({
    queryKey: ['missions', 'list'],
    queryFn: async () => {
      const response = await apiGateway.get<{ results: Mission[] }>('/student/missions')
      return response.results || []
    },
    staleTime: 60000, // 1 minute
  })

  // Fetch single mission
  const useMission = (missionId: string | null) => {
    return useQuery<Mission>({
      queryKey: ['missions', missionId],
      queryFn: async () => {
        if (!missionId) throw new Error('Mission ID required')
        return await apiGateway.get<Mission>(`/student/missions/${missionId}`)
      },
      enabled: !!missionId,
      staleTime: 30000,
    })
  }

  // Submit mission mutation
  const submitMission = useMutation({
    mutationFn: async ({ missionId, submission }: { missionId: string; submission: FormData }) => {
      return await apiGateway.post(`/student/missions/${missionId}/submit`, submission, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  // Save draft mutation
  const saveDraft = useMutation({
    mutationFn: async ({ missionId, data }: { missionId: string; data: any }) => {
      return await apiGateway.post(`/student/missions/${missionId}/draft`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  // Upload artifacts mutation
  const uploadArtifacts = useMutation({
    mutationFn: async ({ submissionId, formData }: { submissionId: string; formData: FormData }) => {
      return await apiGateway.post(`/student/missions/submissions/${submissionId}/artifacts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  // Submit for mentor review mutation
  const submitForMentor = useMutation({
    mutationFn: async (submissionId: string) => {
      return await apiGateway.post(`/student/missions/submissions/${submissionId}/submit-mentor`, {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  return {
    funnel: funnelQuery,
    missions: missionsQuery,
    useMission,
    submitMission,
    saveDraft,
    uploadArtifacts,
    submitForMentor,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['missions'] }),
  }
}

