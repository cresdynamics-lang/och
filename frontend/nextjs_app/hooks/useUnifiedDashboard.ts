'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCoachingStore } from '@/lib/coaching/store'
import { habitsAPI, goalsAPI, reflectionsAPI, metricsAPI } from '@/lib/coaching/api'

interface UnifiedDashboardState {
  coaching: {
    alignmentScore: number
    totalStreakDays: number
    activeHabits: number
    completedGoals: number
    reflectionCount: number
  }
  missions: {
    available: any[]
    locked: any[]
    inProgress: any[]
    completed: any[]
  }
  eligibility: {
    eligible: boolean
    gates: any[]
    warnings: any[]
    coachingScore: number
    scoreMultiplier: number
  } | null
  loading: boolean
  error: string | null
}

export function useUnifiedDashboard() {
  const [state, setState] = useState<UnifiedDashboardState>({
    coaching: {
      alignmentScore: 0,
      totalStreakDays: 0,
      activeHabits: 0,
      completedGoals: 0,
      reflectionCount: 0,
    },
    missions: {
      available: [],
      locked: [],
      inProgress: [],
      completed: [],
    },
    eligibility: null,
    loading: true,
    error: null,
  })
  
  const { setHabits, setGoals, setReflections, setMetrics, setHabitLogs } = useCoachingStore()
  
  const loadUnifiedData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Load coaching data
      const [habits, goals, reflections, metrics, habitLogs] = await Promise.all([
        habitsAPI.getAll().catch(() => []),
        goalsAPI.getAll().catch(() => []),
        reflectionsAPI.getAll().catch(() => []),
        metricsAPI.getMetrics().catch(() => ({
          alignmentScore: 0,
          totalStreakDays: 0,
          activeHabits: 0,
          completedGoals: 0,
          reflectionCount: 0,
        })),
        Promise.all(
          (await habitsAPI.getAll()).map(habit => 
            habitsAPI.getLogs(habit.id).catch(() => [])
          )
        ).then(logs => logs.flat()).catch(() => []),
      ])
      
      setHabits(habits)
      setGoals(goals)
      setReflections(reflections)
      setMetrics(metrics)
      setHabitLogs(habitLogs)
      
      // Load missions data (from missions API)
      try {
        const missionsResponse = await fetch('/api/v1/missions/dashboard', {
          credentials: 'include',
        })
        const missionsData = await missionsResponse.json()
        
        setState(prev => ({
          ...prev,
          coaching: metrics,
          missions: {
            available: missionsData.available_missions || [],
            locked: missionsData.locked_missions || [],
            inProgress: missionsData.in_progress_missions || [],
            completed: missionsData.completed_missions || [],
          },
          eligibility: missionsData.coaching_eligibility || null,
          loading: false,
        }))
      } catch (err) {
        setState(prev => ({
          ...prev,
          coaching: metrics,
          loading: false,
        }))
      }
    } catch (error) {
      console.error('Failed to load unified dashboard data:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to load data',
        loading: false,
      }))
    }
  }, [setHabits, setGoals, setReflections, setMetrics, setHabitLogs])
  
  useEffect(() => {
    loadUnifiedData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUnifiedData, 30000)
    return () => clearInterval(interval)
  }, [loadUnifiedData])
  
  return {
    ...state,
    refresh: loadUnifiedData,
  }
}


