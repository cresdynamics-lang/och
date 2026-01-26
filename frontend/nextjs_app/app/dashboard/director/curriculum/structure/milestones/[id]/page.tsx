'use client'

import { useState, useEffect, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { programsClient, type Milestone, type Module, type Track } from '@/services/programsClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgram, useTrack } from '@/hooks/usePrograms'

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

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

export default function MilestoneManagementPage() {
  const params = useParams()
  const router = useRouter()
  const milestoneId = params.id as string

  const [milestone, setMilestone] = useState<Milestone | null>(null)
  const [track, setTrack] = useState<Track | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [isEditing, setIsEditing] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
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

  // Fetch milestone and related data
  const loadMilestoneData = useCallback(async () => {
    if (!milestoneId) return

    setIsLoading(true)
    setError(null)
    try {
      // Fetch milestone by ID
      const foundMilestone = await programsClient.getMilestone(milestoneId)

      setMilestone(foundMilestone)
      setMilestoneForm({
        name: foundMilestone.name,
        description: foundMilestone.description || '',
        order: foundMilestone.order,
        duration_weeks: foundMilestone.duration_weeks,
      })

      // Load track information
      if (foundMilestone.track) {
        try {
          const trackData = await programsClient.getTrack(foundMilestone.track)
          setTrack(trackData)
        } catch (err) {
          console.error('Failed to load track:', err)
        }
      }

      // Load modules for this milestone
      if (foundMilestone.id) {
        try {
          console.log(`🔄 Loading modules for milestone: ${foundMilestone.id}`)
          const milestoneModules = await programsClient.getModules(foundMilestone.id)
          console.log(`✅ Loaded ${milestoneModules.length} modules from backend:`, milestoneModules.map(m => ({ id: m.id, name: m.name, order: m.order })))
          const sortedModules = milestoneModules.sort((a, b) => (a.order || 0) - (b.order || 0))
          setModules(sortedModules)
        } catch (err) {
          console.error('❌ Failed to load modules:', err)
          setModules([])
        }
      } else {
        console.warn('⚠️ Milestone ID is missing, cannot load modules')
        setModules([])
      }
    } catch (err: any) {
      console.error('Failed to load milestone:', err)
      setError(err?.message || 'Failed to load milestone')
    } finally {
      setIsLoading(false)
    }
  }, [milestoneId])

  useEffect(() => {
    loadMilestoneData()
  }, [loadMilestoneData])

  const handleSaveMilestone = async () => {
    if (!milestone || !milestoneForm.name) {
      alert('Please provide a milestone name')
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

    try {
      const milestoneData: any = {
        name: milestoneForm.name.trim(),
        description: milestoneForm.description || '',
        track: milestone.track,
        order: milestoneForm.order ?? 0,
      }

      // Only include duration_weeks if it's a valid positive number
      if (milestoneForm.duration_weeks && milestoneForm.duration_weeks >= 1) {
        milestoneData.duration_weeks = milestoneForm.duration_weeks
      }

      await programsClient.updateMilestone(milestoneId, milestoneData)
      setIsEditing(false)
      await loadMilestoneData()
    } catch (error: any) {
      console.error('Failed to save milestone:', error)
      
      let errorMessage = 'Failed to save milestone'
      const errorData = error?.response?.data || error?.data
      
      if (errorData) {
        if (errorData.non_field_errors) {
          const nonFieldErrors = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ')
            : String(errorData.non_field_errors)
          errorMessage = nonFieldErrors
          
          if (nonFieldErrors.includes('unique') || nonFieldErrors.includes('track') || nonFieldErrors.includes('order')) {
            errorMessage += '. Please choose a different order number or edit the existing milestone with that order.'
          }
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail)
        } else if (typeof errorData === 'object') {
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

  const handleDeleteMilestone = async () => {
    if (!confirm('Are you sure you want to delete this milestone? This will also delete all modules within it.')) {
      return
    }

    try {
      await programsClient.deleteMilestone(milestoneId)
      router.push('/dashboard/director/curriculum/structure')
    } catch (error) {
      console.error('Failed to delete milestone:', error)
      alert('Failed to delete milestone')
    }
  }

  const handleCreateModule = () => {
    setEditingModule(null)
    setModuleForm({
      name: '',
      description: '',
      content_type: 'video',
      content_url: '',
      order: modules.length,
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
      await loadMilestoneData()
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
      await loadMilestoneData()
    } catch (error) {
      console.error('Failed to delete module:', error)
      alert('Failed to delete module')
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading milestone...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error || !milestone) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">{error || 'Milestone not found'}</p>
              <Link href="/dashboard/director/curriculum/structure">
                <Button variant="outline">Back to Curriculum Structure</Button>
              </Link>
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
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link href="/dashboard/director/curriculum/structure">
                    <Button variant="outline" size="sm">
                      ← Back
                    </Button>
                  </Link>
                </div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold">Milestone Management</h1>
                {track && (
                  <p className="text-och-steel">
                    Managing milestone in <span className="text-och-mint font-medium">{track.name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <Button variant="defender" onClick={() => setIsEditing(true)}>
                      <EditIcon />
                      <span className="ml-2">Edit Milestone</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeleteMilestone}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon />
                      <span className="ml-2">Delete</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Milestone Details */}
          <Card className="mb-6">
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white mb-4">Edit Milestone</h2>
                  
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
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setMilestoneForm({
                          name: milestone.name,
                          description: milestone.description || '',
                          order: milestone.order,
                          duration_weeks: milestone.duration_weeks,
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-white mb-2">
                        {milestone.order !== undefined && `${milestone.order + 1}. `}
                        {milestone.name}
                      </h2>
                      {milestone.description && (
                        <p className="text-och-steel mt-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-4 text-sm text-och-steel">
                        {milestone.duration_weeks && (
                          <span>Duration: {milestone.duration_weeks} weeks</span>
                        )}
                        <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Modules Section */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Modules</h2>
                  <p className="text-sm text-och-steel mt-1">
                    {modules.length === 0 
                      ? 'No modules defined yet for this milestone'
                      : `${modules.length} module${modules.length !== 1 ? 's' : ''} available`
                    }
                  </p>
                </div>
                <Button variant="defender" onClick={handleCreateModule}>
                  <PlusIcon />
                  <span className="ml-2">Add Module</span>
                </Button>
              </div>

              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint mx-auto mb-4"></div>
                  <p className="text-och-steel">Loading modules...</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="p-6 text-center border border-och-steel/20 rounded-lg bg-och-midnight/30">
                  <p className="text-och-steel mb-4">No modules in this milestone yet</p>
                  <Button variant="defender" onClick={handleCreateModule}>
                    <PlusIcon />
                    <span className="ml-2">Create First Module</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="p-5 bg-och-midnight/30 rounded-lg border border-och-steel/20 hover:border-och-mint/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-och-steel text-sm font-medium">
                              {module.order !== undefined && `${module.order + 1}.`}
                            </span>
                            <h3 className="text-white font-semibold text-lg">{module.name}</h3>
                            <Badge variant="steel">{module.content_type}</Badge>
                          </div>
                          {module.description && (
                            <p className="text-sm text-och-steel mb-3 ml-6">{module.description}</p>
                          )}
                          <div className="flex items-center gap-4 ml-6 text-sm text-och-steel">
                            {module.estimated_hours && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ~{module.estimated_hours} hour{module.estimated_hours !== 1 ? 's' : ''}
                              </span>
                            )}
                            {module.skills && module.skills.length > 0 && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {module.skills.length} skill{module.skills.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {module.content_url && (
                              <a
                                href={module.content_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-och-mint hover:text-och-defender flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View Content
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditModule(module)}
                            title="Edit module"
                          >
                            <EditIcon />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteModule(String(module.id))}
                            className="text-red-400 hover:text-red-300"
                            title="Delete module"
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

