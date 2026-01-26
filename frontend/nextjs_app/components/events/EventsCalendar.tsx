'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useEvents } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import type { CalendarEvent } from '@/services/types/events'

export function EventsCalendar() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { events, isLoading, error } = useEvents(menteeId)

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'session':
        return '👥'
      case 'deadline':
        return '⏰'
      case 'milestone':
        return '🎯'
      case 'workshop':
        return '📚'
      case 'reminder':
        return '🔔'
      default:
        return '📅'
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'defender'
      case 'deadline':
        return 'orange'
      case 'milestone':
        return 'gold'
      case 'workshop':
        return 'mint'
      default:
        return 'steel'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    return events.filter(event => new Date(event.start_time) >= now).slice(0, 5)
  }

  const handleJoinSession = (event: CalendarEvent) => {
    if (event.meeting_url) {
      window.open(event.meeting_url, '_blank')
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading events...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 border-och-orange">
        <div className="text-och-orange text-sm">{error}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-xl font-bold mb-4 text-white">Upcoming Events</h3>
        {getUpcomingEvents().length === 0 ? (
          <div className="text-center text-och-steel py-8">
            <div className="text-4xl mb-2">📅</div>
            <div>No upcoming events</div>
          </div>
        ) : (
          <div className="space-y-3">
            {getUpcomingEvents().map((event) => (
              <div
                key={event.id}
                className="p-4 bg-och-midnight/50 rounded-lg border-l-4 border-och-defender"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{event.title}</h4>
                        <Badge variant={getEventTypeColor(event.type) as any} className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-och-steel mb-2">{event.description}</p>
                      )}
                      <div className="text-xs text-och-steel">
                        {formatDate(event.start_time)} at {formatTime(event.start_time)}
                        {event.end_time && ` - ${formatTime(event.end_time)}`}
                      </div>
                      {event.location && (
                        <div className="text-xs text-och-steel mt-1">📍 {event.location}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {event.type === 'session' && event.meeting_url && (
                    <Button variant="mint" size="sm" onClick={() => handleJoinSession(event)}>
                      Join Session
                    </Button>
                  )}
                  {event.related_id && (
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Mini Calendar View */}
      <Card>
        <h3 className="text-xl font-bold mb-4 text-white">Calendar</h3>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs text-och-steel font-semibold">
              {day}
            </div>
          ))}
          {/* Calendar days would go here - simplified for now */}
        </div>
        <div className="text-sm text-och-steel">
          {events.length} events scheduled
        </div>
      </Card>
    </div>
  )
}

