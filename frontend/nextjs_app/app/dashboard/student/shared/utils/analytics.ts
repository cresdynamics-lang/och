'use client'

export type AnalyticsEvent = 
  | 'mission_submitted'
  | 'mission_ai_reviewed'
  | 'mission_approved'
  | 'habit_logged'
  | 'goal_created'
  | 'goal_completed'
  | 'lesson_completed'
  | 'reflection_created'
  | 'module_started'
  | 'mission_started'

export interface AnalyticsEventData {
  event: AnalyticsEvent
  userId?: string
  metadata?: Record<string, any>
  timestamp?: string
}

export function trackEvent(event: AnalyticsEvent, metadata?: Record<string, any>) {
  const eventData: AnalyticsEventData = {
    event,
    metadata,
    timestamp: new Date().toISOString(),
  }
  
  if (typeof window !== 'undefined') {
    console.log('[Analytics]', eventData)
    
    if (window.gtag) {
      window.gtag('event', event, {
        ...metadata,
        event_category: 'student_actions',
      })
    }
    
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      }).catch(err => console.error('Analytics error:', err))
    }
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

