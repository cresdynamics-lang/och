'use client'

import { useState, useEffect, useCallback } from 'react'
import { eventsClient } from '@/services/eventsClient'
import type { CalendarEvent, EventAlert } from '@/services/types/events'

export function useEvents(menteeId: string | undefined) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [alerts, setAlerts] = useState<EventAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [eventsData, alertsData] = await Promise.all([
        eventsClient.getUpcomingEvents(menteeId),
        eventsClient.getAlerts(menteeId),
      ])

      setEvents(eventsData)
      setAlerts(alertsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const addReminder = useCallback(async (data: {
    title: string
    event_time: string
    reminder_minutes: number[]
  }) => {
    if (!menteeId) return

    try {
      const event = await eventsClient.addReminder(menteeId, data)
      setEvents(prev => [...prev, event])
      return event
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add reminder')
    }
  }, [menteeId])

  const subscribeToAlerts = useCallback(async (alertList: EventAlert[]) => {
    if (!menteeId) return

    try {
      await eventsClient.subscribeToAlerts(menteeId, alertList)
      setAlerts(alertList)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to subscribe to alerts')
    }
  }, [menteeId])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return {
    events,
    alerts,
    isLoading,
    error,
    reload: loadEvents,
    addReminder,
    subscribeToAlerts,
  }
}

