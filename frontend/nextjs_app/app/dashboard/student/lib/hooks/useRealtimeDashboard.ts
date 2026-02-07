import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '../store/dashboardStore'

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'

/**
 * Real-time dashboard updates using Server-Sent Events (SSE)
 * Coordinates updates across all dashboard components
 */
export function useRealtimeDashboard() {
  const queryClient = useQueryClient()
  const { updatePoints, updateReadiness, updateEvents } = useDashboardStore()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Get auth token
    const token = localStorage.getItem('access_token')
    if (!token) return

    // Create SSE connection to Django backend
    const eventSource = new EventSource(
      `${DJANGO_API_URL}/api/v1/student/dashboard/sse/`,
      {
        withCredentials: true,
      }
    )

    eventSourceRef.current = eventSource

    // Handle real-time updates
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Update points and trigger gamification refresh
        if (data.points !== undefined) {
          updatePoints(data.points)
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
        }

        // Update readiness and trigger readiness refresh
        if (data.readiness !== undefined) {
          updateReadiness(data.readiness)
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
        }

        // Update events count
        if (data.new_events !== undefined) {
          updateEvents(data.new_events)
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'events'] })
        }

        // Handle comprehensive updates
        if (data.readiness) {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
        }
        if (data.missions_in_review !== undefined) {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'next-actions'] })
        }
        if (data.habit_streak !== undefined) {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'habits'] })
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      // SSE will automatically reconnect
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [queryClient, updatePoints, updateReadiness, updateEvents])
}

