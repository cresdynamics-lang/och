'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { missionsClient } from '@/services/missionsClient'
import type { MissionTemplate } from '@/services/missionsClient'

export default function MissionHallPage() {
  const router = useRouter()
  const [missions, setMissions] = useState<MissionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    difficulty: 'all',
    type: 'all',
    track_key: 'all',
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 24,
    total: 0,
    has_next: false,
    has_previous: false,
  })

  const loadMissions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: any = {
        page: pagination.page,
        page_size: pagination.page_size,
      }

      if (filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty
      }
      if (filters.type !== 'all') {
        params.type = filters.type
      }
      if (filters.track_key !== 'all') {
        params.track_key = filters.track_key
      }
      if (filters.search.trim()) {
        params.search = filters.search.trim()
      }

      const response = await missionsClient.getAllMissions(params)
      setMissions(response.results || [])
      setPagination({
        ...pagination,
        total: response.count || 0,
        has_next: !!response.next,
        has_previous: !!response.previous,
      })
    } catch (err: any) {
      console.error('Failed to load missions:', err)
      setError(err?.message || 'Failed to load missions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMissions()
  }, [pagination.page, filters.difficulty, filters.type, filters.track_key])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        setPagination({ ...pagination, page: 1 })
        loadMissions()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.search])

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lab':
        return '🔬'
      case 'scenario':
        return '🎯'
      case 'project':
        return '🚀'
      case 'capstone':
        return '🏆'
      default:
        return '📋'
    }
  }

  const formatTime = (minutes?: number, hours?: number) => {
    if (hours) return `${hours}h`
    if (minutes) {
      if (minutes < 60) return `${minutes}m`
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return null
  }

  const filteredMissions = useMemo(() => {
    if (!filters.search.trim()) return missions
    const searchLower = filters.search.toLowerCase()
    return missions.filter(
      (mission) =>
        mission.title?.toLowerCase().includes(searchLower) ||
        mission.code?.toLowerCase().includes(searchLower) ||
        mission.description?.toLowerCase().includes(searchLower)
    )
  }, [missions, filters.search])

  if (isLoading && missions.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Mission Hall</h1>
          <p className="text-och-steel">Browse all available missions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-och-steel/20 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-och-steel/20 rounded w-full mb-2"></div>
              <div className="h-4 bg-och-steel/20 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint flex items-center gap-3">
              <span>🏛️</span>
              Mission Hall
            </h1>
            <p className="text-och-steel">
              Explore all available missions across tracks and programs
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/mentor/missions')}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reviews
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-och-mint/10 to-och-mint/5 border-och-mint/30">
            <div className="text-sm text-och-steel mb-1">Total Missions</div>
            <div className="text-2xl font-bold text-och-mint">{pagination.total}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-och-defender/10 to-och-defender/5 border-och-defender/30">
            <div className="text-sm text-och-steel mb-1">Showing</div>
            <div className="text-2xl font-bold text-och-defender">{missions.length}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-och-orange/10 to-och-orange/5 border-och-orange/30">
            <div className="text-sm text-och-steel mb-1">Page</div>
            <div className="text-2xl font-bold text-och-orange">
              {pagination.page} / {Math.ceil(pagination.total / pagination.page_size) || 1}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-och-gold/10 to-och-gold/5 border-och-gold/30">
            <div className="text-sm text-och-steel mb-1">Filters Active</div>
            <div className="text-2xl font-bold text-och-gold">
              {[filters.difficulty, filters.type, filters.track_key].filter((f) => f !== 'all').length}
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-och-midnight/50 border border-och-steel/20">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">Search Missions</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by title, code, or description..."
                  className="w-full px-4 py-2 pl-10 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-och-steel"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Difficulty</label>
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

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters({ ...filters, type: e.target.value })
                  setPagination({ ...pagination, page: 1 })
                }}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
              >
                <option value="all">All Types</option>
                <option value="lab">Lab</option>
                <option value="scenario">Scenario</option>
                <option value="project">Project</option>
                <option value="capstone">Capstone</option>
              </select>
            </div>
          </div>

          {/* Track Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-white mb-2">Track</label>
            <select
              value={filters.track_key}
              onChange={(e) => {
                setFilters({ ...filters, track_key: e.target.value })
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
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-och-orange/50 bg-och-orange/10">
          <div className="p-4 text-och-orange">{error}</div>
        </Card>
      )}

      {/* Mission Grid */}
      {filteredMissions.length === 0 && !isLoading ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No missions found</h3>
          <p className="text-och-steel">
            Try adjusting your filters or search terms to find missions.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => (
            <Card
              key={mission.id}
              className="bg-och-midnight/50 border border-och-steel/20 hover:border-och-defender/40 hover:shadow-lg transition-all group"
            >
              <div className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-2xl">{getTypeIcon(mission.type || 'lab')}</span>
                      <Badge
                        variant={getDifficultyColor(mission.difficulty) as any}
                        className="text-xs capitalize shrink-0"
                      >
                        {mission.difficulty}
                      </Badge>
                      {mission.code && (
                        <span className="text-xs text-och-steel font-mono bg-och-midnight px-2 py-1 rounded shrink-0">
                          {mission.code}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-och-defender transition-colors line-clamp-2">
                      {mission.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                {mission.description && (
                  <p className="text-sm text-och-steel mb-4 line-clamp-3 flex-1">
                    {mission.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="space-y-2 mb-4 pt-4 border-t border-och-steel/20">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-och-steel">
                    {formatTime(mission.estimated_time_minutes, mission.est_hours) && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatTime(mission.estimated_time_minutes, mission.est_hours)}
                      </span>
                    )}
                    {mission.track_name && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        {mission.track_name}
                      </span>
                    )}
                    {mission.program_name && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        {mission.program_name}
                      </span>
                    )}
                  </div>

                  {/* Competencies */}
                  {mission.competencies && mission.competencies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {mission.competencies.slice(0, 3).map((comp, idx) => (
                        <Badge key={idx} variant="steel" className="text-xs">
                          {comp}
                        </Badge>
                      ))}
                      {mission.competencies.length > 3 && (
                        <Badge variant="steel" className="text-xs">
                          +{mission.competencies.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-och-steel/20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/mentor/missions/${mission.id}`)}
                  >
                    View Details
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.page_size && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-och-steel">
            Showing {((pagination.page - 1) * pagination.page_size) + 1} to{' '}
            {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} missions
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={!pagination.has_previous || isLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={!pagination.has_next || isLoading}
            >
              Next
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

