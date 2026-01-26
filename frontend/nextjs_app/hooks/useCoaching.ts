/**
 * Core Coaching Hook
 * Main hook for coaching functionality
 */
import { useEffect } from 'react'
import { useCoachingStore } from '@/lib/coaching/store'
import { habitsAPI, goalsAPI, reflectionsAPI, metricsAPI } from '@/lib/coaching/api'

export function useCoaching() {
  const store = useCoachingStore()
  
  useEffect(() => {
    // Auto-sync with server every 5 minutes
    const interval = setInterval(async () => {
      try {
        const userId = 'current-user' // TODO: Get from auth
        
        const [habits, goals, reflections, metrics] = await Promise.all([
          habitsAPI.getAll(userId),
          goalsAPI.getAll(userId),
          reflectionsAPI.getAll(userId),
          metricsAPI.getMetrics(userId),
        ])
        
        store.setHabits(habits)
        store.setGoals(goals)
        store.setReflections(reflections)
        store.setMetrics(metrics)
      } catch (error) {
        console.error('Failed to sync coaching data:', error)
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [store])
  
  return store
}

