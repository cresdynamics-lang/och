'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiGateway } from '@/services/apiGateway'

export default function CreateTrackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    code: '',
    slug: '',
    name: '',
    title: '',
    description: '',
    level: 'beginner',
    tier: 2,
    order_number: 1,
    thumbnail_url: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        slug: formData.slug.toLowerCase(),
        name: formData.name,
        title: formData.title,
        description: formData.description,
        level: formData.level,
        tier: formData.tier,
        order_number: formData.order_number,
        thumbnail_url: formData.thumbnail_url || '',
        is_active: true
      }

      await apiGateway.post('/curriculum/tracks/', payload)
      router.push('/dashboard/director/modules')
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to create track')
    } finally {
      setLoading(false)
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Create Curriculum Track</h1>
            <p className="text-och-steel">Create a new curriculum track (Defender, Offensive, GRC, Innovation, Leadership)</p>
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
                  <label className="block text-sm font-medium text-white mb-2">Track Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g., DEFENDER, OFFENSIVE"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none uppercase"
                    required
                  />
                  <p className="text-xs text-och-steel mt-1">Uppercase code (e.g., DEFENDER, OFFENSIVE)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="e.g., defender, offensive"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none lowercase"
                    required
                  />
                  <p className="text-xs text-och-steel mt-1">Lowercase slug (e.g., defender, offensive)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Cyber Defense"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Display Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Cyber Defense Track"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the track objectives and learning outcomes"
                  rows={3}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  >
                    <option value="foundations">Foundations</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="mastery">Mastery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({...formData, tier: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  >
                    <option value="0">Tier 0 - Foundations Profiler</option>
                    <option value="1">Tier 1 - Foundations</option>
                    <option value="2">Tier 2 - Beginner Level</option>
                    <option value="3">Tier 3 - Intermediate Level</option>
                    <option value="4">Tier 4 - Advanced Level</option>
                    <option value="5">Tier 5 - Mastery Level</option>
                    <option value="6">Tier 6 - Cross-Track</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Order</label>
                  <input
                    type="number"
                    value={formData.order_number}
                    onChange={(e) => setFormData({...formData, order_number: parseInt(e.target.value)})}
                    min="1"
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Thumbnail URL (Optional)</label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                />
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
                  {loading ? 'Creating...' : 'Create Curriculum Track'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}