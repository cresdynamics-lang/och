'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useCohorts, useCohort } from '@/hooks/usePrograms'
import { programsClient, type CalendarEvent, type Milestone } from '@/services/programsClient'

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function CalendarClient() {
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 9999 })
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const { cohort: selectedCohort, isLoading: loadingCohort } = useCohort(selectedCohortId || '')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])

  // Get user's timezone
  const userTimezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }, [])

  // Event form state
  const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({
    type: 'session',
    title: '',
    description: '',
    start_ts: '',
    end_ts: '',
    timezone: userTimezone,
    location: '',
    link: '',
    milestone_id: '',
    completion_tracked: false,
    status: 'scheduled',
  })

  // Load milestones for the selected cohort's track
  useEffect(() => {
    const loadMilestones = async () => {
      if (selectedCohort?.track) {
        try {
          const data = await programsClient.getMilestones(selectedCohort.track)
          setMilestones(data.sort((a, b) => (a.order || 0) - (b.order || 0)))
        } catch (err) {
          console.error('Failed to load milestones:', err)
          setMilestones([])
        }
      } else {
        setMilestones([])
      }
    }
    loadMilestones()
  }, [selectedCohort?.track])

  const loadEvents = async (cohortId: string) => {
    setLoadingEvents(true)
    setError(null)
    try {
      const data = await programsClient.getCohortCalendar(cohortId)
      setEvents(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to load events:', err)
      setError(err?.response?.data?.detail || err?.message || 'Failed to load calendar events')
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohortId(cohortId)
    setShowEventForm(false)
    setEditingEvent(null)
    if (cohortId) {
      loadEvents(cohortId)
    } else {
      setEvents([])
    }
  }

  const handleCreateEvent = () => {
    setEditingEvent(null)
    setEventForm({
      type: 'session',
      title: '',
      description: '',
      start_ts: '',
      end_ts: '',
      timezone: userTimezone,
      location: '',
      link: '',
      milestone_id: '',
      completion_tracked: false,
      status: 'scheduled',
    })
    setShowEventForm(true)
    setError(null)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setEventForm({
      type: event.type,
      title: event.title,
      description: event.description || '',
      start_ts: event.start_ts ? new Date(event.start_ts).toISOString().slice(0, 16) : '',
      end_ts: event.end_ts ? new Date(event.end_ts).toISOString().slice(0, 16) : '',
      timezone: event.timezone || userTimezone,
      location: event.location || '',
      link: event.link || '',
      milestone_id: event.milestone_id || '',
      completion_tracked: event.completion_tracked || false,
      status: event.status,
    })
    setShowEventForm(true)
    setError(null)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await programsClient.deleteCalendarEvent(eventId)
      if (selectedCohortId) {
        await loadEvents(selectedCohortId)
      }
    } catch (err: any) {
      console.error('Failed to delete event:', err)
      alert(err?.response?.data?.detail || err?.message || 'Failed to delete event')
    }
  }

  const handleSaveEvent = async () => {
    if (!selectedCohortId) {
      setError('Please select a cohort first')
      return
    }

    if (!eventForm.title?.trim()) {
      setError('Title is required')
      return
    }

    if (!eventForm.start_ts || !eventForm.end_ts) {
      setError('Start and end times are required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const eventData: Partial<CalendarEvent> = {
        type: eventForm.type,
        title: eventForm.title.trim(),
        description: eventForm.description?.trim() || '',
        start_ts: new Date(eventForm.start_ts).toISOString(),
        end_ts: new Date(eventForm.end_ts).toISOString(),
        timezone: eventForm.timezone || userTimezone,
        location: eventForm.location?.trim() || '',
        link: eventForm.link?.trim() || '',
        milestone_id: eventForm.milestone_id || undefined,
        completion_tracked: eventForm.completion_tracked || false,
        status: eventForm.status || 'scheduled',
      }

      if (editingEvent) {
        await programsClient.updateCalendarEvent(editingEvent.id, eventData)
      } else {
        await programsClient.createCalendarEvent(selectedCohortId, eventData)
      }

      setShowEventForm(false)
      setEditingEvent(null)
      if (selectedCohortId) {
        await loadEvents(selectedCohortId)
      }
    } catch (err: any) {
      console.error('Failed to save event:', err)
      const errorMessage = err?.response?.data?.detail || 
                          err?.response?.data?.non_field_errors?.[0] ||
                          Object.values(err?.response?.data || {}).flat()[0] ||
                          err?.message || 
                          'Failed to save event'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      orientation: 'Orientation',
      mentorship: 'Mentorship',
      session: 'Session',
      project_review: 'Project Review',
      submission: 'Submission',
      holiday: 'Holiday',
      closure: 'Closure',
    }
    return labels[type] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      orientation: 'mint',
      mentorship: 'defender',
      session: 'outline',
      project_review: 'orange',
      submission: 'defender',
      holiday: 'outline',
      closure: 'orange',
    }
    return colors[type] || 'outline'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'defender',
      done: 'mint',
      cancelled: 'orange',
    }
    return colors[status] || 'outline'
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-defender">Cohort Calendar Management</h1>
              <p className="text-och-steel">Define and manage calendar events for cohorts</p>
            </div>
          </div>

          {/* Cohort Selection */}
          <Card className="mb-6">
            <div className="p-4">
              <label className="block text-sm font-medium text-white mb-2">
                Select Cohort
              </label>
              <select
                value={selectedCohortId}
                onChange={(e) => handleCohortChange(e.target.value)}
                disabled={cohortsLoading}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
              >
                <option value="">Select a cohort</option>
                {cohorts?.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} {cohort.track_name && `(${cohort.track_name})`}
                    {cohort.start_date && ` - ${new Date(cohort.start_date).toLocaleDateString()}`}
                  </option>
                ))}
              </select>
              {selectedCohort && (
                <div className="mt-3 text-sm text-och-steel">
                  <p>
                    <span className="font-medium">Program:</span> {(selectedCohort as any).program_name || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Track:</span> {(selectedCohort as any).track_name || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Duration:</span>{' '}
                    {selectedCohort.start_date && selectedCohort.end_date
                      ? `${new Date(selectedCohort.start_date).toLocaleDateString()} - ${new Date(selectedCohort.end_date).toLocaleDateString()}`
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {selectedCohortId && (
            <>
              {/* Action Buttons */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-3">
                  <Button
                    variant="defender"
                    onClick={handleCreateEvent}
                    disabled={loadingEvents}
                  >
                    <PlusIcon />
                    <span className="ml-2">Add Event</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => selectedCohortId && loadEvents(selectedCohortId)}
                    disabled={loadingEvents}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Event Form Modal */}
              {showEventForm && (
                <Card className="mb-6 border-och-defender/50">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">
                        {editingEvent ? 'Edit Event' : 'Create New Event'}
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowEventForm(false)
                          setEditingEvent(null)
                          setError(null)
                        }}
                      >
                        <XIcon />
                      </Button>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/50 rounded-lg">
                        <p className="text-och-orange text-sm">{error}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Event Type */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Event Type <span className="text-och-orange">*</span>
                        </label>
                        <select
                          value={eventForm.type || 'session'}
                          onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        >
                          <option value="orientation">Orientation</option>
                          <option value="mentorship">Mentorship</option>
                          <option value="session">Session</option>
                          <option value="project_review">Project Review</option>
                          <option value="submission">Submission</option>
                          <option value="holiday">Holiday</option>
                          <option value="closure">Closure</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Title <span className="text-och-orange">*</span>
                        </label>
                        <input
                          type="text"
                          value={eventForm.title || ''}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          placeholder="Event title"
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-defender"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Description
                        </label>
                        <textarea
                          value={eventForm.description || ''}
                          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                          placeholder="Event description"
                          rows={3}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-defender"
                        />
                      </div>

                      {/* Date/Time and Timezone */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <DateTimePicker
                          value={eventForm.start_ts || ''}
                          onChange={(value) => setEventForm({ ...eventForm, start_ts: value })}
                          label="Start Date & Time"
                          required
                          min={selectedCohort?.start_date ? new Date(selectedCohort.start_date).toISOString().slice(0, 16) : undefined}
                          max={selectedCohort?.end_date ? new Date(selectedCohort.end_date).toISOString().slice(0, 16) : undefined}
                        />
                        <DateTimePicker
                          value={eventForm.end_ts || ''}
                          onChange={(value) => setEventForm({ ...eventForm, end_ts: value })}
                          label="End Date & Time"
                          required
                          min={eventForm.start_ts || (selectedCohort?.start_date ? new Date(selectedCohort.start_date).toISOString().slice(0, 16) : undefined)}
                          max={selectedCohort?.end_date ? new Date(selectedCohort.end_date).toISOString().slice(0, 16) : undefined}
                        />
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Timezone
                          </label>
                          <select
                            value={eventForm.timezone || userTimezone}
                            onChange={(e) => setEventForm({ ...eventForm, timezone: e.target.value })}
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                            <option value="Europe/Paris">Paris (CET)</option>
                            <option value="Asia/Dubai">Dubai (GST)</option>
                            <option value="Asia/Kolkata">India (IST)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                            <option value="Australia/Sydney">Sydney (AEST)</option>
                          </select>
                        </div>
                      </div>

                      {/* Location and Link */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            value={eventForm.location || ''}
                            onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                            placeholder="Physical or virtual location"
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-defender"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Meeting Link
                          </label>
                          <input
                            type="url"
                            value={eventForm.link || ''}
                            onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-defender"
                          />
                        </div>
                      </div>

                      {/* Milestone Link */}
                      {milestones.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Link to Milestone (Optional)
                          </label>
                          <select
                            value={eventForm.milestone_id || ''}
                            onChange={(e) => setEventForm({ ...eventForm, milestone_id: e.target.value || undefined })}
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          >
                            <option value="">None</option>
                            {milestones.map((milestone) => (
                              <option key={milestone.id} value={milestone.id}>
                                {milestone.name} (Order: {milestone.order})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Status and Completion Tracking */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Status
                          </label>
                          <select
                            value={eventForm.status || 'scheduled'}
                            onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as any })}
                            className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="done">Done</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-8">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={eventForm.completion_tracked || false}
                              onChange={(e) => setEventForm({ ...eventForm, completion_tracked: e.target.checked })}
                              className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel rounded focus:ring-och-defender"
                            />
                            <span className="ml-2 text-white text-sm">Track Completion</span>
                          </label>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-och-steel/20">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEventForm(false)
                            setEditingEvent(null)
                            setError(null)
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="defender"
                          onClick={handleSaveEvent}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Events List */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Calendar Events</h2>
                    <Badge variant="defender">{events.length} events</Badge>
                  </div>

                  {loadingEvents ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
                      <p className="text-och-steel">Loading events...</p>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-12 text-och-steel">
                      <p>No events scheduled for this cohort.</p>
                      <p className="text-sm mt-2">Click "Add Event" to create the first event.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant={getEventTypeColor(event.type) as any}>
                                  {getEventTypeLabel(event.type)}
                                </Badge>
                                <Badge variant={getStatusColor(event.status) as any}>
                                  {event.status}
                                </Badge>
                                {event.completion_tracked && (
                                  <Badge variant="steel">Completion Tracked</Badge>
                                )}
                              </div>
                              <h3 className="text-white font-semibold text-lg mb-1">{event.title}</h3>
                              {event.description && (
                                <p className="text-och-steel text-sm mb-3">{event.description}</p>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-och-steel">
                                <div>
                                  <span className="font-medium">Start:</span>{' '}
                                  {formatDateTime(event.start_ts)}
                                </div>
                                <div>
                                  <span className="font-medium">End:</span>{' '}
                                  {formatDateTime(event.end_ts)}
                                </div>
                                {event.timezone && (
                                  <div>
                                    <span className="font-medium">Timezone:</span> {event.timezone}
                                  </div>
                                )}
                                {event.location && (
                                  <div>
                                    <span className="font-medium">Location:</span> {event.location}
                                  </div>
                                )}
                                {event.link && (
                                  <div>
                                    <span className="font-medium">Link:</span>{' '}
                                    <a
                                      href={event.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-och-defender hover:text-och-mint"
                                    >
                                      Join Meeting
                                    </a>
                                  </div>
                                )}
                                {event.milestone_id && (
                                  <div>
                                    <span className="font-medium">Milestone:</span> Linked
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEvent(event)}
                              >
                                <EditIcon />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => event.id && handleDeleteEvent(event.id)}
                              >
                                <TrashIcon />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {!selectedCohortId && (
            <Card>
              <div className="p-6 text-center text-och-steel">
                <p>Please select a cohort to manage its calendar events.</p>
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
