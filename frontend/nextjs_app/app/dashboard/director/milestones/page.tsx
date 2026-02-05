'use client'

import { useState, useEffect } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MilestoneResponse, CreateMilestonePayload } from '@/types/api'
import { apiGateway } from '@/services/apiGateway'

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      const data = await apiGateway.get('/milestones/')
      setMilestones(data.results || data.data || data || [])
    } catch (error) {
      console.error('Failed to fetch milestones:', error)
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
              <h1 className="text-2xl font-bold text-white mb-2">Milestones</h1>
              <p className="text-och-steel">Manage major checkpoints and learning milestones</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="defender"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Milestone
            </Button>
          </div>

          {milestones.length === 0 ? (
            <Card className="border-och-steel/20 bg-och-midnight/50">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-och-midnight/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-och-steel mb-2 text-lg">No milestones found</p>
                <p className="text-och-steel/70 mb-6">Create major checkpoints and learning milestones</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="defender"
                >
                  Create Your First Milestone
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="border-och-steel/20 bg-och-midnight/50 hover:border-och-defender/50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{milestone.name}</h3>
                        <p className="text-sm text-och-mint">
                          {milestone.track.name} • {milestone.track.program.name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-och-steel bg-och-steel/10 px-2 py-1 rounded text-center">
                          #{milestone.order}
                        </div>
                        {milestone.duration_weeks && (
                          <div className="text-xs text-och-orange bg-och-orange/10 px-2 py-1 rounded text-center">
                            {milestone.duration_weeks}w
                          </div>
                        )}
                      </div>
                    </div>

                    {milestone.description && (
                      <p className="text-sm text-och-steel mb-4 line-clamp-3">
                        {milestone.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-och-steel mb-4">
                      <span>Modules: {milestone.modules?.length || 0}</span>
                    </div>

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
            <CreateMilestoneModal
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => {
                setShowCreateForm(false)
                fetchMilestones()
              }}
            />
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

interface CreateMilestoneModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateMilestoneModal({ onClose, onSuccess }: CreateMilestoneModalProps) {
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; program: { name: string } }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateMilestonePayload>({
    track: '',
    name: '',
    description: '',
    order: 1
  })

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    try {
      const data = await apiGateway.get('/tracks/')
      console.log('Tracks API response:', data)
      // Handle different response formats
      const tracksArray = data.results || data.data || data || []
      console.log('Tracks array:', tracksArray)
      setTracks(tracksArray)
    } catch (error) {
      console.error('Failed to fetch tracks:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await apiGateway.post('/milestones/', formData)
      onSuccess()
    } catch (error) {
      console.error('Failed to create milestone:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-och-midnight/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-och-steel/20 bg-och-midnight">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Create Milestone</h2>
            <button
              onClick={onClose}
              className="text-och-steel hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Track *</label>
              <select
                value={formData.track}
                onChange={(e) => setFormData(prev => ({ ...prev, track: e.target.value }))}
                required
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
              >
                <option value="">Select a track</option>
                {tracks.length === 0 ? (
                  <option disabled>Loading tracks...</option>
                ) : (
                  tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name} ({track.program?.name || 'No Program'})
                    </option>
                  ))
                )}
              </select>
              {tracks.length === 0 && (
                <p className="text-xs text-och-orange mt-1">No tracks available. Create a track first.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Capstone Project Review"
                required
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Formal evaluation of student projects..."
                rows={3}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Order *</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                  min="1"
                  required
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Duration (weeks)</label>
                <input
                  type="number"
                  value={formData.duration_weeks || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: e.target.value ? parseInt(e.target.value) : undefined }))}
                  min="1"
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-och-steel/20">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-och-steel/50 text-och-steel hover:bg-och-steel/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="defender"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Milestone'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}