'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { mentorClient } from '@/services/mentorClient'
import { profilerClient } from '@/services/profilerClient'
import type { MissionSubmission, TalentScopeMentorView } from '@/services/types/mentor'

interface Mission {
  id?: string
  code?: string
  title?: string
  competencies?: string[]
}

interface StudentProgressViewProps {
  mentorId: string
  menteeId: string
  mission: Mission | null
  submission: MissionSubmission
}

export function StudentProgressView({
  mentorId,
  menteeId,
  mission,
  submission,
}: StudentProgressViewProps) {
  const [talentscopeData, setTalentscopeData] = useState<TalentScopeMentorView | null>(null)
  const [futureYouData, setFutureYouData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStudentData()
  }, [mentorId, menteeId])

  const loadStudentData = async () => {
    setLoading(true)
    try {
      const [talentscope, futureYou] = await Promise.all([
        mentorClient.getTalentScopeView(mentorId, menteeId),
        profilerClient.getFutureYou(menteeId).catch(() => null),
      ])
      setTalentscopeData(talentscope)
      setFutureYouData(futureYou)
    } catch (err) {
      console.error('Failed to load student data:', err)
    } finally {
      setLoading(false)
    }
  }

  const missionCompetencies = mission?.competencies || []
  const studentSkills = talentscopeData?.skills_heatmap || {}

  // Match mission competencies with student skills
  const competencyMatch = missionCompetencies.map(comp => {
    const skillLevel = studentSkills[comp] || 0
    return {
      competency: comp,
      studentLevel: skillLevel,
      status: skillLevel >= 70 ? 'strong' : skillLevel >= 40 ? 'developing' : 'needs_work',
    }
  })

  return (
    <div className="space-y-6">
      {/* Future-You Persona */}
      {futureYouData && (
        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Future-You Persona Alignment</h2>
          <div className="space-y-3">
            {futureYouData.persona && (
              <div>
                <p className="text-sm text-och-steel mb-1">Persona</p>
                <p className="text-white">{futureYouData.persona}</p>
              </div>
            )}
            {futureYouData.recommended_track && (
              <div>
                <p className="text-sm text-och-steel mb-1">Recommended Track</p>
                <Badge variant="defender">{futureYouData.recommended_track}</Badge>
              </div>
            )}
            {mission && (
              <div className="mt-4 p-3 bg-och-midnight/50 rounded-lg">
                <p className="text-xs text-och-steel mb-2">Mission Alignment</p>
                <p className="text-sm text-white">
                  This mission aligns with the student's Future-You persona and helps them progress toward their recommended track.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Competency Match Analysis */}
      {competencyMatch.length > 0 && (
        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Competency Analysis</h2>
          <p className="text-sm text-och-steel mb-4">
            Compare mission requirements with student's current skill levels from TalentScope Analytics.
          </p>
          <div className="space-y-4">
            {competencyMatch.map((match, idx) => (
              <div key={idx} className="p-4 bg-och-midnight/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{match.competency}</span>
                  <Badge
                    variant={
                      match.status === 'strong'
                        ? 'mint'
                        : match.status === 'developing'
                        ? 'gold'
                        : 'orange'
                    }
                    className="text-xs"
                  >
                    {match.status === 'strong'
                      ? 'Strong'
                      : match.status === 'developing'
                      ? 'Developing'
                      : 'Needs Work'}
                  </Badge>
                </div>
                <ProgressBar
                  value={match.studentLevel}
                  max={100}
                  variant={
                    match.status === 'strong'
                      ? 'mint'
                      : match.status === 'developing'
                      ? 'gold'
                      : 'orange'
                  }
                  className="h-2"
                />
                <p className="text-xs text-och-steel mt-1">
                  Current Level: {match.studentLevel}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TalentScope Overview */}
      {talentscopeData && (
        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">TalentScope Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {talentscopeData.core_readiness_score !== undefined && (
              <div>
                <p className="text-xs text-och-steel mb-1">Readiness Score</p>
                <p className="text-2xl font-bold text-och-mint">
                  {talentscopeData.core_readiness_score}%
                </p>
              </div>
            )}
            {talentscopeData.ingested_signals && (
              <>
                <div>
                  <p className="text-xs text-och-steel mb-1">Mission Scores</p>
                  <p className="text-2xl font-bold text-och-defender">
                    {talentscopeData.ingested_signals.mission_scores || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Habit Logs</p>
                  <p className="text-2xl font-bold text-och-gold">
                    {talentscopeData.ingested_signals.habit_logs || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-och-steel mb-1">Mentor Evaluations</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {talentscopeData.ingested_signals.mentor_evaluations || 0}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recommendations</h2>
        <div className="space-y-3">
          <div className="p-3 bg-och-midnight/50 rounded-lg">
            <p className="text-sm text-white font-medium mb-1">Next Mission Suggestions</p>
            <p className="text-xs text-och-steel">
              Based on this student's progress and Future-You alignment, recommend missions that build on these competencies.
            </p>
          </div>
          <div className="p-3 bg-och-midnight/50 rounded-lg">
            <p className="text-sm text-white font-medium mb-1">Skill Gap Interventions</p>
            <p className="text-xs text-och-steel">
              For competencies marked as "Needs Work", consider recommending focused recipes or micro-learning units.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

