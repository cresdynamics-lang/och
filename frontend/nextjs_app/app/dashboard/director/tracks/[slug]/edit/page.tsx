'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiGateway } from '@/services/apiGateway'

interface Track {
  id: string
  code: string
  slug: string
  name: string
  title: string
  description: string
  level: string
  tier: number
  order_number: number
  thumbnail_url: string
  is_active: boolean
}

export default function EditTrackPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [track, setTrack] = useState<Track | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    slug: '',
    name: '',
    title: '',
    description: '',
    level: 'beginner',
    tier: 2,
    order_number: 1,
    thumbnail_url: '',
    is_active: true
  })

  useEffect(() => {
    fetchTrack()
  }, [slug])

  const fetchTrack = async () => {
    try {
      setFetchLoading(true)
      const foundTrack = await apiGateway.get(`/curriculum/tracks/${slug}/`) as Track

      setTrack(foundTrack)
      setFormData({
        code: foundTrack.code,
        slug: foundTrack.slug,
        name: foundTrack.name,
        title: foundTrack.title,
        description: foundTrack.description || '',
        level: foundTrack.level,
        tier: foundTrack.tier,
        order_number: foundTrack.order_number,
        thumbnail_url: foundTrack.thumbnail_url || '',
        is_active: foundTrack.is_active
      })
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Track not found')
      } else {
        setError('Failed to fetch track')
      }
    } finally {
      setFetchLoading(false)
    }
  }

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
        is_active: formData.is_active
      }

      await apiGateway.put(`/curriculum/tracks/${slug}/`, payload)
      router.push('/dashboard/director/tracks')
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to update track')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="p-12 text-center">
            <p className="text-och-steel">Loading track...</p>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error && !track) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="p-12 text-center border-och-orange/50">
            <p className="text-och-orange mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">Go Back</Button>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Track</h1>
            <p className="text-och-steel">Update curriculum track details</p>
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-white">
                  Track is Active
                </label>
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
                  {loading ? 'Updating...' : 'Update Track'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
