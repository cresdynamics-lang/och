'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface Track {
  id: string
  name: string
  key: string
  track_type: string
  description: string
  program_name: string
  competencies: {
    core: string[]
    advanced: string[]
  }
  missions: string[]
}

export default function DirectorTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/tracks/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTracks(data.results || [])
      } else {
        setError('Failed to fetch tracks')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Tracks</h1>
              <p className="text-och-steel">Manage program tracks and learning paths</p>
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
                <Card key={track.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{track.name}</h3>
                      <p className="text-och-steel mb-2">{track.description}</p>
                      <p className="text-sm text-och-mint">Program: {track.program_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="defender" size="sm">Edit</Button>
                    </div>
                  </div>
                  
                  {track.competencies && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-och-steel mb-2">Core Competencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {track.competencies.core?.map((comp, idx) => (
                          <span key={idx} className="px-2 py-1 bg-och-defender/20 text-och-defender text-xs rounded">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-och-steel">
                    <span>Type: {track.track_type}</span>
                    <span>Key: {track.key}</span>
                    <span>Missions: {track.missions?.length || 0}</span>
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
                <p className="text-och-steel/70 mb-6">Create your first track to get started</p>
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