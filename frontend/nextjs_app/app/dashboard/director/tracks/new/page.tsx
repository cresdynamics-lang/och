'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CreateTrackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    track_type: 'primary',
    description: '',
    program_id: '',
    competencies_core: '',
    competencies_advanced: '',
    missions: ''
  })

  const [programs, setPrograms] = useState<any[]>([])
  const [missions, setMissions] = useState<any[]>([])
  const [selectedMissions, setSelectedMissions] = useState<string[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [loadingMissions, setLoadingMissions] = useState(false)

  useEffect(() => {
    fetchPrograms()
    fetchMissions()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true)
      const response = await fetch('http://localhost:8000/api/v1/programs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.results || [])
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err)
    } finally {
      setLoadingPrograms(false)
    }
  }

  const fetchMissions = async () => {
    try {
      setLoadingMissions(true)
      const response = await fetch('http://localhost:8000/api/v1/missions/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMissions(data.results || [])
      }
    } catch (err) {
      console.error('Failed to fetch missions:', err)
    } finally {
      setLoadingMissions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        name: formData.name,
        key: formData.key,
        track_type: formData.track_type,
        description: formData.description,
        program: formData.program_id,
        competencies: {
          core: formData.competencies_core.split(',').map(s => s.trim()).filter(Boolean),
          advanced: formData.competencies_advanced.split(',').map(s => s.trim()).filter(Boolean)
        },
        missions: selectedMissions
      }

      const response = await fetch('http://localhost:8000/api/v1/tracks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push('/dashboard/director/tracks')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to create track')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Create Track</h1>
            <p className="text-och-steel">Create a new learning track</p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-och-orange/20 border border-och-orange/50 rounded-lg">
                  <p className="text-och-orange text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Cybersecurity Defender"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track Key</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    placeholder="e.g., defender"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Track Type</label>
                <select
                  value={formData.track_type}
                  onChange={(e) => setFormData({...formData, track_type: e.target.value})}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                >
                  <option value="primary">Primary Track</option>
                  <option value="cross_track">Cross-Track Program</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the track objectives and outcomes"
                  rows={3}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Program *</label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({...formData, program_id: e.target.value})}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  required
                >
                  <option value="">Select a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {loadingPrograms && (
                  <p className="text-sm text-och-steel mt-1">Loading programs...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Core Competencies</label>
                <textarea
                  value={formData.competencies_core}
                  onChange={(e) => setFormData({...formData, competencies_core: e.target.value})}
                  placeholder="Network Security, Incident Response, Risk Assessment (comma-separated)"
                  rows={2}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Advanced Competencies</label>
                <textarea
                  value={formData.competencies_advanced}
                  onChange={(e) => setFormData({...formData, competencies_advanced: e.target.value})}
                  placeholder="Threat Hunting, Forensics, Penetration Testing (comma-separated)"
                  rows={2}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Missions</label>
                {loadingMissions ? (
                  <p className="text-sm text-och-steel">Loading missions...</p>
                ) : missions.length === 0 ? (
                  <p className="text-sm text-och-steel">No missions available</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-och-steel/30 rounded-lg p-3 bg-och-midnight">
                    <div className="space-y-2">
                      {missions.map((mission) => (
                        <div key={mission.id} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id={`mission-${mission.id}`}
                            checked={selectedMissions.includes(mission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMissions([...selectedMissions, mission.id])
                              } else {
                                setSelectedMissions(selectedMissions.filter(id => id !== mission.id))
                              }
                            }}
                            className="w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2 mt-1"
                          />
                          <label htmlFor={`mission-${mission.id}`} className="flex-1 text-sm text-white cursor-pointer">
                            <div className="font-medium">{mission.title}</div>
                            <div className="text-xs text-och-steel mt-1">
                              Difficulty: {mission.difficulty}/5 • {mission.estimated_duration_min} min • {mission.mission_type}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-och-steel mt-2">
                  Selected: {selectedMissions.length} mission{selectedMissions.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="defender"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Track'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}