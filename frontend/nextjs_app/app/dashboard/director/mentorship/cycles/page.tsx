'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient } from '@/services/programsClient'
import { useCohorts, usePrograms, useTracks } from '@/hooks/usePrograms'

interface MentorshipCycle {
  id?: string
  cohort_id?: string
  cohort_name?: string
  program_id?: string
  program_name?: string
  track_id?: string
  track_name?: string
  duration_weeks: number
  frequency: 'weekly' | 'bi-weekly' | 'monthly'
  milestones: string[]
  goals: string[]
  program_type?: 'builders' | 'leaders' | 'custom'
  created_at?: string
  updated_at?: string
}

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export default function MentorshipCyclesPage() {
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })
  const { programs, isLoading: programsLoading } = usePrograms()
  const { tracks, isLoading: tracksLoading } = useTracks()
  
  const [cycles, setCycles] = useState<MentorshipCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCycle, setEditingCycle] = useState<MentorshipCycle | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<MentorshipCycle>({
    duration_weeks: 12,
    frequency: 'bi-weekly',
    milestones: [''],
    goals: [''],
    program_type: 'builders',
  })

  useEffect(() => {
    loadCycles()
  }, [])

  const loadCycles = async () => {
    setIsLoading(true)
    try {
      // For now, we'll create cycles from cohorts
      // In a real implementation, you'd fetch from an API endpoint
      const cyclesData: MentorshipCycle[] = cohorts.map(cohort => {
        const track = tracks.find(t => String(t.id) === String(cohort.track))
        const program = programs.find(p => track && String(p.id) === String(track.program))
        
        return {
          id: `cycle-${cohort.id}`,
          cohort_id: String(cohort.id),
          cohort_name: cohort.name,
          program_id: track ? String(track.program) : undefined,
          program_name: program?.name,
          track_id: track ? String(track.id) : undefined,
          track_name: track?.name,
          duration_weeks: 12,
          frequency: 'bi-weekly',
          milestones: [
            'Initial Assessment',
            'Mid-cycle Review',
            'Capstone Project Start',
            'Final Presentation'
          ],
          goals: [
            'Complete core curriculum modules',
            'Build portfolio project',
            'Pass technical assessments'
          ],
          program_type: 'builders',
        }
      })
      
      setCycles(cyclesData)
    } catch (error) {
      console.error('Failed to load cycles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingCycle(null)
    setSelectedCohort('')
    setFormData({
      duration_weeks: 12,
      frequency: 'bi-weekly',
      milestones: [''],
      goals: [''],
      program_type: 'builders',
    })
    setShowCreateForm(true)
  }

  const handleEdit = (cycle: MentorshipCycle) => {
    setEditingCycle(cycle)
    setSelectedCohort(cycle.cohort_id || '')
    setFormData(cycle)
    setShowCreateForm(true)
  }

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohort(cohortId)
    const cohort = cohorts.find(c => String(c.id) === cohortId)
    if (cohort) {
      // Check if this cohort already has a mentorship cycle
      const existingCycle = cycles.find(c => c.cohort_id === cohortId)
      if (existingCycle) {
        // Load existing cycle for editing
        setEditingCycle(existingCycle)
        setFormData(existingCycle)
      } else {
        // Reset form for new cycle
        setEditingCycle(null)
      const track = tracks.find(t => String(t.id) === String(cohort.track))
      const program = programs.find(p => track && String(p.id) === String(track.program))
      
      setFormData({
          duration_weeks: 12,
          frequency: 'weekly',
          milestones: [''],
          goals: [''],
          program_type: 'builders',
        cohort_id: cohortId,
        cohort_name: cohort.name,
        program_id: track ? String(track.program) : undefined,
        program_name: program?.name,
        track_id: track ? String(track.id) : undefined,
        track_name: track?.name,
      })
      }
    }
  }

  const handleAddMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, ''],
    })
  }

  const handleRemoveMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    })
  }

  const handleMilestoneChange = (index: number, value: string) => {
    const newMilestones = [...formData.milestones]
    newMilestones[index] = value
    setFormData({
      ...formData,
      milestones: newMilestones,
    })
  }

  const handleAddGoal = () => {
    setFormData({
      ...formData,
      goals: [...formData.goals, ''],
    })
  }

  const handleRemoveGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    })
  }

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...formData.goals]
    newGoals[index] = value
    setFormData({
      ...formData,
      goals: newGoals,
    })
  }

  const handleSave = async () => {
    if (!selectedCohort) {
      alert('Please select a cohort')
      return
    }

    if (formData.milestones.filter(m => m.trim()).length === 0) {
      alert('Please add at least one milestone')
      return
    }

    if (formData.goals.filter(g => g.trim()).length === 0) {
      alert('Please add at least one goal')
      return
    }

    setIsSaving(true)
    try {
      const cycleData = {
        duration_weeks: formData.duration_weeks,
        frequency: formData.frequency,
        milestones: formData.milestones.filter(m => m.trim()),
        goals: formData.goals.filter(g => g.trim()),
        program_type: formData.program_type || 'builders',
      }

      if (editingCycle?.id) {
        // Update existing cycle
        await programsClient.saveMentorshipCycle(selectedCohort, cycleData)
        setCycles(cycles.map(c => 
          c.id === editingCycle.id 
            ? { ...c, ...formData, ...cycleData }
            : c
        ))
      } else {
        // Check if cohort already has a cycle (double-check)
        const existingCycle = cycles.find(c => c.cohort_id === selectedCohort)
        if (existingCycle) {
          alert('This cohort already has a mentorship cycle. Please edit the existing cycle instead.')
          return
        }

        // Create new cycle
        await programsClient.saveMentorshipCycle(selectedCohort, cycleData)
        const cohort = cohorts.find(c => String(c.id) === selectedCohort)
        const track = tracks.find(t => cohort && String(t.id) === String(cohort.track))
        const program = programs.find(p => track && String(p.id) === String(track.program))
        
        setCycles([...cycles, {
          id: `cycle-${selectedCohort}-${Date.now()}`,
          ...formData,
          ...cycleData,
          cohort_id: selectedCohort,
          cohort_name: cohort?.name,
          program_id: track ? String(track.program) : undefined,
          program_name: program?.name,
          track_id: track ? String(track.id) : undefined,
          track_name: track?.name,
        }])
      }

      setShowCreateForm(false)
      setEditingCycle(null)
    } catch (error) {
      console.error('Failed to save cycle:', error)
      alert('Failed to save mentorship cycle')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setShowCreateForm(false)
    setEditingCycle(null)
    setSelectedCohort('')
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly'
      case 'bi-weekly': return 'Bi-weekly'
      case 'monthly': return 'Monthly'
      default: return frequency
    }
  }

  const getProgramTypeLabel = (type?: string) => {
    switch (type) {
      case 'builders': return 'Builders'
      case 'leaders': return 'Leaders'
      case 'custom': return 'Custom'
      default: return 'Builders'
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
                  <RefreshIcon />
                  Mentorship Cycles
                </h1>
                <p className="text-och-steel">Define milestones and goals for mentorship cycles</p>
              </div>
              <Button
                variant="defender"
                onClick={handleCreateNew}
                disabled={showCreateForm}
              >
                <PlusIcon />
                <span className="ml-2">Create Cycle</span>
              </Button>
            </div>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  {editingCycle ? 'Edit Mentorship Cycle' : 'Create New Mentorship Cycle'}
                </h2>

                <div className="space-y-6">
                  {/* Cohort Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Cohort *
                    </label>
                    <select
                      value={selectedCohort}
                      onChange={(e) => handleCohortChange(e.target.value)}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      disabled={!!editingCycle}
                    >
                      <option value="">Select a cohort</option>
                      {cohorts.map((cohort) => {
                        const track = tracks.find(t => String(t.id) === String(cohort.track))
                        const program = programs.find(p => track && String(p.id) === String(track.program))
                        return (
                          <option key={cohort.id} value={String(cohort.id)}>
                            {cohort.name} - {track?.name} ({program?.name})
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Duration and Frequency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Duration (weeks) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={formData.duration_weeks}
                        onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 12 })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Session Frequency *
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  {/* Program Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Program Type
                    </label>
                    <select
                      value={formData.program_type}
                      onChange={(e) => setFormData({ ...formData, program_type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    >
                      <option value="builders">Builders</option>
                      <option value="leaders">Leaders</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {/* Milestones */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-white">
                        Milestones *
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddMilestone}
                      >
                        <PlusIcon />
                        <span className="ml-1">Add</span>
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={milestone}
                            onChange={(e) => handleMilestoneChange(index, e.target.value)}
                            placeholder={`Milestone ${index + 1}`}
                            className="flex-1 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                          />
                          {formData.milestones.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMilestone(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-white">
                        Goals *
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddGoal}
                      >
                        <PlusIcon />
                        <span className="ml-1">Add</span>
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.goals.map((goal, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={goal}
                            onChange={(e) => handleGoalChange(index, e.target.value)}
                            placeholder={`Goal ${index + 1}`}
                            className="flex-1 px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                          />
                          {formData.goals.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveGoal(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                    <Button
                      variant="defender"
                      onClick={handleSave}
                      disabled={isSaving || !selectedCohort}
                    >
                      {isSaving ? 'Saving...' : (
                        <>
                          <CheckIcon />
                          <span className="ml-2">Save Cycle</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Cycles List */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Defined Cycles</h2>

              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading cycles...</p>
                  </div>
                </div>
              ) : cycles.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshIcon />
                  <p className="text-och-steel text-lg mt-4 mb-2">No cycles defined</p>
                  <p className="text-och-steel text-sm mb-4">Create a mentorship cycle to get started</p>
                  <Button variant="defender" onClick={handleCreateNew}>
                    <PlusIcon />
                    <span className="ml-2">Create First Cycle</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="p-5 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-mint/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{cycle.cohort_name}</h3>
                            {cycle.program_name && (
                              <Badge variant="defender">{cycle.program_name}</Badge>
                            )}
                            {cycle.track_name && (
                              <Badge variant="mint">{cycle.track_name}</Badge>
                            )}
                            <Badge variant="gold">{getProgramTypeLabel(cycle.program_type)}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-och-steel text-sm mb-1">Duration</p>
                              <p className="text-white font-medium">{cycle.duration_weeks} weeks</p>
                            </div>
                            <div>
                              <p className="text-och-steel text-sm mb-1">Frequency</p>
                              <p className="text-white font-medium">{getFrequencyLabel(cycle.frequency)}</p>
                            </div>
                            <div>
                              <p className="text-och-steel text-sm mb-1">Milestones</p>
                              <p className="text-white font-medium">{cycle.milestones.length}</p>
                            </div>
                          </div>

                          {/* Milestones */}
                          {cycle.milestones.length > 0 && (
                            <div className="mb-4">
                              <p className="text-och-steel text-sm mb-2 font-medium">Milestones</p>
                              <div className="space-y-1">
                                {cycle.milestones.map((milestone, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-och-defender/30 flex items-center justify-center text-och-defender text-xs font-semibold">
                                      {index + 1}
                                    </div>
                                    <span className="text-white">{milestone}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Goals */}
                          {cycle.goals.length > 0 && (
                            <div>
                              <p className="text-och-steel text-sm mb-2 font-medium">Goals</p>
                              <div className="flex flex-wrap gap-2">
                                {cycle.goals.map((goal, index) => (
                                  <Badge key={index} variant="steel">
                                    {goal}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cycle)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
