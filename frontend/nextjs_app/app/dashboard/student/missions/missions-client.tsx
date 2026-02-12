'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { missionsClient } from '@/services/missionsClient'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Search,
  Lock,
  Play,
  AlertTriangle,
  Clock,
  Target,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Zap,
  TrendingUp,
  Award,
  Flame,
} from 'lucide-react'
import { MissionsGridView } from './components/MissionsGridView'

interface Mission {
  id: string
  code: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  estimated_duration_minutes?: number
  competency_tags?: string[]
  track_key?: string
  status?: string
  progress_percent?: number
  is_locked?: boolean
  lock_reason?: string | null
  type?: string
  ai_score?: number
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

interface StudentProfile {
  tier?: number
  current_track?: string
  skill_level?: string
  total_missions_completed?: number
  current_streak?: number
}

export default function MissionsClient() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  // State management
  const [missions, setMissions] = useState<Mission[]>([])
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtersInitialized, setFiltersInitialized] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    difficulty: 'all',
    track: 'all',
    tier: 'all',
    search: '',
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  })

  // Initialize filters from URL params
  useEffect(() => {
    if (typeof window !== 'undefined' && !filtersInitialized) {
      const params = new URLSearchParams(window.location.search)
      const trackParam = params.get('track')
      const tierParam = params.get('tier')
      const statusParam = params.get('status')

      setFilters(prev => ({
        ...prev,
        track: trackParam || 'all',
        tier: tierParam || 'all',
        status: statusParam || 'all',
      }))
      setFiltersInitialized(true)
    }
  }, [filtersInitialized])

  // Load missions from API
  const loadMissions = async () => {
    if (!isAuthenticated) {
      setLoading(false)
      setError('Please log in to view missions')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params: any = {
        page: pagination.page,
        page_size: pagination.pageSize,
      }

      // Apply filters
      if (filters.status !== 'all') params.status = filters.status
      if (filters.difficulty !== 'all') params.difficulty = filters.difficulty
      if (filters.track !== 'all') params.track = filters.track
      if (filters.tier !== 'all') params.tier = filters.tier
      if (filters.search) params.search = filters.search

      const response = await missionsClient.getAllMissions(params)

      setMissions(response.results || [])
      setPagination(prev => ({
        ...prev,
        total: response.count || 0,
        hasNext: !!response.next,
        hasPrevious: !!response.previous,
      }))

    } catch (err: any) {
      console.error('[MissionsClient] Error loading missions:', err)
      setError(err.message || 'Failed to load missions. Please try again.')
      setMissions([])
    } finally {
      setLoading(false)
    }
  }

  // Load student profile
  const loadProfile = async () => {
    if (!isAuthenticated || !user) {
      setProfileLoading(false)
      return
    }

    try {
      // Profile data comes from auth context
      setStudentProfile({
        tier: 1,
        current_track: user.primary_role?.name || 'defender',
        skill_level: 'beginner',
        total_missions_completed: 0,
        current_streak: 0
      })
    } catch (err: any) {
      console.error('[MissionsClient] Error loading profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (isAuthenticated && filtersInitialized) {
      loadProfile()
      loadMissions()
    } else if (!isAuthenticated) {
      setLoading(false)
      setProfileLoading(false)
    }
  }, [isAuthenticated, filtersInitialized])

  // Reload when filters or pagination changes
  useEffect(() => {
    if (isAuthenticated && filtersInitialized) {
      loadMissions()
    }
  }, [pagination.page, filters])

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      difficulty: 'all',
      track: 'all',
      tier: 'all',
      search: '',
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleMissionClick = (missionId: string) => {
    if (!isAuthenticated) {
      setError('Please log in to access missions')
      return
    }

    router.push(`/dashboard/student/missions/${missionId}`)
  }

  // Wait for auth or profile to load before checking authentication
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-och-mint" />
      </div>
    );
  }

  // Check for token even if isAuthenticated is false (might be loading)
  const hasToken = typeof window !== 'undefined' && (
    localStorage.getItem('access_token') ||
    document.cookie.includes('access_token=')
  );

  // Only show login prompt if auth has finished loading AND there's no token
  // If auth is still loading or token exists, allow access
  if (!authLoading && !isAuthenticated && !hasToken) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-och-steel" />
          <h2 className="text-2xl font-bold mb-2 text-white">Authentication Required</h2>
          <p className="text-och-steel mb-6">
            Please log in to view and complete missions
          </p>
          <Button onClick={() => router.push('/login/student')} variant="defender">
            Log In
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Missions</h1>
        <p className="text-och-steel">
          Complete hands-on cybersecurity challenges to build your skills
        </p>
      </div>

      {/* Stats Overview */}
      {studentProfile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-och-mint" />
              <div>
                <p className="text-xs text-och-steel">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {studentProfile.total_missions_completed || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-och-orange" />
              <div>
                <p className="text-xs text-och-steel">Current Streak</p>
                <p className="text-2xl font-bold text-white">
                  {studentProfile.current_streak || 0} days
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-och-defender" />
              <div>
                <p className="text-xs text-och-steel">Track</p>
                <p className="text-lg font-semibold text-white capitalize">
                  {studentProfile.current_track || 'Defender'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-och-mint" />
              <div>
                <p className="text-xs text-och-steel">Skill Level</p>
                <p className="text-lg font-semibold text-white capitalize">
                  {studentProfile.skill_level || 'Beginner'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-och-steel" />
              <input
                type="text"
                placeholder="Search missions..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="in_ai_review">AI Review</option>
            <option value="ai_reviewed">AI Reviewed</option>
            <option value="in_mentor_review">Mentor Review</option>
            <option value="approved">Approved</option>
            <option value="failed">Failed</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange({ difficulty: e.target.value })}
            className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="capstone">Capstone</option>
          </select>

          {/* Track Filter */}
          <select
            value={filters.track}
            onChange={(e) => handleFilterChange({ track: e.target.value })}
            className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="all">All Tracks</option>
            <option value="defender">Defender</option>
            <option value="offensive">Offensive</option>
            <option value="grc">GRC</option>
            <option value="innovation">Innovation</option>
            <option value="leadership">Leadership</option>
          </select>

          {/* Tier Filter */}
          <select
            value={filters.tier}
            onChange={(e) => handleFilterChange({ tier: e.target.value })}
            className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="all">All Tiers</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="mastery">Mastery</option>
          </select>
        </div>

        {/* Reset Filters */}
        {(filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.track !== 'all' || filters.tier !== 'all') && (
          <div className="mt-4">
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 mb-6 bg-och-orange/10 border-och-orange/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-och-orange flex-shrink-0" />
            <p className="text-sm text-och-orange">{error}</p>
          </div>
        </Card>
      )}

      {/* Missions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-och-mint" />
        </div>
      ) : missions.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-och-steel" />
          <h3 className="text-xl font-semibold mb-2 text-white">No Missions Found</h3>
          <p className="text-och-steel mb-4">
            {filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.track !== 'all' || filters.tier !== 'all'
              ? 'Try adjusting your filters to see more missions'
              : 'No missions are currently available'}
          </p>
          {(filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.track !== 'all') && (
            <Button variant="outline" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <>
          <MissionsGridView missions={missions} onMissionClick={handleMissionClick} />

          {/* Pagination */}
          {pagination.total > pagination.pageSize && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-och-steel">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} missions
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPrevious}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <span className="text-sm text-och-steel px-4">
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
