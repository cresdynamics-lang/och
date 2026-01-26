'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DifficultyChip } from './DifficultyChip'
import { CompetencyTags } from './CompetencyTags'
import { Countdown } from './Countdown'
import type { Mission } from '../types'

interface RecommendedMissionsProps {
  missions: Mission[]
  onStartMission: (missionId: string) => void
  onViewMission: (mission: Mission) => void
}


export function RecommendedMissions({ missions, onStartMission, onViewMission }: RecommendedMissionsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Recommended / Urgent</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missions.map((mission) => (
          <Card key={mission.id} className="bg-och-midnight/50 border border-och-steel/20 hover:border-och-defender/40 transition-all">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DifficultyChip difficulty={mission.difficulty} />
                    {mission.code && (
                      <span className="text-xs text-och-steel font-mono">{mission.code}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{mission.title}</h3>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-4">
                {mission.due_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-och-steel font-medium">Due:</span>
                    <Countdown deadline={mission.due_date} />
                  </div>
                )}
                {mission.estimated_time && (
                  <div className="text-sm text-och-steel">
                    <span className="font-medium">Time:</span> {mission.estimated_time}
                  </div>
                )}
                {mission.competency_tags && mission.competency_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mission.competency_tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-och-defender/20 text-och-defender text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {mission.competency_tags.length > 3 && (
                      <span className="text-xs text-och-steel">+{mission.competency_tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* AI Recommendation Hint */}
              {mission.ai_recommendation_reason && (
                <div className="mb-4 p-2 bg-och-defender/10 border border-och-defender/20 rounded text-xs text-och-steel">
                  <span className="font-medium text-och-defender">AI suggests:</span> {mission.ai_recommendation_reason}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {mission.status === 'not_started' ? (
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={() => onStartMission(mission.id)}
                    className="flex-1"
                  >
                    Start Mission
                  </Button>
                ) : (
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={() => onViewMission(mission)}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewMission(mission)}
                >
                  View Brief
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

