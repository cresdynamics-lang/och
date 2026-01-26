/**
 * Mission Card Component
 * Individual mission UI card
 */
'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useMissionStore } from '@/lib/stores/missionStore'
import type { Mission, MissionProgress } from '../types'

interface MissionCardProps {
  mission: Mission
  progress?: MissionProgress
  showProgress?: boolean
  showCompleted?: boolean
}

export function MissionCard({ mission, progress, showProgress, showCompleted }: MissionCardProps) {
  const router = useRouter()
  const { setCurrentMission } = useMissionStore()

  const handleClick = () => {
    setCurrentMission(mission)
    router.push(`/dashboard/student/missions/${mission.id}`)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'mint'
      case 'intermediate':
        return 'orange'
      case 'advanced':
        return 'defender'
      case 'capstone':
        return 'gold'
      default:
        return 'steel'
    }
  }

  const progressPercentage = progress?.progress_percentage || 0
  const completedSubtasks = progress
    ? Object.values(progress.subtasks_progress).filter((p) => p.completed).length
    : 0
  const totalSubtasks = mission.objectives?.length || 0

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Card className="glass-card hover:glass-hover transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{mission.title}</h3>
          <p className="text-sm text-och-steel line-clamp-2">{mission.description}</p>
        </div>
        <Badge variant={getDifficultyColor(mission.difficulty)}>{mission.difficulty}</Badge>
      </div>

      {showProgress && progress && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-och-steel mb-1">
            <span>Progress: {completedSubtasks}/{totalSubtasks} subtasks</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <ProgressBar value={progressPercentage} max={100} variant="mint" className="h-2" />
        </div>
      )}

      {showCompleted && progress && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={progress.final_status === 'pass' ? 'mint' : 'defender'}>
              {progress.final_status === 'pass' ? '✓ Passed' : '✗ Failed'}
            </Badge>
            {progress.ai_score !== undefined && progress.ai_score !== null && (
              <span className="text-och-steel">AI: {progress.ai_score}/100</span>
            )}
            {progress.mentor_score !== undefined && progress.mentor_score !== null && (
              <span className="text-och-steel">Mentor: {progress.mentor_score}/100</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-xs text-och-steel">
          {mission.estimated_time_minutes && (
            <span>⏱️ {mission.estimated_time_minutes} min</span>
          )}
          {mission.competency_tags && mission.competency_tags.length > 0 && (
            <span>📚 {mission.competency_tags.length} skills</span>
          )}
        </div>
        <Button
          variant="defender"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
        >
          {showProgress ? 'Continue' : showCompleted ? 'View' : 'Start'}
        </Button>
      </div>
      </Card>
    </div>
  )
}

