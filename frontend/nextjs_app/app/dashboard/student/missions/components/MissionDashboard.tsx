/**
 * Mission Dashboard Component
 * Track-level mission list with available, in-progress, and completed missions
 */
'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '@/lib/stores/missionStore'
import { MissionCard } from './MissionCard'
import type { Mission, MissionProgress } from '../types'

interface MissionDashboardResponse {
  available_missions: Mission[]
  in_progress_missions: Array<{
    id: string
    mission: Mission
    status: string
    current_subtask: number
    progress_percentage: number
  }>
  completed_missions: Array<{
    id: string
    mission: Mission
    final_status: string
    ai_score?: number
    mentor_score?: number
    submitted_at?: string
  }>
  recommended_recipes: string[]
  next_mission: string | null
  tier_lock: boolean
  user_tier: string
}

interface MissionDashboardProps {
  track?: string
  tier?: string
}

export function MissionDashboard({ track = 'defender', tier = 'beginner' }: MissionDashboardProps) {
  const {
    setAvailableMissions,
    setInProgressMissions,
    setCompletedMissions,
    setUserTier,
    setTierLock,
    availableMissions,
    inProgressMissions,
    completedMissions,
  } = useMissionStore()

  const { data, isLoading, error } = useQuery<MissionDashboardResponse>({
    queryKey: ['mission-dashboard', track, tier],
    queryFn: async () => {
      try {
        const response = await apiGateway.get<MissionDashboardResponse>(
          `/missions/dashboard?track=${track}&tier=${tier}`
        )
        return response
      } catch (err: any) {
        console.error('Failed to load mission dashboard:', err)
        // Return empty data structure on error
        return {
          available_missions: [],
          in_progress_missions: [],
          completed_missions: [],
          recommended_recipes: [],
          next_mission: null,
          tier_lock: false,
          user_tier: 'free',
        }
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  })

  useEffect(() => {
    if (data) {
      setAvailableMissions(data.available_missions.map((m) => ({
        ...m,
        status: (m as any).status ?? 'available',
        progress_percent: (m as any).progress_percent ?? 0,
      })))
      setInProgressMissions(
        data.in_progress_missions.map((p: any) => ({
          id: p.id,
          code: p.mission.code || '',
          title: p.mission.title || '',
          description: p.mission.description || '',
          difficulty: p.mission.difficulty || 'beginner',
          mission_id: p.mission.id,
          user_id: '',
          status: p.status as any,
          current_subtask: p.current_subtask,
          subtasks_progress: {},
          progress_percentage: p.progress_percentage,
          progress_percent: p.progress_percentage,
        }))
      )
      setCompletedMissions(
        data.completed_missions.map((p: any) => ({
          id: p.id,
          code: p.mission.code || '',
          title: p.mission.title || '',
          description: p.mission.description || '',
          difficulty: p.mission.difficulty || 'beginner',
          mission_id: p.mission.id,
          user_id: '',
          status: p.final_status === 'pass' ? 'approved' : 'failed',
          current_subtask: 0,
          subtasks_progress: {},
          final_status: p.final_status as any,
          progress_percent: 100,
        }))
      )
      setUserTier(data.user_tier as any)
      setTierLock(data.tier_lock)
    }
  }, [data, setAvailableMissions, setInProgressMissions, setCompletedMissions, setUserTier, setTierLock])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Mission Dashboard</h2>
          <p className="text-och-steel">Loading missions...</p>
        </div>
        <div className="h-32 bg-och-midnight/50 rounded-xl animate-pulse" />
        <div className="h-32 bg-och-midnight/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Mission Dashboard</h2>
        </div>
        <Card className="p-6 text-center border-och-error/30">
          <p className="text-och-error mb-2">Error loading missions dashboard</p>
          <p className="text-sm text-och-steel">Track: {track}, Tier: {tier}</p>
          <p className="text-xs text-och-steel mt-2">Check console for details</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Mission Dashboard</h2>
        <p className="text-och-steel text-sm">
          Track: <span className="text-och-mint capitalize">{track}</span> • Tier: <span className="text-och-mint capitalize">{tier}</span>
        </p>
      </div>

      {/* Available Missions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Available Missions</h3>
          <Badge variant="mint">{availableMissions.length} available</Badge>
        </div>
        {availableMissions.length === 0 ? (
          <Card className="p-6 text-center text-och-steel">
            <p>No available missions for this track/tier</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </section>

      {/* In Progress Missions */}
      {inProgressMissions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">In Progress</h3>
            <Badge variant="orange">{inProgressMissions.length} active</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.in_progress_missions.map((progressItem) => {
              const mission = progressItem.mission
              if (!mission) return null
              return (
                <MissionCard
                  key={progressItem.id}
                  mission={mission}
                  showProgress
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Completed</h3>
            <Badge variant="defender">{completedMissions.length} completed</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedMissions.map((progress) => {
              const mission = data?.completed_missions.find((p) => p.id === progress.id)?.mission
              if (!mission) return null
              return (
                <MissionCard
                  key={progress.id}
                  mission={mission}
                  showCompleted
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Tier Lock Warning */}
      {data?.tier_lock && (
        <Card className="p-6 bg-och-orange/10 border-och-orange/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-bold text-white mb-1">Tier Locked</h3>
              <p className="text-sm text-och-steel">
                This tier requires a Premium subscription. Upgrade to unlock advanced missions.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

