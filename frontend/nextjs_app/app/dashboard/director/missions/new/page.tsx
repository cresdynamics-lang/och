'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CreateMissionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 1,
    mission_type: 'intermediate',
    requires_mentor_review: false,
    requires_lab_integration: false,
    estimated_duration_min: 60,
    skills_tags: '',
    track_id: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        skills_tags: formData.skills_tags.split(',').map(s => s.trim()).filter(Boolean)
      }

      const response = await fetch('http://localhost:8000/api/v1/missions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push('/dashboard/director/missions')
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to create mission')
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
            <h1 className="text-3xl font-bold text-white">Create Mission</h1>
            <p className="text-och-steel">Create a new curriculum mission</p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-och-orange/20 border border-och-orange/50 rounded-lg">
                  <p className="text-och-orange text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">Mission Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Network Security Fundamentals"
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the mission objectives and learning outcomes"
                  rows={4}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Difficulty (1-5)</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  >
                    <option value={1}>1 - Beginner</option>
                    <option value={2}>2 - Intermediate</option>
                    <option value={3}>3 - Advanced</option>
                    <option value={4}>4 - Expert</option>
                    <option value={5}>5 - Master</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Mission Type</label>
                  <select
                    value={formData.mission_type}
                    onChange={(e) => setFormData({...formData, mission_type: e.target.value})}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="capstone">Capstone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.estimated_duration_min}
                    onChange={(e) => setFormData({...formData, estimated_duration_min: parseInt(e.target.value)})}
                    min="1"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track ID</label>
                  <input
                    type="text"
                    value={formData.track_id}
                    onChange={(e) => setFormData({...formData, track_id: e.target.value})}
                    placeholder="e.g., SOC_DEFENSE"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Skills Tags</label>
                <input
                  type="text"
                  value={formData.skills_tags}
                  onChange={(e) => setFormData({...formData, skills_tags: e.target.value})}
                  placeholder="network-security, incident-response, threat-analysis (comma-separated)"
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mentor_review"
                    checked={formData.requires_mentor_review}
                    onChange={(e) => setFormData({...formData, requires_mentor_review: e.target.checked})}
                    className="w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2"
                  />
                  <label htmlFor="mentor_review" className="ml-2 text-sm text-white">
                    Requires Mentor Review ($7 tier)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="lab_integration"
                    checked={formData.requires_lab_integration}
                    onChange={(e) => setFormData({...formData, requires_lab_integration: e.target.checked})}
                    className="w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2"
                  />
                  <label htmlFor="lab_integration" className="ml-2 text-sm text-white">
                    Requires Lab Integration
                  </label>
                </div>
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
                  {loading ? 'Creating...' : 'Create Mission'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}