export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  type: 'session' | 'deadline' | 'milestone' | 'workshop' | 'reminder'
  related_id?: string // mission_id, session_id, etc.
  related_type?: string
  location?: string
  meeting_url?: string
  reminder_minutes?: number[]
  notes?: string
}

export interface EventAlert {
  id: string
  event_id: string
  alert_type: 'email' | 'push' | 'sms'
  minutes_before: number
  enabled: boolean
}

