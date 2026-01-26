'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiGateway } from '@/services/apiGateway'
// No authentication required - completely free access
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

// Mock missions data for demonstration when not authenticated
const MOCK_MISSIONS: Mission[] = [
  {
    id: 'mock-1',
    code: 'LOG-001',
    title: 'SIEM Log Analysis Challenge',
    description: 'Analyze suspicious login patterns in SIEM logs. Identify potential brute force attacks and unauthorized access attempts.',
    difficulty: 'beginner',
    estimated_duration_minutes: 45,
    competency_tags: ['log_analysis', 'siem', 'threat_detection'],
    track_key: 'defender',
    status: 'available',
    type: 'challenge',
    ai_score: 85,
    is_locked: false
  },
  {
    id: 'mock-2',
    code: 'NET-002',
    title: 'Network Traffic Investigation',
    description: 'Examine network packet captures to identify malicious traffic patterns and potential data exfiltration.',
    difficulty: 'intermediate',
    estimated_duration_minutes: 60,
    competency_tags: ['network_security', 'packet_analysis', 'forensics'],
    track_key: 'defender',
    status: 'available',
    type: 'investigation',
    ai_score: 92,
    is_locked: false
  },
  {
    id: 'mock-3',
    code: 'WEB-003',
    title: 'Web Application Vulnerability Assessment',
    description: 'Perform security testing on a vulnerable web application to identify and exploit common vulnerabilities.',
    difficulty: 'intermediate',
    estimated_duration_minutes: 75,
    competency_tags: ['web_security', 'penetration_testing', 'vulnerability_assessment'],
    track_key: 'offensive',
    status: 'available',
    type: 'assessment',
    ai_score: 78,
    is_locked: false
  },
  {
    id: 'mock-4',
    code: 'CLOUD-004',
    title: 'Cloud Security Configuration Review',
    description: 'Review and harden cloud infrastructure configurations to prevent common misconfigurations and security gaps.',
    difficulty: 'advanced',
    estimated_duration_minutes: 90,
    competency_tags: ['cloud_security', 'configuration_management', 'compliance'],
    track_key: 'grc',
    status: 'available',
    type: 'review',
    ai_score: 88,
    is_locked: false
  },
  {
    id: 'mock-5',
    code: 'MALWARE-005',
    title: 'Malware Analysis Deep Dive',
    description: 'Analyze a sophisticated malware sample to understand its behavior, persistence mechanisms, and communication patterns.',
    difficulty: 'advanced',
    estimated_duration_minutes: 120,
    competency_tags: ['malware_analysis', 'reverse_engineering', 'threat_intelligence'],
    track_key: 'defender',
    status: 'available',
    type: 'analysis',
    ai_score: 95,
    is_locked: false
  },
  {
    id: 'mock-6',
    code: 'SOC-006',
    title: 'SOC Team Leadership Simulation',
    description: 'Lead a simulated SOC team through a complex cyber incident response, making critical decisions under pressure.',
    difficulty: 'capstone',
    estimated_duration_minutes: 180,
    competency_tags: ['incident_response', 'leadership', 'team_management'],
    track_key: 'leadership',
    status: 'available',
    type: 'simulation',
    ai_score: 98,
    is_locked: false
  }
]

export default function MissionsClient() {
  const router = useRouter()
  // No authentication required - load mock data immediately

  // State management
  const [missions, setMissions] = useState<Mission[]>([])
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
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

  // No authentication check needed - routes are open

  // Load mock data immediately (no authentication required)
  useEffect(() => {
    // Load mock missions immediately
    setMissions(MOCK_MISSIONS)
    setPagination(prev => ({
      ...prev,
      total: MOCK_MISSIONS.length,
      hasNext: false,
      hasPrevious: false
    }))

    // Set mock student profile
    setStudentProfile({
      tier: 1,
      current_track: 'defender',
      skill_level: 'beginner',
      total_missions_completed: 0,
      current_streak: 0
    })
    setProfileLoading(false)
  }, [])

  // Handle filters change (reset to page 1)
  useEffect(() => {
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [filters.status, filters.difficulty, filters.track, filters.search])

  // Apply filters to mock data when page or filters change
  useEffect(() => {
    applyFilters()
  }, [pagination.page, filters])

  const applyFilters = () => {
    setLoading(true)
    setError(null)

    try {
      let filteredMissions = [...MOCK_MISSIONS]

      // Apply filters
      if (filters.status !== 'all') {
        filteredMissions = filteredMissions.filter(mission => mission.status === filters.status)
      }
      if (filters.difficulty !== 'all') {
        filteredMissions = filteredMissions.filter(mission => mission.difficulty === filters.difficulty)
      }
      if (filters.track !== 'all') {
        filteredMissions = filteredMissions.filter(mission => mission.track_key === filters.track)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredMissions = filteredMissions.filter(mission =>
          mission.title.toLowerCase().includes(searchLower) ||
          mission.description.toLowerCase().includes(searchLower) ||
          mission.code.toLowerCase().includes(searchLower)
        )
      }

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize
      const paginatedMissions = filteredMissions.slice(startIndex, endIndex)

      setMissions(paginatedMissions)
      setPagination(prev => ({
        ...prev,
        total: filteredMissions.length,
        hasNext: endIndex < filteredMissions.length,
        hasPrevious: pagination.page > 1,
      }))

      // Show a friendly message
      setError('Viewing sample missions. Sign in to access your personalized mission feed and submit real challenges.')

    } catch (err: any) {
      console.error('[MissionsClient] Error applying filters:', err)
      setError('Failed to filter missions. Please try again.')
      setMissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleMissionClick = (missionId: string) => {
    // Check if this is a mock mission (starts with 'mock-')
    if (missionId.startsWith('mock-')) {
      setError('This is a sample mission. Sign in to access real missions and challenges.')
      return
    }

    // Navigate to real mission detail page
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

  // No authentication loading state needed - data loads immediately

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
              onClick={applyFilters}
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
      {/* TIER 7: Enhanced Hero Section with Student Profile */}
      <section className="w-full border-b border-och-steel/10 bg-gradient-to-r from-och-gold/10 via-och-defender/10 to-och-mint/10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Main Title Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-och-defender to-och-orange shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Mission <span className="text-och-gold">Control</span>
                  </h1>
                  <p className="text-och-steel text-sm mt-1">
                    Tier 7 Mission Engine • Track-Based Learning Paths
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-och-gold">{pagination.total}</p>
                <p className="text-och-steel text-sm">Missions</p>
              </div>
            </div>

            {/* Student Progress Summary */}
            {!profileLoading && studentProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                <div className="px-4 py-3 rounded-lg bg-och-midnight/60 border border-och-steel/20">
                  <p className="text-xs text-och-steel mb-1">Current Tier</p>
                  <p className="text-2xl font-bold text-och-gold">
                    {studentProfile.tier || 'N/A'}
                  </p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-och-midnight/60 border border-och-steel/20">
                  <p className="text-xs text-och-steel mb-1">Track</p>
                  <p className="text-lg font-bold text-och-mint truncate">
                    {studentProfile.current_track || 'Unassigned'}
                  </p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-och-midnight/60 border border-och-steel/20">
                  <p className="text-xs text-och-steel mb-1">Completed</p>
                  <p className="text-2xl font-bold text-och-defender">
                    {studentProfile.total_missions_completed || 0}
                  </p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-och-midnight/60 border border-och-steel/20">
                  <p className="text-xs text-och-steel mb-1">Streak</p>
                  <div className="flex items-center gap-1">
                    <Flame className="w-5 h-5 text-och-orange" />
                    <p className="text-2xl font-bold text-och-orange">
                      {studentProfile.current_streak || 0}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* TIER 7: Advanced Stats Bar */}
      <section className="w-full bg-och-midnight/40 border-b border-och-steel/10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30"
            >
              <Play className="w-5 h-5 text-blue-400" />
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
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-yellow-300">In Progress</p>
                <p className="text-lg font-bold text-yellow-400">{missions.filter(m => m.status === 'in_progress').length}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30"
            >
              <Award className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-purple-300">Locked</p>
                <p className="text-lg font-bold text-purple-400">{missions.filter(m => m.is_locked).length}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TIER 7: Advanced Filters Section */}
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

            {/* TIER 7: Advanced Pagination */}
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
