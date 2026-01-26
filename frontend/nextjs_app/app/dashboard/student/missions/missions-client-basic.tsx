'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiGateway } from '@/services/apiGateway'
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

export default function MissionsClient() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  // State management
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    difficulty: 'all',
    track: 'all',
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

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
    }
  }, [isAuthenticated, authLoading, router])

  // Load missions when filters change (reset to page 1)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [filters.status, filters.difficulty, filters.track, filters.search])

  // Load missions when page or filters change
  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    loadMissions()
  }, [pagination.page, filters, isAuthenticated, authLoading])

  const loadMissions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: Record<string, string | number> = {
        page: pagination.page,
        page_size: pagination.pageSize,
      }

      // Add filters to params
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

      console.log('[MissionsClient] Loading missions with params:', params)
      console.log('[MissionsClient] User:', user?.username)
      console.log('[MissionsClient] Authenticated:', isAuthenticated)

      // Call the API
      const response = await apiGateway.get<MissionsResponse>(
        '/student/missions/',
        { params }
      )

      console.log('[MissionsClient] API Response:', response)
      console.log('[MissionsClient] Response type:', typeof response)
      console.log('[MissionsClient] Response.results type:', Array.isArray(response?.results))

      // Check if response has results array
      if (response && Array.isArray(response.results)) {
        console.log('[MissionsClient] ✅ Got results array with', response.results.length, 'missions')
        setMissions(response.results)
        setPagination({
          page: response.page || 1,
          pageSize: response.page_size || 20,
          total: response.total || 0,
          hasNext: response.has_next || false,
          hasPrevious: response.has_previous || false,
        })
      } else if (Array.isArray(response)) {
        // Response is directly an array
        console.log('[MissionsClient] ⚠️ Response is direct array, not object')
        setMissions(response)
        setPagination({
          page: 1,
          pageSize: 20,
          total: response.length,
          hasNext: false,
          hasPrevious: false,
        })
      } else {
        console.warn('[MissionsClient] ❌ Unexpected response format:', response)
        setError('Unexpected response format from server')
        setMissions([])
      }
    } catch (err: any) {
      console.error('[MissionsClient] Error loading missions:', err)
      
      // Handle specific error types
      if (err?.response?.status === 401) {
        setError('Authentication failed. Please log in again.')
        router.push('/login/student')
      } else if (err?.response?.status === 403) {
        setError('You do not have permission to access missions.')
      } else if (err?.response?.status === 404) {
        setError('Missions endpoint not found on the server.')
      } else {
        setError(`Failed to load missions: ${err?.message || 'Unknown error'}`)
      }
      
      setMissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleMissionClick = (missionId: string) => {
    router.push(`/dashboard/student/missions/${missionId}`)
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      difficulty: 'all',
      track: 'all',
      search: '',
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Loading state
  if (!isAuthenticated || authLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-och-gold" />
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error && missions.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-och-midnight/90 border border-och-defender/40">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-och-defender flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Failed to Load Missions</h2>
                <p className="text-och-steel mt-1">{error}</p>
              </div>
            </div>
            <Button
              onClick={loadMissions}
              variant="defender"
              className="mt-4"
            >
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="w-full border-b border-och-steel/10 bg-gradient-to-r from-och-gold/5 via-och-defender/5 to-och-mint/5">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-och-defender to-och-orange shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">
                Mission <span className="text-och-gold">Control</span>
              </h1>
              <p className="text-och-steel text-sm mt-1">
                Practical challenges. Industry-ready competence.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-och-gold">{pagination.total}</p>
              <p className="text-och-steel text-sm">Total Missions</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="w-full bg-och-midnight/40 border-b border-och-steel/10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30"
            >
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-blue-300">Available</p>
                <p className="text-lg font-bold text-blue-400">{missions.filter(m => !m.is_locked).length}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-green-300">Completed</p>
                <p className="text-lg font-bold text-green-400">{missions.filter(m => m.status === 'approved').length}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
            >
              <Play className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-yellow-300">In Progress</p>
                <p className="text-lg font-bold text-yellow-400">{missions.filter(m => m.status === 'in_progress').length}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-500/10 border border-gray-500/30"
            >
              <Lock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-300">Locked</p>
                <p className="text-lg font-bold text-gray-400">{missions.filter(m => m.is_locked).length}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="w-full border-b border-och-steel/10 bg-och-midnight/20">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3"
          >
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-och-steel" />
                <input
                  type="text"
                  placeholder="Search missions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
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
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Completed</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange({ difficulty: e.target.value })}
              className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
            >
              <option value="all">All Levels</option>
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
              <option value="defender">🛡️ Defender</option>
              <option value="offensive">⚔️ Offensive</option>
              <option value="grc">📋 GRC</option>
              <option value="innovation">💡 Innovation</option>
              <option value="leadership">👥 Leadership</option>
            </select>

            {/* Reset Button */}
            {(filters.status !== 'all' || filters.difficulty !== 'all' || filters.track !== 'all' || filters.search) && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-och-gold hover:text-och-gold/80 font-semibold transition-colors"
              >
                Reset
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-12 h-12 text-och-gold" />
            </motion.div>
          </div>
        ) : missions.length === 0 ? (
          <Card className="p-12 bg-och-midnight/60 border border-och-steel/20 text-center">
            <Target className="w-16 h-16 text-och-steel/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Missions Found</h3>
            <p className="text-och-steel">Try adjusting your filters or check back later</p>
          </Card>
        ) : (
          <>
            <MissionsGridView
              missions={missions}
              onMissionClick={handleMissionClick}
              loading={loading}
            />

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-sm text-och-steel">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} missions
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    disabled={!pagination.hasPrevious || loading}
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.ceil(pagination.total / pagination.pageSize))]
                      .slice(
                        Math.max(0, pagination.page - 3),
                        Math.min(
                          Math.ceil(pagination.total / pagination.pageSize),
                          pagination.page + 2
                        )
                      )
                      .map((_, idx) => {
                        const pageNum = idx + Math.max(1, pagination.page - 2)
                        return (
                          <button
                            key={pageNum}
                            onClick={() =>
                              setPagination(prev => ({ ...prev, page: pageNum }))
                            }
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              pageNum === pagination.page
                                ? 'bg-och-defender text-white'
                                : 'bg-och-midnight border border-och-steel/20 text-och-steel hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                  </div>

                  <Button
                    disabled={!pagination.hasNext || loading}
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
