'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface CalendarEvent {
  id: string
  type: string
  title: string
  description: string
  start_ts: string
  end_ts: string
  timezone: string
  location: string
  link: string
  status: string
  cohort: {
    id: string
    name: string
  }
}

interface Cohort {
  id: string
  name: string
  start_date: string
  end_date: string
  track: {
    name: string
    program: {
      name: string
    }
  }
}

const EVENT_TYPES = [
  { value: 'orientation', label: 'Orientation', color: 'defender', icon: '🎯' },
  { value: 'mentorship', label: 'Mentorship', color: 'mint', icon: '👥' },
  { value: 'session', label: 'Session', color: 'orange', icon: '📚' },
  { value: 'project_review', label: 'Project Review', color: 'purple', icon: '🔍' },
  { value: 'submission', label: 'Submission', color: 'yellow', icon: '📝' },
  { value: 'holiday', label: 'Holiday', color: 'steel', icon: '🏖️' },
  { value: 'closure', label: 'Closure', color: 'red', icon: '🎓' }
]

export default function CalendarManagementClient() {
  const { user } = useAuth()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState({
    type: 'session',
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    link: ''
  })

  useEffect(() => {
    loadCohorts()
  }, [])

  useEffect(() => {
    if (selectedCohort) {
      loadEvents(selectedCohort)
    }
  }, [selectedCohort])

  const loadCohorts = async () => {
    try {
      const response = await fetch('/api/v1/director/cohorts-management/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCohorts(data.results || data)
      }
    } catch (error) {
      console.error('Error loading cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async (cohortId: string) => {
    try {
      const response = await fetch(`/api/v1/director/calendar/?cohort_id=${cohortId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const generateMilestones = async () => {
    if (!selectedCohort) return

    try {
      const response = await fetch('/api/v1/director/calendar/generate_milestones/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          cohort_id: selectedCohort
        })
      })

      if (response.ok) {
        loadEvents(selectedCohort)
      } else {
        const error = await response.json()
        console.error('Failed to generate milestones:', error)
      }
    } catch (error) {
      console.error('Error generating milestones:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCohort) return

    const startDateTime = `${formData.start_date}T${formData.start_time}:00Z`
    const endDateTime = `${formData.end_date}T${formData.end_time}:00Z`

    const eventData = {
      cohort_id: selectedCohort,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      start_ts: startDateTime,
      end_ts: endDateTime,
      location: formData.location,
      link: formData.link,
      timezone: 'UTC'
    }

    try {
      const url = editingEvent 
        ? `/api/v1/director/calendar/${editingEvent.id}/`
        : '/api/v1/director/calendar/'
      
      const method = editingEvent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        loadEvents(selectedCohort)
        setShowCreateForm(false)
        setEditingEvent(null)
        resetForm()
      } else {
        const error = await response.json()
        console.error('Failed to save event:', error)
      }
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/v1/director/calendar/${eventId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        loadEvents(selectedCohort)
      } else {
        const error = await response.json()
        console.error('Failed to delete event:', error)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const editEvent = (event: CalendarEvent) => {
    const startDate = new Date(event.start_ts)
    const endDate = new Date(event.end_ts)

    setFormData({
      type: event.type,
      title: event.title,
      description: event.description,
      start_date: startDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().slice(0, 5),
      end_date: endDate.toISOString().split('T')[0],
      end_time: endDate.toTimeString().slice(0, 5),
      location: event.location || '',
      link: event.link || ''
    })
    setEditingEvent(event)
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setFormData({
      type: 'session',
      title: '',
      description: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      location: '',
      link: ''
    })
  }

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0]
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading calendar data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Calendar Management</h1>
        <p className="text-och-steel">Manage cohort schedules, milestones, and events</p>
      </div>

      {/* Cohort Selection */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Select Cohort
              </label>
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
              >
                <option value="">Choose a cohort...</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} - {cohort.track.program.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedCohort && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={generateMilestones}
                >
                  Generate Milestones
                </Button>
                <Button
                  variant="defender"
                  onClick={() => {
                    resetForm()
                    setEditingEvent(null)
                    setShowCreateForm(true)
                  }}
                >
                  + Add Event
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create/Edit Event Form */}
      {showCreateForm && (
        <Card className="mb-6 border-och-defender/50">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Event Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    placeholder="Event title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    placeholder="Event description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    placeholder="Physical location or 'Virtual'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-och-steel mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingEvent(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="defender">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Events List */}
      {selectedCohort && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Calendar Events</h2>
            
            {events.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-och-steel">No events scheduled yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={generateMilestones}
                >
                  Generate Default Milestones
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {events
                  .sort((a, b) => new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime())
                  .map((event) => {
                    const typeInfo = getEventTypeInfo(event.type)
                    
                    return (
                      <div
                        key={event.id}
                        className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl">{typeInfo.icon}</span>
                              <h3 className="font-semibold text-white">{event.title}</h3>
                              <Badge variant={typeInfo.color as any}>
                                {typeInfo.label}
                              </Badge>
                              <Badge variant={event.status === 'done' ? 'mint' : 'orange'}>
                                {event.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-och-steel mb-2">{event.description}</p>
                            
                            <div className="text-sm text-och-steel">
                              <p><strong>Start:</strong> {formatDateTime(event.start_ts)}</p>
                              <p><strong>End:</strong> {formatDateTime(event.end_ts)}</p>
                              {event.location && <p><strong>Location:</strong> {event.location}</p>}
                              {event.link && (
                                <p>
                                  <strong>Link:</strong>{' '}
                                  <a
                                    href={event.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-och-defender hover:underline"
                                  >
                                    Join Meeting
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editEvent(event)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteEvent(event.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}