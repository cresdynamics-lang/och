'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { apiGateway } from '@/services/apiGateway'

interface Mission {
  id: string
  code: string
  title: string
  description?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  type?: string
  estimated_time_minutes?: number
  competency_tags?: string[]
  track_key?: string
  status?: string
  progress_percent?: number
  ai_score?: number
  submission_id?: string
  artifacts_uploaded?: number
  artifacts_required?: number
  ai_feedback?: {
    score: number
    strengths: string[]
    gaps: string[]
  }
}

interface MissionsResponse {
  results: Mission[]
  count: number
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export function ReadOnlyMissionsView() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    difficulty: 'all',
    track: 'all',
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    has_next: false,
    has_previous: false,
  })

  useEffect(() => {
    loadMissions()
  }, [pagination.page, filters.status, filters.difficulty, filters.track, filters.search])

  const loadMissions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params: any = {
        page: pagination.page,
        page_size: pagination.page_size,
      }
      
      if (filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty
      }
      if (filters.track !== 'all') {
        params.track = filters.track
      }
      if (filters.search) {
        params.search = filters.search
      }

      const response = await apiGateway.get<MissionsResponse>('/student/missions', { params })
      
      setMissions(response.results || [])
      setPagination({
        page: response.page || 1,
        page_size: response.page_size || 20,
        total: response.total || response.count || 0,
        has_next: response.has_next || false,
        has_previous: response.has_previous || false,
      })
    } catch (err: any) {
      console.error('Failed to load missions:', err)
      setError(err?.message || 'Failed to load missions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'not_started') {
      return <Badge variant="steel">Not Started</Badge>
    }
    
    switch (status) {
      case 'approved':
        return <Badge variant="mint">Approved</Badge>
      case 'in_ai_review':
        return <Badge variant="defender">AI Review</Badge>
      case 'in_mentor_review':
        return <Badge variant="orange">Mentor Review</Badge>
      case 'submitted':
        return <Badge variant="steel">Submitted</Badge>
      case 'in_progress':
        return <Badge variant="defender">In Progress</Badge>
      case 'changes_requested':
        return <Badge variant="orange">Changes Requested</Badge>
      default:
        return <Badge variant="steel">{status}</Badge>
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'mint'
      case 'intermediate':
        return 'defender'
      case 'advanced':
        return 'orange'
      case 'capstone':
        return 'gold'
      default:
        return 'steel'
    }
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading && missions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-6 bg-och-steel/20 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-och-steel/20 rounded w-full mb-2"></div>
              <div className="h-4 bg-och-steel/20 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-och-orange mb-4">{error}</p>
          <Button variant="outline" onClick={loadMissions}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-och-midnight/50 border border-och-steel/20">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value })
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="in_ai_review">In AI Review</option>
                <option value="in_mentor_review">In Mentor Review</option>
                <option value="approved">Approved</option>
                <option value="changes_requested">Changes Requested</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => {
                  setFilters({ ...filters, difficulty: e.target.value })
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="capstone">Capstone</option>
              </select>
            </div>

            {/* Track Filter */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Track</label>
              <select
                value={filters.track}
                onChange={(e) => {
                  setFilters({ ...filters, track: e.target.value })
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="all">All Tracks</option>
                <option value="defender">Defender</option>
                <option value="builder">Builder</option>
                <option value="analyst">Analyst</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value })
                  setPagination({ ...pagination, page: 1 })
                }}
                placeholder="Search missions..."
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Mission Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-och-steel">
          Showing {missions.length} of {pagination.total} missions
        </p>
      </div>

      {/* Mission List */}
      <div className="space-y-4">
        {missions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-och-steel">No missions found matching your filters.</p>
          </Card>
        ) : (
          missions.map((mission) => (
            <Card
              key={mission.id}
              className="bg-och-midnight/50 border border-och-steel/20 hover:border-och-defender/40 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-semibold text-white">{mission.title}</h3>
                      {getStatusBadge(mission.status)}
                      <Badge variant={getDifficultyColor(mission.difficulty) as any} className="text-xs capitalize">
                        {mission.difficulty}
                      </Badge>
                      {mission.code && (
                        <span className="text-sm text-och-steel font-mono bg-och-midnight px-2 py-1 rounded">
                          {mission.code}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {mission.description && (
                      <p className="text-sm text-och-steel mb-4 line-clamp-2">{mission.description}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-och-steel mb-3">
                      {mission.type && (
                        <span className="capitalize">{mission.type}</span>
                      )}
                      {mission.estimated_time_minutes && (
                        <span>⏱ {formatTime(mission.estimated_time_minutes)}</span>
                      )}
                      {mission.track_key && (
                        <span className="capitalize">Track: {mission.track_key}</span>
                      )}
                    </div>

                    {/* Competency Tags */}
                    {mission.competency_tags && mission.competency_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mission.competency_tags.slice(0, 5).map((tag, idx) => (
                          <Badge key={idx} variant="steel" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {mission.competency_tags.length > 5 && (
                          <Badge variant="steel" className="text-xs">
                            +{mission.competency_tags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Progress Info */}
                    {mission.status && mission.status !== 'not_started' && (
                      <div className="mt-3 pt-3 border-t border-och-steel/20">
                        {mission.progress_percent !== undefined && (
                          <div className="text-sm text-och-steel mb-2">
                            Progress: <span className="text-white font-medium">{mission.progress_percent}%</span>
                          </div>
                        )}
                        {mission.artifacts_uploaded !== undefined && mission.artifacts_required !== undefined && (
                          <div className="text-sm text-och-steel">
                            Artifacts: <span className="text-white font-medium">
                              {mission.artifacts_uploaded}/{mission.artifacts_required}
                            </span>
                          </div>
                        )}
                        {mission.ai_score !== undefined && (
                          <div className="text-sm text-och-steel">
                            AI Score: <span className="text-white font-medium">{mission.ai_score.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Feedback Summary */}
                    {mission.ai_feedback && (
                      <div className="mt-3 pt-3 border-t border-och-steel/20">
                        <div className="text-sm text-och-steel mb-2">
                          <strong className="text-white">AI Feedback Score:</strong> {mission.ai_feedback.score.toFixed(1)}%
                        </div>
                        {mission.ai_feedback.strengths && mission.ai_feedback.strengths.length > 0 && (
                          <div className="text-sm mb-2">
                            <span className="text-och-mint font-medium">Strengths:</span>
                            <ul className="list-disc list-inside text-och-steel ml-2">
                              {mission.ai_feedback.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mission.ai_feedback.gaps && mission.ai_feedback.gaps.length > 0 && (
                          <div className="text-sm">
                            <span className="text-och-orange font-medium">Areas for Improvement:</span>
                            <ul className="list-disc list-inside text-och-steel ml-2">
                              {mission.ai_feedback.gaps.map((gap, idx) => (
                                <li key={idx}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.page_size && (
        <div className="flex items-center justify-between pt-4 border-t border-och-steel/20">
          <div className="text-sm text-och-steel">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.page_size)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={!pagination.has_previous || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={!pagination.has_next || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
























































