'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { apiGateway } from '@/services/apiGateway'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Trash2 } from 'lucide-react'

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
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<CurriculumTrack | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  const openDetails = (track: CurriculumTrack) => {
    setSelectedTrack(track)
    setDeleteError('')
    setDetailsModalOpen(true)
  }

  const closeDetails = () => {
    setDetailsModalOpen(false)
    setSelectedTrack(null)
    setDeleteError('')
  }

  const handleDeleteTrack = async () => {
    if (!selectedTrack) return
    const confirmed = window.confirm(
      `Permanently delete the track "${selectedTrack.title || selectedTrack.name}" and all modules linked to it? This cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    setDeleteError('')
    try {
      await apiGateway.delete(`/curriculum/tracks/${selectedTrack.slug}/`)
      closeDetails()
      await fetchTracks()
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete track. It may have linked progress or enrollments.')
    } finally {
      setDeleting(false)
    }
  }

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
                      <Button variant="outline" size="sm" onClick={() => openDetails(track)}>
                        View Details
                      </Button>
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

          {/* View track details modal with delete */}
          <Dialog open={detailsModalOpen} onOpenChange={(open) => !open && closeDetails()}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {selectedTrack ? (selectedTrack.title || selectedTrack.name) : 'Track details'}
                </DialogTitle>
                <DialogDescription>
                  Track information and actions. Deleting removes this track and all its modules permanently.
                </DialogDescription>
              </DialogHeader>
              {selectedTrack && (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-och-steel block mb-0.5">Code</span>
                      <code className="px-2 py-1 bg-och-midnight/50 rounded text-och-defender font-mono text-xs">
                        {selectedTrack.code}
                      </code>
                    </div>
                    <div>
                      <span className="text-och-steel block mb-0.5">Slug</span>
                      <code className="px-2 py-1 bg-och-midnight/50 rounded text-och-mint font-mono text-xs">
                        {selectedTrack.slug}
                      </code>
                    </div>
                    <div>
                      <span className="text-och-steel block mb-0.5">Level</span>
                      <Badge className="capitalize">{selectedTrack.level}</Badge>
                    </div>
                    <div>
                      <span className="text-och-steel block mb-0.5">Tier</span>
                      <span className="text-white">Tier {selectedTrack.tier}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-och-steel block mb-0.5">Description</span>
                      <p className="text-white text-sm">{selectedTrack.description || '—'}</p>
                    </div>
                  </div>
                  {deleteError && (
                    <p className="text-sm text-red-400">{deleteError}</p>
                  )}
                </div>
              )}
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={handleDeleteTrack}
                  disabled={deleting || !selectedTrack}
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete track and all modules
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={closeDetails}>
                    Close
                  </Button>
                  {selectedTrack && (
                    <Link href={`/dashboard/director/tracks/${selectedTrack.slug}/edit`}>
                      <Button variant="defender">Edit track</Button>
                    </Link>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
