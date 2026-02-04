'use client'

import { useState, useEffect } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SpecializationResponse, CreateSpecializationPayload } from '@/types/api'

export default function SpecializationsPage() {
  const [specializations, setSpecializations] = useState<SpecializationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchSpecializations()
  }, [])

  const fetchSpecializations = async () => {
    try {
      const response = await fetch('/api/specializations')
      if (response.ok) {
        const data = await response.json()
        setSpecializations(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch specializations:', error)
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
              <h1 className="text-2xl font-bold text-white mb-2">Specializations</h1>
              <p className="text-och-steel">Manage track specializations and focused learning paths</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="defender"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Specialization
            </Button>
          </div>

          {specializations.length === 0 ? (
            <Card className="border-och-steel/20 bg-och-midnight/50">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-och-midnight/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-och-steel mb-2 text-lg">No specializations found</p>
                <p className="text-och-steel/70 mb-6">Create specialized learning paths within tracks</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="defender"
                >
                  Create Your First Specialization
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specializations.map((specialization) => (
                <Card key={specialization.id} className="border-och-steel/20 bg-och-midnight/50 hover:border-och-defender/50 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{specialization.name}</h3>
                        <p className="text-sm text-och-mint">
                          {specialization.track.name} • {specialization.track.program.name}
                        </p>
                      </div>
                      <div className="text-xs text-och-steel bg-och-steel/10 px-2 py-1 rounded">
                        {specialization.duration_weeks}w
                      </div>
                    </div>

                    {specialization.description && (
                      <p className="text-sm text-och-steel mb-4 line-clamp-3">
                        {specialization.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-och-steel mb-4">
                      <span>Missions: {specialization.missions.length}</span>
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
            <CreateSpecializationModal
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => {
                setShowCreateForm(false)
                fetchSpecializations()
              }}
            />
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

interface CreateSpecializationModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateSpecializationModal({ onClose, onSuccess }: CreateSpecializationModalProps) {
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; program: { name: string } }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateSpecializationPayload>({
    track: '',
    name: '',
    description: '',
    duration_weeks: 4,
    missions: []
  })

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    try {
      const response = await fetch('/api/tracks')
      if (response.ok) {
        const data = await response.json()
        setTracks(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tracks:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/specializations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create specialization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-och-midnight/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-och-steel/20 bg-och-midnight">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Create Specialization</h2>
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
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name} ({track.program.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Governance & Compliance"
                required
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Focus on regulatory frameworks and compliance leadership..."
                rows={3}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Duration (weeks) *</label>
              <input
                type="number"
                value={formData.duration_weeks}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) }))}
                min="1"
                required
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
              />
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
                {isLoading ? 'Creating...' : 'Create Specialization'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}