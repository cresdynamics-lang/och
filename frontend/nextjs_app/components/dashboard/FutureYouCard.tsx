'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useProfiler } from '@/hooks/useProfiler'
import { useAuth } from '@/hooks/useAuth'
import type { UserTrack } from '@/services/types/profiler'

export function FutureYouCard() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { futureYou, tracks, readinessWindow, isLoading, error, changeTrack } = useProfiler(menteeId)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [changing, setChanging] = useState(false)

  const currentTrack = Array.isArray(tracks) ? (tracks.find(t => t.current_progress > 0) || tracks[0]) : null

  const handleChangeTrack = async (trackId: string) => {
    setChanging(true)
    try {
      await changeTrack(trackId)
      setShowChangeModal(false)
    } catch (err: any) {
      alert(err.message || 'Failed to change track')
    } finally {
      setChanging(false)
    }
  }

  if (isLoading) {
    return (
      <Card gradient="defender">
        <div className="animate-pulse">
          <div className="h-8 bg-och-steel/20 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-och-steel/20 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-och-steel/20 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  if (error || !futureYou) {
    return (
      <Card gradient="defender">
        <div className="text-och-orange">Error loading Future-You data: {error || 'No data available'}</div>
      </Card>
    )
  }

  const getReadinessColor = (confidence?: string) => {
    if (confidence === 'high') return 'mint'
    if (confidence === 'medium') return 'defender'
    return 'steel'
  }

  return (
    <>
      <Card gradient="defender" className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{futureYou.persona_name}</h2>
            <p className="text-och-steel mb-4">{futureYou.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {currentTrack && (
            <div className="flex items-center gap-2">
              <span className="text-och-steel text-sm">Current Track:</span>
              <Badge variant="defender">{currentTrack.name}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangeModal(true)}
                className="text-xs"
              >
                Change Track
              </Button>
            </div>
          )}

          {readinessWindow && (
            <Badge variant={getReadinessColor(readinessWindow.confidence) as any}>
              {readinessWindow.label}
            </Badge>
          )}
        </div>
      </Card>

      {showChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowChangeModal(false)}>
          <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-4">Change Track</h3>
            <p className="text-och-steel mb-4">Select a new track to switch to:</p>
            <div className="space-y-2 mb-4">
              {Array.isArray(tracks) && tracks.map((track: UserTrack) => (
                <button
                  key={track.id}
                  onClick={() => handleChangeTrack(track.id)}
                  disabled={changing || track.id === currentTrack?.id}
                  className="w-full text-left p-3 bg-och-midnight/50 border border-och-steel/20 rounded-lg hover:border-och-defender transition disabled:opacity-50"
                >
                  <div className="font-semibold text-white">{track.name}</div>
                  <div className="text-sm text-och-steel">{track.description}</div>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setShowChangeModal(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
