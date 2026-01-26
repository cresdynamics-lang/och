'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CoachingOverview, Habit, Goal, Reflection } from '../types'

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001'

export function useCoachingOverview() {
  return useQuery<CoachingOverview>({
    queryKey: ['student', 'coaching', 'overview'],
    queryFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/overview`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch coaching overview')
      return response.json()
    },
    staleTime: 60000,
  })
}

export function useEnsureCoreHabits() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/habits/core/ensure`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to ensure core habits')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'coaching'] })
    },
  })
}

export function useLogHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ habitId, logDate, status }: { 
      habitId: string
      logDate: string
      status: 'done' | 'skipped'
    }) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ log_date: logDate, status }),
      })
      if (!response.ok) throw new Error('Failed to log habit')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'coaching'] })
    },
  })
}

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ['student', 'coaching', 'goals'],
    queryFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/goals`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch goals')
      return response.json()
    },
    staleTime: 60000,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (goal: { title: string; scope: string; description?: string; target_date?: string }) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(goal),
      })
      if (!response.ok) throw new Error('Failed to create goal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'coaching', 'goals'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ goalId, ...updates }: { 
      goalId: string
      title?: string
      description?: string
      target_date?: string
      status?: string
    }) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update goal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'coaching', 'goals'] })
    },
  })
}

export function useCreateReflection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/reflections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('Failed to create reflection')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'coaching'] })
    },
  })
}

export function useRecentReflections() {
  return useQuery<Reflection[]>({
    queryKey: ['student', 'coaching', 'reflections', 'recent'],
    queryFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/reflections/recent`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch reflections')
      return response.json()
    },
    staleTime: 60000,
  })
}

export function useAICoach() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${FASTAPI_URL}/api/student/coaching/ai-coach`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to get AI coach plan')
      return response.json()
    },
  })
}

