'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGateway } from '@/services/apiGateway'
import { useDashboardStore } from '../store/dashboardStore'

interface RSVPEventParams {
  eventId: string
  status: 'accepted' | 'declined' | 'pending'
}

export function useRSVPEvent() {
  const queryClient = useQueryClient()
  const { setEvents } = useDashboardStore()

  return useMutation({
    mutationFn: async (params: RSVPEventParams) => {
      try {
        const response = await apiGateway.post(`/student/events/${params.eventId}/rsvp`, {
          status: params.status,
        })
        return response
      } catch (error) {
        // Fallback: update local state if API fails
        const { events } = useDashboardStore.getState()
        const updatedEvents = events.map((event) =>
          event.id === params.eventId
            ? { ...event, rsvpStatus: params.status }
            : event
        )
        setEvents(updatedEvents)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'events'] })
      
      // Update local store
      const { events } = useDashboardStore.getState()
      const updatedEvents = events.map((event) =>
        event.id === variables.eventId
          ? { ...event, rsvpStatus: variables.status }
          : event
      )
      setEvents(updatedEvents)
    },
  })
}

