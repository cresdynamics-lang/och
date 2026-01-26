/**
 * Mission Progress Tracker Component
 * Visual progress bar showing subtask completion
 */
'use client'

import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { MissionProgress } from '../types'

interface MissionProgressTrackerProps {
  progress: MissionProgress
}

export function MissionProgressTracker({ progress }: MissionProgressTrackerProps) {
  const completedCount = Object.values(progress.subtasks_progress || {}).filter(
    (p) => p.completed
  ).length
  const totalSubtasks = Object.keys(progress.subtasks_progress || {}).length
  const percentage = totalSubtasks > 0 ? (completedCount / totalSubtasks) * 100 : 0

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-och-steel">Mission Progress</span>
        <span className="text-sm text-och-steel">
          {completedCount}/{totalSubtasks} subtasks
        </span>
      </div>
      <ProgressBar value={percentage} max={100} variant="mint" className="h-3" />
      <div className="mt-2 text-xs text-och-steel">
        Current: Subtask {progress.current_subtask}
      </div>
    </Card>
  )
}

