'use client'

import { useState, useEffect } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ModuleResponse, CreateModulePayload } from '@/types/api'
import { apiGateway } from '@/services/apiGateway'

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const data = await apiGateway.get('/modules/')
      setModules(data.results || data.data || data || [])
    } catch (error) {
      console.error('Failed to fetch modules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['program_director', 'admin']}>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender"></div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Modules</h1>
              <p className="text-och-steel">Manage learning modules and content units</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="defender"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Module
            </Button>
          </div>

          {modules.length === 0 ? (
            <Card className="border-och-steel/20 bg-och-midnight/50">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-och-midnight/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-och-steel mb-2 text-lg">No modules found</p>
                <p className="text-och-steel/70 mb-6">Create learning modules and content units</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="defender"
                >
                  Create Your First Module
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card key={module.id} className="border-och-steel/20 bg-och-midnight/50 hover:border-och-defender/50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{module.name}</h3>
                        <p className="text-sm text-och-mint">
                          {module.milestone.name} • {module.milestone.track.name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-och-steel bg-och-steel/10 px-2 py-1 rounded text-center">
                          {module.content_type}
                        </div>
                        {module.estimated_hours && (
                          <div className="text-xs text-och-orange bg-och-orange/10 px-2 py-1 rounded text-center">
                            {module.estimated_hours}h
                          </div>
                        )}
                      </div>
                    </div>

                    {module.description && (
                      <p className="text-sm text-och-steel mb-4 line-clamp-3">
                        {module.description}
                      </p>
                    )}

                    {module.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {module.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="text-xs bg-och-defender/20 text-och-mint px-2 py-1 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {module.skills.length > 3 && (
                            <span className="text-xs text-och-steel">
                              +{module.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-och-defender/50 text-och-defender hover:bg-och-defender hover:text-white"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 border-och-steel/50 text-och-steel hover:border-och-mint hover:text-och-mint"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {showCreateForm && (
            <div className="fixed inset-0 bg-och-midnight/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-4xl bg-och-midnight border border-och-steel/20 rounded-lg shadow-xl">
                <CreateModuleForm
                  onClose={() => setShowCreateForm(false)}
                  onSuccess={() => {
                    setShowCreateForm(false)
                    fetchModules()
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

interface CreateModuleFormProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateModuleForm({ onClose, onSuccess }: CreateModuleFormProps) {
  const [milestones, setMilestones] = useState<Array<{ id: string; name: string; track: { name: string; program: { name: string } } }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateModulePayload>({
    milestone: '',
    name: '',
    description: '',
    content_type: 'video',
    order: 1,
    skills: []
  })

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      const data = await apiGateway.get('/milestones/')
      setMilestones(data.results || data.data || data || [])
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await apiGateway.post('/modules/', formData)
      onSuccess()
    } catch (error) {
      console.error('Failed to create module:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Module</h1>
          <p className="text-och-steel">Add a new learning module to a milestone</p>
        </div>
        <button
          onClick={onClose}
          className="text-och-steel hover:text-white transition-colors p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">Milestone *</label>
                <select
                  value={formData.milestone}
                  onChange={(e) => setFormData(prev => ({ ...prev, milestone: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                >
                  <option value="">Select a milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.name} ({milestone.track.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">Content Type *</label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                >
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="lab">Lab</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-och-steel mb-2">Module Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Introduction to Cybersecurity"
                required
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-och-steel mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Covers fundamentals of cyber risk and governance..."
                rows={4}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Content Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">Order *</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  min="0"
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-och-steel mb-2">Content URL</label>
              <input
                type="url"
                value={formData.content_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value || undefined }))}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="defender"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Module'}
          </Button>
        </div>
      </form>
    </div>
  )
}