'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useMissions } from '@/hooks/useMissions'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function MissionsCard() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const router = useRouter()
  const { inProgress, nextRecommended, isLoading, error, startMission } = useMissions(menteeId)
  const [starting, setStarting] = useState<string | null>(null)

  const handleStartMission = async (missionId: string) => {
    setStarting(missionId)
    try {
      await startMission(missionId)
      router.push(`/dashboard/student/missions/${missionId}`)
    } catch (err: any) {
      alert(err.message || 'Failed to start mission')
    } finally {
      setStarting(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-och-steel/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-och-steel/20 rounded"></div>
            <div className="h-4 bg-och-steel/20 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6">
        <div className="text-och-orange">Error loading missions: {error}</div>
      </Card>
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'beginner') return 'mint'
    if (difficulty === 'intermediate') return 'defender'
    return 'orange'
  }

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Active Missions</h2>
        <Link href="/dashboard/student/missions">
          <Button variant="outline" size="sm">All Missions</Button>
        </Link>
      </div>

      {/* In Progress Missions */}
      {inProgress.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-och-steel mb-3">In Progress</h3>
          <div className="space-y-3">
            {inProgress.slice(0, 3).map((mission) => (
              <div key={mission.id} className="p-4 bg-och-midnight/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">{mission.title}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getDifficultyColor(mission.difficulty) as any}>
                        {mission.difficulty}
                      </Badge>
                      <span className="text-sm text-och-steel">
                        {mission.progress_percent}% complete
                      </span>
                    </div>
                    <ProgressBar value={mission.progress_percent} variant="defender" className="mb-2" />
                  </div>
                </div>
                <Link href={`/dashboard/student/missions/${mission.id}`}>
                  <Button variant="outline" size="sm">Resume</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Recommended */}
      {nextRecommended && (
        <div className="p-4 bg-och-defender/10 border border-och-defender/20 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Next Mission</h3>
              <p className="text-sm text-och-steel mb-2">{nextRecommended.title}</p>
              <p className="text-xs text-och-steel">{nextRecommended.reason}</p>
            </div>
            <Badge variant={getDifficultyColor(nextRecommended.difficulty) as any}>
              {nextRecommended.difficulty}
            </Badge>
          </div>
          <Button
            variant="defender"
            onClick={() => handleStartMission(nextRecommended.id)}
            disabled={starting === nextRecommended.id}
            className="w-full"
          >
            {starting === nextRecommended.id ? 'Starting...' : 'Start Mission'}
          </Button>
        </div>
      )}

      {inProgress.length === 0 && !nextRecommended && (
        <div className="text-center py-8 text-och-steel">
          <p>No active missions. Check back soon for recommendations!</p>
        </div>
      )}
    </Card>
  )
}
