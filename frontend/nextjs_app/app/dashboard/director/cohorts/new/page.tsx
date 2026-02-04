'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CreateCohortPayload } from '@/types/api'

interface Track {
  id: string
  name: string
  program: {
    id: string
    name: string
  }
}

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

export default function CreateCohortPage() {
  const router = useRouter()
  const [tracks, setTracks] = useState<Track[]>([])
  const [coordinators, setCoordinators] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateCohortPayload>({
    track: '',
    name: '',
    start_date: '',
    end_date: '',
    mode: 'virtual',
    seat_cap: 25,
    mentor_ratio: 0.1,
    seat_pool: {
      paid: 20,
      scholarship: 3,
      sponsored: 2
    }
  })

  useEffect(() => {
    fetchTracks()
    fetchCoordinators()
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

  const fetchCoordinators = async () => {
    try {
      const response = await fetch('/api/users?role=coordinator')
      if (response.ok) {
        const data = await response.json()
        setCoordinators(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch coordinators:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/dashboard/director/cohorts')
      } else {
        const error = await response.json()
        console.error('Failed to create cohort:', error)
      }
    } catch (error) {
      console.error('Failed to create cohort:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: keyof CreateCohortPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateSeatPool = (type: 'paid' | 'scholarship' | 'sponsored', value: number) => {
    setFormData(prev => ({
      ...prev,
      seat_pool: {
        ...prev.seat_pool,
        [type]: value
      }
    }))
  }

  return (
    <RouteGuard allowedRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Create New Cohort</h1>
            <p className="text-och-steel">Set up a new cohort instance for a track</p>
          </div>

          <Card className="border-och-steel/20 bg-och-midnight/50">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Track *
                  </label>
                  <select
                    value={formData.track}
                    onChange={(e) => updateFormData('track', e.target.value)}
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

              {/* Seat Pool Allocation */}
              <div>
                <label className="block text-sm font-medium text-white mb-4">
                  Seat Pool Allocation
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-och-steel mb-1">Paid Seats</label>
                    <input
                      type="number"
                      value={formData.seat_pool?.paid || 0}
                      onChange={(e) => updateSeatPool('paid', parseInt(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-och-steel mb-1">Scholarship Seats</label>
                    <input
                      type="number"
                      value={formData.seat_pool?.scholarship || 0}
                      onChange={(e) => updateSeatPool('scholarship', parseInt(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-och-steel mb-1">Sponsored Seats</label>
                    <input
                      type="number"
                      value={formData.seat_pool?.sponsored || 0}
                      onChange={(e) => updateSeatPool('sponsored', parseInt(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>
              </div>

              {/* Coordinator */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Coordinator (Optional)
                </label>
                <select
                  value={formData.coordinator || ''}
                  onChange={(e) => updateFormData('coordinator', e.target.value || undefined)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                >
                  <option value="">No coordinator assigned</option>
                  {coordinators.map((coordinator) => (
                    <option key={coordinator.id} value={coordinator.id}>
                      {coordinator.first_name && coordinator.last_name 
                        ? `${coordinator.first_name} ${coordinator.last_name} (${coordinator.email})`
                        : coordinator.email
                      }
                    </option>
                  ))}
                </select>
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