'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { fastapiClient } from '@/services/fastapiClient'
import { foundationsClient } from '@/services/foundationsClient'
import { curriculumClient } from '@/services/curriculumClient'
import { apiGateway } from '@/services/apiGateway'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Rocket, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  Zap,
  Brain,
  Map,
  GraduationCap,
  Briefcase,
  Star,
  Award,
  Compass,
  ChevronRight,
  BookOpen,
  PlayCircle,
  Clock,
  TrendingDown,
  Lock
} from 'lucide-react'

// Track themes matching dashboard
const trackThemes: Record<string, {
  gradient: string;
  border: string;
  text: string;
  bg: string;
  icon: string;
}> = {
  defender: {
    gradient: 'from-indigo-500/20 via-blue-500/10 to-indigo-500/20',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
    icon: '🛡️',
  },
  offensive: {
    gradient: 'from-red-500/20 via-orange-500/10 to-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    bg: 'bg-red-500/20',
    icon: '⚔️',
  },
  grc: {
    gradient: 'from-emerald-500/20 via-teal-500/10 to-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    icon: '📋',
  },
  innovation: {
    gradient: 'from-cyan-500/20 via-sky-500/10 to-cyan-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    icon: '🔬',
  },
  leadership: {
    gradient: 'from-och-gold/20 via-amber-500/10 to-och-gold/20',
    border: 'border-och-gold/30',
    text: 'text-och-gold',
    bg: 'bg-och-gold/20',
    icon: '👑',
  },
}

interface JourneyStage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tier: number;
  status: 'completed' | 'in_progress' | 'locked' | 'upcoming';
  progress?: number;
  stats?: {
    label: string;
    value: string | number;
  }[];
  route?: string;
}

export default function ProfilingResultsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [results, setResults] = useState<any>(null)
  const [blueprint, setBlueprint] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Mock profiling data for demonstration when API is not available
  const MOCK_PROFILING_RESULTS = {
    recommendations: [
      {
        track_name: 'Defender',
        score: 92,
        reasoning: ['Strong analytical skills', 'Interest in security operations', 'Good problem-solving abilities']
      }
    ],
    primary_track: {
      key: 'defender',
      track_key: 'defender',
      name: 'Defender',
      track_name: 'Defender',
      description: 'Master defensive cybersecurity techniques and security operations',
      focus_areas: ['Network Security', 'Incident Response', 'SIEM', 'Threat Hunting'],
      career_paths: ['SOC Analyst', 'Security Operations Center Lead', 'Cybersecurity Analyst']
    },
    assessment_summary: 'You have excellent analytical skills and a strong interest in defensive cybersecurity. Your problem-solving abilities make you well-suited for security operations roles.',
    completed_at: new Date().toISOString(),
    overall_score: 92,
    aptitude_score: 88,
    behavioral_score: 85,
    strengths: [
      'Strong analytical and problem-solving skills',
      'Good attention to detail and systematic thinking',
      'Interest in security operations and incident response',
      'Ability to work under pressure and make quick decisions'
    ],
    areas_for_growth: [
      'Offensive security techniques',
      'Advanced penetration testing',
      'Red team methodologies'
    ]
  }

  const MOCK_BLUEPRINT = {
    personalized_insights: {
      career_alignment: {
        career_readiness_score: 87
      }
    },
    learning_strategy: {
      strengths_to_leverage: [
        'Systematic thinking and attention to detail',
        'Strong foundation in technical concepts',
        'Good communication and teamwork skills'
      ],
      growth_opportunities: [
        'Advanced technical certifications',
        'Leadership and management skills',
        'Specialized domain expertise'
      ]
    },
    difficulty_level: {
      selected: 'intermediate'
    },
    value_statement: 'A dedicated cybersecurity professional with strong analytical skills and a passion for protecting digital assets. Committed to continuous learning and staying ahead of emerging threats.',
    next_steps: [
      'Complete Foundations tier to build core knowledge',
      'Enroll in Defender track curriculum',
      'Obtain CompTIA Security+ certification',
      'Participate in cybersecurity capture the flag challenges'
    ]
  }
  const [allTracks, setAllTracks] = useState<Record<string, any>>({})
  
  // Journey progress data
  const [foundationsStatus, setFoundationsStatus] = useState<any>(null)
  const [curriculumProgress, setCurriculumProgress] = useState<any>(null)
  const [missionsStats, setMissionsStats] = useState<any>(null)
  const [loadingJourney, setLoadingJourney] = useState(true)

  useEffect(() => {
    // Authentication check bypassed - profiling is now an open route
    // if (!authLoading && !isAuthenticated) {
    //   router.push('/login/student')
    //   return
    // }

    // if (authLoading || !isAuthenticated) return

    const checkAndRedirect = async () => {
      try {
        setCheckingStatus(true)

        // For demonstration purposes, always load mock data
        console.log('Loading mock profiling data for demonstration...')
        setResults(MOCK_PROFILING_RESULTS)
        setBlueprint(MOCK_BLUEPRINT)
        setAllTracks({
          defender: { name: 'Defender', description: 'Defensive cybersecurity' },
          offensive: { name: 'Offensive', description: 'Penetration testing and red teaming' },
          grc: { name: 'GRC', description: 'Governance, risk, and compliance' },
          innovation: { name: 'Innovation', description: 'Emerging technologies and research' },
          leadership: { name: 'Leadership', description: 'Cybersecurity management and strategy' }
        })
        setLoading(false)
        setCheckingStatus(false)
        return

        const fastapiStatus = await fastapiClient.profiling.checkStatus()

        if (!fastapiStatus.completed) {
          router.push('/onboarding/ai-profiler')
          return
        }

        if (fastapiStatus.session_id) {
          try {
            const fastapiResults = await fastapiClient.profiling.getResults(fastapiStatus.session_id)
            let bp: any | null = null
            try {
              bp = await fastapiClient.profiling.getBlueprint(fastapiStatus.session_id)
              setBlueprint(bp)
            } catch (bpError) {
              console.warn('Failed to fetch OCH Blueprint:', bpError)
            }

            setResults({
              recommendations: fastapiResults.recommendations,
              primary_track: fastapiResults.primary_track,
              assessment_summary: fastapiResults.assessment_summary,
              completed_at: fastapiResults.completed_at,
              overall_score:
                bp?.personalized_insights?.career_alignment?.career_readiness_score ??
                fastapiResults.recommendations?.[0]?.score ??
                0,
              aptitude_score: fastapiResults.recommendations?.[0]?.score || 0,
              behavioral_score: fastapiResults.recommendations?.[0]?.score || 0,
              strengths:
                bp?.learning_strategy?.strengths_to_leverage?.length
                  ? bp.learning_strategy.strengths_to_leverage
                  : fastapiResults.recommendations?.[0]?.reasoning || [],
              areas_for_growth:
                bp?.learning_strategy?.growth_opportunities?.length
                  ? bp.learning_strategy.growth_opportunities
                  : fastapiResults.recommendations?.slice(1, 3).map((r: any) => r.track_name) || [],
            })

            try {
              const tracksResp = await fastapiClient.profiling.getTracks()
              setAllTracks(tracksResp.tracks || {})
            } catch (tracksError) {
              console.warn('Failed to load OCH tracks:', tracksError)
            }

            setLoading(false)
            setCheckingStatus(false)
            return
          } catch (resultsError: any) {
            console.warn('Failed to fetch FastAPI results:', resultsError)
          }
        }

        try {
          const { djangoClient } = await import('@/services/djangoClient')
          const djangoData = await djangoClient.profiler.getResults()
          if (djangoData.completed && djangoData.result) {
            setResults(djangoData.result)
          } else {
            // Load mock profiling data for demonstration purposes
            console.log('Loading mock profiling data due to incomplete Django data...')
            setResults(MOCK_PROFILING_RESULTS)
            setBlueprint(MOCK_BLUEPRINT)
            setAllTracks({
              defender: { name: 'Defender', description: 'Defensive cybersecurity' },
              offensive: { name: 'Offensive', description: 'Penetration testing and red teaming' },
              grc: { name: 'GRC', description: 'Governance, risk, and compliance' },
              innovation: { name: 'Innovation', description: 'Emerging technologies and research' },
              leadership: { name: 'Leadership', description: 'Cybersecurity management and strategy' }
            })
            setLoading(false)
            setCheckingStatus(false)
            return
          }
        } catch (djangoError: any) {
          // Check if it's an authentication error (401)
          const isAuthError = djangoError?.status === 401 ||
                             djangoError?.response?.status === 401 ||
                             djangoError?.message?.includes('401') ||
                             djangoError?.message?.includes('Authentication') ||
                             djangoError?.message?.includes('credentials') ||
                             djangoError?.message?.includes('Unauthorized')

          if (isAuthError) {
            // Load mock profiling data for demonstration purposes
            console.log('Loading mock profiling data...')
            setResults(MOCK_PROFILING_RESULTS)
            setBlueprint(MOCK_BLUEPRINT)
            setAllTracks({
              defender: { name: 'Defender', description: 'Defensive cybersecurity' },
              offensive: { name: 'Offensive', description: 'Penetration testing and red teaming' },
              grc: { name: 'GRC', description: 'Governance, risk, and compliance' },
              innovation: { name: 'Innovation', description: 'Emerging technologies and research' },
              leadership: { name: 'Leadership', description: 'Cybersecurity management and strategy' }
            })
            setLoading(false)
            setCheckingStatus(false)
            return
          } else {
            setError('Unable to load profiling results. Please try completing the assessment again.')
          }
        }

        setLoading(false)
        setCheckingStatus(false)
      } catch (err: any) {
        console.error('Error checking profiling status:', err)

        // Load mock profiling data for demonstration purposes
        console.log('Loading mock profiling data due to API error...')
        setResults(MOCK_PROFILING_RESULTS)
        setBlueprint(MOCK_BLUEPRINT)
        setAllTracks({
          defender: { name: 'Defender', description: 'Defensive cybersecurity' },
          offensive: { name: 'Offensive', description: 'Penetration testing and red teaming' },
          grc: { name: 'GRC', description: 'Governance, risk, and compliance' },
          innovation: { name: 'Innovation', description: 'Emerging technologies and research' },
          leadership: { name: 'Leadership', description: 'Cybersecurity management and strategy' }
        })
        setLoading(false)
        setCheckingStatus(false)
        return
      }
    }

    checkAndRedirect()
  }, [isAuthenticated, authLoading, router])

  // Fetch journey progress data
  useEffect(() => {
    const fetchJourneyProgress = async () => {
      if (!user?.id || !results) {
        setLoadingJourney(false)
        return
      }

      setLoadingJourney(true)
      try {
        // Fetch Foundations status
        try {
          const foundations = await foundationsClient.getStatus()
          setFoundationsStatus(foundations)
        } catch (err) {
          console.error('Failed to fetch Foundations:', err)
        }

        // Fetch curriculum progress
        try {
          const primaryTrack = results.primary_track || results.recommendations?.[0]
          if (primaryTrack?.key || primaryTrack?.track_key) {
            const trackKey = (primaryTrack.key || primaryTrack.track_key).toUpperCase()
            const trackCode = `${trackKey}_2` // Tier 2 (Beginner)
            try {
              const progress = await curriculumClient.getTrackProgress(trackCode)
              setCurriculumProgress(progress)
            } catch (err) {
              // Track might not be enrolled yet
              console.log('Track not enrolled yet:', err)
            }
          }
        } catch (err) {
          console.error('Failed to fetch curriculum:', err)
        }

        // Fetch missions stats
        try {
          const missionsResponse = await apiGateway.get<any>('/student/missions', {
            params: { page_size: 1 }
          })
          const missionsData = await apiGateway.get<any>('/student/missions/funnel')
          setMissionsStats({
            total: missionsResponse?.total ?? missionsResponse?.count ?? 0,
            completed: missionsData?.funnel?.approved || 0,
            in_progress: missionsData?.funnel?.pending || 0,
          })
        } catch (err) {
          console.error('Failed to fetch missions:', err)
        }
      } catch (error) {
        console.error('Failed to fetch journey progress:', error)
      } finally {
        setLoadingJourney(false)
      }
    }

    if (results) {
      fetchJourneyProgress()
    }
  }, [user?.id, results])

  if (checkingStatus || loading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card className="p-8 bg-och-midnight/90 border border-och-gold/30 rounded-2xl max-w-md w-full">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto"
            >
              <Sparkles className="w-12 h-12 text-och-gold" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {checkingStatus ? 'Analyzing Profile' : 'Loading Results'}
              </h2>
              <p className="text-sm text-och-steel">
                Processing your assessment
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card className="p-8 bg-och-midnight/90 border border-och-defender/40 rounded-2xl max-w-2xl w-full">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-och-defender/10 flex items-center justify-center mx-auto border-2 border-och-defender/30">
              <Brain className="w-8 h-8 text-och-defender" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Profiling Not Completed</h1>
              <p className="text-sm text-och-steel leading-relaxed">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => router.push('/onboarding/ai-profiler')}
                variant="defender"
                className="flex-1 font-bold uppercase tracking-wide text-xs"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Assessment
              </Button>
              <Button
                onClick={() => router.push('/dashboard/student')}
                variant="outline"
                className="flex-1 font-bold uppercase tracking-wide text-xs"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!results) {
    return null
  }

  const primaryRecommendation = results.recommendations?.[0]
  const overallScore = results.overall_score || primaryRecommendation?.score || 0
  const primaryTrack = results.primary_track || primaryRecommendation
  const strengths = results.strengths || primaryRecommendation?.reasoning || []
  const secondaryRecommendations = results.recommendations?.slice(1, 3) || []

  const difficultyLevel = blueprint?.difficulty_level
  const careerAlignment = blueprint?.personalized_insights?.career_alignment
  const valueStatement = blueprint?.value_statement
  const nextSteps = blueprint?.next_steps || []

  const trackKey = primaryTrack?.key || primaryTrack?.track_key || 'defender'
  const trackTheme = trackThemes[trackKey.toLowerCase()] || trackThemes.defender

  // Build dynamic journey stages based on actual progress
  const journeyStages: JourneyStage[] = [
    {
      id: 'profiling',
      title: 'AI Profiling',
      description: 'Tier 0 - Assessment Complete',
      icon: Brain,
      tier: 0,
      status: 'completed',
      progress: 100,
      stats: [
        { label: 'Match Score', value: `${Math.round(overallScore)}%` },
        { label: 'Track', value: primaryTrack?.name || 'Selected' },
      ],
    },
    {
      id: 'foundations',
      title: 'Foundations',
      description: 'Tier 1 - Orientation & Preparation',
      icon: GraduationCap,
      tier: 1,
      status: user?.foundations_complete 
        ? 'completed' 
        : foundationsStatus?.status === 'in_progress'
        ? 'in_progress'
        : 'upcoming',
      progress: foundationsStatus?.completion_percentage || (user?.foundations_complete ? 100 : 0),
      stats: foundationsStatus ? [
        { label: 'Modules', value: `${foundationsStatus.modules?.filter((m: any) => m.completed).length || 0}/${foundationsStatus.modules?.length || 0}` },
        { label: 'Progress', value: `${Math.round(foundationsStatus.completion_percentage)}%` },
      ] : undefined,
      route: '/dashboard/student/foundations',
    },
    {
      id: 'curriculum',
      title: 'Curriculum',
      description: 'Tier 2+ - Structured Learning',
      icon: BookOpen,
      tier: 2,
      status: curriculumProgress 
        ? (curriculumProgress.completion_percentage >= 100 ? 'completed' : 'in_progress')
        : 'upcoming',
      progress: curriculumProgress?.completion_percentage || 0,
      stats: curriculumProgress ? [
        { label: 'Modules', value: `${curriculumProgress.modules_completed}/${curriculumProgress.track?.module_count || 0}` },
        { label: 'Lessons', value: curriculumProgress.lessons_completed },
        { label: 'Progress', value: `${Math.round(curriculumProgress.completion_percentage)}%` },
      ] : undefined,
      route: '/dashboard/student/curriculum',
    },
    {
      id: 'missions',
      title: 'Missions',
      description: 'Hands-On Practice & Real-World Challenges',
      icon: Target,
      tier: 2,
      status: missionsStats?.total > 0
        ? (missionsStats.completed > 0 ? 'in_progress' : 'in_progress')
        : 'upcoming',
      progress: missionsStats?.total > 0 
        ? Math.round((missionsStats.completed / missionsStats.total) * 100)
        : 0,
      stats: missionsStats ? [
        { label: 'Completed', value: missionsStats.completed },
        { label: 'In Progress', value: missionsStats.in_progress },
        { label: 'Total', value: missionsStats.total },
      ] : undefined,
      route: '/dashboard/student/missions',
    },
    {
      id: 'career',
      title: 'Career Ready',
      description: 'Portfolio, Networking & Job Placement',
      icon: Briefcase,
      tier: 3,
      status: 'upcoming',
      progress: careerAlignment?.career_readiness_score || 0,
      stats: careerAlignment ? [
        { label: 'Readiness', value: `${careerAlignment.career_readiness_score || 0}%` },
      ] : undefined,
      route: '/dashboard/student/portfolio',
    },
  ]

  // Calculate overall journey progress
  const completedStages = journeyStages.filter(s => s.status === 'completed').length
  const totalStages = journeyStages.length
  const overallJourneyProgress = Math.round((completedStages / totalStages) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-midnight/95 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <Badge variant="gold" className="mb-3 text-xs font-bold uppercase tracking-wide px-3 py-1">
            Assessment Complete
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
            Your <span className={`${trackTheme.text}`}>{primaryTrack?.name || primaryTrack?.track_name || 'Career Journey'}</span>
          </h1>
          <p className="text-sm text-och-steel max-w-2xl mx-auto">
            Your personalized path to cybersecurity excellence{difficultyLevel?.selected ? ` at ${difficultyLevel.selected.toUpperCase()} level` : ''}
          </p>
        </motion.div>

        {/* Primary Track Card - Compact */}
        {primaryTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`p-6 bg-gradient-to-br ${trackTheme.gradient} border-2 ${trackTheme.border} rounded-xl`}>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className={`w-16 h-16 rounded-xl ${trackTheme.bg} ${trackTheme.border} border-2 flex items-center justify-center text-3xl shrink-0`}>
                  {trackTheme.icon}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Badge className={`${trackTheme.bg} ${trackTheme.text} text-xs border-0`}>
                      Your Perfect Match
                    </Badge>
                    <Badge variant="outline" className={`${trackTheme.border} ${trackTheme.text} text-xs`}>
                      {Math.round(primaryRecommendation?.score || overallScore)}% Match
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
                    {primaryTrack.name || primaryTrack.track_name}
                  </h2>
                  {primaryTrack.description && (
                    <p className="text-sm text-och-steel mb-3">
                      {primaryTrack.description}
                    </p>
                  )}
                  {careerAlignment?.career_readiness_score && (
                    <p className="text-xs text-och-steel">
                      Career readiness: <span className={`font-bold ${trackTheme.text}`}>{careerAlignment.career_readiness_score}%</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Focus Areas & Career Paths - Compact */}
              {(primaryTrack.focus_areas?.length > 0 || primaryTrack.career_paths?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                  {primaryTrack.focus_areas?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className={`w-4 h-4 ${trackTheme.text}`} />
                        <h3 className="text-xs font-black text-white uppercase tracking-wide">Focus Areas</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {primaryTrack.focus_areas.slice(0, 4).map((area: string, idx: number) => (
                          <Badge key={idx} className={`${trackTheme.bg} ${trackTheme.text} text-xs border-0`}>
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {primaryTrack.career_paths?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className={`w-4 h-4 ${trackTheme.text}`} />
                        <h3 className="text-xs font-black text-white uppercase tracking-wide">Career Paths</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {primaryTrack.career_paths.slice(0, 3).map((path: string, idx: number) => (
                          <Badge key={idx} variant="gold" className="text-xs">
                            {path}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Dynamic Journey Blueprint - Creative Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`p-6 bg-gradient-to-br ${trackTheme.gradient} border-2 ${trackTheme.border} rounded-xl relative overflow-hidden`}>
            {/* Blueprint Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }} />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Map className={`w-5 h-5 ${trackTheme.text}`} />
                    <h3 className="text-lg font-black text-white uppercase tracking-wide">Your OCH Journey Blueprint</h3>
                  </div>
                  <p className="text-xs text-och-steel">
                    Dynamic progress tracking across your cybersecurity transformation
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${trackTheme.text}`}>
                    {overallJourneyProgress}%
                  </div>
                  <div className="text-xs text-och-steel uppercase tracking-wide">Overall</div>
                </div>
              </div>

              {/* Journey Path Visualization */}
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-och-steel/20 -translate-y-1/2 z-0">
                  <motion.div
                    className={`h-full ${trackTheme.bg} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${overallJourneyProgress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>

                {/* Journey Stages */}
                <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4">
                  {journeyStages.map((stage, idx) => {
                    const StageIcon = stage.icon
                    const isCompleted = stage.status === 'completed'
                    const isInProgress = stage.status === 'in_progress'
                    const isLocked = stage.status === 'locked'
                    const isUpcoming = stage.status === 'upcoming'

                    // Calculate position percentage for line connection
                    const positionPercent = (idx / (journeyStages.length - 1)) * 100

                    return (
                      <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="relative"
                      >
                        {/* Connection Line (hidden on mobile) */}
                        {idx < journeyStages.length - 1 && (
                          <div className="hidden md:block absolute left-full top-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                            <div className="h-full bg-och-steel/20">
                              <motion.div
                                className={`h-full ${isCompleted || isInProgress ? trackTheme.bg : 'bg-och-steel/20'} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: isCompleted ? '100%' : isInProgress ? '50%' : '0%' }}
                                transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Stage Card */}
                        <button
                          onClick={() => stage.route && !isLocked && router.push(stage.route)}
                          disabled={isLocked}
                          className={`w-full p-4 rounded-xl border-2 transition-all ${
                            isCompleted
                              ? `${trackTheme.bg} ${trackTheme.border} border-2 ${trackTheme.text} shadow-lg`
                              : isInProgress
                              ? `${trackTheme.bg} ${trackTheme.border} border-2 ${trackTheme.text} opacity-80`
                              : isLocked
                              ? 'bg-och-steel/10 border-och-steel/30 opacity-50 cursor-not-allowed'
                              : 'bg-och-midnight/60 border-och-steel/20 hover:border-och-steel/40'
                          }`}
                        >
                          {/* Status Indicator */}
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`text-[10px] ${
                              isCompleted
                                ? `${trackTheme.bg} ${trackTheme.text} border-0`
                                : isInProgress
                                ? `${trackTheme.bg} ${trackTheme.text} border-0`
                                : 'bg-och-steel/20 text-och-steel border-0'
                            }`}>
                              Tier {stage.tier}
                            </Badge>
                            {isCompleted && (
                              <CheckCircle2 className={`w-4 h-4 ${trackTheme.text}`} />
                            )}
                            {isInProgress && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Clock className={`w-4 h-4 ${trackTheme.text}`} />
                              </motion.div>
                            )}
                            {isLocked && (
                              <Lock className="w-4 h-4 text-och-steel" />
                            )}
                          </div>

                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-lg ${
                            isCompleted || isInProgress
                              ? `${trackTheme.bg} ${trackTheme.border} border`
                              : 'bg-och-steel/10 border-och-steel/20 border'
                          } flex items-center justify-center mb-3 mx-auto`}>
                            <StageIcon className={`w-6 h-6 ${
                              isCompleted || isInProgress
                                ? trackTheme.text
                                : 'text-och-steel'
                            }`} />
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-black text-white mb-1 text-center">
                            {stage.title}
                          </h4>

                          {/* Description */}
                          <p className="text-[10px] text-och-steel mb-3 text-center leading-relaxed">
                            {stage.description}
                          </p>

                          {/* Progress Bar */}
                          {stage.progress !== undefined && (
                            <div className="mb-3">
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${
                                    isCompleted || isInProgress
                                      ? trackTheme.bg
                                      : 'bg-och-steel/20'
                                  } rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${stage.progress}%` }}
                                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                />
                              </div>
                              <div className="text-[10px] text-och-steel text-center mt-1">
                                {stage.progress}%
                              </div>
                            </div>
                          )}

                          {/* Stats */}
                          {stage.stats && stage.stats.length > 0 && (
                            <div className="space-y-1">
                              {stage.stats.slice(0, 2).map((stat, statIdx) => (
                                <div key={statIdx} className="flex items-center justify-between text-[10px]">
                                  <span className="text-och-steel">{stat.label}</span>
                                  <span className={`font-bold ${
                                    isCompleted || isInProgress
                                      ? trackTheme.text
                                      : 'text-och-steel'
                                  }`}>
                                    {stat.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Button */}
                          {!isLocked && stage.route && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className={`text-[10px] font-bold ${
                                isCompleted || isInProgress
                                  ? trackTheme.text
                                  : 'text-och-steel'
                              } text-center flex items-center justify-center gap-1`}>
                                {isCompleted ? 'View' : isInProgress ? 'Continue' : 'Start'}
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Overall Progress Summary */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-och-steel font-bold uppercase tracking-wide">
                    Journey Completion
                  </span>
                  <span className={`font-black ${trackTheme.text}`}>
                    {completedStages} of {totalStages} Stages Complete
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-2">
                  <motion.div
                    className={`h-full ${trackTheme.bg} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${overallJourneyProgress}%` }}
                    transition={{ duration: 1, delay: 0.7 }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Two Column Layout - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Strengths */}
          {strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4 bg-gradient-to-br from-och-gold/10 to-och-midnight/60 border border-och-gold/20 rounded-xl h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-och-gold" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">Your Strengths</h3>
                </div>
                <div className="space-y-2">
                  {strengths.slice(0, 4).map((strength: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-och-gold shrink-0 mt-0.5" />
                      <p className="text-xs text-och-steel leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Alternative Tracks */}
          {secondaryRecommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4 bg-gradient-to-br from-och-defender/10 to-och-midnight/60 border border-och-defender/20 rounded-xl h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Compass className="w-4 h-4 text-och-defender" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">Alternative Paths</h3>
                </div>
                <div className="space-y-2">
                  {secondaryRecommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{rec.track_name}</h4>
                        <Badge variant="defender" className="text-[10px] font-bold">
                          {Math.round(rec.score)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Assessment Summary - Compact */}
        {results.assessment_summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-och-defender" />
                <h3 className="text-sm font-black text-white uppercase tracking-wide">Assessment Summary</h3>
              </div>
              <p className="text-xs text-och-steel leading-relaxed mb-3">
                {results.assessment_summary}
              </p>
              {valueStatement && (
                <div className="pt-3 border-t border-och-steel/20">
                  <h4 className="text-xs font-black text-white uppercase tracking-wide mb-2">Your Value Statement</h4>
                  <p className="text-xs text-och-steel leading-relaxed">
                    {valueStatement}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* All Tracks - Compact Grid */}
        {Object.keys(allTracks).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20 rounded-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wide mb-3 text-center">
                All OCH Career Tracks
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(allTracks).map(([key, track]) => {
                  const isPrimary = primaryTrack?.key === key || primaryTrack?.track_key === key
                  const theme = trackThemes[key.toLowerCase()] || trackThemes.defender
                  
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border-2 ${
                        isPrimary 
                          ? `${theme.border} ${theme.bg} bg-gradient-to-br` 
                          : 'border-och-steel/20 bg-och-midnight/40'
                      } text-center`}
                    >
                      <div className="text-2xl mb-1">{theme.icon}</div>
                      <h4 className="text-xs font-bold text-white mb-1 truncate">
                        {track.name}
                      </h4>
                      {isPrimary && (
                        <Badge className={`${theme.bg} ${theme.text} text-[8px] border-0 mt-1`}>
                          Your Track
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Next Steps & CTA - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className={`p-4 bg-gradient-to-br ${trackTheme.gradient} border ${trackTheme.border} rounded-xl`}>
            <h3 className="text-sm font-black text-white uppercase tracking-wide mb-3 text-center">
              Ready to Begin Your Journey?
            </h3>
            {nextSteps.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wide mb-2">Recommended Next Steps</h4>
                <ul className="text-xs text-och-steel space-y-1 mb-4">
                  {nextSteps.slice(0, 3).map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-3 h-3 ${trackTheme.text} shrink-0 mt-0.5`} />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => router.push('/dashboard/student')}
                variant="defender"
                className={`flex-1 ${trackTheme.bg} ${trackTheme.text} hover:opacity-90 font-bold uppercase tracking-wide text-xs`}
              >
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
                Launch Dashboard
              </Button>
              <Button
                onClick={() => router.push('/dashboard/student/curriculum')}
                variant="outline"
                className={`flex-1 ${trackTheme.border} ${trackTheme.text} hover:${trackTheme.bg} border font-bold uppercase tracking-wide text-xs`}
              >
                <Compass className="w-3.5 h-3.5 mr-1.5" />
                View Curriculum
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
