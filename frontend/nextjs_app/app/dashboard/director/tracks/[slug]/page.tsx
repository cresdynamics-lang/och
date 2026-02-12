'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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

export default function TrackDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [track, setTrack] = useState<Track | null>(null)

  useEffect(() => {
    fetchTrack()
  }, [slug])

  const fetchTrack = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiGateway.get(`/curriculum/tracks/${slug}/`) as Track
      setTrack(data)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Track not found')
      } else {
        setError('Failed to fetch track')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  if (error || !track) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="p-12 text-center border-och-orange/50">
            <p className="text-och-orange mb-4">{error || 'Track not found'}</p>
            <Button onClick={() => router.push('/dashboard/director/tracks')} variant="outline">
              Back to Tracks
            </Button>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{track.title || track.name}</h1>
                {!track.is_active && (
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                )}
              </div>
              <p className="text-och-steel">Track Details</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/director/tracks/${track.slug}/edit`}>
                <Button variant="defender">Edit Track</Button>
              </Link>
              <Button variant="outline" onClick={() => router.push('/dashboard/director/tracks')}>
                Back
              </Button>
            </div>
          </div>

          {/* Track Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Track Information</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Track Code</label>
                <code className="block px-3 py-2 bg-och-midnight/50 rounded text-och-defender font-mono">
                  {track.code}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Track Slug</label>
                <code className="block px-3 py-2 bg-och-midnight/50 rounded text-och-mint font-mono">
                  {track.slug}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Track Name</label>
                <p className="text-white">{track.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Display Title</label>
                <p className="text-white">{track.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Level</label>
                <Badge className="capitalize">{track.level}</Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Tier</label>
                <p className="text-white">Tier {track.tier}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Order Number</label>
                <p className="text-white">{track.order_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-och-steel mb-1">Status</label>
                <Badge variant={track.is_active ? "default" : "outline"}>
                  {track.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {track.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-och-steel mb-1">Description</label>
                <p className="text-white">{track.description}</p>
              </div>
            )}

            {track.thumbnail_url && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-och-steel mb-1">Thumbnail URL</label>
                <a
                  href={track.thumbnail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-och-defender hover:text-och-defender/80 break-all"
                >
                  {track.thumbnail_url}
                </a>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/dashboard/director/modules?track=${track.slug}`}>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Modules
                </Button>
              </Link>
              <Link href={`/dashboard/director/missions?track=${track.slug}`}>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  View Missions
                </Button>
              </Link>
              <Link href={`/dashboard/director/tracks/${track.slug}/edit`}>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Track
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
