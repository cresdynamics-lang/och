'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Program, type Track, type Specialization, type ProgramRule } from '@/services/programsClient'
import { apiGateway } from '@/services/apiGateway'
import { useUsers } from '@/hooks/useUsers'

interface TrackFormData extends Omit<Track, 'id' | 'created_at' | 'updated_at' | 'program'> {
  specializations: SpecializationFormData[]
}

interface SpecializationFormData extends Omit<Specialization, 'id' | 'created_at' | 'updated_at' | 'track'> {
  _temp?: boolean
}

interface ProgramRuleFormData {
  criteria: {
    attendance_percent?: number
    portfolio_approved?: boolean
    feedback_score?: number
    payment_complete?: boolean
  }
  thresholds?: Record<string, any>
  dependencies?: string[]
}

interface UserOption {
  id: number
  email: string
  first_name?: string
  last_name?: string
}

type Step = 'program' | 'tracks' | 'rules' | 'review'

export default function CreateProgramClient() {
  const router = useRouter()
  const { users } = useUsers({ page: 1, page_size: 200 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('program')
  const [directorsAndMentors, setDirectorsAndMentors] = useState<UserOption[]>([])
  
  const [programData, setProgramData] = useState<Partial<Program>>({
    name: '',
    category: 'technical',
    description: '',
    duration_months: 6,
    default_price: 0,
    currency: 'USD',
    outcomes: [],
    missions_registry_link: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<('technical' | 'leadership' | 'mentorship' | 'executive')[]>(['technical'])

  const [tracks, setTracks] = useState<TrackFormData[]>([])
  const [programRules, setProgramRules] = useState<ProgramRuleFormData>({
    criteria: {
      attendance_percent: 80,
      portfolio_approved: true,
      feedback_score: 4.0,
      payment_complete: true,
    },
    thresholds: {},
    dependencies: [],
  })

  // Load directors and mentors
  useEffect(() => {
    const loadDirectorsAndMentors = () => {
      const directors = users.filter((u) => 
        u.roles?.some((r: any) => r.role === 'program_director' || r.role === 'mentor')
      ).map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
      }))
      setDirectorsAndMentors(directors)
    }
    if (users.length > 0) {
      loadDirectorsAndMentors()
    }
  }, [users])

  const addTrack = () => {
    const newTrack: TrackFormData = {
      name: '',
      key: `track_${tracks.length + 1}`,
      track_type: 'primary',
      description: '',
      competencies: {},
      missions: [],
      director: null,
      specializations: [],
    }
    setTracks([...tracks, newTrack])
  }

  const updateTrack = (index: number, data: Partial<TrackFormData>) => {
    const updated = [...tracks]
    updated[index] = { ...updated[index], ...data }
    setTracks(updated)
  }

  const removeTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index))
  }

  const addSpecialization = (trackIndex: number) => {
    const updated = [...tracks]
    updated[trackIndex].specializations.push({
      name: '',
      description: '',
      missions: [],
      duration_weeks: 4,
    })
    setTracks(updated)
  }

  const updateSpecialization = (trackIndex: number, specIndex: number, data: Partial<SpecializationFormData>) => {
    const updated = [...tracks]
    updated[trackIndex].specializations[specIndex] = {
      ...updated[trackIndex].specializations[specIndex],
      ...data,
    }
    setTracks(updated)
  }

  const removeSpecialization = (trackIndex: number, specIndex: number) => {
    const updated = [...tracks]
    updated[trackIndex].specializations = updated[trackIndex].specializations.filter((_, i) => i !== specIndex)
    setTracks(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate required fields
    if (!programData.name || programData.name.trim() === '') {
      setError('Program name is required and cannot be blank')
      setIsLoading(false)
      return
    }

    if (selectedCategories.length === 0) {
      setError('At least one category must be selected')
      setIsLoading(false)
      return
    }

    if (tracks.length === 0) {
      setError('At least one track must be defined')
      setIsLoading(false)
      return
    }

    // Validate tracks
    for (const track of tracks) {
      if (!track.name || track.name.trim() === '') {
        setError(`Track name is required for all tracks`)
        setIsLoading(false)
        return
      }
    }

    try {
      // Prepare program data
      const submitData: any = {
        ...programData,
        name: programData.name?.trim(),
        categories: selectedCategories,
        category: selectedCategories[0],
        // Convert empty string to null for missions_registry_link to avoid URL validation errors
        missions_registry_link: programData.missions_registry_link?.trim() || null,
        // Ensure outcomes is always an array
        outcomes: programData.outcomes || [],
        tracks: tracks.map(track => ({
          ...track,
          specializations: track.specializations,
        })),
        rules: [{
          rule: programRules,
          active: true,
        }],
      }

      console.log('Submitting program data:', submitData)

      const result = await programsClient.createProgram(submitData)
      
      console.log('✅ Program created successfully:', result)
      
      if (!result.id) {
        throw new Error('Program was created but no ID was returned')
      }
      
      router.push(`/dashboard/director/programs/${result.id}`)
    } catch (err: any) {
      console.error('Failed to create program:', err)
      
      let errorMessage = 'Failed to create program'
      if (err.response?.data) {
        if (err.response.data.details) {
          errorMessage = `Validation error: ${JSON.stringify(err.response.data.details, null, 2)}`
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const steps: { key: Step; label: string; description: string }[] = [
    { key: 'program', label: 'Program Definition', description: 'Define metadata, goals, and structure' },
    { key: 'tracks', label: 'Tracks & Specializations', description: 'Define learning paths and specializations' },
    { key: 'rules', label: 'Completion Rules', description: 'Configure auto-graduation criteria' },
    { key: 'review', label: 'Review', description: 'Review and create program' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  return (
    <DirectorLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-defender">Create New Program</h1>
          <p className="text-och-steel">Define a comprehensive program structure following OCH guidelines</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      idx === currentStepIndex
                        ? 'bg-och-defender text-white'
                        : idx < currentStepIndex
                        ? 'bg-och-mint text-och-midnight'
                        : 'bg-och-midnight/50 text-och-steel'
                    }`}
                  >
                    {idx < currentStepIndex ? '✓' : idx + 1}
            </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${idx === currentStepIndex ? 'text-och-defender' : 'text-och-steel'}`}>
                      {s.label}
          </div>
                    <div className="text-xs text-och-steel mt-1">{s.description}</div>
            </div>
          </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${idx < currentStepIndex ? 'bg-och-mint' : 'bg-och-steel/20'}`} />
                )}
            </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
              {error && (
            <Card className="mb-6 border-och-orange/50 bg-och-orange/10">
              <div className="p-4 text-och-orange">
                  <div className="font-semibold mb-2">Error:</div>
                  <pre className="text-sm whitespace-pre-wrap">{error}</pre>
                </div>
            </Card>
              )}

          {/* Step 1: Program Definition */}
          {step === 'program' && (
            <Card>
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Program Definition</h2>
                  <p className="text-och-steel mb-6">
                    Define the high-level administrative and academic container for your training program.
                    This establishes the program's metadata, goals, and links to the Missions/Competency Registry.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={programData.name}
                    onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="e.g., Cybersecurity Leadership Program"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Categories * (Select one or more)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'technical', label: 'Technical', icon: '🔧' },
                      { value: 'leadership', label: 'Leadership', icon: '👔' },
                      { value: 'mentorship', label: 'Mentorship', icon: '🤝' },
                      { value: 'executive', label: 'Executive', icon: '💼' },
                    ].map((category) => (
                      <label
                        key={category.value}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedCategories.includes(category.value as any)
                            ? 'border-och-defender bg-och-defender/10'
                            : 'border-och-steel/20 bg-och-midnight/50 hover:border-och-steel/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.value as any)}
                          onChange={(e) => {
                            const catValue = category.value as 'technical' | 'leadership' | 'mentorship' | 'executive'
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, catValue])
                            } else {
                              if (selectedCategories.length > 1) {
                                setSelectedCategories(selectedCategories.filter(c => c !== catValue))
                              }
                            }
                          }}
                          className="w-5 h-5 text-och-defender bg-och-midnight border-och-steel/30 rounded focus:ring-och-defender focus:ring-2"
                        />
                        <span className="text-2xl">{category.icon}</span>
                        <span className="text-white font-medium">{category.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={programData.description}
                    onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="Describe the program goals, outcomes, and alignment with OCH philosophy..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Duration (months) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={programData.duration_months}
                      onChange={(e) => setProgramData({ ...programData, duration_months: parseInt(e.target.value) || 6 })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Default Price
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={programData.currency}
                        onChange={(e) => setProgramData({ ...programData, currency: e.target.value })}
                        className="px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="KES">KES</option>
                      </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={programData.default_price}
                      onChange={(e) => setProgramData({ ...programData, default_price: parseFloat(e.target.value) || 0 })}
                        className="flex-1 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                    Missions/Competency Registry Link
                    </label>
                    <input
                      type="url"
                      value={programData.missions_registry_link}
                      onChange={(e) => setProgramData({ ...programData, missions_registry_link: e.target.value })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="https://registry.ongoza.cyberhub/..."
                    />
                  <p className="text-xs text-och-steel mt-1">
                    Link to the central Missions/Competency Registry to ensure learning goals align with standardized industry roles
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Learning Outcomes (one per line)
                  </label>
                  <textarea
                    value={programData.outcomes?.join('\n') || ''}
                    onChange={(e) => setProgramData({ ...programData, outcomes: e.target.value.split('\n').filter(o => o.trim()) })}
                    rows={4}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="Students will learn...&#10;Students will be able to...&#10;Students will demonstrate..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
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
                    onClick={() => setStep('tracks')}
                  >
                    Next: Define Tracks
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Tracks & Specializations */}
          {step === 'tracks' && (
              <Card>
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Tracks & Specializations</h2>
                  <p className="text-och-steel mb-6">
                    Break down your program into specific learning paths (Tracks) that represent specialized cyber roles.
                    Optionally define specializations within tracks for focused learning paths.
                  </p>
                </div>

                  <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Tracks</h3>
                      <Button
                        type="button"
                        variant="outline"
                    onClick={addTrack}
                      >
                    + Add Track
                      </Button>
                </div>

                {tracks.length === 0 ? (
                  <div className="text-center py-12 bg-och-midnight/30 rounded-lg border border-och-steel/20">
                    <p className="text-och-steel mb-4">No tracks defined yet</p>
                      <Button
                        type="button"
                      variant="defender"
                      onClick={addTrack}
                      >
                      Add First Track
                      </Button>
                    </div>
                  ) : (
                  <div className="space-y-6">
                      {tracks.map((track, trackIndex) => (
                      <Card key={trackIndex} className="border-och-defender/30 bg-och-midnight/30">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-white">Track {trackIndex + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTrack(trackIndex)}
                              >
                                Remove
                              </Button>
                            </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  Track Name *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={track.name}
                                  onChange={(e) => updateTrack(trackIndex, { name: e.target.value })}
                                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                placeholder="e.g., Cyber Defense Track"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  Track Key *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={track.key}
                                  onChange={(e) => updateTrack(trackIndex, { key: e.target.value })}
                                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                  placeholder="e.g., defenders"
                                />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Track Type *
                            </label>
                            <select
                              value={track.track_type}
                              onChange={(e) => updateTrack(trackIndex, { track_type: e.target.value as any })}
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                            >
                              <option value="primary">Primary Track</option>
                              <option value="cross_track">Cross-Track Program</option>
                            </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={track.description}
                                  onChange={(e) => updateTrack(trackIndex, { description: e.target.value })}
                                  rows={2}
                                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                              placeholder="Describe this track's focus and alignment with industry roles..."
                                />
                              </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Track Director
                            </label>
                            <select
                              value={track.director || ''}
                              onChange={(e) => updateTrack(trackIndex, { director: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                            >
                              <option value="">None (assign later)</option>
                              {directorsAndMentors.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.first_name || ''} {user.last_name || ''} ({user.email})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Mission IDs (from Registry)
                            </label>
                            <input
                              type="text"
                              value={track.missions?.join(', ') || ''}
                              onChange={(e) => updateTrack(trackIndex, { missions: e.target.value.split(',').map(m => m.trim()).filter(Boolean) })}
                              className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                              placeholder="mission-id-1, mission-id-2, ..."
                            />
                            <p className="text-xs text-och-steel mt-1">
                              Comma-separated list of mission IDs from the Missions/Competency Registry
                            </p>
                          </div>

                          {/* Specializations */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="block text-sm font-medium text-white">
                                Specializations (Optional)
                                  </label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                onClick={() => addSpecialization(trackIndex)}
                                  >
                                + Add Specialization
                                  </Button>
                                </div>

                            {track.specializations.length > 0 && (
                              <div className="space-y-3">
                                {track.specializations.map((spec, specIndex) => (
                                  <div key={specIndex} className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-och-defender">
                                        Specialization {specIndex + 1}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                        onClick={() => removeSpecialization(trackIndex, specIndex)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                          type="text"
                                        placeholder="Specialization name"
                                        value={spec.name}
                                        onChange={(e) => updateSpecialization(trackIndex, specIndex, { name: e.target.value })}
                                        className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                          />
                                          <input
                                            type="number"
                                            placeholder="Duration (weeks)"
                                        value={spec.duration_weeks}
                                        onChange={(e) => updateSpecialization(trackIndex, specIndex, { duration_weeks: parseInt(e.target.value) || 4 })}
                                        className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                          />
                                        </div>
                                    <textarea
                                      placeholder="Description"
                                      value={spec.description}
                                      onChange={(e) => updateSpecialization(trackIndex, specIndex, { description: e.target.value })}
                                      rows={2}
                                      className="w-full mt-3 px-3 py-2 bg-och-midnight border border-och-steel/20 rounded text-white text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                                            <Button
                                              type="button"
                                              variant="outline"
                    onClick={() => setStep('program')}
                                            >
                    ← Back
                                            </Button>
                                                <Button
                                                  type="button"
                    variant="defender"
                    onClick={() => setStep('rules')}
                                                >
                    Next: Completion Rules
                                                </Button>
                                              </div>
              </div>
            </Card>
          )}

          {/* Step 3: Completion Rules */}
          {step === 'rules' && (
            <Card>
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Completion Rules</h2>
                  <p className="text-och-steel mb-6">
                    Define measurable criteria for program success and auto-graduation logic.
                    These rules govern when students are automatically marked as completed and certificates are generated.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-3 p-4 border border-och-steel/20 rounded-lg">
                                                <input
                        type="checkbox"
                        checked={programRules.criteria.payment_complete !== undefined}
                        onChange={(e) => setProgramRules({
                          ...programRules,
                          criteria: {
                            ...programRules.criteria,
                            payment_complete: e.target.checked ? true : undefined,
                          },
                        })}
                        className="w-5 h-5 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium">Payment Complete</div>
                        <div className="text-sm text-och-steel">Require payment to be completed or waived</div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Minimum Attendance Percentage
                    </label>
                    <div className="flex items-center gap-4">
                                                <input
                        type="checkbox"
                        checked={programRules.criteria.attendance_percent !== undefined}
                        onChange={(e) => setProgramRules({
                          ...programRules,
                          criteria: {
                            ...programRules.criteria,
                            attendance_percent: e.target.checked ? (programRules.criteria.attendance_percent || 80) : undefined,
                          },
                        })}
                        className="w-5 h-5 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                      />
                      {programRules.criteria.attendance_percent !== undefined && (
                                                <input
                          type="number"
                          min="0"
                          max="100"
                          value={programRules.criteria.attendance_percent}
                          onChange={(e) => setProgramRules({
                            ...programRules,
                            criteria: {
                              ...programRules.criteria,
                              attendance_percent: parseInt(e.target.value) || 80,
                            },
                          })}
                          className="w-32 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                        />
                      )}
                      <span className="text-och-steel">%</span>
                                              </div>
                                            </div>

                  <div>
                    <label className="flex items-center gap-3 p-4 border border-och-steel/20 rounded-lg">
                      <input
                        type="checkbox"
                        checked={programRules.criteria.portfolio_approved !== undefined}
                        onChange={(e) => setProgramRules({
                          ...programRules,
                          criteria: {
                            ...programRules.criteria,
                            portfolio_approved: e.target.checked ? true : undefined,
                          },
                        })}
                        className="w-5 h-5 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium">Portfolio Approval Required</div>
                        <div className="text-sm text-och-steel">Require key artifacts (e.g., Capstone project) to be approved</div>
                                        </div>
                    </label>
                                      </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Minimum Feedback Score
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={programRules.criteria.feedback_score !== undefined}
                        onChange={(e) => setProgramRules({
                          ...programRules,
                          criteria: {
                            ...programRules.criteria,
                            feedback_score: e.target.checked ? (programRules.criteria.feedback_score || 4.0) : undefined,
                          },
                        })}
                        className="w-5 h-5 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                      />
                      {programRules.criteria.feedback_score !== undefined && (
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={programRules.criteria.feedback_score}
                          onChange={(e) => setProgramRules({
                            ...programRules,
                            criteria: {
                              ...programRules.criteria,
                              feedback_score: parseFloat(e.target.value) || 4.0,
                            },
                          })}
                          className="w-32 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                        />
                      )}
                      <span className="text-och-steel">out of 5.0</span>
                                    </div>
                              </div>
                            </div>

                <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                    onClick={() => setStep('tracks')}
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

          {/* Step 4: Review */}
          {step === 'review' && (
              <Card>
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Review Program</h2>
                  <p className="text-och-steel mb-6">
                    Review all program details before creating. You can create cohorts and configure mentorship after the program is created.
                  </p>
                </div>

                {/* Program Details */}
                    <div>
                  <h3 className="font-semibold text-och-defender mb-3 text-lg">Program Details</h3>
                      <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                    <p><span className="text-och-steel">Name:</span> <span className="text-white font-medium">{programData.name}</span></p>
                        <div>
                          <span className="text-och-steel">Categories:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedCategories.map((cat) => (
                              <Badge key={cat} variant="defender" className="capitalize">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p><span className="text-och-steel">Duration:</span> <span className="text-white">{programData.duration_months} months</span></p>
                        <p><span className="text-och-steel">Price:</span> <span className="text-white">{programData.currency} {programData.default_price}</span></p>
                    {programData.missions_registry_link && (
                      <p><span className="text-och-steel">Registry Link:</span> <span className="text-white text-xs break-all">{programData.missions_registry_link}</span></p>
                    )}
                      </div>
                    </div>

                {/* Tracks */}
                    <div>
                  <h3 className="font-semibold text-och-defender mb-3 text-lg">Tracks ({tracks.length})</h3>
                  <div className="space-y-3">
                        {tracks.map((track, idx) => (
                          <div key={idx} className="bg-och-midnight/50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                                {track.track_type}
                              </Badge>
                              <span className="text-white font-medium">{track.name}</span>
                          <span className="text-och-steel text-sm">({track.key})</span>
                            </div>
                        {track.director && (
                          <p className="text-xs text-och-steel">Director: {directorsAndMentors.find(u => u.id === track.director)?.email}</p>
                        )}
                        {track.specializations.length > 0 && (
                          <p className="text-xs text-och-steel mt-1">
                            {track.specializations.length} specialization(s)
                            </p>
                        )}
                          </div>
                        ))}
                      </div>
                    </div>

                {/* Completion Rules */}
                <div>
                  <h3 className="font-semibold text-och-defender mb-3 text-lg">Completion Rules</h3>
                  <div className="bg-och-midnight/50 p-4 rounded-lg space-y-2 text-sm">
                    {programRules.criteria.payment_complete && (
                      <p className="text-white">✓ Payment must be completed</p>
                    )}
                    {programRules.criteria.attendance_percent !== undefined && (
                      <p className="text-white">✓ Minimum {programRules.criteria.attendance_percent}% attendance</p>
                    )}
                    {programRules.criteria.portfolio_approved && (
                      <p className="text-white">✓ Portfolio approval required</p>
                    )}
                    {programRules.criteria.feedback_score !== undefined && (
                      <p className="text-white">✓ Minimum {programRules.criteria.feedback_score}/5.0 feedback score</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
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
                    {isLoading ? 'Creating Program...' : 'Create Program'}
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
