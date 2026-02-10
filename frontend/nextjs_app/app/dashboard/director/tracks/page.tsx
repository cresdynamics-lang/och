'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { programsClient, type Track, type Program } from '@/services/programsClient'
import { useUpdateTrack } from '@/hooks/usePrograms'

export default function DirectorTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assigningTrackId, setAssigningTrackId] = useState<string | null>(null)
  const [assignProgramId, setAssignProgramId] = useState<Record<string, string>>({})
  const { updateTrack, isLoading: isUpdatingTrack } = useUpdateTrack()

  const fetchTracks = async () => {
    try {
      const list = await programsClient.getTracks()
      setTracks(Array.isArray(list) ? list : [])
    } catch (err) {
      setError('Failed to fetch tracks')
    }
  }

  const fetchPrograms = async () => {
    try {
      const list = await programsClient.getPrograms()
      setPrograms(Array.isArray(list) ? list : [])
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([programsClient.getTracks(), programsClient.getPrograms()])
      .then(([tracksList, programsList]) => {
        if (cancelled) return
        setTracks(Array.isArray(tracksList) ? tracksList : [])
        setPrograms(Array.isArray(programsList) ? programsList : [])
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load tracks')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleAssignToProgram = async (trackId: string) => {
    const programId = assignProgramId[trackId]
    if (!programId) return
    setAssigningTrackId(trackId)
    try {
      await updateTrack(trackId, { program: programId })
      await fetchTracks()
      setAssignProgramId((prev) => ({ ...prev, [trackId]: '' }))
    } catch (err: any) {
      console.error('Failed to assign track to program:', err)
      setError(err?.message || 'Failed to assign track to program')
    } finally {
      setAssigningTrackId(null)
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
              <Button onClick={() => { setError(''); fetchTracks(); fetchPrograms(); }} variant="outline">Retry</Button>
            </Card>
          ) : tracks.length > 0 ? (
            <div className="grid gap-4">
              {tracks.map((track) => (
                <Card key={track.id!} className="p-6 border-och-steel/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-2">{track.name}</h3>
                      <p className="text-och-steel mb-2">{track.description || '—'}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-och-mint">Program: {track.program_name || 'Unassigned'}</span>
                        {track.track_type && (
                          <Badge variant={track.track_type === 'primary' ? 'defender' : 'outline'} className="text-xs">
                            {track.track_type === 'primary' ? 'Primary' : 'Cross-track'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link href={`/dashboard/director/tracks/${track.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <Link href={`/dashboard/director/tracks/${track.id}`}>
                        <Button variant="defender" size="sm">Edit</Button>
                      </Link>
                    </div>
                  </div>

                  {track.competencies && typeof track.competencies === 'object' && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-och-steel mb-2">Competencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray((track.competencies as any).core) ? (track.competencies as any).core : []).map((comp: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-och-defender/20 text-och-defender text-xs rounded">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-och-steel mb-4">
                    <span>Key: <code className="px-1.5 py-0.5 bg-och-midnight/50 rounded text-och-defender font-mono">{track.key}</code></span>
                    <span>Missions: {Array.isArray(track.missions) ? track.missions.length : 0}</span>
                  </div>

                  <div className="pt-4 border-t border-och-steel/20 flex flex-wrap items-center gap-3">
                    <span className="text-sm text-och-steel">Assign to program:</span>
                    <select
                      value={assignProgramId[track.id!] ?? ''}
                      onChange={(e) => setAssignProgramId((prev) => ({ ...prev, [track.id!]: e.target.value }))}
                      disabled={assigningTrackId === track.id}
                      className="px-3 py-1.5 rounded-lg bg-och-midnight/50 border border-och-steel/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender min-w-[200px]"
                    >
                      <option value="">— Select program —</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignToProgram(track.id!)}
                      disabled={!assignProgramId[track.id!] || assigningTrackId === track.id || isUpdatingTrack}
                    >
                      {assigningTrackId === track.id ? 'Assigning...' : 'Assign'}
                    </Button>
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
