'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Mission } from '../types'

interface MissionListProps {
  missions: Mission[]
  filters: {
    status: string
    difficulty: string
    track: string
    search: string
  }
  onFiltersChange: (filters: any) => void
  onStartMission: (missionId: string) => void
  onViewMission: (mission: Mission) => void
  pagination?: {
    page: number
    page_size: number
    total: number
    has_next: boolean
    has_previous: boolean
  }
  onPageChange?: (page: number) => void
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_ai_review', label: 'In AI Review' },
  { value: 'in_mentor_review', label: 'In Mentor Review' },
  { value: 'approved', label: 'Approved' },
]

const difficultyOptions = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'capstone', label: 'Capstone' },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved': return <Badge variant="mint">Approved</Badge>
    case 'in_ai_review': return <Badge variant="defender">AI Review</Badge>
    case 'in_mentor_review': return <Badge variant="orange">Mentor Review</Badge>
    case 'submitted': return <Badge variant="steel">Submitted</Badge>
    case 'in_progress': return <Badge variant="defender">In Progress</Badge>
    case 'changes_requested': return <Badge variant="orange">Changes Requested</Badge>
    default: return <Badge variant="steel">Not Started</Badge>
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'mint'
    case 'intermediate': return 'defender'
    case 'advanced': return 'orange'
    case 'capstone': return 'gold'
    default: return 'steel'
  }
}

export function MissionList({ missions, filters, onFiltersChange, onStartMission, onViewMission }: MissionListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">All Missions</h2>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-och-midnight/50 border border-och-steel/20">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => onFiltersChange({ ...filters, difficulty: e.target.value })}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                {difficultyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Track Filter */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Track</label>
              <select
                value={filters.track}
                onChange={(e) => onFiltersChange({ ...filters, track: e.target.value })}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="all">All Tracks</option>
                {/* Track options would come from API */}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                placeholder="Search missions..."
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Mission List */}
      <div className="space-y-4">
        {missions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-och-steel">No missions found matching your filters.</p>
          </Card>
        ) : (
          missions.map((mission) => (
            <Card key={mission.id} className="bg-och-midnight/50 border border-och-steel/20 hover:border-och-defender/40 transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{mission.title}</h3>
                      {getStatusBadge(mission.status)}
                      <Badge variant={getDifficultyColor(mission.difficulty) as any} className="text-xs">
                        {mission.difficulty}
                      </Badge>
                      {mission.code && (
                        <span className="text-sm text-och-steel font-mono">{mission.code}</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-och-steel mb-3">
                      {mission.mission_type && (
                        <span>{mission.mission_type}</span>
                      )}
                      {mission.estimated_time && (
                        <span>⏱ {mission.estimated_time}</span>
                      )}
                      {mission.last_updated && (
                        <span>Updated: {new Date(mission.last_updated).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    {mission.artifacts_required && mission.artifacts_uploaded !== undefined && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-och-steel">Artifacts uploaded</span>
                          <span className="text-white">
                            {mission.artifacts_uploaded}/{mission.artifacts_required}
                          </span>
                        </div>
                        <ProgressBar 
                          value={(mission.artifacts_uploaded / mission.artifacts_required) * 100} 
                          variant="defender" 
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Portfolio Link - Auto-created when mission approved */}
                    {mission.status === 'approved' && (
                      <div className="mt-3">
                        {mission.portfolio_linked ? (
                          <Badge variant="mint" className="flex items-center gap-1">
                            <span>✓</span>
                            <span>In Portfolio</span>
                          </Badge>
                        ) : (
                          <div className="text-xs text-och-steel">
                            Portfolio item will be auto-created (85%+ score)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex gap-2">
                    {mission.status === 'not_started' ? (
                      <Button variant="defender" size="sm" onClick={() => onStartMission(mission.id)}>
                        Start
                      </Button>
                    ) : (
                      <Button variant="defender" size="sm" onClick={() => onViewMission(mission)}>
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

