'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mentorClient } from '@/services/mentorClient'
import { apiGateway } from '@/services/apiGateway'
import { MissionReviewPanel } from './MissionReviewPanel'
import { StudentProgressView } from './StudentProgressView'
import type { MissionSubmission } from '@/services/types/mentor'

interface Mission {
  id: string
  code: string
  title: string
  description: string
  track: string
  tier: string
  difficulty: string
  type: string
  track_key?: string
  competencies?: string[]
  requires_mentor_review: boolean
  objectives?: string[]
  subtasks?: any[]
  success_criteria?: any
}

interface MissionDetailViewProps {
  mentorId: string
  mission: Mission | null
  submission: MissionSubmission | null
  onBack: () => void
}

export function MissionDetailView({ mentorId, mission, submission, onBack }: MissionDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'submission' | 'progress' | 'review'>('overview')
  const [missionData, setMissionData] = useState<Mission | null>(mission)
  const [submissionData, setSubmissionData] = useState<MissionSubmission | null>(submission)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mission && !missionData) {
      loadMissionDetails()
    }
    if (submission && !submissionData) {
      loadSubmissionDetails()
    }
  }, [mission, submission])

  const loadMissionDetails = async () => {
    if (!mission?.id) return
    setLoading(true)
    try {
      const response = await apiGateway.get<any>(`/missions/${mission.id}`)
      setMissionData(response as Mission)
    } catch (err) {
      console.error('Failed to load mission details:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissionDetails = async () => {
    if (!submission?.id) return
    setLoading(true)
    try {
      const response = await mentorClient.getMissionSubmission(submission.id)
      setSubmissionData(response)
      setActiveTab('submission')
    } catch (err) {
      console.error('Failed to load submission details:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentMission = missionData || mission
  const currentSubmission = submissionData || submission

  if (!currentMission && !currentSubmission) {
    return (
      <Card className="glass-card p-8 text-center">
        <p className="text-och-steel mb-4">No mission or submission data available.</p>
        <Button onClick={onBack} variant="outline">
          Go Back
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="outline" size="sm" className="mb-4">
            ← Back to Missions
          </Button>
          <h1 className="text-3xl font-bold text-och-mint mb-2">
            {currentMission?.code || 'Mission'} - {currentMission?.title || 'Unknown'}
          </h1>
          {currentMission && (
            <div className="flex gap-2 mt-2">
              <Badge variant="steel">{currentMission.track}</Badge>
              <Badge variant="defender">{currentMission.tier}</Badge>
              <Badge variant="gold">{currentMission.difficulty}</Badge>
              {currentMission.requires_mentor_review && (
                <Badge variant="orange">Requires Mentor Review</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-och-steel/20">
        {['overview', 'submission', 'progress', 'review'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 capitalize ${
              activeTab === tab
                ? 'border-och-mint text-och-mint'
                : 'border-transparent text-och-steel hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && currentMission && (
        <div className="space-y-4">
          <Card className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Mission Overview</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-och-steel mb-2">Description</h3>
                <p className="text-white">{currentMission.description || 'No description available'}</p>
              </div>

              {currentMission.objectives && currentMission.objectives.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-och-steel mb-2">Objectives</h3>
                  <ul className="list-disc list-inside space-y-1 text-white">
                    {currentMission.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentMission.competencies && currentMission.competencies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-och-steel mb-2">Technical Competencies</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentMission.competencies.map((comp, idx) => (
                      <Badge key={idx} variant="steel" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {currentMission.success_criteria && (
                <div>
                  <h3 className="text-sm font-semibold text-och-steel mb-2">Success Criteria</h3>
                  <pre className="text-xs text-och-steel bg-och-midnight/50 p-3 rounded overflow-auto">
                    {JSON.stringify(currentMission.success_criteria, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'submission' && currentSubmission && (
        <MissionReviewPanel
          mentorId={mentorId}
          submission={currentSubmission}
          mission={currentMission}
          onReviewComplete={() => {
            loadSubmissionDetails()
            setActiveTab('review')
          }}
        />
      )}

      {activeTab === 'progress' && currentSubmission && (
        <StudentProgressView
          mentorId={mentorId}
          menteeId={(currentSubmission as any).mentee_id}
          mission={currentMission}
          submission={currentSubmission}
        />
      )}

      {activeTab === 'review' && currentSubmission && (
        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Review Status</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-och-steel mb-1">Status</p>
              <Badge variant="defender">{currentSubmission.status}</Badge>
            </div>
            {(currentSubmission as any).ai_score && (
              <div>
                <p className="text-sm text-och-steel mb-1">AI Score</p>
                <p className="text-white">{(currentSubmission as any).ai_score}%</p>
              </div>
            )}
            {(currentSubmission as any).mentor_score && (
              <div>
                <p className="text-sm text-och-steel mb-1">Mentor Score</p>
                <p className="text-white">{(currentSubmission as any).mentor_score}%</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

