'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useProgram, useUpdateProgram, useTracks, useCreateTrack, useDeleteTrack } from '@/hooks/usePrograms'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { programsClient, type Program, type Track } from '@/services/programsClient'
import { useUsers } from '@/hooks/useUsers'
import Link from 'next/link'

export default function EditProgramPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string
  const { program, isLoading: loadingProgram, reload: reloadProgram } = useProgram(programId)
  const { tracks, reload: reloadTracks } = useTracks(programId)
  const { updateProgram, isLoading: isUpdating } = useUpdateProgram()
  const { createTrack, isLoading: isCreatingTrack } = useCreateTrack()
  const { deleteTrack, isLoading: isDeletingTrack } = useDeleteTrack()
  const { users } = useUsers({ page: 1, page_size: 200 })
  
  const [formData, setFormData] = useState<Partial<Program>>({})
  const [error, setError] = useState<string | null>(null)
  const [showAddTrack, setShowAddTrack] = useState(false)
  const [newTrack, setNewTrack] = useState<Partial<Track>>({
    name: '',
    key: '',
    track_type: 'primary',
    description: '',
    missions: [],
  })
  const [trackError, setTrackError] = useState<string | null>(null)

  // Get directors and mentors
  const directorsAndMentors = users.filter((u) => 
    u.roles?.some((r: any) => r.role === 'program_director' || r.role === 'mentor')
  ).map((u) => ({
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
  }))

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        category: program.category,
        description: program.description,
        duration_months: program.duration_months,
        default_price: program.default_price,
        currency: program.currency,
        outcomes: program.outcomes || [],
        missions_registry_link: program.missions_registry_link,
        status: program.status,
      })
    }
  }, [program])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await updateProgram(programId, formData)
      router.push(`/dashboard/director/programs/${programId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update program')
    }
  }

  const handleAddTrack = async () => {
    // Validate required fields
    if (!newTrack.name || !newTrack.name.trim()) {
      setTrackError('Track name is required')
      return
    }
    
    if (!newTrack.key || !newTrack.key.trim()) {
      setTrackError('Track key is required')
      return
    }
    
      // Check for duplicate key in existing tracks (case-insensitive)
      const normalizedKey = newTrack.key.trim().toLowerCase()
      const duplicateTrack = tracks.find(t => {
        const existingKey = t.key ? String(t.key).toLowerCase() : ''
        return existingKey === normalizedKey
      })
      if (duplicateTrack) {
        setTrackError(`A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`)
        return
      }
    
    setTrackError(null)
    try {
      // Prepare track data with required fields
      const trackData: any = {
        name: newTrack.name.trim(),
        key: newTrack.key.trim(),
        program: programId, // Program ID as UUID string
        track_type: newTrack.track_type || 'primary',
      }
      
      // Add optional fields
      if (newTrack.description && newTrack.description.trim()) {
        trackData.description = newTrack.description.trim()
      }
      
      if (newTrack.director) {
        // Ensure director is a number (User ID)
        trackData.director = typeof newTrack.director === 'string' ? parseInt(newTrack.director) : newTrack.director
      }
      
      // Set missions - ensure it's always an array
      trackData.missions = Array.isArray(newTrack.missions) && newTrack.missions.length > 0 
        ? newTrack.missions 
        : []
      
      // Set competencies - ensure it's always an object
      trackData.competencies = {}
      
      console.log('Creating track with data:', trackData)
      
      await createTrack(trackData)
      setNewTrack({
        name: '',
        key: '',
        track_type: 'primary',
        description: '',
        missions: [],
      })
      setShowAddTrack(false)
      reloadTracks()
      reloadProgram()
    } catch (err: any) {
      console.error('Failed to create track:', err)
      console.error('Error details:', {
        message: err?.message,
        data: err?.data,
        response: err?.response,
        status: err?.status,
        fullError: err
      })
      
      // Extract detailed error message
      let errorMessage = 'Failed to create track'
      
      // Check ApiError format (from fetcher)
      if (err?.data) {
        if (typeof err.data === 'string') {
          errorMessage = err.data
        } else if (err.data.detail) {
          errorMessage = err.data.detail
        } else if (err.data.error) {
          errorMessage = err.data.error
        } else if (typeof err.data === 'object') {
          // Handle validation errors - check for non_field_errors first
          if (err.data.non_field_errors) {
            const nonFieldErrors = Array.isArray(err.data.non_field_errors) 
              ? err.data.non_field_errors.join(', ')
              : err.data.non_field_errors
            
            // Check if it's a unique constraint error
            if (String(nonFieldErrors).includes('program, key') || String(nonFieldErrors).includes('unique set')) {
              errorMessage = `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
            } else {
              errorMessage = nonFieldErrors
            }
          } else {
            // Handle field-specific errors
            const errors = Object.entries(err.data)
              .map(([field, messages]: [string, any]) => {
                let msg = Array.isArray(messages) ? messages.join(', ') : String(messages)
                
                // Make error messages more user-friendly for unique constraint violations
                if (msg.includes('unique') || msg.includes('already exists') || msg.includes('must make a unique set')) {
                  if (field === 'key' || (msg.includes('program') && msg.includes('key')) || msg.includes('program, key')) {
                    return `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
                  }
                }
                
                // Handle the specific Django unique constraint error message
                if (msg.includes('program, key') && msg.includes('unique set')) {
                  return `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
                }
                
                // Format field name for display
                const fieldName = field === 'key' ? 'Track Key' : 
                                 field === 'name' ? 'Track Name' :
                                 field === 'program' ? 'Program' :
                                 field === 'non_field_errors' ? '' :
                                 field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')
                
                return fieldName ? `${fieldName}: ${msg}` : msg
              })
              .filter(msg => msg.trim() !== '') // Remove empty messages
              .join('; ')
            errorMessage = errors || errorMessage
          }
        }
      } 
      // Check response format (from axios/fetch)
      else if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          // Check if it's a unique constraint error
          if (err.response.data.includes('program, key') || err.response.data.includes('unique set')) {
            errorMessage = `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
          } else {
            errorMessage = err.response.data
          }
        } else if (err.response.data.detail) {
          if (String(err.response.data.detail).includes('program, key') || String(err.response.data.detail).includes('unique set')) {
            errorMessage = `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
          } else {
            errorMessage = err.response.data.detail
          }
        } else if (err.response.data.error) {
          if (String(err.response.data.error).includes('program, key') || String(err.response.data.error).includes('unique set')) {
            errorMessage = `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
          } else {
            errorMessage = err.response.data.error
          }
        } else if (err.response.data.non_field_errors) {
          const nonFieldErrors = Array.isArray(err.response.data.non_field_errors) 
            ? err.response.data.non_field_errors.join(', ')
            : err.response.data.non_field_errors
          
          if (String(nonFieldErrors).includes('program, key') || String(nonFieldErrors).includes('unique set')) {
            errorMessage = `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
          } else {
            errorMessage = nonFieldErrors
          }
        } else if (typeof err.response.data === 'object') {
          const errors = Object.entries(err.response.data)
            .map(([field, messages]: [string, any]) => {
              let msg = Array.isArray(messages) ? messages.join(', ') : String(messages)
              
              // Handle unique constraint error
              if (msg.includes('program, key') || msg.includes('unique set')) {
                return `A track with key "${newTrack.key}" already exists in this program. Please choose a different key.`
              }
              
              // Format field name for display
              const fieldName = field === 'key' ? 'Track Key' : 
                               field === 'name' ? 'Track Name' :
                               field === 'program' ? 'Program' :
                               field === 'non_field_errors' ? '' :
                               field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')
              
              return fieldName ? `${fieldName}: ${msg}` : msg
            })
            .filter(msg => msg.trim() !== '')
            .join('; ')
          errorMessage = errors || errorMessage
        }
      } 
      // Fallback to message
      else if (err?.message) {
        errorMessage = err.message
      }
      
      setTrackError(errorMessage)
    }
  }

  const handleDeleteTrack = async (trackId: string, trackName: string) => {
    if (!confirm(`Are you sure you want to delete track "${trackName}"? This action cannot be undone.`)) {
      return
    }
    try {
      await deleteTrack(trackId)
      reloadTracks()
      reloadProgram()
    } catch (err: any) {
      alert(err.message || 'Failed to delete track')
    }
  }

  if (loadingProgram) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading program...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (!program) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="border-och-orange/50">
            <div className="p-6 text-center">
              <p className="text-och-orange mb-4">Program not found</p>
              <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-defender">Edit Program</h1>
            <p className="text-och-steel">Update program details and settings</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                >
                  <option value="technical">Technical</option>
                  <option value="leadership">Leadership</option>
                  <option value="mentorship">Mentorship</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
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
                    value={formData.duration_months || 0}
                    onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Default Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.default_price || 0}
                    onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={formData.currency || 'USD'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Learning Outcomes (one per line)
                </label>
                <textarea
                  value={formData.outcomes?.join('\n') || ''}
                  onChange={(e) => setFormData({ ...formData, outcomes: e.target.value.split('\n').filter(o => o.trim()) })}
                  rows={4}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Missions Registry Link
                </label>
                <input
                  type="url"
                  value={formData.missions_registry_link || ''}
                  onChange={(e) => setFormData({ ...formData, missions_registry_link: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                />
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
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="defender"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Program'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Tracks Management Section */}
          <Card className="mt-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Program Tracks</h2>
                  <p className="text-och-steel">Manage primary and cross-track programs for this program</p>
                </div>
                <Button
                  variant="defender"
                  size="sm"
                  onClick={() => setShowAddTrack(!showAddTrack)}
                >
                  + Add Track
                </Button>
              </div>

              {/* Add Track Form */}
              {showAddTrack && (
                <Card className="mb-6 border-och-defender/30 bg-och-midnight/30">
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white">Add New Track</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Track Name *
                        </label>
                        <input
                          type="text"
                          value={newTrack.name || ''}
                          onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })}
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
                          value={newTrack.key || ''}
                          onChange={(e) => setNewTrack({ ...newTrack, key: e.target.value })}
                          className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                          placeholder="e.g., cyber-defense"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Track Type *
                      </label>
                      <select
                        value={newTrack.track_type || 'primary'}
                        onChange={(e) => setNewTrack({ ...newTrack, track_type: e.target.value as 'primary' | 'cross_track' })}
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
                        value={newTrack.description || ''}
                        onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                        placeholder="Track description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Track Director
                      </label>
                      <select
                        value={newTrack.director || ''}
                        onChange={(e) => setNewTrack({ ...newTrack, director: e.target.value ? parseInt(e.target.value) : null })}
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

                    {trackError && (
                      <div className="p-3 bg-och-orange/20 border border-och-orange rounded-lg text-och-orange text-sm">
                        {trackError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="defender"
                        onClick={handleAddTrack}
                        disabled={isCreatingTrack}
                      >
                        {isCreatingTrack ? 'Creating...' : 'Create Track'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddTrack(false)
                          setTrackError(null)
                          setNewTrack({
                            name: '',
                            key: '',
                            track_type: 'primary',
                            description: '',
                            missions: [],
                          })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Existing Tracks */}
              {tracks.length > 0 ? (
                <div className="space-y-4">
                  {tracks.map((track) => (
                    <Card key={track.id} className="border-och-defender/30">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={track.track_type === 'primary' ? 'defender' : 'gold'}>
                                {track.track_type === 'primary' ? 'Primary Track' : 'Cross-Track'}
                              </Badge>
                              <h3 className="text-lg font-bold text-white">{track.name}</h3>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-och-steel">Key:</span>
                                <code className="px-2 py-1 bg-och-midnight/50 rounded text-och-defender font-mono text-xs">
                                  {track.key}
                                </code>
                              </div>
                              {track.description && (
                                <p className="text-och-steel">{track.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/dashboard/director/tracks/${track.id}`}>
                              <Button variant="defender" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTrack(track.id!, track.name)}
                              disabled={isDeletingTrack}
                              className="text-och-orange hover:text-och-orange/80 hover:border-och-orange"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-och-steel">
                  <p>No tracks yet. Add your first track above.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}

