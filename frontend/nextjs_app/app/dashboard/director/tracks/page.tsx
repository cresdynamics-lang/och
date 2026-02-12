'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { apiGateway } from '@/services/apiGateway'

interface CurriculumTrack {
  id: string
  slug: string
  name: string
  title: string
  code: string
  description: string
  level: string
  tier: number
  order_number: number
  thumbnail_url: string
  is_active: boolean
}

export default function DirectorTracksPage() {
  const [tracks, setTracks] = useState<CurriculumTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTracks = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiGateway.get('/curriculum/tracks/') as any
      const trackList = data?.results || data?.data || data || []
      setTracks(trackList)
    } catch (err) {
      setError('Failed to fetch tracks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracks()
  }, [])

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Curriculum Tracks</h1>
              <p className="text-och-steel">Manage curriculum tracks and learning paths</p>
            </div>
            <Link href="/dashboard/director/tracks/new">
              <Button variant="defender">
                Create Track
              </Button>
            </Link>
          </div>

          {loading ? (
            <Card className="p-12 text-center">
              <p className="text-och-steel">Loading tracks...</p>
            </Card>
          ) : error ? (
            <Card className="p-12 text-center border-och-orange/50">
              <p className="text-och-orange mb-4">{error}</p>
              <Button onClick={fetchTracks} variant="outline">Retry</Button>
            </Card>
          ) : tracks.length > 0 ? (
            <div className="grid gap-4">
              {tracks.map((track) => (
                <Card key={track.id} className="p-6 border-och-steel/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{track.title || track.name}</h3>
                        {!track.is_active && (
                          <Badge variant="outline" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-och-steel mb-3">{track.description || '—'}</p>
                      <div className="flex items-center gap-4 flex-wrap text-sm">
                        <span className="text-och-mint">Level: {track.level}</span>
                        <span className="text-och-steel">Tier {track.tier}</span>
                        <span className="text-och-steel">Order: {track.order_number}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link href={`/dashboard/director/tracks/${track.slug}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      <Link href={`/dashboard/director/tracks/${track.slug}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Link href={`/dashboard/director/modules?track=${track.slug}`}>
                        <Button variant="outline" size="sm">View Modules</Button>
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-och-steel pt-4 border-t border-och-steel/20">
                    <span>Slug: <code className="px-1.5 py-0.5 bg-och-midnight/50 rounded text-och-defender font-mono">{track.slug}</code></span>
                    <span>Code: <code className="px-1.5 py-0.5 bg-och-midnight/50 rounded text-och-mint font-mono">{track.code}</code></span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="col-span-full border-och-steel/20">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-och-midnight/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-och-steel mb-2 text-lg">No tracks found</p>
                <p className="text-och-steel/70 mb-6">Create your first curriculum track to get started</p>
                <Link href="/dashboard/director/tracks/new">
                  <Button variant="defender">
                    Create Your First Track
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
