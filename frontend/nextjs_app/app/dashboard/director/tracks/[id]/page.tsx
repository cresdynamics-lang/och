'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useTrack, useUpdateTrack, useDeleteTrack } from '@/hooks/usePrograms'
import { programsClient, type Track, type Specialization, type Milestone, type Module } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUsers } from '@/hooks/useUsers'

export default function TrackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const trackId = params?.id as string | undefined
  const { track, isLoading, error, reload } = useTrack(trackId || '')
  const { updateTrack, isLoading: isUpdating } = useUpdateTrack()
  const { deleteTrack, isLoading: isDeleting } = useDeleteTrack()
  const { users } = useUsers({ page: 1, page_size: 200 })
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Track>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [cohorts, setCohorts] = useState<any[]>([])
  const [loadingCohorts, setLoadingCohorts] = useState(false)
  const [showAssignCohortsModal, setShowAssignCohortsModal] = useState(false)
  const [availableCohorts, setAvailableCohorts] = useState<any[]>([])
  const [loadingAvailableCohorts, setLoadingAvailableCohorts] = useState(false)
  const [selectedCohortIds, setSelectedCohortIds] = useState<Set<string>>(new Set())
  const [isAssigningCohorts, setIsAssigningCohorts] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  
  // Milestones and modules state
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({
    name: '',
    description: '',
    order: 0,
    duration_weeks: 4,
  })
  const [milestoneModules, setMilestoneModules] = useState<Partial<Module>[]>([])
  const [savingMilestone, setSavingMilestone] = useState(false)

  // Load cohorts for this track
  useEffect(() => {
    const loadCohorts = async () => {
      if (!trackId) return
      setLoadingCohorts(true)
      try {
        const res = await programsClient.getCohorts({ trackId, page: 1, pageSize: 200 })
        setCohorts(Array.isArray(res?.results) ? res.results : [])
      } catch (err) {
        console.error('Failed to load cohorts:', err)
      } finally {
        setLoadingCohorts(false)
      }
    }
    if (trackId) {
      loadCohorts()
    }
  }, [trackId])

  // Load available cohorts for assignment modal
  const loadAvailableCohorts = async () => {
    setLoadingAvailableCohorts(true)
    setAssignError(null)
    try {
      // Fetch all cohorts (not filtered by track)
      const res = await programsClient.getCohorts({ page: 1, pageSize: 500 })
      const allCohorts = Array.isArray(res?.results) ? res.results : []
      
      // Filter out cohorts already assigned to this track
      const available = allCohorts.filter((cohort: any) => {
        const cohortTrackId = cohort.track ? String(cohort.track) : null
        return cohortTrackId !== trackId
      })
      
      setAvailableCohorts(available)
    } catch (err) {
      console.error('Failed to load available cohorts:', err)
      setAssignError('Failed to load available cohorts')
    } finally {
      setLoadingAvailableCohorts(false)
    }
  }

  // Handle opening assign cohorts modal
  const handleOpenAssignCohorts = async () => {
    setShowAssignCohortsModal(true)
    setSelectedCohortIds(new Set())
    setAssignError(null)
    setAssignSuccess(null)
    await loadAvailableCohorts()
  }

  // Handle assigning selected cohorts to track
  const handleAssignCohorts = async () => {
    if (!trackId) return
    if (selectedCohortIds.size === 0) {
      setAssignError('Please select at least one cohort to assign')
      return
    }

    setAssignError(null)
    setAssignSuccess(null)
    setIsAssigningCohorts(true)

    try {
      // Update each selected cohort to assign it to the track
      const updatePromises = Array.from(selectedCohortIds).map((cohortId) =>
        programsClient.updateCohort(cohortId, { track: trackId })
      )

      await Promise.all(updatePromises)
      
      setAssignSuccess(`Successfully assigned ${selectedCohortIds.size} cohort(s) to the track`)
      
      // Reload cohorts for this track
      const res = await programsClient.getCohorts({ trackId, page: 1, pageSize: 200 })
      setCohorts(Array.isArray(res?.results) ? res.results : [])
      
      // Reload available cohorts (remove assigned ones)
      await loadAvailableCohorts()
      
      // Clear selection
      setSelectedCohortIds(new Set())
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowAssignCohortsModal(false)
        setAssignSuccess(null)
      }, 2000)
    } catch (err: any) {
      console.error('Failed to assign cohorts:', err)
      setAssignError(err?.message || 'Failed to assign cohorts. Please try again.')
    } finally {
      setIsAssigningCohorts(false)
    }
  }

  // Toggle cohort selection
  const toggleCohortSelection = (cohortId: string) => {
    const newSelection = new Set(selectedCohortIds)
    if (newSelection.has(cohortId)) {
      newSelection.delete(cohortId)
    } else {
      newSelection.add(cohortId)
    }
    setSelectedCohortIds(newSelection)
  }

  // Load milestones and modules for this track
  useEffect(() => {
    const loadModules = async () => {
      if (!trackId) return
      setLoadingModules(true)
      try {
        // Fetch milestones and modules in parallel
        const [milestonesData, modulesData] = await Promise.all([
          programsClient.getMilestones(trackId),
          programsClient.getModules(undefined, trackId)
        ])
        setMilestones(milestonesData || [])
        setModules(modulesData || [])
      } catch (err) {
        console.error('Failed to load modules:', err)
      } finally {
        setLoadingModules(false)
      }
    }
    if (trackId) {
      loadModules()
    }
  }, [trackId])

  // Reload milestones and modules
  const reloadMilestonesAndModules = async () => {
    if (!trackId) return
    setLoadingModules(true)
    try {
      const [milestonesData, modulesData] = await Promise.all([
        programsClient.getMilestones(trackId),
        programsClient.getModules(undefined, trackId)
      ])
      setMilestones(milestonesData || [])
      setModules(modulesData || [])
    } catch (err) {
      console.error('Failed to reload milestones and modules:', err)
    } finally {
      setLoadingModules(false)
    }
  }

  // Initialize form data when track loads
  useEffect(() => {
    if (track && !isEditing) {
      setFormData({
        name: track.name,
        key: track.key,
        track_type: track.track_type,
        description: track.description,
        missions: track.missions || [],
        director: track.director,
      })
    }
  }, [track, isEditing])

  // Get directors and mentors
  const directorsAndMentors = users.filter((u) => 
    u.roles?.some((r: any) => r.role === 'program_director' || r.role === 'mentor')
  ).map((u) => ({
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
  }))

  const handleSave = async () => {
    if (!trackId) return
    setSaveError(null)
    try {
      // Prepare update data - only include fields that have changed
      const updateData: any = {}
      
      if (formData.name !== track?.name) {
        updateData.name = formData.name?.trim()
      }
      
      if (formData.key !== track?.key) {
        updateData.key = formData.key?.trim()
      }
      
      if (formData.track_type !== track?.track_type) {
        updateData.track_type = formData.track_type
      }
      
      if (formData.description !== track?.description) {
        updateData.description = formData.description?.trim() || ''
      }
      
      if (formData.director !== track?.director) {
        updateData.director = formData.director || null
      }
      
      if (JSON.stringify(formData.missions || []) !== JSON.stringify(track?.missions || [])) {
        updateData.missions = formData.missions || []
      }
      
      console.log('Updating track with data:', updateData)
      
      await updateTrack(trackId, updateData)
      setIsEditing(false)
      reload()
    } catch (err: any) {
      console.error('Failed to update track:', err)
      console.error('Error details:', {
        message: err?.message,
        data: err?.data,
        response: err?.response,
        status: err?.status,
        fullError: err
      })
      
      // Extract detailed error message
      let errorMessage = 'Failed to update track'
      
      // Check ApiError format (from fetcher)
      if (err?.data) {
        if (typeof err.data === 'string') {
          errorMessage = err.data
        } else if (err.data.detail) {
          errorMessage = err.data.detail
        } else if (err.data.error) {
          errorMessage = err.data.error
        } else if (typeof err.data === 'object') {
          // Handle validation errors
          if (err.data.non_field_errors) {
            const nonFieldErrors = Array.isArray(err.data.non_field_errors) 
              ? err.data.non_field_errors.join(', ')
              : err.data.non_field_errors
            errorMessage = nonFieldErrors
          } else {
            const errors = Object.entries(err.data)
              .map(([field, messages]: [string, any]) => {
                let msg = Array.isArray(messages) ? messages.join(', ') : String(messages)
                
                // Handle unique constraint error
                if (msg.includes('program, key') || msg.includes('unique set')) {
                  return `A track with key "${formData.key}" already exists in this program. Please choose a different key.`
                }
                
                const fieldName = field === 'key' ? 'Track Key' : 
                                 field === 'name' ? 'Track Name' :
                                 field === 'program' ? 'Program' :
                                 field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')
                
                return `${fieldName}: ${msg}`
              })
              .filter(msg => msg.trim() !== '')
              .join('; ')
            errorMessage = errors || errorMessage
          }
        }
      } else if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        } else if (typeof err.response.data === 'object') {
          const errors = Object.entries(err.response.data)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : String(messages)
              const fieldName = field === 'key' ? 'Track Key' : 
                               field === 'name' ? 'Track Name' :
                               field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')
              return `${fieldName}: ${msg}`
            })
            .join('; ')
          errorMessage = errors || errorMessage
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setSaveError(errorMessage)
    }
  }

  const handleDelete = async () => {
    if (!trackId || !confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return
    }
    try {
      await deleteTrack(trackId)
      router.push('/dashboard/director/tracks')
    } catch (err: any) {
      alert(err.message || 'Failed to delete track')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: track?.name,
      key: track?.key,
      track_type: track?.track_type,
      description: track?.description,
      missions: track?.missions || [],
      director: track?.director,
    })
    setIsEditing(false)
    setSaveError(null)
  }

  const handleAddModuleToForm = () => {
    setMilestoneModules([...milestoneModules, {
      name: '',
      description: '',
      content_type: 'video',
      content_url: '',
      order: milestoneModules.length,
      estimated_hours: 1,
      skills: [],
    }])
  }

  const handleRemoveModuleFromForm = (index: number) => {
    setMilestoneModules(milestoneModules.filter((_, i) => i !== index))
  }

  const handleUpdateModuleInForm = (index: number, updates: Partial<Module>) => {
    const updated = [...milestoneModules]
    updated[index] = { ...updated[index], ...updates }
    setMilestoneModules(updated)
  }

  const handleSaveMilestone = async () => {
    if (!milestoneForm.name || !trackId) {
      alert('Please fill in milestone name')
      return
    }

    setSavingMilestone(true)
    try {
      // Create milestone first
      const milestoneData: any = {
        name: milestoneForm.name.trim(),
        description: milestoneForm.description || '',
        track: trackId,
        order: milestoneForm.order ?? 0,
        duration_weeks: milestoneForm.duration_weeks ?? 4,
      }

      console.log('Creating milestone with data:', milestoneData)
      const createdMilestone = await programsClient.createMilestone(milestoneData)
      
      // Create modules for the milestone
      if (milestoneModules.length > 0 && createdMilestone.id) {
        const modulePromises = milestoneModules
          .filter(m => m.name && m.name.trim()) // Only create modules with names
          .map(async (moduleForm, index) => {
            const moduleData: any = {
              name: moduleForm.name!.trim(),
              description: moduleForm.description || '',
              milestone: createdMilestone.id,
              content_type: moduleForm.content_type || 'video',
              order: moduleForm.order ?? index,
            }

            if (moduleForm.content_url && moduleForm.content_url.trim()) {
              moduleData.content_url = moduleForm.content_url.trim()
            }

            if (moduleForm.estimated_hours !== undefined && moduleForm.estimated_hours !== null && moduleForm.estimated_hours > 0) {
              moduleData.estimated_hours = moduleForm.estimated_hours
            }

            if (moduleForm.skills && Array.isArray(moduleForm.skills) && moduleForm.skills.length > 0) {
              moduleData.skills = moduleForm.skills
            } else {
              moduleData.skills = []
            }

            return programsClient.createModule(moduleData)
          })

        await Promise.all(modulePromises)
      }

      // Reset form and close modal
      setShowMilestoneForm(false)
      setMilestoneForm({
        name: '',
        description: '',
        order: 0,
        duration_weeks: 4,
      })
      setMilestoneModules([])
      
      // Reload milestones and modules
      await reloadMilestonesAndModules()
    } catch (error: any) {
      console.error('Failed to save milestone:', error)
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.non_field_errors?.[0] ||
                          (typeof error?.response?.data === 'object' ? JSON.stringify(error.response.data) : null) ||
                          error?.message || 
                          'Failed to save milestone'
      alert(errorMessage)
    } finally {
      setSavingMilestone(false)
    }
  }

  // Group modules by milestone
  const modulesByMilestone = useMemo(() => {
    const grouped: Record<string, Module[]> = {}
    modules.forEach((module) => {
      const milestoneId = String(module.milestone || '')
      if (!grouped[milestoneId]) {
        grouped[milestoneId] = []
      }
      grouped[milestoneId].push(module)
    })
    // Sort modules within each milestone by order
    Object.keys(grouped).forEach((milestoneId) => {
      grouped[milestoneId].sort((a, b) => (a.order || 0) - (b.order || 0))
    })
    return grouped
  }, [modules])

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading track...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error || !track) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-2">Error loading track</p>
              {error && <p className="text-sm text-och-steel mb-4">{error}</p>}
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/director/tracks">
                  <Button variant="outline">Back to Tracks</Button>
                </Link>
              </div>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-4xl font-bold bg-och-midnight/50 border border-och-steel/20 rounded-lg px-4 py-2 text-och-defender focus:outline-none focus:border-och-defender"
                  />
                ) : (
                  <h1 className="text-4xl font-bold mb-2 text-och-defender">{track.name}</h1>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                    {track.track_type === 'primary' ? 'Primary Track' : 'Cross-Track Program'}
                  </Badge>
                  {track.program_name && (
                    <Link href={`/dashboard/director/programs/${track.program}`} className="text-och-steel hover:text-och-defender">
                      Program: {track.program_name}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="defender"
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="defender"
                      size="sm"
                      onClick={() => {
                        // Set initial order to be after the last milestone
                        const lastOrder = milestones.length > 0 
                          ? Math.max(...milestones.map(m => m.order || 0))
                          : -1
                        setMilestoneForm({
                          name: '',
                          description: '',
                          order: lastOrder + 1,
                          duration_weeks: 4,
                        })
                        setMilestoneModules([])
                        setShowMilestoneForm(true)
                      }}
                    >
                      + Add Milestone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Track
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Link href="/dashboard/director/tracks">
                      <Button variant="outline" size="sm">
                        ← Back
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            {saveError && (
              <Card className="border-och-orange/50 bg-och-orange/10 mb-4">
                <div className="p-4 text-och-orange">
                  <p className="font-semibold mb-1">Error saving track</p>
                  <p className="text-sm">{saveError}</p>
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Track Details */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Track Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Track Key</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.key || ''}
                          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        />
                      ) : (
                        <p className="text-white font-mono">{track.key}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Track Type</label>
                      {isEditing ? (
                        <select
                          value={formData.track_type || 'primary'}
                          onChange={(e) => setFormData({ ...formData, track_type: e.target.value as 'primary' | 'cross_track' })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        >
                          <option value="primary">Primary Track</option>
                          <option value="cross_track">Cross-Track Program</option>
                        </select>
                      ) : (
                        <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                          {track.track_type === 'primary' ? 'Primary Track' : 'Cross-Track Program'}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Description</label>
                      {isEditing ? (
                        <textarea
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        />
                      ) : (
                        <p className="text-och-steel">{track.description || 'No description'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Track Director</label>
                      {isEditing ? (
                        <select
                          value={formData.director || ''}
                          onChange={(e) => setFormData({ ...formData, director: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        >
                          <option value="">None (assign later)</option>
                          {directorsAndMentors.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.first_name || ''} {user.last_name || ''} ({user.email})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-white">
                          {track.director ? directorsAndMentors.find(u => u.id === track.director)?.email || 'Unknown' : 'Not assigned'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Mission IDs (from Registry)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={Array.isArray(formData.missions) ? formData.missions.join(', ') : ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            missions: e.target.value.split(',').map(m => m.trim()).filter(Boolean) 
                          })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="mission-id-1, mission-id-2, ..."
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {track.missions && track.missions.length > 0 ? (
                            track.missions.map((missionId: string, idx: number) => (
                              <Badge key={idx} variant="outline">{missionId}</Badge>
                            ))
                          ) : (
                            <p className="text-och-steel">No missions linked</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Specializations */}
              {track.specializations && track.specializations.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Specializations ({track.specializations.length})</h2>
                    <div className="space-y-3">
                      {track.specializations.map((spec: Specialization) => (
                        <div key={spec.id} className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                          <h3 className="text-white font-semibold mb-2">{spec.name}</h3>
                          <p className="text-sm text-och-steel mb-2">{spec.description}</p>
                          <div className="flex items-center gap-4 text-xs text-och-steel">
                            <span>Duration: {spec.duration_weeks} weeks</span>
                            {spec.missions && spec.missions.length > 0 && (
                              <span>{spec.missions.length} missions</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Modules by Milestone */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                      Modules ({modules.length})
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reloadMilestonesAndModules}
                      disabled={loadingModules}
                    >
                      {loadingModules ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                  
                  {loadingModules ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender mx-auto mb-4"></div>
                      <p className="text-och-steel">Loading modules...</p>
                    </div>
                  ) : milestones.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No milestones found for this track.</p>
                      <p className="text-sm mt-2">Create milestones first to add modules.</p>
                    </div>
                  ) : modules.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No modules found for this track.</p>
                      <Button
                        variant="defender"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          const lastOrder = milestones.length > 0 
                            ? Math.max(...milestones.map(m => m.order || 0))
                            : -1
                          setMilestoneForm({
                            name: '',
                            description: '',
                            order: lastOrder + 1,
                            duration_weeks: 4,
                          })
                          setMilestoneModules([])
                          setShowMilestoneForm(true)
                        }}
                      >
                        + Add Milestone with Modules
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {milestones.map((milestone: Milestone) => {
                        const milestoneModules = modulesByMilestone[String(milestone.id)] || []
                        if (milestoneModules.length === 0) return null
                        
                        return (
                          <div key={milestone.id} className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-white font-semibold">{milestone.name}</h3>
                                <p className="text-sm text-och-steel mt-1">{milestone.description}</p>
                              </div>
                              <Badge variant="outline">
                                {milestoneModules.length} module{milestoneModules.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {milestoneModules.map((module: Module) => (
                                <div
                                  key={module.id}
                                  className="p-3 bg-och-midnight/70 rounded border border-och-steel/10 hover:border-och-defender/30 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-white font-medium">{module.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {module.content_type}
                                        </Badge>
                                        {module.order !== undefined && (
                                          <span className="text-xs text-och-steel">Order: {module.order}</span>
                                        )}
                                      </div>
                                      {module.description && (
                                        <p className="text-sm text-och-steel mb-2">{module.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-och-steel">
                                        {module.estimated_hours && (
                                          <span>⏱️ {module.estimated_hours}h</span>
                                        )}
                                        {module.content_url && (
                                          <a
                                            href={module.content_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-och-defender hover:underline"
                                          >
                                            View Content
                                          </a>
                                        )}
                                        {module.skills && module.skills.length > 0 && (
                                          <div className="flex gap-1 flex-wrap">
                                            {module.skills.map((skill: string, idx: number) => (
                                              <Badge key={idx} variant="outline" className="text-xs">
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - Cohorts & Stats */}
            <div className="space-y-6">
              {/* Cohorts */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Cohorts ({cohorts.length})</h2>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleOpenAssignCohorts}
                    >
                      + Assign Cohort
                    </Button>
                  </div>
                  {loadingCohorts ? (
                    <p className="text-och-steel text-sm">Loading cohorts...</p>
                  ) : cohorts.length > 0 ? (
                    <div className="space-y-2">
                      {cohorts.map((cohort) => (
                        <Link key={cohort.id} href={`/dashboard/director/cohorts/${cohort.id}`}>
                          <div className="p-3 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/50 transition-colors cursor-pointer">
                            <p className="text-white font-medium text-sm">{cohort.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={cohort.status === 'active' ? 'mint' : 'orange'} className="text-xs">
                                {cohort.status}
                              </Badge>
                              <span className="text-xs text-och-steel">
                                {cohort.enrolled_count || 0} / {cohort.seat_cap} seats
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-och-steel text-sm">No cohorts yet</p>
                  )}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-och-steel text-sm">Milestones</p>
                      <p className="text-2xl font-bold text-white">
                        {loadingModules ? '...' : milestones.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-och-steel text-sm">Modules</p>
                      <p className="text-2xl font-bold text-white">
                        {loadingModules ? '...' : modules.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-och-steel text-sm">Specializations</p>
                      <p className="text-2xl font-bold text-white">{track.specializations?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-och-steel text-sm">Linked Missions</p>
                      <p className="text-2xl font-bold text-white">{track.missions?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Link href={`/dashboard/director/programs/${track.program}`}>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        📋 View Program
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={handleOpenAssignCohorts}
                    >
                      👥 Assign Cohort
                    </Button>
                    {track.milestones && track.milestones.length > 0 && (
                      <Button variant="outline" className="w-full justify-start" size="sm" disabled>
                        📚 Manage Milestones
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Add Milestone with Modules Modal */}
          {showMilestoneForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-och-steel/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Add Milestone to Track</h3>
                    <p className="text-sm text-och-steel mt-1">{track.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowMilestoneForm(false)
                      setMilestoneForm({
                        name: '',
                        description: '',
                        order: 0,
                        duration_weeks: 4,
                      })
                      setMilestoneModules([])
                    }}
                    disabled={savingMilestone}
                  >
                    Close
                  </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  <div className="space-y-6">
                    {/* Milestone Form */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white border-b border-och-steel/20 pb-2">Milestone Details</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Milestone Name <span className="text-och-orange">*</span>
                        </label>
                        <input
                          type="text"
                          value={milestoneForm.name || ''}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="Enter milestone name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Description</label>
                        <textarea
                          value={milestoneForm.description || ''}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="Enter milestone description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Order</label>
                          <input
                            type="number"
                            value={milestoneForm.order || 0}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, order: parseInt(e.target.value) || 0 })}
                            min="0"
                            className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Duration (weeks)</label>
                          <input
                            type="number"
                            value={milestoneForm.duration_weeks || 4}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, duration_weeks: parseInt(e.target.value) || 4 })}
                            min="1"
                            className="w-full px-4 py-2.5 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modules Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-och-steel/20 pb-2">
                        <h4 className="text-lg font-semibold text-white">Modules ({milestoneModules.length})</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddModuleToForm}
                          disabled={savingMilestone}
                        >
                          + Add Module
                        </Button>
                      </div>

                      {milestoneModules.length === 0 ? (
                        <div className="text-center py-8 text-och-steel border border-och-steel/20 rounded-lg">
                          <p>No modules added yet.</p>
                          <p className="text-sm mt-1">Click "Add Module" to add modules to this milestone</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {milestoneModules.map((moduleForm, index) => (
                            <Card key={index} className="border-och-steel/30 bg-och-midnight/40">
                              <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-white font-medium">Module {index + 1}</h5>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveModuleFromForm(index)}
                                    disabled={savingMilestone}
                                    className="text-och-orange hover:text-och-orange/80 hover:border-och-orange"
                                  >
                                    Remove
                                  </Button>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white mb-2">
                                    Module Name <span className="text-och-orange">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={moduleForm.name || ''}
                                    onChange={(e) => handleUpdateModuleInForm(index, { name: e.target.value })}
                                    className="w-full px-4 py-2 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                    placeholder="Enter module name"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                                  <textarea
                                    value={moduleForm.description || ''}
                                    onChange={(e) => handleUpdateModuleInForm(index, { description: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                    placeholder="Enter module description"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Content Type</label>
                                    <select
                                      value={moduleForm.content_type || 'video'}
                                      onChange={(e) => handleUpdateModuleInForm(index, { content_type: e.target.value as any })}
                                      className="w-full px-4 py-2 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                    >
                                      <option value="video">Video</option>
                                      <option value="article">Article</option>
                                      <option value="quiz">Quiz</option>
                                      <option value="assignment">Assignment</option>
                                      <option value="lab">Lab</option>
                                      <option value="workshop">Workshop</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Order</label>
                                    <input
                                      type="number"
                                      value={moduleForm.order || index}
                                      onChange={(e) => handleUpdateModuleInForm(index, { order: parseInt(e.target.value) || index })}
                                      min="0"
                                      className="w-full px-4 py-2 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Estimated Hours</label>
                                    <input
                                      type="number"
                                      value={moduleForm.estimated_hours || 1}
                                      onChange={(e) => handleUpdateModuleInForm(index, { estimated_hours: parseFloat(e.target.value) || 1 })}
                                      min="0"
                                      step="0.5"
                                      className="w-full px-4 py-2 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2">Content URL</label>
                                    <input
                                      type="url"
                                      value={moduleForm.content_url || ''}
                                      onChange={(e) => handleUpdateModuleInForm(index, { content_url: e.target.value })}
                                      className="w-full px-4 py-2 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                      placeholder="https://..."
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white mb-2">Skills (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={Array.isArray(moduleForm.skills) ? moduleForm.skills.join(', ') : ''}
                                    onChange={(e) => {
                                      const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                      handleUpdateModuleInForm(index, { skills })
                                    }}
                                    className="w-full px-4 py-2 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                                    placeholder="Skill 1, Skill 2, Skill 3"
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-och-steel/20 flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowMilestoneForm(false)
                      setMilestoneForm({
                        name: '',
                        description: '',
                        order: 0,
                        duration_weeks: 4,
                      })
                      setMilestoneModules([])
                    }}
                    disabled={savingMilestone}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={handleSaveMilestone}
                    disabled={savingMilestone || !milestoneForm.name || !trackId}
                    className="flex-1"
                  >
                    {savingMilestone ? 'Saving...' : 'Add Milestone'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Assign Cohorts Modal */}
          {showAssignCohortsModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-och-steel/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Assign Cohorts to Track</h3>
                    <p className="text-sm text-och-steel mt-1">{track.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAssignCohortsModal(false)
                      setSelectedCohortIds(new Set())
                      setAssignError(null)
                      setAssignSuccess(null)
                    }}
                    disabled={isAssigningCohorts}
                  >
                    Close
                  </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  {assignError && (
                    <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg text-och-orange text-sm">
                      {assignError}
                    </div>
                  )}
                  
                  {assignSuccess && (
                    <div className="mb-4 p-3 bg-och-mint/10 border border-och-mint/30 rounded-lg text-och-mint text-sm">
                      {assignSuccess}
                    </div>
                  )}

                  {loadingAvailableCohorts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender mx-auto mb-4"></div>
                      <p className="text-och-steel">Loading available cohorts...</p>
                    </div>
                  ) : availableCohorts.length === 0 ? (
                    <div className="text-center py-8 text-och-steel">
                      <p>No available cohorts to assign.</p>
                      <p className="text-sm mt-2">All cohorts are already assigned to this track or other tracks.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mb-4">
                        <p className="text-sm text-och-steel">
                          Select cohorts to assign to this track. Selected: {selectedCohortIds.size}
                        </p>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {availableCohorts.map((cohort) => {
                          const isSelected = selectedCohortIds.has(String(cohort.id))
                          return (
                            <div
                              key={cohort.id}
                              onClick={() => toggleCohortSelection(String(cohort.id))}
                              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-och-defender/20 border-och-defender'
                                  : 'bg-och-midnight/50 border-och-steel/20 hover:border-och-defender/50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCohortSelection(String(cohort.id))}
                                  className="mt-1 w-4 h-4 text-och-defender bg-och-midnight border-och-steel/30 rounded focus:ring-och-defender"
                                />
                                <div className="flex-1">
                                  <p className="text-white font-medium">{cohort.name}</p>
                                  <div className="flex items-center gap-3 mt-2 text-sm text-och-steel">
                                    <Badge variant={cohort.status === 'active' ? 'mint' : 'orange'} className="text-xs">
                                      {cohort.status}
                                    </Badge>
                                    <span>
                                      {cohort.enrolled_count || 0} / {cohort.seat_cap} seats
                                    </span>
                                    {cohort.track_name && (
                                      <span className="text-och-steel">
                                        Current track: {cohort.track_name}
                                      </span>
                                    )}
                                  </div>
                                  {cohort.start_date && cohort.end_date && (
                                    <p className="text-xs text-och-steel mt-1">
                                      {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-och-steel/20 flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAssignCohortsModal(false)
                      setSelectedCohortIds(new Set())
                      setAssignError(null)
                      setAssignSuccess(null)
                    }}
                    disabled={isAssigningCohorts}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={handleAssignCohorts}
                    disabled={isAssigningCohorts || selectedCohortIds.size === 0}
                    className="flex-1"
                  >
                    {isAssigningCohorts ? 'Assigning...' : `Assign ${selectedCohortIds.size} Cohort(s)`}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}


