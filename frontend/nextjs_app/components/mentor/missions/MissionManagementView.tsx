'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mentorClient } from '@/services/mentorClient'
import { apiGateway } from '@/services/apiGateway'
import { AllMissionsView } from './AllMissionsView'
import { SubmissionQueue } from './SubmissionQueue'
import { MissionDetailView } from './MissionDetailView'
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
  is_active: boolean
}

interface MissionManagementViewProps {
  mentorId: string
}

type ViewMode = 'missions' | 'submissions' | 'detail'

export function MissionManagementView({ mentorId }: MissionManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('missions')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<MissionSubmission | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    track: '',
    tier: '',
    difficulty: '',
    type: '',
    search: '',
  })

  const loadMissions = async () => {
    setLoading(true)
    try {
      const params: any = { is_active: 'true' }
      if (filters.track) params.track = filters.track
      if (filters.tier) params.tier = filters.tier
      if (filters.difficulty) params.difficulty = filters.difficulty
      if (filters.type) params.type = filters.type
      if (filters.search) params.search = filters.search

      const response = await apiGateway.get<any>(`/mentors/${mentorId}/missions`, { params })
      const fetched = Array.isArray(response) ? response : (response?.results || [])
      setMissions(fetched)
    } catch (err) {
      console.error('Failed to load missions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'missions') {
      loadMissions()
    }
  }, [viewMode, filters, mentorId])

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission)
    setViewMode('detail')
  }

  const handleSubmissionClick = (submission: MissionSubmission) => {
    setSelectedSubmission(submission)
    setViewMode('detail')
  }

  const handleBack = () => {
    setSelectedMission(null)
    setSelectedSubmission(null)
    setViewMode('missions')
  }

  if (viewMode === 'detail' && (selectedMission || selectedSubmission)) {
    return (
      <MissionDetailView
        mentorId={mentorId}
        mission={selectedMission}
        submission={selectedSubmission}
        onBack={handleBack}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-och-steel/20">
        <button
          onClick={() => setViewMode('missions')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'missions'
              ? 'border-och-mint text-och-mint'
              : 'border-transparent text-och-steel hover:text-white'
          }`}
        >
          All Missions
        </button>
        <button
          onClick={() => setViewMode('submissions')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'submissions'
              ? 'border-och-mint text-och-mint'
              : 'border-transparent text-och-steel hover:text-white'
          }`}
        >
          Submission Queue
        </button>
      </div>

      {/* Content */}
      {viewMode === 'missions' && (
        <AllMissionsView
          missions={missions}
          loading={loading}
          filters={filters}
          onFiltersChange={setFilters}
          onMissionClick={handleMissionClick}
          onRefresh={loadMissions}
        />
      )}

      {viewMode === 'submissions' && (
        <SubmissionQueue
          mentorId={mentorId}
          onSubmissionClick={handleSubmissionClick}
        />
      )}
    </div>
  )
}

