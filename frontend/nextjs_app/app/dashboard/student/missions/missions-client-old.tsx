'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { missionsClient, MissionTemplate } from '@/services/missionsClient'
import { getMissionLockState, type UserTrackInfo } from '@/utils/missionLocking'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import {
  Loader2,
  Target,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Award,
  Rocket,
  Play,
  CheckCircle2,
  Lock
} from 'lucide-react'
import { MissionsGridView } from './components/MissionsGridView'
import { MissionsTableView } from './components/MissionsTableView'

interface Mission {
  id: string
  code: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  type?: string
  estimated_time_minutes?: number
  competency_tags?: string[]
  track_key?: string
  track?: string
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
  is_locked?: boolean
  lock_reason?: string | null
  lock_message?: string
}

interface MissionsResponse {
  results?: Mission[]
  count?: number
  total?: number
  page?: number
  page_size?: number
  has_next?: boolean
  has_previous?: boolean
}

export default function MissionsClient() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [directorMissions, setDirectorMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDirectorMissions, setLoadingDirectorMissions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentTrack, setStudentTrack] = useState<string | undefined>()
  const [studentDifficulty, setStudentDifficulty] = useState<string>('beginner')
  const [profileLoading, setProfileLoading] = useState(true)
  const [userTrackInfo, setUserTrackInfo] = useState<UserTrackInfo>({})
  const [filters, setFilters] = useState({
    status: 'all',
    difficulty: 'all',
    track: 'all',
    search: '',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    has_next: false,
    has_previous: false,
  })

  // Load initial data when authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (authLoading || !isAuthenticated) return

    const initializeData = async () => {
      await loadStudentInfo()
      await loadMissions()
    }
    
    initializeData()
  }, [isAuthenticated, authLoading])

  // Load missions when filters change (reset to page 1)
  useEffect(() => {
    // Skip if not authenticated or initial load
    if (!isAuthenticated || authLoading) return
    
    // Reset page and reload
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      loadMissions()
    }
  }, [filters.status, filters.difficulty, filters.track, filters.search])

  // Load missions when page changes (pagination)
  useEffect(() => {
    if (!authLoading && isAuthenticated && pagination.page > 1) {
      loadMissions()
    }
  }, [pagination.page])

  const loadStudentInfo = async () => {
    setProfileLoading(true)
    try {
      // Get student's enrollment to determine track
      const profileResponse = await apiGateway.get<any>('/student/profile')
      if (profileResponse?.enrollment?.track_key) {
        setStudentTrack(profileResponse.enrollment.track_key)
        setUserTrackInfo({
          track_key: profileResponse.enrollment.track_key,
          track_name: profileResponse.enrollment.track_name,
          enrollment_status: 'enrolled',
          profile_complete: true
        })
      } else {
        // User hasn't selected a track yet
        setUserTrackInfo({
          track_key: undefined,
          enrollment_status: 'not_enrolled',
          profile_complete: false
        })
      }
      
      // Get student's current difficulty level
      const progressResponse = await apiGateway.get<any>('/student/curriculum/progress')
      if (progressResponse?.current_difficulty) {
        setStudentDifficulty(progressResponse.current_difficulty)
      }
    } catch (err) {
      console.error('Failed to load student info:', err)
      // Default to beginner if we can't fetch
      setStudentDifficulty('beginner')
      setUserTrackInfo({
        track_key: undefined,
        enrollment_status: 'not_enrolled',
        profile_complete: false
      })
    } finally {
      setProfileLoading(false)
    }
  }

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

      console.log('[MissionsClient] ========== LOADING MISSIONS ==========')
      console.log('[MissionsClient] Authenticated:', isAuthenticated)
      console.log('[MissionsClient] User:', user?.username || 'unknown')
      console.log('[MissionsClient] Params:', params)
      console.log('[MissionsClient] Calling API: /student/missions')
      console.log('[MissionsClient] Full URL will be: http://localhost:8000/api/v1/student/missions')
      
      const response = await apiGateway.get<MissionsResponse>('/student/missions', { params })
      
      console.log('[MissionsClient] ✅ SUCCESS - API Response received')
      console.log('[MissionsClient] RAW Response:', response)
      console.log('[MissionsClient] Response type:', typeof response)
      console.log('[MissionsClient] Response keys:', Object.keys(response || {}))
      console.log('[MissionsClient] Response structure:', {
        results: response.results?.length || 0,
        total: response.total || response.count || 0,
        page: response.page,
        has_next: response.has_next
      })

      if (!response.results || response.results.length === 0) {
        console.warn('[MissionsClient] ⚠️ API returned empty results')
        console.warn('[MissionsClient] Full response object:', JSON.stringify(response, null, 2))
      }

      setMissions(response.results || [])
      setPagination({
        page: response.page || 1,
        page_size: response.page_size || 20,
        total: response.total || response.count || 0,
        has_next: response.has_next || false,
        has_previous: response.has_previous || false,
      })
      console.log('[MissionsClient] ========== MISSIONS LOADED ==========')
    } catch (err: any) {
      console.error('[MissionsClient] ❌ FAILED - API Error')
      console.error('[MissionsClient] Error message:', err?.message)
      console.error('[MissionsClient] Status:', err?.response?.status)
      console.error('[MissionsClient] Data:', err?.response?.data)
      console.error('[MissionsClient] Full error:', err)
      
      // More user-friendly error messages
      let userMessage = 'Failed to load missions.'
      if (err?.response?.status === 401) {
        userMessage = 'Authentication failed. Please log in again.'
      } else if (err?.response?.status === 403) {
        const errorData = err?.response?.data
        if (errorData?.upgrade_required) {
          userMessage = 'Upgrade your subscription to access missions.'
        } else {
          userMessage = 'You do not have permission to access missions.'
        }
      } else if (err?.response?.status === 404) {
        userMessage = 'Missions endpoint not found.'
      } else if (err?.message?.includes('fetch')) {
        userMessage = 'Network error. Please check your connection.'
      }
      
      setError(userMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadDirectorMissions = async () => {
    setLoadingDirectorMissions(true)
    try {
      // Fetch director-defined missions that are published/approved
      const params: any = {
        status: 'published', // Only show published missions to students
        page_size: 1000, // Get all published missions
      }

      // Apply filters if they match director mission fields
      if (filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty
      }
      if (filters.track !== 'all') {
        params.track_key = filters.track
      }
      if (filters.search) {
        params.search = filters.search
      }

      const response = await missionsClient.getAllMissions(params)
      
      // Convert MissionTemplate to Mission format for consistency
      const convertedMissions: Mission[] = (response.results || []).map((template: MissionTemplate) => {
        const missionTrack = template.track_key || template.track_id || ''
        const lockState = getMissionLockState(
          {
            id: template.id || '',
            code: template.code,
            title: template.title,
            track_key: missionTrack
          },
          userTrackInfo,
          profileLoading
        )

        return {
          id: template.id || '',
          code: template.code,
          title: template.title,
          description: template.description || '',
          difficulty: template.difficulty,
          type: template.type,
          track_key: missionTrack,
          estimated_time_minutes: template.estimated_time_minutes || (template.est_hours ? (template.est_hours * 60) : undefined),
          competency_tags: template.competencies || [],
          status: 'not_started', // Director missions are always "not_started" for students until they begin
          progress_percent: 0,
          // Lock state from utils
          is_locked: lockState.is_locked,
          lock_reason: lockState.lock_reason,
          lock_message: lockState.lock_message
        }
      })

      setDirectorMissions(convertedMissions)
    } catch (err: any) {
      console.error('Failed to load director missions:', err)
      // Don't set error state - just log it, as student missions might still work
      setDirectorMissions([])
    } finally {
      setLoadingDirectorMissions(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'not_started') {
      return <Badge variant="steel">Not Started</Badge>
    }

    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge variant="mint">Approved</Badge>
      case 'in_ai_review':
        return <Badge variant="defender">AI Review</Badge>
      case 'in_mentor_review':
        return <Badge variant="orange">Mentor Review</Badge>
      case 'submitted':
        return <Badge variant="steel">Submitted</Badge>
      case 'in_progress':
      case 'draft':
        return <Badge variant="defender">In Progress</Badge>
      case 'changes_requested':
      case 'failed':
        return <Badge variant="orange">Changes Requested</Badge>
      default:
        return <Badge variant="steel">{status}</Badge>
    }
  }

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return { 
          color: 'och-mint', 
          colorClass: 'text-och-mint', 
          bgClass: 'bg-och-mint/20', 
          borderClass: 'border-och-mint/40',
          icon: Shield, 
          label: 'Beginner' 
        }
      case 'intermediate':
        return { 
          color: 'och-defender', 
          colorClass: 'text-och-defender', 
          bgClass: 'bg-och-defender/20', 
          borderClass: 'border-och-defender/40',
          icon: Target, 
          label: 'Intermediate' 
        }
      case 'advanced':
        return { 
          color: 'och-orange', 
          colorClass: 'text-och-orange', 
          bgClass: 'bg-och-orange/20', 
          borderClass: 'border-och-orange/40',
          icon: Zap, 
          label: 'Advanced' 
        }
      case 'capstone':
        return { 
          color: 'och-gold', 
          colorClass: 'text-och-gold', 
          bgClass: 'bg-och-gold/20', 
          borderClass: 'border-och-gold/40',
          icon: Award, 
          label: 'Capstone' 
        }
      default:
        return { 
          color: 'och-steel', 
          colorClass: 'text-och-steel', 
          bgClass: 'bg-och-steel/20', 
          borderClass: 'border-och-steel/40',
          icon: Shield, 
          label: difficulty 
        }
    }
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Merge student missions and director missions
  const allMissions = useMemo(() => {
    console.log('[MissionsClient] Computing allMissions...')
    console.log('[MissionsClient] Student missions:', missions.length)
    console.log('[MissionsClient] Director missions:', directorMissions.length)
    
    // Use missions from /student/missions endpoint (which includes all available missions)
    // directorMissions is no longer used but kept for backwards compatibility
    const combined = missions.length > 0 ? missions : [...missions, ...directorMissions]
    console.log('[MissionsClient] Combined missions:', combined.length)
    
    // Remove duplicates based on mission ID or code
    const uniqueMissions = combined.filter((mission, index, self) =>
      index === self.findIndex((m) => m.id === mission.id || (m.code && m.code === mission.code))
    )
    console.log('[MissionsClient] Unique missions after dedup:', uniqueMissions.length)
    
    // Apply status filter if needed (director missions are always 'not_started')
    if (filters.status !== 'all') {
      const filtered = uniqueMissions.filter(m => {
        if (filters.status === 'not_started') {
          return m.status === 'not_started' || !m.status
        }
        return m.status === filters.status
      })
      console.log('[MissionsClient] After status filter:', filtered.length)
      return filtered
    }
    
    console.log('[MissionsClient] Final missions to display:', uniqueMissions.length)
    return uniqueMissions
  }, [missions, directorMissions, filters.status])

  const handleMissionClick = (missionId: string) => {
    router.push(`/dashboard/student/missions/${missionId}`)
  }

  if (loading && missions.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center p-4">
        <Card className="p-12 bg-och-midnight/90 border border-och-gold/30 rounded-3xl max-w-md w-full">
          <div className="text-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto"
            >
              <Target className="w-16 h-16 text-och-gold" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Loading Missions
              </h2>
              <p className="text-sm text-och-steel font-medium">
                Fetching available missions from the backend
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center p-4">
        <Card className="p-12 bg-och-midnight/90 border border-och-defender/40 rounded-3xl max-w-2xl w-full">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-och-defender/10 flex items-center justify-center mx-auto border-2 border-och-defender/30">
              <AlertTriangle className="w-12 h-12 text-och-defender" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Failed to Load Missions</h1>
              <p className="text-base text-och-steel leading-relaxed">{error}</p>
            </div>
            <Button
              onClick={loadMissions}
              variant="defender"
              className="font-black uppercase tracking-widest text-sm"
              glow
            >
              <Rocket className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950">
      {/* Compact Hero Section */}
      <section className="w-full relative overflow-hidden border-b border-och-steel/10">
        <div className="absolute inset-0 bg-gradient-to-r from-och-gold/5 via-och-mint/5 to-och-defender/5" />
        <div className="relative w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4 sm:gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-och-defender to-och-orange shadow-lg shadow-och-defender/20"
            >
              <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                Mission <span className="text-och-gold">Control</span>
              </h1>
              <p className="text-xs sm:text-sm text-och-steel font-medium mt-1">
                Practical challenges. Industry-ready competence.
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-sm sm:text-base font-bold text-och-gold">{allMissions.length}</p>
              <p className="text-xs text-och-steel">Missions</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar - Horizontal and Compact */}
      <section className="w-full bg-och-midnight/40 border-b border-och-steel/10 overflow-x-auto">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4 sm:gap-6 min-w-min sm:min-w-full">
            {/* Total */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30"
            >
              <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="whitespace-nowrap">
                <p className="text-xs text-blue-300">Total</p>
                <p className="text-sm font-bold text-blue-400">{allMissions.length}</p>
              </div>
            </motion.div>

            {/* Available */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
            >
              <Play className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="whitespace-nowrap">
                <p className="text-xs text-emerald-300">Available</p>
                <p className="text-sm font-bold text-emerald-400">
                  {allMissions.filter(m => !m.is_locked).length}
                </p>
              </div>
            </motion.div>

            {/* Completed */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30"
            >
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div className="whitespace-nowrap">
                <p className="text-xs text-green-300">Completed</p>
                <p className="text-sm font-bold text-green-400">
                  {allMissions.filter(m => m.status === 'completed').length}
                </p>
              </div>
            </motion.div>

            {/* Locked */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/10 border border-gray-500/30"
            >
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="whitespace-nowrap">
                <p className="text-xs text-gray-300">Locked</p>
                <p className="text-sm font-bold text-gray-400">
                  {allMissions.filter(m => m.is_locked).length}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Compact Horizontal Filters */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-och-steel/10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 sm:gap-4"
        >
          {/* Search */}
          <div className="flex-1 min-w-[200px] sm:min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-och-steel" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value })
                  setPagination({ ...pagination, page: 1 })
                }}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => {
              setFilters({ ...filters, difficulty: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
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
            onChange={(e) => {
              setFilters({ ...filters, track: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            className="px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
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
              onClick={() => {
                setFilters({
                  status: 'all',
                  difficulty: 'all',
                  track: 'all',
                  search: '',
                })
                setPagination({ ...pagination, page: 1 })
              }}
              className="px-3 py-2 text-xs font-semibold text-och-gold hover:text-och-gold/80 transition-colors"
            >
              Reset
            </button>
          )}

          {/* View Toggle */}
          <div className="ml-auto flex items-center gap-2 bg-och-midnight/60 rounded-lg p-1 border border-och-steel/20">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-och-defender text-white'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-och-defender text-white'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              ≡
            </button>
          </div>
        </motion.div>
      </section>

      {/* Main Content - Full Width */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Missions View */}
        {loading && missions.length === 0 ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Target className="w-12 h-12 text-och-gold mx-auto" />
              </motion.div>
              <p className="text-och-steel font-medium">Loading missions...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-8 bg-och-defender/10 border border-och-defender/30 rounded-2xl">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-och-defender flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Failed to Load Missions</h3>
                <p className="text-och-steel text-sm">{error}</p>
              </div>
              <Button
                onClick={loadMissions}
                variant="defender"
                className="text-sm"
              >
                Retry
              </Button>
            </div>
          </Card>
        ) : allMissions.length === 0 ? (
          <Card className="p-12 bg-och-midnight/60 border border-och-steel/20 rounded-2xl text-center">
            <Target className="w-16 h-16 text-och-steel/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Missions Found</h3>
            <p className="text-och-steel">Try adjusting your filters or check back later</p>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <MissionsGridView
                missions={allMissions}
                onMissionClick={handleMissionClick}
                loading={loading || loadingDirectorMissions}
              />
            ) : (
              <MissionsTableView
                missions={allMissions}
                loading={loading || loadingDirectorMissions}
                pagination={pagination}
                onPageChange={(page) => setPagination({ ...pagination, page })}
                studentTrack={studentTrack}
                studentDifficulty={studentDifficulty}
              />
            )}
            
            {/* Pagination Controls */}
            {pagination.total > pagination.page_size && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-och-steel">
                  Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} missions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={!pagination.has_previous || loading}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.page_size)) }, (_, i) => {
                      const pageNum = i + 1
                      const totalPages = Math.ceil(pagination.total / pagination.page_size)
                      
                      // Show first 3, current page neighbors, and last page
                      if (
                        pageNum <= 3 ||
                        pageNum === totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination({ ...pagination, page: pageNum })}
                            disabled={loading}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              pagination.page === pageNum
                                ? 'bg-och-defender text-white'
                                : 'text-och-steel hover:text-white hover:bg-och-steel/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      } else if (pageNum === 4 || pageNum === totalPages - 1) {
                        return <span key={pageNum} className="text-och-steel px-1">...</span>
                      }
                      return null
                    })}
                  </div>
                  <Button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={!pagination.has_next || loading}
                    variant="outline"
                    size="sm"
                  >
                    Next
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
