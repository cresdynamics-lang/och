'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { usePrograms, useCohorts, useTracks } from '@/hooks/usePrograms'
import { programsClient, type CalendarEvent } from '@/services/programsClient'
import Link from 'next/link'

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

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

interface AssessmentWindow {
  id?: string
  name: string
  description?: string
  cohort_id: string
  cohort_name?: string
  start_date: string
  end_date: string
  type: 'mission' | 'capstone' | 'portfolio' | 'milestone' | 'final'
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  requirements?: {
    min_submissions?: number
    passing_score?: number
    mandatory?: boolean
  }
  created_at?: string
}

export default function AssessmentsPage() {
  const { programs } = usePrograms()
  const { tracks } = useTracks()
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 9999 })

  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [assessmentWindows, setAssessmentWindows] = useState<AssessmentWindow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<AssessmentWindow | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<Partial<AssessmentWindow>>({
    name: '',
    description: '',
    cohort_id: '',
    start_date: '',
    end_date: '',
    type: 'mission',
    status: 'scheduled',
    requirements: {
      min_submissions: 1,
      passing_score: 70,
      mandatory: true,
    },
  })

  const filteredCohorts = selectedProgramId
    ? cohorts.filter(c => {
        const track = tracks.find(t => t.id === c.track)
        return track && String(track.program) === selectedProgramId
      })
    : cohorts

  useEffect(() => {
    if (selectedCohortId) {
      loadAssessmentWindows()
    } else {
      setAssessmentWindows([])
    }
  }, [selectedCohortId])

  const loadAssessmentWindows = async () => {
    if (!selectedCohortId) return

    setIsLoading(true)
    try {
      // Load calendar events for the cohort (assessment windows are calendar events)
      const calendarEvents = await programsClient.getCohortCalendar(selectedCohortId)
      
      // Filter calendar events that are assessment-related
      const assessmentTypes = ['project_review', 'submission']
      const assessments = calendarEvents
        .filter(event => assessmentTypes.includes(event.type))
        .map(event => {
          // Map calendar event status back to assessment status
          const statusMap: Record<string, 'scheduled' | 'active' | 'completed' | 'cancelled'> = {
            'scheduled': 'scheduled',
            'done': 'completed',
            'cancelled': 'cancelled',
          }
          
          // Map calendar event type back to assessment type
          const typeMap: Record<string, 'mission' | 'capstone' | 'portfolio' | 'milestone' | 'final'> = {
            'submission': 'mission',
            'project_review': 'capstone',
          }

          // Extract date portion from datetime strings
          const startDate = event.start_ts ? (event.start_ts.includes('T') ? event.start_ts.split('T')[0] : event.start_ts) : ''
          const endDate = event.end_ts ? (event.end_ts.includes('T') ? event.end_ts.split('T')[0] : event.end_ts) : ''

          return {
            id: event.id,
            name: event.title,
            description: event.description || '',
            cohort_id: selectedCohortId,
            cohort_name: cohorts.find(c => c.id === selectedCohortId)?.name,
            start_date: startDate,
            end_date: endDate,
            type: typeMap[event.type] || 'mission',
            status: statusMap[event.status] || 'scheduled',
            requirements: {
              mandatory: (event as any).completion_tracked || false,
            },
            created_at: event.created_at,
          } as AssessmentWindow
        })

      setAssessmentWindows(assessments)
    } catch (err) {
      console.error('Failed to load assessment windows:', err)
      setAssessmentWindows([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAssessment = () => {
    setEditingAssessment(null)
    setFormData({
      name: '',
      description: '',
      cohort_id: selectedCohortId,
      start_date: '',
      end_date: '',
      type: 'mission',
      status: 'scheduled',
      requirements: {
        min_submissions: 1,
        passing_score: 70,
        mandatory: true,
      },
    })
    setShowCreateForm(true)
  }

  const handleEditAssessment = (assessment: AssessmentWindow) => {
    setEditingAssessment(assessment)
    // Ensure dates are in YYYY-MM-DD format for date inputs
    setFormData({
      ...assessment,
      start_date: assessment.start_date ? (assessment.start_date.includes('T') ? assessment.start_date.split('T')[0] : assessment.start_date) : '',
      end_date: assessment.end_date ? (assessment.end_date.includes('T') ? assessment.end_date.split('T')[0] : assessment.end_date) : '',
    })
    setShowCreateForm(true)
  }

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.cohort_id || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      // Map assessment type to calendar event type
      const eventTypeMap: Record<string, string> = {
        'mission': 'submission',
        'capstone': 'project_review',
        'portfolio': 'submission',
        'milestone': 'submission',
        'final': 'project_review',
      }

      // Map assessment status to calendar event status
      const statusMap: Record<string, string> = {
        'scheduled': 'scheduled',
        'active': 'scheduled', // Calendar events use 'scheduled' for active
        'completed': 'done',
        'cancelled': 'cancelled',
      }

      const calendarEventData: Partial<CalendarEvent> = {
        cohort: formData.cohort_id!,
        title: formData.name,
        description: formData.description || '',
        type: (eventTypeMap[formData.type || 'mission'] || 'session') as CalendarEvent['type'],
        start_ts: new Date(formData.start_date!).toISOString(),
        end_ts: new Date(formData.end_date!).toISOString(),
        status: (statusMap[formData.status || 'scheduled'] || 'scheduled') as CalendarEvent['status'],
        completion_tracked: formData.requirements?.mandatory || false,
      }

      if (editingAssessment?.id) {
        // Update existing calendar event
        await programsClient.updateCalendarEvent?.(editingAssessment.id, calendarEventData)
      } else {
        // Create new calendar event
        await programsClient.createCalendarEvent(formData.cohort_id!, calendarEventData)
      }

      setShowCreateForm(false)
      setEditingAssessment(null)
      loadAssessmentWindows() // Reload the list
    } catch (err: any) {
      console.error('Failed to save assessment window:', err)
      alert(err?.response?.data?.detail || err?.message || 'Failed to save assessment window')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment window?')) return

    try {
      await programsClient.deleteCalendarEvent?.(id)
      loadAssessmentWindows() // Reload the list
    } catch (err: any) {
      console.error('Failed to delete assessment window:', err)
      alert(err?.response?.data?.detail || err?.message || 'Failed to delete assessment window')
    }
  }


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mission': return 'mint'
      case 'capstone': return 'defender'
      case 'portfolio': return 'gold'
      case 'milestone': return 'orange'
      case 'final': return 'orange'
      default: return 'steel'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'mint'
      case 'completed': return 'defender'
      case 'scheduled': return 'gold'
      case 'cancelled': return 'steel'
      default: return 'steel'
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon />
                <div>
                  <h1 className="text-4xl font-bold text-och-gold">Assessment Windows</h1>
                  <p className="text-och-steel">
                    Configure assessment windows and evaluation schedules
                  </p>
                </div>
              </div>
              {selectedCohortId && (
                <Button variant="defender" onClick={handleCreateAssessment}>
                  <PlusIcon />
                  <span className="ml-2">Create Assessment Window</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Program</label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value)
                      setSelectedCohortId('')
                      setAssessmentWindows([])
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="">All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={String(program.id)}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Cohort</label>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    disabled={!selectedProgramId}
                  >
                    <option value="">Select a cohort</option>
                    {filteredCohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Assessment Windows List */}
          {selectedCohortId && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Assessment Windows</h2>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
                  </div>
                ) : assessmentWindows.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon />
                    <p className="text-och-steel mt-4 mb-2">No assessment windows configured</p>
                    <p className="text-och-steel text-sm mb-4">
                      Create assessment windows to schedule evaluations for this cohort
                    </p>
                    <Button variant="defender" onClick={handleCreateAssessment}>
                      <PlusIcon />
                      <span className="ml-2">Create Assessment Window</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessmentWindows.map((assessment) => (
                      <div
                        key={assessment.id}
                        className="p-5 bg-och-midnight/50 rounded-lg border border-och-steel/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{assessment.name}</h3>
                              <Badge variant={getTypeColor(assessment.type)}>
                                {assessment.type}
                              </Badge>
                              <Badge variant={getStatusColor(assessment.status)}>
                                {assessment.status}
                              </Badge>
                            </div>
                            {assessment.description && (
                              <p className="text-sm text-och-steel mb-3">{assessment.description}</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-och-steel">Start Date:</span>
                                <span className="text-white font-medium ml-2">
                                  {new Date(assessment.start_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-och-steel">End Date:</span>
                                <span className="text-white font-medium ml-2">
                                  {new Date(assessment.end_date).toLocaleDateString()}
                                </span>
                              </div>
                              {assessment.requirements?.passing_score && (
                                <div>
                                  <span className="text-och-steel">Passing Score:</span>
                                  <span className="text-white font-medium ml-2">
                                    {assessment.requirements.passing_score}%
                                  </span>
                                </div>
                              )}
                              {assessment.requirements?.min_submissions && (
                                <div>
                                  <span className="text-och-steel">Min Submissions:</span>
                                  <span className="text-white font-medium ml-2">
                                    {assessment.requirements.min_submissions}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAssessment(assessment)}
                            >
                              <EditIcon />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAssessment(assessment.id!)}
                              className="text-red-400 hover:text-red-300"
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
          )}

          {!selectedCohortId && (
            <Card>
              <div className="p-6 text-center">
                <p className="text-och-steel">Please select a program and cohort to manage assessment windows</p>
              </div>
            </Card>
          )}

          {/* Create/Edit Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingAssessment ? 'Edit Assessment Window' : 'Create Assessment Window'}
                  </h2>

                  <form onSubmit={handleSaveAssessment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Start Date *</label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">End Date *</label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        >
                          <option value="mission">Mission</option>
                          <option value="capstone">Capstone</option>
                          <option value="portfolio">Portfolio</option>
                          <option value="milestone">Milestone</option>
                          <option value="final">Final Assessment</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Status *</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-och-midnight/30 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-3">Requirements</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-och-steel mb-1">Minimum Submissions</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.requirements?.min_submissions || 1}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requirements: {
                                  ...formData.requirements,
                                  min_submissions: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-och-steel mb-1">Passing Score (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.requirements?.passing_score || 70}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requirements: {
                                  ...formData.requirements,
                                  passing_score: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.requirements?.mandatory || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requirements: {
                                  ...formData.requirements,
                                  mandatory: e.target.checked,
                                },
                              })
                            }
                            className="rounded border-och-steel/20 bg-och-midnight/50 text-och-mint focus:ring-och-mint"
                          />
                          <span className="text-sm text-white">Mandatory</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        type="submit"
                        disabled={isSaving || !formData.name || !formData.start_date || !formData.end_date}
                      >
                        {isSaving ? 'Saving...' : editingAssessment ? 'Update' : 'Create'}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false)
                          setEditingAssessment(null)
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
