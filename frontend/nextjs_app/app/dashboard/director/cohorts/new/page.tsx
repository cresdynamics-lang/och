'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { RegistrationFormFieldsEditor } from '@/components/director/RegistrationFormFieldsEditor'
import { CreateCohortPayload } from '@/types/api'
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

interface CalendarTemplate {
  id: string
  name: string
}

interface User {
  id: string
  uuid_id: string
  email: string
  first_name?: string
  last_name?: string
}

export default function CreateCohortPage() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [calendarTemplates, setCalendarTemplates] = useState<CalendarTemplate[]>([])
  const [mentors, setMentors] = useState<User[]>([])
  const [coordinators, setCoordinators] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    program_id: '',
    track_id: '',
    name: '',
    start_date: '',
    end_date: '',
    mode: 'virtual' as 'onsite' | 'virtual' | 'hybrid',
    seat_cap: 50,
    mentor_ratio: 0.1,
    calendar_template_id: '',
    assigned_staff: {
      mentors: [] as string[],
      coordinators: [] as string[]
    },
    published_to_homepage: false,
    profile_image: null as File | null,
    registration_form_fields: {
      student: [
        { key: 'first_name', label: 'First Name', type: 'text', required: true },
        { key: 'last_name', label: 'Last Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Phone', type: 'tel', required: false }
      ] as { key: string; label: string; type: string; required: boolean }[],
      sponsor: [
        { key: 'org_name', label: 'Organization Name', type: 'text', required: true },
        { key: 'contact_name', label: 'Contact Name', type: 'text', required: true },
        { key: 'contact_email', label: 'Contact Email', type: 'email', required: true },
        { key: 'phone', label: 'Phone', type: 'tel', required: false }
      ] as { key: string; label: string; type: string; required: boolean }[]
    }
  })

  useEffect(() => {
    fetchPrograms()
    fetchCalendarTemplates()
    fetchMentors()
    fetchCoordinators()
  }, [])

  useEffect(() => {
    if (formData.program_id) {
      fetchTracks(formData.program_id)
    }
  }, [formData.program_id])

  const fetchPrograms = async () => {
    try {
      const data = await apiGateway.get('/programs/') as any
      setPrograms(data?.results || data?.data || data || [])
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    }
  }

  const fetchTracks = async (programId: string) => {
    try {
      const data = await apiGateway.get(`/tracks/?program_id=${programId}`) as any
      setTracks(data?.results || data?.data || data || [])
    } catch (error) {
      console.error('Failed to fetch tracks:', error)
    }
  }

  const fetchCalendarTemplates = async () => {
    try {
      const data = await apiGateway.get('/calendar-templates/') as any
      setCalendarTemplates(data?.results || data?.data || data || [])
    } catch (error) {
      console.error('Failed to fetch calendar templates:', error)
    }
  }

  const fetchMentors = async () => {
    try {
      const data = await apiGateway.get('/users?role=mentor') as any
      setMentors(data?.results || data?.data || data || [])
    } catch (error) {
      console.error('Failed to fetch mentors:', error)
    }
  }

  const fetchCoordinators = async () => {
    try {
      const data = await apiGateway.get('/users?role=coordinator') as any
      setCoordinators(data?.results || data?.data || data || [])
    } catch (error) {
      console.error('Failed to fetch coordinators:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const cohortData: Record<string, unknown> = {
        track: formData.track_id,
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        mode: formData.mode,
        seat_cap: formData.seat_cap,
        mentor_ratio: formData.mentor_ratio,
        calendar_template_id: null,
        coordinator: formData.assigned_staff.coordinators[0] || null,
        seat_pool: {
          paid: Math.floor(formData.seat_cap * 0.8),
          scholarship: Math.floor(formData.seat_cap * 0.1),
          sponsored: Math.floor(formData.seat_cap * 0.1)
        },
        assigned_staff: {
          mentors: formData.assigned_staff.mentors,
          coordinators: formData.assigned_staff.coordinators
        },
        published_to_homepage: formData.published_to_homepage,
        registration_form_fields: formData.registration_form_fields
      }

      if (formData.profile_image) {
        const fd = new FormData()
        ;['track', 'name', 'start_date', 'end_date', 'mode', 'seat_cap', 'mentor_ratio'].forEach((k) => {
          const v = cohortData[k]
          if (v != null) fd.append(k, String(v))
        })
        if (cohortData.coordinator) fd.append('coordinator', String(cohortData.coordinator))
        fd.append('calendar_template_id', '')
        fd.append('seat_pool', JSON.stringify(cohortData.seat_pool))
        fd.append('assigned_staff', JSON.stringify(cohortData.assigned_staff))
        fd.append('status', 'draft')
        fd.append('published_to_homepage', String(cohortData.published_to_homepage))
        fd.append('registration_form_fields', JSON.stringify(cohortData.registration_form_fields))
        fd.append('profile_image', formData.profile_image)
        await apiGateway.post('/cohorts/', fd)
      } else {
        await apiGateway.post('/cohorts/', cohortData)
      }
      router.push('/dashboard/director/cohorts')
    } catch (error) {
      console.error('Failed to create cohort:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateAssignedStaff = (type: 'mentors' | 'coordinators', values: string[]) => {
    setFormData(prev => ({
      ...prev,
      assigned_staff: {
        ...prev.assigned_staff,
        [type]: values
      }
    }))
  }

  return (
    <RouteGuard requiredRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Create New Cohort</h1>
            <p className="text-och-steel">Set up a new cohort instance for a track</p>
          </div>

          <Card className="border-och-steel/20 bg-och-midnight/50">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Program and Track Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program *
                  </label>
                  <select
                    value={formData.program_id}
                    onChange={(e) => {
                      updateFormData('program_id', e.target.value)
                      updateFormData('track_id', '') // Reset track when program changes
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
                  <label className="block text-sm font-medium text-white mb-2">
                    Track *
                  </label>
                  <select
                    value={formData.track_id}
                    onChange={(e) => updateFormData('track_id', e.target.value)}
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

              {/* Cohort Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Cohort Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="e.g., Jan 2026 Cohort"
                  required
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateFormData('start_date', e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => updateFormData('end_date', e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>
              </div>

              {/* Mode and Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mode *
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => updateFormData('mode', e.target.value as 'onsite' | 'virtual' | 'hybrid')}
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="virtual">Virtual</option>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    value={formData.seat_cap}
                    onChange={(e) => updateFormData('seat_cap', parseInt(e.target.value))}
                    min="1"
                    required
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mentor Ratio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mentor_ratio}
                    onChange={(e) => updateFormData('mentor_ratio', parseFloat(e.target.value))}
                    min="0"
                    max="1"
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>
              </div>

              {/* Calendar Template */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Calendar Template
                </label>
                <select
                  value={formData.calendar_template_id}
                  onChange={(e) => updateFormData('calendar_template_id', e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                >
                  <option value="">No template</option>
                  {calendarTemplates.length === 0 ? (
                    <option disabled>No templates available</option>
                  ) : (
                    calendarTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Publish to Homepage */}
              <div className="p-4 rounded-lg border border-och-defender/30 bg-och-midnight/30 space-y-4">
                <h3 className="text-lg font-semibold text-och-defender">Publish to Homepage</h3>
                <p className="text-sm text-och-steel">Allow students and sponsors to find and apply to this cohort from the public homepage.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published_to_homepage}
                    onChange={(e) => updateFormData('published_to_homepage', e.target.checked)}
                    className="rounded text-och-defender focus:ring-och-defender"
                  />
                  <span className="text-white">Publish this cohort to the homepage</span>
                </label>
                {formData.published_to_homepage && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Cohort profile image (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateFormData('profile_image', e.target.files?.[0] || null)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-och-defender file:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Registration form fields</label>
                      <p className="text-xs text-och-steel mb-3">
                        Add, remove, or edit fields shown when students or sponsors apply. Click a field to edit. Add custom questions (e.g. &quot;Why do you want to join?&quot;, &quot;Years of experience&quot;).
                      </p>
                      <RegistrationFormFieldsEditor
                        studentFields={formData.registration_form_fields.student}
                        sponsorFields={formData.registration_form_fields.sponsor}
                        onChange={(student, sponsor) =>
                          setFormData((prev) => ({
                            ...prev,
                            registration_form_fields: { student, sponsor }
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Staff Assignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Assigned Mentors
                  </label>
                  <select
                    multiple
                    value={formData.assigned_staff.mentors}
                    onChange={(e) => updateAssignedStaff('mentors', Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender h-32"
                  >
                    {mentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.uuid_id}>
                        {mentor.first_name && mentor.last_name 
                          ? `${mentor.first_name} ${mentor.last_name} (${mentor.email})`
                          : mentor.email
                        }
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-och-steel mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Assigned Coordinators
                  </label>
                  <select
                    multiple
                    value={formData.assigned_staff.coordinators}
                    onChange={(e) => updateAssignedStaff('coordinators', Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender h-32"
                  >
                    {coordinators.map((coordinator) => (
                      <option key={coordinator.id} value={coordinator.uuid_id}>
                        {coordinator.first_name && coordinator.last_name 
                          ? `${coordinator.first_name} ${coordinator.last_name} (${coordinator.email})`
                          : coordinator.email
                        }
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-och-steel mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-och-steel/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-och-steel/50 text-och-steel hover:bg-och-steel/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="defender"
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Creating...' : 'Create Cohort'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}