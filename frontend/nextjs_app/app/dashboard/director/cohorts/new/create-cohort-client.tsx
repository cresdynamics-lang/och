'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DatePicker } from '@/components/ui/DatePicker'
import { useCreateCohort, useTracks, usePrograms, useProgram, useTrack, useProgramRules } from '@/hooks/usePrograms'
import { programsClient, type Cohort, type CalendarEvent, type Program, type Track, type Milestone } from '@/services/programsClient'
import { apiGateway } from '@/services/apiGateway'
import Link from 'next/link'

interface SeatPool {
  paid: number
  scholarship: number
  sponsored: number
}

interface MilestoneEvent {
  type: 'orientation' | 'mentorship' | 'session' | 'project_review' | 'submission' | 'closure'
  title: string
  description: string
  start_ts: string
  end_ts: string
  timezone: string
  location?: string
  link?: string
  completion_tracked: boolean
  milestone_id?: string
}

interface ProgramRule {
  attendance_percent?: number
  portfolio_approved?: boolean
  feedback_score?: number
  payment_complete?: boolean
}

export default function CreateCohortClient() {
  const router = useRouter()
  const { createCohort, isLoading, error } = useCreateCohort()
  const { programs, isLoading: programsLoading } = usePrograms()
  
  const [step, setStep] = useState<'core' | 'capacity' | 'schedule' | 'rules' | 'review'>('core')
  
  const [formData, setFormData] = useState<Partial<Cohort> & { seat_pool?: { paid: number; scholarship: number; sponsored: number }; coordinator?: any }>({
    name: '',
    start_date: '',
    end_date: '',
    mode: 'virtual',
    seat_cap: 20,
    mentor_ratio: 0.1,
    status: 'draft',
    seat_pool: { paid: 0, scholarship: 0, sponsored: 0 } as any,
    coordinator: null,
  })

  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<string>('')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  const [calendarTemplateId, setCalendarTemplateId] = useState<string>('')
  const [milestoneEvents, setMilestoneEvents] = useState<MilestoneEvent[]>([])
  const [enrollmentMethods, setEnrollmentMethods] = useState<string[]>(['director', 'invite'])
  const [programRules, setProgramRules] = useState<ProgramRule>({})
  const [mentorAssignmentMode, setMentorAssignmentMode] = useState<'auto' | 'manual'>('auto')
  const [selectedMentors, setSelectedMentors] = useState<string[]>([])

  // Fetch program details when selected
  const { program: selectedProgramDetails, isLoading: loadingProgramDetails } = useProgram(
    selectedProgramId || ''
  )
  
  // Fetch tracks for the selected program (filters server-side)
  const { tracks: tracksFromApi, isLoading: tracksLoading } = useTracks(
    selectedProgramId || undefined
  )
  
  // Fetch track details when selected
  const { track: selectedTrackDetails, isLoading: loadingTrackDetails } = useTrack(
    selectedTrackId || ''
  )
  
  // Fetch program rules when program is selected
  const { rules: programRulesData, isLoading: loadingRules } = useProgramRules(
    selectedProgramId || undefined
  )

  // Use tracks from program detail API (source of truth) if available, otherwise use tracks from API
  const availableTracks = useMemo(() => {
    if (!selectedProgramId) {
      return []
    }
    
    // Prefer tracks from program detail API as it's the source of truth
    if (selectedProgramDetails?.tracks && Array.isArray(selectedProgramDetails.tracks) && selectedProgramDetails.tracks.length > 0) {
      console.log('📊 Using tracks from program detail API:', {
        programId: selectedProgramId,
        tracksCount: selectedProgramDetails.tracks.length,
        tracks: selectedProgramDetails.tracks.map(t => ({ id: t.id, name: t.name, program: t.program }))
      })
      return selectedProgramDetails.tracks
    }
    
    // Fall back to tracks from tracks API endpoint
    if (tracksFromApi && tracksFromApi.length > 0) {
      console.log('📊 Using tracks from tracks API endpoint:', {
        programId: selectedProgramId,
        tracksCount: tracksFromApi.length,
        tracks: tracksFromApi.map(t => ({ id: t.id, name: t.name, program: t.program }))
      })
      return tracksFromApi
    }
    
    return []
  }, [selectedProgramId, selectedProgramDetails, tracksFromApi])

  // Reset track selection when program changes
  useEffect(() => {
    if (selectedProgramId && selectedTrackId) {
      // Check if the selected track belongs to the selected program
      const trackBelongsToProgram = availableTracks.some(t => t.id === selectedTrackId)
      if (!trackBelongsToProgram) {
        setSelectedTrackId('')
      }
    }
  }, [selectedProgramId, availableTracks, selectedTrackId])

  const selectedProgram = useMemo(() => {
    return selectedProgramDetails || programs.find(p => p.id === selectedProgramId)
  }, [selectedProgramDetails, programs, selectedProgramId])

  const selectedTrack = useMemo(() => {
    return selectedTrackDetails || availableTracks.find(t => t.id === selectedTrackId)
  }, [selectedTrackDetails, availableTracks, selectedTrackId])

  // Load program rules from API when program is selected
  useEffect(() => {
    if (programRulesData && programRulesData.length > 0) {
      const activeRule = programRulesData.find(r => r.active) || programRulesData[0]
      if (activeRule?.rule?.criteria) {
        setProgramRules(activeRule.rule.criteria)
      }
    }
  }, [programRulesData])

  const addMilestoneEvent = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDay = new Date(tomorrow)
    nextDay.setDate(nextDay.getDate() + 1)
    
    setMilestoneEvents([
      ...milestoneEvents,
      {
        type: 'orientation',
        title: '',
        description: '',
        start_ts: tomorrow.toISOString().slice(0, 16),
        end_ts: nextDay.toISOString().slice(0, 16),
        timezone: timezone,
        completion_tracked: false,
      }
    ])
  }

  const updateMilestoneEvent = (index: number, data: Partial<MilestoneEvent>) => {
    const updated = [...milestoneEvents]
    updated[index] = { ...updated[index], ...data }
    setMilestoneEvents(updated)
  }

  const removeMilestoneEvent = (index: number) => {
    setMilestoneEvents(milestoneEvents.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!selectedTrackId || !formData.name || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields: Program, Track, Cohort Name, Start Date, and End Date')
      return
    }

    if (!selectedProgramId) {
      alert('Please select a program')
      return
    }

    if (!selectedTrackId) {
      alert('Please select a track')
      return
    }

    try {
      // Prepare cohort data - ensure track is set correctly
      const cohortData: any = {
        track: selectedTrackId, // Use selectedTrackId directly, not formData.track
        name: formData.name?.trim(),
        start_date: formData.start_date, // Should be in YYYY-MM-DD format
        end_date: formData.end_date, // Should be in YYYY-MM-DD format
        mode: formData.mode || 'virtual',
        seat_cap: formData.seat_cap || 20,
        mentor_ratio: formData.mentor_ratio || 0.1,
        status: formData.status || 'draft',
      }

      // Only include optional fields if they have valid values
      if (formData.seat_pool && (formData.seat_pool.paid || formData.seat_pool.scholarship || formData.seat_pool.sponsored)) {
        cohortData.seat_pool = formData.seat_pool
      }
      
      if (formData.coordinator) {
        cohortData.coordinator = formData.coordinator
      }
      
      // Only include calendar_template_id if it's a valid UUID (not empty string)
      // UUID regex: 8-4-4-4-12 hex digits
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (calendarTemplateId && calendarTemplateId.trim() !== '' && uuidRegex.test(calendarTemplateId)) {
        cohortData.calendar_template_id = calendarTemplateId
      }

      console.log('📤 Submitting cohort data:', {
        track: cohortData.track,
        name: cohortData.name,
        start_date: cohortData.start_date,
        end_date: cohortData.end_date,
        mode: cohortData.mode,
        seat_cap: cohortData.seat_cap,
        mentor_ratio: cohortData.mentor_ratio,
        status: cohortData.status,
        seat_pool: cohortData.seat_pool,
      })

      // Create cohort
      const cohort = await createCohort(cohortData)
      console.log('✅ Cohort created successfully:', cohort)

      // Create calendar events if milestones are defined
      if (milestoneEvents.length > 0 && cohort.id) {
        for (const event of milestoneEvents) {
          try {
            await programsClient.createCalendarEvent(cohort.id, {
              type: event.type,
              title: event.title,
              description: event.description,
              start_ts: event.start_ts,
              end_ts: event.end_ts,
              timezone: event.timezone,
              location: event.location || '',
              link: event.link || '',
              completion_tracked: event.completion_tracked,
              milestone_id: event.milestone_id,
            })
          } catch (err) {
            console.error('Failed to create calendar event:', err)
          }
        }
      }

      // Assign mentors if manual mode
      if (mentorAssignmentMode === 'manual' && selectedMentors.length > 0 && cohort.id) {
        for (const mentorId of selectedMentors) {
          try {
            await programsClient.assignMentor(cohort.id, {
              mentor: mentorId,
              role: 'support',
            })
          } catch (err) {
            console.error('Failed to assign mentor:', err)
          }
        }
      }

      // Create program rules if defined
      if (Object.keys(programRules).length > 0 && selectedProgramId) {
        try {
          await programsClient.createProgramRule({
            program: selectedProgramId,
            rule: {
              criteria: programRules,
              thresholds: {},
              dependencies: [],
            },
            active: true,
          })
        } catch (err) {
          console.error('Failed to create program rule:', err)
        }
      }

      router.push(`/dashboard/director/cohorts/${cohort.id}`)
    } catch (err: any) {
      console.error('❌ Failed to create cohort:', err)
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      })
      
      // Display detailed error message
      // ApiError structure: { status, statusText, data, message }
      let errorMessage = 'Failed to create cohort'
      const errorData = err?.data || err?.response?.data
      
      if (errorData) {
        if (errorData.details) {
          errorMessage = typeof errorData.details === 'object' 
            ? JSON.stringify(errorData.details, null, 2)
            : errorData.details
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'object'
            ? JSON.stringify(errorData.error, null, 2)
            : errorData.error
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : String(errorData.non_field_errors)
        } else {
          // Show field-specific errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]: [string, any]) => {
              const errorMsg = Array.isArray(errors) ? errors.join(', ') : String(errors)
              return `${field}: ${errorMsg}`
            })
            .join('; ')
          errorMessage = fieldErrors || errorMessage
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      console.error('❌ Cohort creation error details:', {
        status: err?.status,
        statusText: err?.statusText,
        data: errorData,
        message: err?.message,
        fullError: err
      })
      
      alert(`Error creating cohort: ${errorMessage}`)
    }
  }

  const totalSeatsAllocated = useMemo(() => {
    const pool = formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }
    return (pool.paid || 0) + (pool.scholarship || 0) + (pool.sponsored || 0)
  }, [formData.seat_pool])

  const seatsRemaining = useMemo(() => {
    return (formData.seat_cap || 0) - totalSeatsAllocated
  }, [formData.seat_cap, totalSeatsAllocated])

  return (
    <DirectorLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-defender">Create New Cohort</h1>
          <p className="text-och-steel">Define a cohort with complete operational context, schedule, and rules</p>
        </div>

        {/* Enhanced Step Indicator */}
        <Card className="mb-6 border-och-defender/30">
          <div className="p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {([
                { key: 'core', label: 'Core Definition', icon: '📋' },
                { key: 'capacity', label: 'Capacity & Resources', icon: '👥' },
                { key: 'schedule', label: 'Schedule & Milestones', icon: '📅' },
                { key: 'rules', label: 'Enrollment & Rules', icon: '⚙️' },
                { key: 'review', label: 'Review & Create', icon: '✓' }
              ] as const).map((stepInfo, idx) => {
                const stepIndex = ['core', 'capacity', 'schedule', 'rules', 'review'].indexOf(step)
                const isActive = step === stepInfo.key
                const isCompleted = stepIndex > idx
                const isPending = stepIndex < idx
                
                return (
                  <div key={stepInfo.key} className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-center">
              <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold transition-all ${
                          isActive
                            ? 'bg-och-defender text-white shadow-lg scale-110'
                            : isCompleted
                    ? 'bg-och-mint text-och-midnight'
                    : 'bg-och-midnight/50 text-och-steel'
                }`}
              >
                        {isCompleted ? '✓' : stepInfo.icon}
              </div>
                      <span className={`text-xs font-medium mt-1 text-center whitespace-nowrap ${
                        isActive ? 'text-och-defender' : isCompleted ? 'text-och-mint' : 'text-och-steel'
              }`}>
                        {stepInfo.label}
              </span>
            </div>
                    {idx < 4 && (
                      <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-och-mint' : 'bg-och-steel/30'}`} />
                    )}
        </div>
                )
              })}
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Core Definition */}
          {step === 'core' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Core Definition</h2>

                {/* Program Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program * <span className="text-och-steel text-xs">(Highest Level Container)</span>
                  </label>
                  <select
                    required
                    value={selectedProgramId}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value)
                      setSelectedTrackId('')
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    disabled={programsLoading}
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} {program.status === 'active' ? '✓' : ''} ({program.duration_months} months)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Program Details Card */}
                {selectedProgram && (
                  <Card className="border-och-defender/30 bg-och-midnight/30">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-och-defender">Program: {selectedProgram.name}</h3>
                        <Link href={`/dashboard/director/programs/${selectedProgramId}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-och-steel">Duration:</span>
                          <span className="ml-2 text-white">{selectedProgram.duration_months} months</span>
                        </div>
                        <div>
                          <span className="text-och-steel">Category:</span>
                          <span className="ml-2 text-white capitalize">{selectedProgram.category || selectedProgram.categories?.[0]}</span>
                        </div>
                        <div>
                          <span className="text-och-steel">Status:</span>
                          <Badge variant={selectedProgram.status === 'active' ? 'defender' : 'steel'} className="ml-2">
                            {selectedProgram.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-och-steel">Tracks:</span>
                          <span className="ml-2 text-white">{selectedProgram.tracks_count ?? selectedProgram.tracks?.length ?? availableTracks.length}</span>
                        </div>
                      </div>
                      {selectedProgram.description && (
                        <p className="text-xs text-och-steel mt-2 line-clamp-2">{selectedProgram.description}</p>
                      )}
                    </div>
                  </Card>
                )}

                {/* Track Selection */}
                {selectedProgramId && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Track * <span className="text-och-steel text-xs">(Learning Path within Program)</span>
                    </label>
                    <select
                      required
                      value={selectedTrackId}
                      onChange={(e) => setSelectedTrackId(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      disabled={tracksLoading || !selectedProgramId || availableTracks.length === 0}
                    >
                      <option value="">Select a track</option>
                      {availableTracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name} ({track.track_type === 'primary' ? 'Primary' : 'Cross-Track'})
                        </option>
                      ))}
                    </select>
                    {availableTracks.length === 0 && !tracksLoading && (
                      <p className="text-xs text-och-orange mt-1">No tracks available for this program. Create tracks first.</p>
                    )}
                  </div>
                )}

                {/* Track Details Card */}
                {selectedTrack && (
                  <Card className="border-och-mint/30 bg-och-midnight/30">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-och-mint">Track: {selectedTrack.name}</h3>
                        <Link href={`/dashboard/director/tracks/${selectedTrack.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-och-steel">Type:</span>
                          <Badge variant={selectedTrack.track_type === 'primary' ? 'defender' : 'gold'} className="ml-2">
                            {selectedTrack.track_type === 'primary' ? 'Primary' : 'Cross-Track'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-och-steel">Milestones:</span>
                          <span className="ml-2 text-white">{selectedTrack.milestones?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-och-steel">Modules:</span>
                          <span className="ml-2 text-white">
                            {selectedTrack.milestones?.reduce((sum: number, m: Milestone) => sum + (m.modules?.length || 0), 0) || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-och-steel">Specializations:</span>
                          <span className="ml-2 text-white">{selectedTrack.specializations?.length || 0}</span>
                        </div>
                      </div>
                      {selectedTrack.description && (
                        <p className="text-xs text-och-steel line-clamp-2">{selectedTrack.description}</p>
                      )}
                      
                      {/* Specialization Selection (if available) */}
                      {selectedTrack.specializations && selectedTrack.specializations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-och-steel/20">
                          <label className="block text-xs font-medium text-och-steel mb-2">
                            Specialization (Optional)
                          </label>
                          <select
                            value={selectedSpecializationId}
                            onChange={(e) => setSelectedSpecializationId(e.target.value)}
                            className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint"
                          >
                            <option value="">All specializations</option>
                            {selectedTrack.specializations.map((spec) => (
                              <option key={spec.id} value={spec.id}>
                                {spec.name} ({spec.duration_weeks} weeks)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Cohort Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="e.g., Jan 2026 Cohort"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DatePicker
                      label="Start Date"
                      required
                      value={formData.start_date || ''}
                      onChange={(val) => {
                        const next: any = { ...formData, start_date: val }
                        if (val && formData.end_date && val > formData.end_date) {
                          next.end_date = ''
                        }
                        setFormData(next)
                      }}
                      max={formData.end_date || undefined}
                    />
                  </div>

                  <div>
                    <DatePicker
                      label="End Date"
                      required
                      value={formData.end_date || ''}
                      onChange={(val) => setFormData({ ...formData, end_date: val })}
                      min={formData.start_date || undefined}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Delivery Mode *
                  </label>
                  <select
                    required
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="virtual">Virtual</option>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Initial Status <span className="text-och-steel text-xs">(Status Lifecycle)</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="running">Running</option>
                  </select>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-och-steel">Lifecycle:</span>
                    <Badge variant={formData.status === 'draft' ? 'defender' : 'steel'}>draft</Badge>
                    <span className="text-och-steel">→</span>
                    <Badge variant={formData.status === 'active' ? 'defender' : 'steel'}>active</Badge>
                    <span className="text-och-steel">→</span>
                    <Badge variant={formData.status === 'running' ? 'defender' : 'steel'}>running</Badge>
                    <span className="text-och-steel">→</span>
                    <Badge variant="steel">closing</Badge>
                    <span className="text-och-steel">→</span>
                    <Badge variant="steel">closed</Badge>
                  </div>
                  <p className="text-xs text-och-steel mt-2">
                    New cohorts typically start as <strong>draft</strong>. Move to <strong>active</strong> when ready for enrollment, 
                    then <strong>running</strong> when the program begins.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('capacity')}
                  >
                    Next: Capacity & Resources
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Capacity and Resource Allocation */}
          {step === 'capacity' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Capacity & Resource Allocation</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Seat Capacity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.seat_cap}
                      onChange={(e) => setFormData({ ...formData, seat_cap: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Mentor Ratio (e.g., 0.1 = 1:10) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.mentor_ratio}
                      onChange={(e) => setFormData({ ...formData, mentor_ratio: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                    <p className="text-xs text-och-steel mt-1">
                      Recommended: 0.1 (1 mentor per 10 students)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Seat Pool Breakdown
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-och-steel mb-1">Paid Seats</label>
                      <input
                        type="number"
                        min="0"
                        value={(formData.seat_pool as SeatPool)?.paid || 0}
                        onChange={(e) => {
                          const pool = { ...(formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }), paid: parseInt(e.target.value) || 0 }
                          setFormData({ ...formData, seat_pool: pool })
                        }}
                        className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-och-steel mb-1">Scholarship Seats</label>
                      <input
                        type="number"
                        min="0"
                        value={(formData.seat_pool as SeatPool)?.scholarship || 0}
                        onChange={(e) => {
                          const pool = { ...(formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }), scholarship: parseInt(e.target.value) || 0 }
                          setFormData({ ...formData, seat_pool: pool })
                        }}
                        className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-och-steel mb-1">Sponsored Seats</label>
                      <input
                        type="number"
                        min="0"
                        value={(formData.seat_pool as SeatPool)?.sponsored || 0}
                        onChange={(e) => {
                          const pool = { ...(formData.seat_pool as SeatPool || { paid: 0, scholarship: 0, sponsored: 0 }), sponsored: parseInt(e.target.value) || 0 }
                          setFormData({ ...formData, seat_pool: pool })
                        }}
                        className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-och-steel">Total Allocated:</span>
                    <span className={`font-medium ${totalSeatsAllocated > (formData.seat_cap || 0) ? 'text-och-orange' : 'text-white'}`}>
                      {totalSeatsAllocated}
                    </span>
                    <span className="text-och-steel">/ {formData.seat_cap}</span>
                    {seatsRemaining < 0 && (
                      <Badge variant="orange" className="ml-2">Over capacity!</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mentor Assignment Mode
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="auto"
                        checked={mentorAssignmentMode === 'auto'}
                        onChange={(e) => setMentorAssignmentMode(e.target.value as 'auto' | 'manual')}
                        className="text-och-defender"
                      />
                      <span className="text-white">Auto-match (by availability & skillset)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="manual"
                        checked={mentorAssignmentMode === 'manual'}
                        onChange={(e) => setMentorAssignmentMode(e.target.value as 'auto' | 'manual')}
                        className="text-och-defender"
                      />
                      <span className="text-white">Manual Assignment</span>
                    </label>
                  </div>
                  {mentorAssignmentMode === 'manual' && (
                    <div>
                      <p className="text-sm text-och-steel mb-2">
                        Manual mentor assignment will be available after cohort creation
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('core')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('schedule')}
                  >
                    Next: Schedule & Milestones
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Scheduling and Milestones */}
          {step === 'schedule' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Scheduling & Milestones</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Timezone * <span className="text-och-steel text-xs">(All events will use this timezone)</span>
                  </label>
                  <select
                    required
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                    <option value="America/Denver">America/Denver (MST/MDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  </select>
                  <p className="text-xs text-och-steel mt-1">Selected: {timezone}</p>
                </div>

                {/* Track Milestones Reference */}
                {selectedTrack && selectedTrack.milestones && selectedTrack.milestones.length > 0 && (
                  <Card className="border-och-mint/30 bg-och-midnight/20">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-och-mint mb-2">Track Milestones Reference</h3>
                      <p className="text-xs text-och-steel mb-3">
                        These milestones are defined in the track. You can link calendar events to them when creating events below.
                      </p>
                      <div className="space-y-2">
                        {selectedTrack.milestones.map((milestone, idx) => (
                          <div key={milestone.id} className="flex items-start gap-2 p-2 bg-och-midnight/50 rounded text-xs">
                            <Badge variant="steel" className="flex-shrink-0">{idx + 1}</Badge>
                            <div className="flex-1">
                              <span className="text-white font-medium">{milestone.name}</span>
                              {milestone.description && (
                                <p className="text-och-steel mt-1 line-clamp-1">{milestone.description}</p>
                              )}
                              {milestone.modules && milestone.modules.length > 0 && (
                                <p className="text-och-steel mt-1">{milestone.modules.length} module(s)</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Calendar Template (Optional)
                  </label>
                  <select
                    value={calendarTemplateId}
                    onChange={(e) => setCalendarTemplateId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="">Create from scratch</option>
                    <option value="template-1">Standard 6-Month Program</option>
                    <option value="template-2">Intensive 3-Month Program</option>
                  </select>
                  <p className="text-xs text-och-steel mt-1">
                    Select a template or create a custom calendar
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-white">
                      Milestone Events
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMilestoneEvent}
                    >
                      + Add Event
                    </Button>
                  </div>

                  {milestoneEvents.length === 0 ? (
                    <div className="text-center py-8 text-och-steel border border-och-steel/20 rounded-lg">
                      <p>No milestone events added yet.</p>
                      <p className="text-xs mt-1">Add orientation, sessions, reviews, and closure events</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {milestoneEvents.map((event, index) => (
                        <Card key={index} className="border-och-defender/30">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-och-defender">
                                Event {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeMilestoneEvent(index)}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Event Type *</label>
                                  <select
                                    required
                                    value={event.type}
                                    onChange={(e) => updateMilestoneEvent(index, { type: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  >
                                    <option value="orientation">Orientation</option>
                                    <option value="mentorship">Mentorship Session</option>
                                    <option value="session">Training Session</option>
                                    <option value="project_review">Project Review</option>
                                    <option value="submission">Submission Deadline</option>
                                    <option value="holiday">Holiday</option>
                                    <option value="closure">Closure</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Title *</label>
                                  <input
                                    type="text"
                                    required
                                    value={event.title}
                                    onChange={(e) => updateMilestoneEvent(index, { title: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                    placeholder="e.g., Orientation Session"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs text-och-steel mb-1">Description</label>
                                <textarea
                                  value={event.description}
                                  onChange={(e) => updateMilestoneEvent(index, { description: e.target.value })}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Start Date & Time *</label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={event.start_ts}
                                    onChange={(e) => updateMilestoneEvent(index, { start_ts: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">End Date & Time *</label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={event.end_ts}
                                    onChange={(e) => updateMilestoneEvent(index, { end_ts: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={event.location || ''}
                                    onChange={(e) => updateMilestoneEvent(index, { location: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                    placeholder="Physical location or meeting room"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Meeting Link</label>
                                  <input
                                    type="url"
                                    value={event.link || ''}
                                    onChange={(e) => updateMilestoneEvent(index, { link: e.target.value })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                    placeholder="https://..."
                                  />
                                </div>
                              </div>

                              {/* Link to Track Milestone */}
                              {selectedTrack && selectedTrack.milestones && selectedTrack.milestones.length > 0 && (
                                <div>
                                  <label className="block text-xs text-och-steel mb-1">Link to Track Milestone (Optional)</label>
                                  <select
                                    value={event.milestone_id || ''}
                                    onChange={(e) => updateMilestoneEvent(index, { milestone_id: e.target.value || undefined })}
                                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                                  >
                                    <option value="">No milestone link</option>
                                    {selectedTrack.milestones.map((milestone) => (
                                      <option key={milestone.id} value={milestone.id}>
                                        {milestone.name} (Order: {milestone.order})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={event.completion_tracked}
                                    onChange={(e) => updateMilestoneEvent(index, { completion_tracked: e.target.checked })}
                                    className="text-och-defender"
                                  />
                                  <span className="text-xs text-och-steel">Track completion for this event</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('capacity')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('rules')}
                  >
                    Next: Enrollment & Rules
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 4: Enrollment and Closure Rules */}
          {step === 'rules' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Enrollment & Closure Rules</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Allowed Enrollment Methods
                  </label>
                  <div className="space-y-2">
                    {['self', 'invite', 'sponsor', 'director'].map((method) => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enrollmentMethods.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnrollmentMethods([...enrollmentMethods, method])
                            } else {
                              setEnrollmentMethods(enrollmentMethods.filter(m => m !== method))
                            }
                          }}
                          className="text-och-defender"
                        />
                        <span className="text-white capitalize">
                          {method === 'self' ? 'Self-enroll' : method === 'invite' ? 'Invite' : method === 'sponsor' ? 'Sponsor assign' : 'Director assign'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Program Rules Display */}
                {selectedProgram && programRulesData && programRulesData.length > 0 && (
                  <Card className="border-och-defender/30 bg-och-midnight/20">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-och-defender mb-2">Program Rules (Inherited from Program)</h3>
                      <p className="text-xs text-och-steel mb-3">
                        These rules are inherited from the selected program. They will be used for auto-graduation.
                      </p>
                      {programRulesData.filter(r => r.active).map((rule, idx) => (
                        <div key={rule.id} className="mb-3 p-3 bg-och-midnight/50 rounded text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">Rule Version {rule.version}</span>
                            <Badge variant="defender">Active</Badge>
                          </div>
                          {rule.rule?.criteria && (
                            <div className="space-y-1 text-xs">
                              {rule.rule.criteria.attendance_percent && (
                                <p className="text-och-steel">Min Attendance: <span className="text-white">{rule.rule.criteria.attendance_percent}%</span></p>
                              )}
                              {rule.rule.criteria.portfolio_approved && (
                                <p className="text-och-steel">Portfolio Approval: <span className="text-white">Required</span></p>
                              )}
                              {rule.rule.criteria.feedback_score && (
                                <p className="text-och-steel">Min Feedback Score: <span className="text-white">{rule.rule.criteria.feedback_score}/5.0</span></p>
                              )}
                              {rule.rule.criteria.payment_complete && (
                                <p className="text-och-steel">Payment Complete: <span className="text-white">Required</span></p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Program Success Metrics (Auto-Graduation Rules)
                    {selectedProgram && programRulesData && programRulesData.length > 0 && (
                      <span className="text-och-steel text-xs ml-2">(Override program defaults if needed)</span>
                    )}
                  </label>
                  <div className="space-y-4 bg-och-midnight/30 p-4 rounded-lg">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={programRules.portfolio_approved || false}
                          onChange={(e) => setProgramRules({ ...programRules, portfolio_approved: e.target.checked })}
                          className="text-och-defender"
                        />
                        <span className="text-white">Portfolio Approval Required</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={programRules.payment_complete || false}
                          onChange={(e) => setProgramRules({ ...programRules, payment_complete: e.target.checked })}
                          className="text-och-defender"
                        />
                        <span className="text-white">Payment Complete Required</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm text-och-steel mb-2">
                        Minimum Attendance Percentage
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={programRules.attendance_percent || ''}
                          onChange={(e) => setProgramRules({ ...programRules, attendance_percent: parseInt(e.target.value) || undefined })}
                          className="w-24 px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="80"
                        />
                        <span className="text-och-steel">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-och-steel mb-2">
                        Minimum Feedback Score
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={programRules.feedback_score || ''}
                          onChange={(e) => setProgramRules({ ...programRules, feedback_score: parseFloat(e.target.value) || undefined })}
                          className="w-24 px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="4.0"
                        />
                        <span className="text-och-steel">out of 5.0</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-och-steel mt-2">
                    These rules will be used for auto-graduation when all criteria are met
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('schedule')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="defender"
                    onClick={() => setStep('review')}
                  >
                    Review & Create
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Review */}
          {step === 'review' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Review Cohort Configuration</h2>

                <div className="space-y-4">
                  {/* Program → Track Hierarchy */}
                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Program Structure</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="defender">Program</Badge>
                        <span className="text-white font-medium">{selectedProgram?.name || 'N/A'}</span>
                        {selectedProgram && (
                          <span className="text-och-steel text-xs">({selectedProgram.duration_months} months, {selectedProgram.category})</span>
                        )}
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <span className="text-och-steel">→</span>
                        <Badge variant="gold">Track</Badge>
                        <span className="text-white font-medium">{selectedTrack?.name || 'N/A'}</span>
                        {selectedTrack && (
                          <span className="text-och-steel text-xs">
                            ({selectedTrack.track_type === 'primary' ? 'Primary' : 'Cross-Track'}, {selectedTrack.milestones?.length || 0} milestones)
                          </span>
                        )}
                      </div>
                      {selectedSpecializationId && selectedTrack?.specializations && (
                        <div className="ml-8 flex items-center gap-2">
                          <span className="text-och-steel">→</span>
                          <Badge variant="steel">Specialization</Badge>
                          <span className="text-white text-sm">
                            {selectedTrack.specializations.find(s => s.id === selectedSpecializationId)?.name || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Cohort Details</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Cohort Name:</span> <span className="text-white font-medium">{formData.name}</span></p>
                      <p><span className="text-och-steel">Duration:</span> <span className="text-white">{formData.start_date} to {formData.end_date}</span></p>
                      <p><span className="text-och-steel">Delivery Mode:</span> <span className="text-white capitalize">{formData.mode}</span></p>
                      <p><span className="text-och-steel">Initial Status:</span> <Badge variant={formData.status === 'draft' ? 'defender' : 'steel'}>{formData.status}</Badge></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Capacity</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Seat Capacity:</span> <span className="text-white">{formData.seat_cap}</span></p>
                      <p><span className="text-och-steel">Mentor Ratio:</span> <span className="text-white">1:{Math.round(1 / (formData.mentor_ratio || 0.1))}</span></p>
                      <p><span className="text-och-steel">Seat Pool:</span> <span className="text-white">
                        Paid: {(formData.seat_pool as SeatPool)?.paid || 0}, 
                        Scholarship: {(formData.seat_pool as SeatPool)?.scholarship || 0}, 
                        Sponsored: {(formData.seat_pool as SeatPool)?.sponsored || 0}
                      </span></p>
                      <p><span className="text-och-steel">Mentor Assignment:</span> <span className="text-white capitalize">{mentorAssignmentMode}</span></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Schedule</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Timezone:</span> <span className="text-white">{timezone}</span></p>
                      <p><span className="text-och-steel">Milestone Events:</span> <span className="text-white">{milestoneEvents.length}</span></p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-och-defender mb-2">Enrollment & Rules</h3>
                    <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-och-steel">Enrollment Methods:</span> <span className="text-white">{enrollmentMethods.map(m => m === 'self' ? 'Self-enroll' : m === 'invite' ? 'Invite' : m === 'sponsor' ? 'Sponsor' : 'Director').join(', ')}</span></p>
                      <p><span className="text-och-steel">Program Rules:</span> <span className="text-white">
                        {Object.keys(programRules).length > 0 ? Object.entries(programRules).map(([k, v]) => `${k}: ${v}`).join(', ') : 'None'}
                      </span></p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('rules')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    variant="defender"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Cohort'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </form>
      </div>
    </DirectorLayout>
  )
}
