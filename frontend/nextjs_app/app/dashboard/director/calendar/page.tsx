'use client'

import { useState, useEffect } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiGateway } from '@/services/apiGateway'

interface Program {
  id: string
  name: string
}

interface Track {
  id: string
  name: string
  program: {
    id: string
    name: string
  }
}

interface CalendarEvent {
  type: 'orientation' | 'mentorship' | 'session' | 'project_review' | 'submission' | 'holiday' | 'closure'
  title: string
  offset_days: number
}

interface CalendarTemplate {
  template_id?: string
  program_id: string
  track_id: string
  name: string
  timezone: string
  events: CalendarEvent[]
}

export default function CalendarTemplatePage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [templates, setTemplates] = useState<CalendarTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEventsModal, setShowEventsModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CalendarTemplate | null>(null)
  const [formData, setFormData] = useState<CalendarTemplate>({
    program_id: '',
    track_id: '',
    name: '',
    timezone: 'Africa/Nairobi',
    events: []
  })

  useEffect(() => {
    fetchPrograms()
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (formData.program_id) {
      fetchTracks(formData.program_id)
    }
  }, [formData.program_id])

  const fetchPrograms = async () => {
    try {
      const data = await apiGateway.get('/programs/') as any
      setPrograms(data.results || data.data || data || [])
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    }
  }

  const fetchTracks = async (programId: string) => {
    try {
      const data = await apiGateway.get(`/tracks/?program_id=${programId}`) as any
      setTracks(data.results || data.data || data || [])
    } catch (error) {
      console.error('Failed to fetch tracks:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const data = await apiGateway.get('/calendar-templates/') as any
      setTemplates(data.results || data.data || data || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await apiGateway.post('/calendar-templates/', formData)
      setShowCreateForm(false)
      fetchTemplates()
      setFormData({
        program_id: '',
        track_id: '',
        name: '',
        timezone: 'Africa/Nairobi',
        events: []
      })
    } catch (error) {
      console.error('Failed to create template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addEvent = () => {
    setFormData(prev => ({
      ...prev,
      events: [...prev.events, { type: 'session', title: '', offset_days: 0 }]
    }))
  }

  const updateEvent = (index: number, field: keyof CalendarEvent, value: any) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.map((event, i) => 
        i === index ? { ...event, [field]: value } : event
      )
    }))
  }

  const removeEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index)
    }))
  }

  return (
    <RouteGuard requiredRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Calendar Templates</h1>
              <p className="text-och-steel">Create reusable calendar templates for cohorts</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="defender"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Template
            </Button>
          </div>

          {/* Templates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {templates.map((template) => (
              <Card key={template.template_id} className="border-och-steel/20 bg-och-midnight/50">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                  <p className="text-sm text-och-mint mb-4">{template.timezone}</p>
                  <div className="text-sm text-och-steel mb-4">
                    <p>Events: {template.events.length}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-och-defender/50 text-och-defender hover:bg-och-defender hover:text-white"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowEventsModal(true)
                      }}
                    >
                      View Events
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card className="border-och-steel/20 bg-och-midnight/50">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Create Calendar Template</h2>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-och-steel hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Program *</label>
                    <select
                      value={formData.program_id}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, program_id: e.target.value, track_id: '' }))
                      }}
                      required
                      className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="">Select a program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Track *</label>
                    <select
                      value={formData.track_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_id: e.target.value }))}
                      required
                      disabled={!formData.program_id}
                      className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
                    >
                      <option value="">Select a track</option>
                      {tracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Template Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Cyber Leaders Standard Template"
                      required
                      className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Timezone *</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    >
                      <option value="Africa/Nairobi">Africa/Nairobi</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </div>
                </div>

                {/* Events */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-white">Events</label>
                    <Button type="button" onClick={addEvent} variant="outline" size="sm">
                      Add Event
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.events.map((event, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-och-steel/20 rounded-lg">
                        <div>
                          <label className="block text-xs text-och-steel mb-1">Type</label>
                          <select
                            value={event.type}
                            onChange={(e) => updateEvent(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white focus:outline-none focus:border-och-defender"
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
                        
                        <div className="md:col-span-2">
                          <label className="block text-xs text-och-steel mb-1">Title</label>
                          <input
                            type="text"
                            value={event.title}
                            onChange={(e) => updateEvent(index, 'title', e.target.value)}
                            placeholder="Event title"
                            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white focus:outline-none focus:border-och-defender"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-och-steel mb-1">Offset Days</label>
                            <input
                              type="number"
                              value={event.offset_days}
                              onChange={(e) => updateEvent(index, 'offset_days', parseInt(e.target.value))}
                              min="0"
                              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white focus:outline-none focus:border-och-defender"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEvent(index)}
                            className="mt-5 px-2 py-2 text-och-orange hover:bg-och-orange/20 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-och-steel/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="defender"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Events Modal */}
          {showEventsModal && selectedTemplate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="border-och-steel/20 bg-och-midnight/95 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Events in {selectedTemplate.name}</h2>
                    <button
                      onClick={() => {
                        setShowEventsModal(false)
                        setSelectedTemplate(null)
                      }}
                      className="text-och-steel hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {selectedTemplate.events.length === 0 ? (
                    <p className="text-och-steel text-center py-8">No events in this template</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTemplate.events.map((event, index) => (
                        <div key={index} className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-medium">{event.title}</h3>
                            <span className="text-xs bg-och-defender/20 text-och-defender px-2 py-1 rounded">
                              {event.type}
                            </span>
                          </div>
                          <p className="text-och-steel text-sm">Day {event.offset_days}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}