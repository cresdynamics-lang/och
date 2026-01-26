/**
 * Events Service Client
 * Handles calendar events, deadlines, and reminders
 */

import { apiGateway } from './apiGateway'
import type {
  CalendarEvent,
  EventAlert,
} from './types/events'

export const eventsClient = {
  /**
   * Get upcoming events for a mentee
   */
  async getUpcomingEvents(menteeId: string): Promise<CalendarEvent[]> {
    return apiGateway.get(`/events/mentees/${menteeId}/upcoming`)
  },

  /**
   * Subscribe to event alerts
   */
  async subscribeToAlerts(menteeId: string, alerts: EventAlert[]): Promise<{ detail: string }> {
    return apiGateway.post(`/events/alerts/subscribe`, { mentee_id: menteeId, alerts })
  },

  /**
   * Get event alerts
   */
  async getAlerts(menteeId: string): Promise<EventAlert[]> {
    return apiGateway.get(`/events/mentees/${menteeId}/alerts`)
  },

  /**
   * Add personal reminder
   */
  async addReminder(menteeId: string, data: {
    title: string
    event_time: string
    reminder_minutes: number[]
  }): Promise<CalendarEvent> {
    return apiGateway.post(`/events/mentees/${menteeId}/reminders`, data)
  },
}

