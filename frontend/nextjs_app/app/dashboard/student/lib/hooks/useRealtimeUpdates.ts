'use client'

import { useEffect, useRef } from 'react'
import { useDashboardStore } from '../store/dashboardStore'

export function useRealtimeUpdates() {
  const eventSourceRef = useRef<EventSource | null>(null)
  const { updatePoints, updateReadiness } = useDashboardStore()

  useEffect(() => {
    const connectSSE = () => {
      try {
        const eventSource = new EventSource('/api/v1/student/dashboard/sse')
        eventSourceRef.current = eventSource

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.points_delta) {
              updatePoints(data.points_delta)
            }
            
            if (data.readiness_delta) {
              updateReadiness(data.readiness_delta)
            }
            
            if (data.new_events) {
              console.log(`New events: ${data.new_events}`)
            }
          } catch (error) {
            console.error('Error parsing SSE data:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error)
          eventSource.close()
          
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              connectSSE()
            }
          }, 5000)
        }
      } catch (error) {
        console.error('Failed to create SSE connection:', error)
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [updatePoints, updateReadiness])
}

