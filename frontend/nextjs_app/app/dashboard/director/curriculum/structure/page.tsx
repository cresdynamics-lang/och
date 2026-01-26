'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Program, type Track, type Milestone, type Module } from '@/services/programsClient'
import { usePrograms, useTracks, useProgram } from '@/hooks/usePrograms'
import Link from 'next/link'

interface Lesson {
  id?: string
  module?: string
  title: string
  description?: string
  content_url?: string
  order_index: number
}

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

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default function CurriculumStructurePage() {
  const { programs, isLoading: programsLoading } = usePrograms()
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  
  // Fetch program detail when program is selected (includes tracks nested in program object)
  const { program: selectedProgramDetail, isLoading: loadingProgramDetail } = useProgram(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : ''
  )
  
  // Also try tracks endpoint as fallback
  const { tracks: tracksFromEndpoint, isLoading: loadingTracksFromEndpoint } = useTracks(
    selectedProgramId && selectedProgramId !== '' ? selectedProgramId : undefined
  )
  
  // Use tracks from program detail if available (more reliable), otherwise use tracks endpoint
  const tracks = useMemo(() => {
    if (!selectedProgramId) return []
    
    // Prefer tracks from program detail as it's the source of truth
    if (selectedProgramDetail?.tracks && Array.isArray(selectedProgramDetail.tracks)) {
      console.log('✅ Using tracks from program detail:', {
        programId: selectedProgramId,
        tracksCount: selectedProgramDetail.tracks.length,
        tracks: selectedProgramDetail.tracks.map((t: any) => ({ id: t.id, name: t.name, program: t.program }))
      })
      return selectedProgramDetail.tracks
    }
    
    // Fallback to tracks from endpoint
    console.log('📡 Using tracks from tracks endpoint:', {
      programId: selectedProgramId,
      tracksCount: tracksFromEndpoint.length,
      tracks: tracksFromEndpoint.map(t => ({ id: t.id, name: t.name, program: t.program }))
    })
    return tracksFromEndpoint
  }, [selectedProgramId, selectedProgramDetail, tracksFromEndpoint])
  
  const tracksLoading = loadingProgramDetail || loadingTracksFromEndpoint
  
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]) // Store all milestones for pagination
  const [modules, setModules] = useState<Module[]>([])
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  
  // Pagination state for milestones
  const [milestonePage, setMilestonePage] = useState(1)
  const [milestonesPerPage, setMilestonesPerPage] = useState(10)
  
  // Form states
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  
  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({
    name: '',
    description: '',
    order: 0,
    duration_weeks: 4,
  })
  
  const [moduleForm, setModuleForm] = useState<Partial<Module>>({
    name: '',
    description: '',
    content_type: 'video',
    content_url: '',
    order: 0,
    estimated_hours: 1,
    skills: [],
  })

  // Tracks are already filtered from program detail or endpoint, just use them directly
  const availableTracks = useMemo(() => {
    if (!selectedProgramId) return []
    // Tracks from program detail are already filtered, so use them directly
    return tracks
  }, [tracks, selectedProgramId])

  // Define loadMilestones before useEffect that uses it
  const loadMilestones = useCallback(async () => {
    if (!selectedTrackId) {
      console.log('⚠️ Cannot load milestones: no track selected')
      return
    }
    
    console.log(`🔄 Loading milestones for track: ${selectedTrackId}`)
    setIsLoading(true)
    try {
      const data = await programsClient.getMilestones(selectedTrackId)
      console.log(`✅ Loaded ${data.length} milestones from backend`)
      
      const sortedMilestones = data.sort((a, b) => (a.order || 0) - (b.order || 0))
      console.log(`✅ Sorted milestones by order:`, sortedMilestones.map(m => ({ id: m.id, name: m.name, order: m.order })))
      
      // Store all milestones for pagination
      setAllMilestones(sortedMilestones)
      
      // Load modules for all milestones (not just paginated ones)
      const allModules: Module[] = []
      for (const milestone of sortedMilestones) {
        if (milestone.id) {
          try {
          const milestoneModules = await programsClient.getModules(milestone.id)
          allModules.push(...milestoneModules)
            console.log(`✅ Loaded ${milestoneModules.length} modules for milestone ${milestone.name}`)
          } catch (err) {
            console.error(`❌ Failed to load modules for milestone ${milestone.id}:`, err)
          }
        }
      }
      setModules(allModules.sort((a, b) => (a.order || 0) - (b.order || 0)))
      console.log(`✅ Total modules loaded: ${allModules.length}`)
    } catch (error) {
      console.error('❌ Failed to load milestones:', error)
      setAllMilestones([])
      setModules([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedTrackId])

  // Load milestones when track is selected
  useEffect(() => {
    if (selectedTrackId) {
      loadMilestones()
      setMilestonePage(1) // Reset to first page when track changes
    } else {
      setMilestones([])
      setAllMilestones([])
      setModules([])
    }
  }, [selectedTrackId, loadMilestones])
  
  // Calculate paginated milestones
  const paginatedMilestones = useMemo(() => {
    const startIndex = (milestonePage - 1) * milestonesPerPage
    const endIndex = startIndex + milestonesPerPage
    return allMilestones.slice(startIndex, endIndex)
  }, [allMilestones, milestonePage, milestonesPerPage])
  
  const totalMilestonePages = Math.ceil(allMilestones.length / milestonesPerPage)
  
  // Adjust page if it becomes invalid after milestones change
  useEffect(() => {
    if (totalMilestonePages > 0 && milestonePage > totalMilestonePages) {
      setMilestonePage(totalMilestonePages)
    } else if (totalMilestonePages === 0 && milestonePage > 1) {
      setMilestonePage(1)
    }
  }, [totalMilestonePages, milestonePage])

  const handleMilestoneToggle = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones)
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId)
    } else {
      newExpanded.add(milestoneId)
    }
    setExpandedMilestones(newExpanded)
  }

  const handleCreateMilestone = () => {
    setEditingMilestone(null)
    // Calculate next available order (find max order and add 1, or use 0 if no milestones)
    const maxOrder = allMilestones.length > 0 
      ? Math.max(...allMilestones.map(m => m.order || 0))
      : -1
    const nextOrder = maxOrder + 1
    
    setMilestoneForm({
      name: '',
      description: '',
      order: nextOrder,
      duration_weeks: 4,
    })
    setShowMilestoneForm(true)
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setMilestoneForm({
      name: milestone.name,
      description: milestone.description,
      order: milestone.order,
      duration_weeks: milestone.duration_weeks,
    })
    setShowMilestoneForm(true)
  }

  const handleSaveMilestone = async () => {
    if (!selectedTrackId || !milestoneForm.name) {
      alert('Please select a track and provide a milestone name')
      return
    }

    // Validate duration_weeks if provided
    if (milestoneForm.duration_weeks !== undefined && milestoneForm.duration_weeks !== null && milestoneForm.duration_weeks < 1) {
      alert('Duration weeks must be at least 1 if provided')
      return
    }

    // Validate order
    if (milestoneForm.order !== undefined && milestoneForm.order < 0) {
      alert('Order must be a non-negative number')
      return
    }

    // Check for duplicate order (only for new milestones, not when editing)
    if (!editingMilestone?.id) {
      const existingMilestoneWithOrder = allMilestones.find(
        m => m.order === milestoneForm.order && String(m.track) === String(selectedTrackId)
      )
      if (existingMilestoneWithOrder) {
        alert(`A milestone with order ${milestoneForm.order} already exists for this track. Please choose a different order number.`)
        return
      }
    } else {
      // When editing, check if another milestone (not the one being edited) has the same order
      const existingMilestoneWithOrder = allMilestones.find(
        m => m.order === milestoneForm.order && 
             String(m.track) === String(selectedTrackId) &&
             String(m.id) !== String(editingMilestone.id)
      )
      if (existingMilestoneWithOrder) {
        alert(`A milestone with order ${milestoneForm.order} already exists for this track. Please choose a different order number.`)
        return
      }
    }

    try {
      const milestoneData: any = {
        name: milestoneForm.name.trim(),
        description: milestoneForm.description || '',
          track: selectedTrackId,
        order: milestoneForm.order ?? 0,
      }

      // Only include duration_weeks if it's a valid positive number
      if (milestoneForm.duration_weeks && milestoneForm.duration_weeks >= 1) {
        milestoneData.duration_weeks = milestoneForm.duration_weeks
      }

      if (editingMilestone?.id) {
        await programsClient.updateMilestone(editingMilestone.id, milestoneData)
      } else {
        await programsClient.createMilestone(milestoneData)
      }
      setShowMilestoneForm(false)
      setEditingMilestone(null)
      // Reload milestones to show the newly created one
      await loadMilestones()
      // Reset to first page if we're not already there
      if (milestonePage !== 1) {
        setMilestonePage(1)
      }
    } catch (error: any) {
      console.error('Failed to save milestone:', error)
      
      // Extract detailed error message
      let errorMessage = 'Failed to save milestone'
      const errorData = error?.response?.data || error?.data
      
      if (errorData) {
        // Handle non_field_errors (like unique constraint violations)
        if (errorData.non_field_errors) {
          const nonFieldErrors = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ')
            : String(errorData.non_field_errors)
          errorMessage = nonFieldErrors
          
          // If it's a unique constraint error, suggest a solution
          if (nonFieldErrors.includes('unique') || nonFieldErrors.includes('track') || nonFieldErrors.includes('order')) {
            errorMessage += '. Please choose a different order number or edit the existing milestone with that order.'
          }
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail)
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error)
        } else if (typeof errorData === 'object') {
          // Handle field-level validation errors
          const fieldErrors = Object.entries(errorData)
            .filter(([key]) => key !== 'non_field_errors') // Exclude non_field_errors as we handle it above
            .map(([field, errors]: [string, any]) => {
              const errorMsg = Array.isArray(errors) ? errors.join(', ') : String(errors)
              return `${field}: ${errorMsg}`
            })
            .join('; ')
          if (fieldErrors) {
            errorMessage = fieldErrors
          }
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone? This will also delete all modules within it.')) {
      return
    }

    try {
      await programsClient.deleteMilestone(milestoneId)
      await loadMilestones()
      // Note: Pagination will adjust automatically via useMemo when allMilestones updates
    } catch (error) {
      console.error('Failed to delete milestone:', error)
      alert('Failed to delete milestone')
    }
  }

  const handleCreateModule = (milestoneId: string) => {
    const milestoneModules = modules.filter(m => m.milestone === milestoneId)
    setEditingModule(null)
    setModuleForm({
      name: '',
      description: '',
      content_type: 'video',
      content_url: '',
      order: milestoneModules.length,
      estimated_hours: 1,
      skills: [],
      milestone: milestoneId,
    })
    setShowModuleForm(true)
  }

  const handleEditModule = (module: Module) => {
    setEditingModule(module)
    setModuleForm({
      name: module.name,
      description: module.description,
      content_type: module.content_type,
      content_url: module.content_url,
      order: module.order,
      estimated_hours: module.estimated_hours,
      skills: module.skills || [],
      milestone: module.milestone,
    })
    setShowModuleForm(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.milestone || !moduleForm.name) {
      alert('Please provide a module name and ensure milestone is set')
      return
    }

    // Validate order
    if (moduleForm.order !== undefined && moduleForm.order < 0) {
      alert('Order must be a non-negative number')
      return
    }

    // Check for duplicate order (only for new modules, not when editing)
    if (!editingModule?.id) {
      const milestoneModules = modules.filter(m => String(m.milestone) === String(moduleForm.milestone))
      const existingModuleWithOrder = milestoneModules.find(
        m => m.order === moduleForm.order
      )
      if (existingModuleWithOrder) {
        alert(`A module with order ${moduleForm.order} already exists in this milestone. Please choose a different order number.`)
        return
      }
    } else {
      // When editing, check if another module (not the one being edited) has the same order
      const milestoneModules = modules.filter(m => String(m.milestone) === String(moduleForm.milestone))
      const existingModuleWithOrder = milestoneModules.find(
        m => m.order === moduleForm.order && String(m.id) !== String(editingModule.id)
      )
      if (existingModuleWithOrder) {
        alert(`A module with order ${moduleForm.order} already exists in this milestone. Please choose a different order number.`)
        return
      }
    }

    try {
      // Prepare module data - ensure milestone is a string ID
      const moduleData: any = {
        name: moduleForm.name.trim(),
        description: moduleForm.description || '',
        milestone: String(moduleForm.milestone),
        content_type: moduleForm.content_type || 'video',
        order: moduleForm.order ?? 0,
      }

      // Only include optional fields if they have values
      if (moduleForm.content_url && moduleForm.content_url.trim()) {
        moduleData.content_url = moduleForm.content_url.trim()
      } else {
        moduleData.content_url = '' // Empty string is allowed (blank=True in model)
      }

      if (moduleForm.estimated_hours !== undefined && moduleForm.estimated_hours !== null) {
        moduleData.estimated_hours = moduleForm.estimated_hours
      }

      if (moduleForm.skills && Array.isArray(moduleForm.skills) && moduleForm.skills.length > 0) {
        moduleData.skills = moduleForm.skills
      } else {
        moduleData.skills = []
      }

      if (editingModule?.id) {
        await programsClient.updateModule(editingModule.id, moduleData)
      } else {
        await programsClient.createModule(moduleData)
      }
      setShowModuleForm(false)
      loadMilestones()
    } catch (error: any) {
      console.error('Failed to save module:', error)
      
      // Extract detailed error message
      let errorMessage = 'Failed to save module'
      const errorData = error?.response?.data || error?.data
      
      if (errorData) {
        if (errorData.non_field_errors) {
          const nonFieldErrors = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ')
            : String(errorData.non_field_errors)
          errorMessage = nonFieldErrors
          
          if (nonFieldErrors.includes('unique') || nonFieldErrors.includes('milestone') || nonFieldErrors.includes('order')) {
            errorMessage += '. Please choose a different order number or edit the existing module with that order.'
          }
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail)
        } else if (typeof errorData === 'object') {
          // Handle field-level validation errors
          const fieldErrors = Object.entries(errorData)
            .filter(([key]) => key !== 'non_field_errors')
            .map(([field, errors]: [string, any]) => {
              const errorMsg = Array.isArray(errors) ? errors.join(', ') : String(errors)
              return `${field}: ${errorMsg}`
            })
            .join('; ')
          if (fieldErrors) {
            errorMessage = fieldErrors
          }
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) {
      return
    }

    try {
      await programsClient.deleteModule(moduleId)
      loadMilestones()
    } catch (error) {
      console.error('Failed to delete module:', error)
      alert('Failed to delete module')
    }
  }

  const getModulesForMilestone = (milestoneId: string) => {
    return modules
      .filter(m => String(m.milestone) === String(milestoneId))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const selectedProgram = selectedProgramDetail || programs.find(p => String(p.id) === selectedProgramId)
  const selectedTrack = availableTracks.find(t => String(t.id) === selectedTrackId)

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Curriculum Structure</h1>
            <p className="text-och-steel">
              Define and manage the curriculum hierarchy: Track → Milestones → Modules
            </p>
          </div>

          {/* Program and Track Selection */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Program</label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      const newProgramId = e.target.value
                      setSelectedProgramId(newProgramId)
                      setSelectedTrackId('')
                      setMilestones([])
                      setModules([])
                      setExpandedMilestones(new Set())
                      console.log('📌 Program changed:', { newProgramId })
                    }}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    disabled={programsLoading}
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={String(program.id)}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track</label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                    disabled={!selectedProgramId || tracksLoading}
                  >
                    <option value="">
                      {tracksLoading ? 'Loading tracks...' : availableTracks.length === 0 && selectedProgramId ? 'No tracks available' : 'Select a track'}
                    </option>
                    {availableTracks.map((track) => (
                      <option key={track.id} value={String(track.id)}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTrack && (
                <div className="mt-4 p-4 bg-och-midnight/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedTrack.name}</h3>
                      <p className="text-sm text-och-steel">{selectedTrack.description}</p>
                    </div>
                    <Badge variant={selectedTrack.track_type === 'primary' ? 'defender' : 'gold'}>
                      {selectedTrack.track_type === 'primary' ? 'Primary Track' : 'Cross-Track'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Milestones and Modules */}
          {selectedTrackId && (
            <div className="space-y-4">
              {/* Milestones Header */}
              <div className="flex items-center justify-between">
                <div>
                <h2 className="text-2xl font-bold text-white">Milestones</h2>
                  {selectedTrack && (
                    <p className="text-sm text-och-steel mt-1">
                      Showing milestones for <span className="text-och-mint font-medium">{selectedTrack.name}</span>
                      {selectedProgram && (
                        <span className="text-och-steel"> in <span className="text-och-mint font-medium">{selectedProgram.name}</span></span>
                      )}
                    </p>
                  )}
                </div>
                <Button variant="defender" onClick={handleCreateMilestone}>
                  <PlusIcon />
                  <span className="ml-2">Add Milestone</span>
                </Button>
              </div>

              {isLoading ? (
                <Card>
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading curriculum structure...</p>
                  </div>
                </Card>
              ) : allMilestones.length === 0 ? (
                <Card>
                  <div className="p-6 text-center">
                    <p className="text-och-steel mb-4">No milestones defined yet</p>
                    <Button variant="defender" onClick={handleCreateMilestone}>
                      <PlusIcon />
                      <span className="ml-2">Create First Milestone</span>
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Milestones List with Pagination */}
                  <div className="space-y-4">
                    {paginatedMilestones.map((milestone) => {
                  const milestoneModules = getModulesForMilestone(String(milestone.id))
                  const isExpanded = expandedMilestones.has(String(milestone.id))

                  return (
                    <Card key={milestone.id}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                onClick={() => handleMilestoneToggle(String(milestone.id))}
                                className="text-och-steel hover:text-och-mint transition-colors"
                              >
                                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                              </button>
                              <div>
                                <h3 className="text-xl font-semibold text-white">
                                  {milestone.order !== undefined && `${milestone.order + 1}. `}
                                  {milestone.name}
                                </h3>
                                {milestone.description && (
                                  <p className="text-sm text-och-steel mt-1">{milestone.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-8 text-sm text-och-steel">
                              {milestone.duration_weeks && (
                                <span>Duration: {milestone.duration_weeks} weeks</span>
                              )}
                              <span>{milestoneModules.length} module{milestoneModules.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/director/curriculum/structure/milestones/${milestone.id}`}>
                              <Button variant="defender" size="sm">
                                Manage
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMilestone(milestone)}
                            >
                              <EditIcon />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMilestone(String(milestone.id))}
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>

                        {/* Modules */}
                        {isExpanded && (
                          <div className="ml-8 mt-4 space-y-3">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold text-white">Modules</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCreateModule(String(milestone.id))}
                              >
                                <PlusIcon />
                                <span className="ml-1">Add Module</span>
                              </Button>
                            </div>

                            {milestoneModules.length === 0 ? (
                              <div className="p-4 bg-och-midnight/30 rounded-lg text-center">
                                <p className="text-och-steel text-sm mb-2">No modules in this milestone</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateModule(String(milestone.id))}
                                >
                                  <PlusIcon />
                                  <span className="ml-1">Add Module</span>
                                </Button>
                              </div>
                            ) : (
                              milestoneModules.map((module) => (
                                <div
                                  key={module.id}
                                  className="p-4 bg-och-midnight/30 rounded-lg border border-och-steel/20"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-och-steel text-sm">
                                          {module.order !== undefined && `${module.order + 1}. `}
                                        </span>
                                        <h5 className="text-white font-medium">{module.name}</h5>
                                        <Badge variant="steel">{module.content_type}</Badge>
                                      </div>
                                      {module.description && (
                                        <p className="text-sm text-och-steel mb-2">{module.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-och-steel">
                                        {module.estimated_hours && (
                                          <span>~{module.estimated_hours} hour{module.estimated_hours !== 1 ? 's' : ''}</span>
                                        )}
                                        {module.skills && module.skills.length > 0 && (
                                          <span>{module.skills.length} skill{module.skills.length !== 1 ? 's' : ''}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditModule(module)}
                                      >
                                        <EditIcon />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteModule(String(module.id))}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <TrashIcon />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalMilestonePages > 1 && (
                    <Card className="mt-4">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-och-steel">
                              Showing {((milestonePage - 1) * milestonesPerPage) + 1}-{Math.min(milestonePage * milestonesPerPage, allMilestones.length)} of {allMilestones.length} milestones
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-och-steel">Per page:</label>
                              <select
                                value={milestonesPerPage}
                                onChange={(e) => {
                                  setMilestonesPerPage(Number(e.target.value))
                                  setMilestonePage(1)
                                }}
                                className="px-3 py-1 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-defender"
                              >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMilestonePage(1)}
                              disabled={milestonePage === 1}
                            >
                              First
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMilestonePage(prev => Math.max(1, prev - 1))}
                              disabled={milestonePage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-och-steel px-3">
                              Page {milestonePage} of {totalMilestonePages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMilestonePage(prev => Math.min(totalMilestonePages, prev + 1))}
                              disabled={milestonePage === totalMilestonePages}
                            >
                              Next
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMilestonePage(totalMilestonePages)}
                              disabled={milestonePage === totalMilestonePages}
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Milestone Form Modal */}
          {showMilestoneForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingMilestone ? 'Edit Milestone' : 'Create Milestone'}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={milestoneForm.name}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={milestoneForm.description || ''}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Order *</label>
                        <input
                          type="number"
                          min="0"
                          value={milestoneForm.order}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, order: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Duration (weeks)</label>
                        <input
                          type="number"
                          min="1"
                          value={milestoneForm.duration_weeks}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, duration_weeks: parseInt(e.target.value) || 4 })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        onClick={handleSaveMilestone}
                        disabled={!milestoneForm.name}
                      >
                        Save Milestone
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowMilestoneForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Module Form Modal */}
          {showModuleForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {editingModule ? 'Edit Module' : 'Create Module'}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={moduleForm.name}
                        onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Description</label>
                      <textarea
                        value={moduleForm.description || ''}
                        onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Content Type *</label>
                        <select
                          value={moduleForm.content_type}
                          onChange={(e) => setModuleForm({ ...moduleForm, content_type: e.target.value as any })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
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
                        <label className="block text-sm font-medium text-white mb-2">Order *</label>
                        <input
                          type="number"
                          min="0"
                          value={moduleForm.order}
                          onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Content URL</label>
                      <input
                        type="url"
                        value={moduleForm.content_url || ''}
                        onChange={(e) => setModuleForm({ ...moduleForm, content_url: e.target.value })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Estimated Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={moduleForm.estimated_hours}
                        onChange={(e) => setModuleForm({ ...moduleForm, estimated_hours: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-och-steel/20">
                      <Button
                        variant="defender"
                        onClick={handleSaveModule}
                        disabled={!moduleForm.name}
                      >
                        Save Module
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowModuleForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
