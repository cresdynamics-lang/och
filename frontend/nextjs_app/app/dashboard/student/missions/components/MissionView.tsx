/**
 * Mission View Component
 * Full mission experience with story, objectives, and subtasks
 */
'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '@/lib/stores/missionStore'
import { SubtaskView } from './SubtaskView'
import { RecipeSidebar } from './RecipeSidebar'
import { MissionProgressTracker } from './MissionProgressTracker'
import type { Mission, MissionProgress, Subtask } from '../types'

interface MissionViewProps {
  missionId: string
}

export function MissionView({ missionId }: MissionViewProps) {
  const {
    currentMission,
    currentProgress,
    currentSubtask,
    setCurrentMission,
    setCurrentProgress,
    setCurrentSubtask,
    setSubtasks,
  } = useMissionStore()

  const [started, setStarted] = useState(false)

  // Fetch mission details
  const { data: missionData, isLoading: missionLoading } = useQuery<Mission>({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      const response = await apiGateway.get<Mission>(`/student/missions/${missionId}`)
      return response
    },
  })

  // Start mission mutation
  const startMissionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiGateway.post<{ progress_id: string; status: string; current_subtask: number }>(
        `/missions/${missionId}/start`
      )
      return response
    },
  })

  useEffect(() => {
    if (startMissionMutation.isSuccess && startMissionMutation.data) {
      setStarted(true)
      // Fetch progress details
      // TODO: Add endpoint to get progress details
    }
  }, [startMissionMutation.isSuccess, startMissionMutation.data])

  useEffect(() => {
    if (missionData) {
      setCurrentMission(missionData)
      // Parse subtasks from mission data
      if (missionData.objectives) {
        const objectives = missionData.objectives
        const subtasks: Subtask[] = objectives.map((obj, idx) => ({
          id: idx + 1,
          title: `Subtask ${idx + 1}`,
          description: obj,
          estimated_minutes: Math.floor((missionData.estimated_time_minutes || 0) / objectives.length),
        }))
        setSubtasks(subtasks)
      }
    }
  }, [missionData, setCurrentMission, setSubtasks])

  if (missionLoading) {
    return <div className="text-center text-och-steel">Loading mission...</div>
  }

  if (!missionData) {
    return <div className="text-center text-och-error">Mission not found</div>
  }

  const handleStart = () => {
    startMissionMutation.mutate()
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Story Section */}
        {missionData.description && (
          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🧭</span>
              <h2 className="text-xl font-bold text-white">Story</h2>
            </div>
            <p className="text-och-steel leading-relaxed whitespace-pre-line">{missionData.description}</p>
          </Card>
        )}

        {/* Objectives Section */}
        {missionData.objectives && missionData.objectives.length > 0 && (
          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-bold text-white">Objectives</h2>
            </div>
            <ul className="space-y-2">
              {missionData.objectives.map((objective, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-och-mint mt-1">✓</span>
                  <span className="text-och-steel">{objective}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Progress Tracker */}
        {started && currentProgress && (
          <MissionProgressTracker progress={currentProgress as any} />
        )}

        {/* Subtask View */}
        {started ? (
          <SubtaskView missionId={missionId} subtaskNumber={currentSubtask} />
        ) : (
          <Card className="glass-card p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-4">Ready to Start?</h3>
            <p className="text-och-steel mb-6">
              This mission will take approximately {missionData.estimated_time_minutes || 0} minutes to complete.
            </p>
            <Button variant="defender" size="lg" onClick={handleStart} disabled={startMissionMutation.isPending}>
              {startMissionMutation.isPending ? 'Starting...' : 'Start Mission'}
            </Button>
          </Card>
        )}

        {/* Timer and Auto-save indicator */}
        {started && (
          <div className="flex items-center justify-between text-sm text-och-steel">
            <div className="flex items-center gap-4">
              <span>⏱️ {missionData.estimated_time_minutes || 0} min estimated</span>
              <span className="text-och-mint">💾 Auto-save every 30s</span>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Sidebar */}
      {started && missionData.recipe_recommendations && (
        <RecipeSidebar recipeIds={missionData.recipe_recommendations} />
      )}
    </div>
  )
}

