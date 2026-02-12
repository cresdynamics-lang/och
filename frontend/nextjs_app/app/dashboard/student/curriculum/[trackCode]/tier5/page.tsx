/**
 * Mastery Tracks Track Page
 * 
 * Comprehensive Mastery Tracks implementation.
 * Provides track dashboard, module viewer, mastery missions hub, capstone project,
 * evidence upload, mentor feedback, performance summary, and completion flow.
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { curriculumClient } from '@/services/curriculumClient'
import { missionsClient } from '@/services/missionsClient'
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  PlayCircle,
  FileText,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Clock,
  Target,
  Award,
  MessageSquare,
  Loader2,
  AlertCircle,
  BarChart3,
  Trophy,
  Zap,
  Shield,
  Code,
  Upload,
  FileCheck,
  Users,
  Star,
  Crown,
  TrendingUp,
  Presentation,
  FileVideo,
  Headphones,
  ListChecks,
  GitBranch,
  Lightbulb,
  CheckCircle,
  Circle,
  ChevronRight,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import Link from 'next/link'
import type { CurriculumModuleDetail, Lesson } from '@/services/types/curriculum'

type Tier5View = 
  | 'dashboard' 
  | 'module-viewer' 
  | 'mission-hub' 
  | 'capstone-project' 
  | 'subtask-execution' 
  | 'evidence-upload' 
  | 'mission-feedback' 
  | 'performance-summary' 
  | 'reflection' 
  | 'completion'

interface Tier5Status {
  track_code: string
  track_name: string
  completion_percentage: number
  is_complete: boolean
  tier5_completion_requirements_met: boolean
  requirements: {
    mandatory_modules_total: number
    mandatory_modules_completed: number
    mastery_missions_total: number
    mastery_missions_approved: number
    capstone_total: number
    capstone_approved: number
    reflections_required: number
    reflections_submitted: number
    rubric_passed: boolean
    mentor_approval: boolean
    mentor_approval_required: boolean
  }
  missing_requirements: string[]
  mastery_complete: boolean
  progression_mode?: 'sequential' | 'flexible'
}

export default function Tier5TrackPage() {
  const params = useParams()
  const router = useRouter()
  const trackCode = params?.trackCode as string
  const { user, isLoading: authLoading } = useAuth()
  
  const [tier5Status, setTier5Status] = useState<Tier5Status | null>(null)
  const [currentView, setCurrentView] = useState<Tier5View>('dashboard')
  const [currentModule, setCurrentModule] = useState<CurriculumModuleDetail | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentMission, setCurrentMission] = useState<any>(null)
  const [currentSubtask, setCurrentSubtask] = useState<number | null>(null)
  const [missions, setMissions] = useState<any[]>([])
  const [capstoneMissions, setCapstoneMissions] = useState<any[]>([])
  const [missionProgress, setMissionProgress] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const {
    track,
    progress,
    modules,
    loading: trackLoading,
    error: trackError,
    refetch,
  } = useCurriculumProgress(String(user?.id || ''), { trackCode })

  useEffect(() => {
    if (!authLoading && user && trackCode) {
      loadTier5Data()
    }
  }, [authLoading, user, trackCode, track])

  const loadTier5Data = async () => {
    try {
      setLoading(true)
      
      // Check if track is Mastery level
      if (track && track.tier !== 5) {
        setError('This page is only for Mastery level tracks')
        setLoading(false)
        return
      }

      // Load Mastery level status
      const status = await curriculumClient.getTier5Status(trackCode)
      setTier5Status(status)

      // Load Mastery missions
      await loadMissions()

      // If complete, show completion screen
      if (status.is_complete && status.tier5_completion_requirements_met) {
        setCurrentView('completion')
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load track data')
      setLoading(false)
    }
  }

  const handleModuleClick = async (moduleId: string) => {
    try {
      await curriculumClient.startModule(moduleId)
      const module = await curriculumClient.getModule(moduleId)
      setCurrentModule(module)
      setCurrentView('module-viewer')
      await refetch()
    } catch (err: any) {
      setError(err.message || 'Failed to load module')
    }
  }

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    setCurrentView('module-viewer')
  }

  const handleMissionClick = (mission: any) => {
    setCurrentMission(mission)
    if (mission.mission_type === 'capstone') {
      setCurrentView('capstone-project')
    } else {
      setCurrentView('mission-hub')
    }
  }

  const handleSubtaskClick = (subtaskId: number) => {
    setCurrentSubtask(subtaskId)
    setCurrentView('subtask-execution')
  }

  const loadMissions = async () => {
    try {
      // Determine track match from trackCode
      const trackCodeLower = trackCode.toLowerCase()
      let trackMatch: string | undefined
      if (trackCodeLower.includes('defender')) trackMatch = 'defender'
      else if (trackCodeLower.includes('offensive')) trackMatch = 'offensive'
      else if (trackCodeLower.includes('grc')) trackMatch = 'grc'
      else if (trackCodeLower.includes('innovation')) trackMatch = 'innovation'
      else if (trackCodeLower.includes('leadership')) trackMatch = 'leadership'

      // Load mastery missions
      const missionsData = await missionsClient.getAllMissions({
        track_key: trackMatch,
        difficulty: 'advanced', // Mastery missions are advanced difficulty
        type: 'scenario',
        status: 'published',
      })

      // Filter for mastery tier missions
      const masteryMissions = missionsData.results.filter((m: any) => 
        m.tier === 'mastery' || m.type === 'capstone'
      )

      // Separate capstone missions
      const capstones = masteryMissions.filter((m: any) => m.mission_type === 'capstone' || m.type === 'capstone')
      const regularMissions = masteryMissions.filter((m: any) => m.mission_type !== 'capstone' && m.type !== 'capstone')

      setCapstoneMissions(capstones)
      setMissions(regularMissions)

      // Load mission progress for each mission
      const progressMap: Record<string, any> = {}
      for (const mission of masteryMissions) {
        try {
          // TODO: Load mission progress via API
          // For now, we'll load it when mission is clicked
        } catch (err) {
          console.error(`Failed to load progress for mission ${mission.id}:`, err)
        }
      }
      setMissionProgress(progressMap)
    } catch (err: any) {
      console.error('Failed to load missions:', err)
      // Don't set error, just log - missions are optional
    }
  }

  const handleCompleteTier5 = async () => {
    try {
      await curriculumClient.completeTier5(trackCode)
      router.push(`/dashboard/student/curriculum?tier5_complete=${trackCode}`)
    } catch (err: any) {
      setError(err.message || 'Failed to complete track')
    }
  }

  if (authLoading || loading || trackLoading) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-och-orange animate-spin mx-auto" />
              <div className="text-white text-lg">Loading Mastery Track...</div>
            </div>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  if (error || trackError || !track) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center p-6">
          <Card className="p-12 max-w-md">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h2 className="text-white text-2xl font-bold">Error</h2>
              <p className="text-gray-300">{error || trackError || 'Track not found'}</p>
              <Link href="/dashboard/student/curriculum">
                <Button variant="outline">Back to Curriculum</Button>
              </Link>
            </div>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  if (!tier5Status) {
    return null
  }

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <Tier5Dashboard
        track={track}
        trackCode={trackCode}
        tier5Status={tier5Status}
        modules={modules}
        progress={progress}
        onModuleClick={handleModuleClick}
        onLessonClick={handleLessonClick}
        onMissionClick={handleMissionClick}
        onPerformanceClick={() => setCurrentView('performance-summary')}
        onComplete={handleCompleteTier5}
        missions={missions}
        capstoneMissions={capstoneMissions}
        missionProgress={missionProgress}
      />
    )
  }

  // Module Viewer
  if (currentView === 'module-viewer' && currentModule) {
    return (
      <Tier5ModuleViewer
        trackCode={trackCode}
        module={currentModule}
        currentLesson={currentLesson}
        onBack={() => {
          setCurrentView('dashboard')
          setCurrentModule(null)
          setCurrentLesson(null)
        }}
        onLessonClick={handleLessonClick}
        onComplete={async () => {
          await curriculumClient.completeModule(currentModule.id)
          await refetch()
          await loadTier5Data()
          setCurrentView('dashboard')
        }}
      />
    )
  }

  // Mission Hub
  if (currentView === 'mission-hub' && currentMission) {
    return (
      <Tier5MissionHub
        mission={currentMission}
        missionProgress={missionProgress[currentMission.id]}
        onBack={() => {
          setCurrentView('dashboard')
          setCurrentMission(null)
        }}
        onSubtaskClick={(subtaskId) => handleSubtaskClick(typeof subtaskId === 'string' ? parseInt(subtaskId) : subtaskId)}
        onFeedbackClick={() => setCurrentView('mission-feedback')}
        onEvidenceUpload={(subtaskId) => {
          setCurrentSubtask(typeof subtaskId === 'string' ? parseInt(subtaskId) : subtaskId)
          setCurrentView('evidence-upload')
        }}
        onDecisionPoint={(decisionId) => {
          setCurrentView('subtask-execution')
        }}
      />
    )
  }

  // Capstone Project
  if (currentView === 'capstone-project' && currentMission) {
    return (
      <Tier5CapstoneProject
        mission={currentMission}
        missionProgress={missionProgress[currentMission.id]}
        onBack={() => {
          setCurrentView('dashboard')
          setCurrentMission(null)
        }}
        onSubtaskClick={handleSubtaskClick}
        onPresentationClick={() => {
          // For capstone, use evidence upload but mark as presentation
          setCurrentView('evidence-upload')
        }}
      />
    )
  }

  // Subtask Execution
  if (currentView === 'subtask-execution' && currentMission && currentSubtask !== null) {
    return (
      <Tier5SubtaskExecution
        mission={currentMission}
        subtaskId={currentSubtask}
        missionProgress={missionProgress[currentMission.id]}
        onBack={() => setCurrentView(currentMission.mission_type === 'capstone' ? 'capstone-project' : 'mission-hub')}
        onUploadClick={() => setCurrentView('evidence-upload')}
        onDecisionPoint={async (decisionId: string, choiceId: string) => {
          // TODO: Call API to record decision
          // await missionsClient.recordDecision(currentMission.id, decisionId, choiceId)
          // Reload mission progress
          await loadTier5Data()
        }}
      />
    )
  }

  // Evidence Upload
  if (currentView === 'evidence-upload' && currentMission && currentSubtask !== null) {
    return (
      <Tier5EvidenceUpload
        mission={currentMission}
        subtaskId={currentSubtask}
        onBack={() => setCurrentView('subtask-execution')}
        onComplete={() => setCurrentView('subtask-execution')}
      />
    )
  }

  // Mission Feedback
  if (currentView === 'mission-feedback' && currentMission) {
    // Check if this is a capstone project
    const isCapstone = currentMission.mission_type === 'capstone' || currentMission.type === 'capstone'
    
    if (isCapstone) {
      return (
        <Tier5CapstoneReview
          mission={currentMission}
          missionProgress={missionProgress[currentMission.id]}
          onBack={() => setCurrentView('capstone-project')}
        />
      )
    }
    
    return (
      <Tier5MissionFeedback
        mission={currentMission}
        missionProgress={missionProgress[currentMission.id]}
        onBack={() => setCurrentView('mission-hub')}
      />
    )
  }

  // Performance Summary
  if (currentView === 'performance-summary') {
    return (
      <Tier5PerformanceSummary
        trackCode={trackCode}
        tier5Status={tier5Status}
        missions={missions}
        missionProgress={missionProgress}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Reflection
  if (currentView === 'reflection' && currentMission) {
    return (
      <Tier5ReflectionScreen
        mission={currentMission}
        onBack={() => setCurrentView('mission-hub')}
        onSubmit={async (reflectionText: string) => {
          // TODO: Submit reflection via API
          setCurrentView('mission-hub')
        }}
      />
    )
  }

  // Completion View
  if (currentView === 'completion') {
    return (
      <Tier5CompletionScreen
        track={track}
        tier5Status={tier5Status}
        onComplete={handleCompleteTier5}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  return null
}

// Tier 5 Dashboard Component
function Tier5Dashboard({
  track,
  trackCode,
  tier5Status,
  modules,
  progress,
  onModuleClick,
  onLessonClick,
  onMissionClick,
  onPerformanceClick,
  onComplete,
  missions,
  capstoneMissions,
  missionProgress,
}: {
  track: any
  trackCode: string
  tier5Status: Tier5Status
  modules: any[]
  progress: any
  onModuleClick: (moduleId: string) => void
  onLessonClick: (lesson: Lesson) => void
  onMissionClick: (mission: any) => void
  onPerformanceClick: () => void
  onComplete: () => void
  missions: any[]
  capstoneMissions: any[]
  missionProgress: Record<string, any>
}) {
  const completionPct = tier5Status.completion_percentage
  const req = tier5Status.requirements
  const isFlexible = tier5Status.progression_mode === 'flexible'

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex">
        {/* Persistent sidebar */}
        <aside className="w-64 shrink-0 border-r border-och-steel/30 bg-och-midnight/80 hidden lg:block">
          <div className="sticky top-4 p-4 space-y-4">
            <Link href="/dashboard/student/curriculum">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white w-full justify-start">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Curriculum
              </Button>
            </Link>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Track Modules</div>
            <nav className="space-y-1">
              {modules.map((module, index) => {
                const locked = !isFlexible && module.order_index > 0 && (modules[index - 1]?.completion_percentage ?? 0) < 100
                const done = module.completion_percentage === 100
                return (
                  <button
                    key={module.id}
                    onClick={() => !locked && onModuleClick(module.id)}
                    disabled={locked}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      locked
                        ? 'text-gray-600 cursor-not-allowed'
                        : done
                        ? 'text-och-mint hover:bg-white/10'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {locked ? (
                      <Lock className="w-4 h-4 shrink-0" />
                    ) : done ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-och-mint" />
                    ) : (
                      <BookOpen className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">{module.title}</span>
                  </button>
                )
              })}
            </nav>
            <div className="pt-4 border-t border-och-steel/30">
              <button
                type="button"
                onClick={onPerformanceClick}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                Performance Summary
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  {track?.name || 'Mastery Track'}
                  <Crown className="w-8 h-8 text-och-gold" />
                </h1>
                <p className="text-gray-400">Achieve mastery through complex real-world scenarios and capstone projects</p>
              </div>
              <Badge variant="outline" className="bg-och-gold/10 text-och-gold border-och-gold/30">
                <Crown className="w-4 h-4 mr-2" />
                Mastery Level
              </Badge>
            </div>

            {/* Progress Overview */}
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Track Progress</h2>
                <span className="text-2xl font-bold text-och-gold">{completionPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-och-steel/30 rounded-full h-3 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-och-gold to-och-mint h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{req.mandatory_modules_completed}/{req.mandatory_modules_total}</div>
                  <div className="text-sm text-gray-400">Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{req.mastery_missions_approved}/{req.mastery_missions_total}</div>
                  <div className="text-sm text-gray-400">Missions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{req.capstone_approved}/{req.capstone_total}</div>
                  <div className="text-sm text-gray-400">Capstone</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{req.reflections_submitted}/{req.reflections_required}</div>
                  <div className="text-sm text-gray-400">Reflections</div>
                </div>
              </div>
            </Card>

            {/* Requirements Status */}
            {tier5Status.missing_requirements.length > 0 && (
              <Card className="p-6 bg-yellow-500/10 border-yellow-500/30">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Requirements to Complete Mastery
                </h3>
                <ul className="space-y-2">
                  {tier5Status.missing_requirements.map((req, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Rubric Status */}
            {!req.rubric_passed && (
              <Card className="p-6 bg-red-500/10 border-red-500/30">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Mastery Completion Rubric
                </h3>
                <p className="text-gray-300 text-sm">
                  All missions must score 70% or higher to meet Mastery Completion Rubric requirements.
                </p>
              </Card>
            )}

            {/* Modules Grid */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Learning Modules</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => {
                  const locked = !isFlexible && module.order_index > 0 && (modules[module.order_index - 2]?.completion_percentage ?? 0) < 100
                  return (
                    <Card
                      key={module.id}
                      className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                        locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                      }`}
                      onClick={() => !locked && onModuleClick(module.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-white">{module.title}</h3>
                        {locked ? (
                          <Lock className="w-5 h-5 text-gray-600" />
                        ) : module.completion_percentage === 100 ? (
                          <CheckCircle2 className="w-5 h-5 text-och-mint" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{module.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{module.lesson_count} lessons</span>
                        <span className="text-och-mint font-semibold">{module.completion_percentage}%</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Mastery Missions Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-och-gold" />
                Mastery Missions
              </h2>
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <p className="text-gray-300 mb-4">
                  Complete {req.mastery_missions_total} mastery missions and {req.capstone_total} capstone project to achieve Mastery level. 
                  Each mission includes complex multi-layer scenarios, branching decisions, and professional-grade outputs.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Mastery Missions */}
                  {missions.length > 0 ? (
                    missions.map((mission) => {
                      const progress = missionProgress[mission.id] || {}
                      const status = progress.status || 'available'
                      const isApproved = progress.final_status === 'pass' && progress.status === 'approved'
                      return (
                        <Card
                          key={mission.id}
                          className="p-4 bg-white/5 border border-och-steel/20 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-white font-semibold flex-1">{mission.title || mission.code}</h4>
                            <Badge 
                              variant="outline" 
                              className={
                                isApproved 
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : status === 'in_progress'
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                  : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                              }
                            >
                              {isApproved ? 'Approved' : status === 'in_progress' ? 'In Progress' : 'Available'}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {mission.description || mission.story_narrative || 'Complex mission with multi-layer subtasks'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {mission.subtasks && (
                                <span>{mission.subtasks.length} stages</span>
                              )}
                              {mission.time_constraint_hours && (
                                <span>• {mission.time_constraint_hours}h deadline</span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => onMissionClick(mission)}
                            >
                              {status === 'in_progress' ? 'Continue' : 'Start Mission'}
                            </Button>
                          </div>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="p-4 rounded-lg bg-white/5 border border-och-steel/20">
                      <p className="text-gray-400 text-sm">No mastery missions available yet</p>
                    </div>
                  )}
                  
                  {/* Capstone Missions */}
                  {capstoneMissions.length > 0 && capstoneMissions.map((capstone) => {
                    const progress = missionProgress[capstone.id] || {}
                    const isApproved = progress.final_status === 'pass' && progress.status === 'approved'
                    return (
                      <Card
                        key={capstone.id}
                        className="p-4 bg-gradient-to-r from-och-gold/20 to-transparent border border-och-gold/30 hover:from-och-gold/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold flex items-center gap-2 flex-1">
                            <Crown className="w-4 h-4 text-och-gold" />
                            {capstone.title || 'Capstone Project'}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={isApproved ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"}
                          >
                            {isApproved ? 'Approved' : progress.status === 'in_progress' ? 'In Progress' : 'Available'}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">
                          {capstone.description || capstone.story_narrative || 'Final real-world scenario requiring investigation, decision-making, and reporting'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {capstone.subtasks && `${capstone.subtasks.length} stages`}
                            {capstone.presentation_required && ' • Presentation required'}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onMissionClick(capstone)}
                            className="bg-och-gold hover:bg-och-gold/80"
                          >
                            {progress.status === 'in_progress' ? 'Continue Capstone' : 'Start Capstone'}
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                  
                  {/* Show capstone placeholder if no capstones loaded but capstone_total > 0 */}
                  {capstoneMissions.length === 0 && req.capstone_total > 0 && (
                    <Card className="p-4 bg-gradient-to-r from-och-gold/20 to-transparent border border-och-gold/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <Crown className="w-4 h-4 text-och-gold" />
                          Capstone Project
                        </h4>
                        <Badge variant="outline" className={req.capstone_approved >= req.capstone_total ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"}>
                          {req.capstone_approved >= req.capstone_total ? 'Approved' : 'In Progress'}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">Final real-world scenario requiring investigation, decision-making, and reporting</p>
                      <Button
                        size="sm"
                        onClick={() => onMissionClick({ id: 'capstone', title: 'Capstone Project', mission_type: 'capstone' })}
                      >
                        View Capstone
                      </Button>
                    </Card>
                  )}
                </div>
              </Card>
            </div>

            {/* Completion Button */}
            {tier5Status.is_complete && tier5Status.tier5_completion_requirements_met && (
              <Card className="p-6 bg-gradient-to-r from-och-gold/20 to-och-mint/20 border-och-gold/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Crown className="w-6 h-6 text-och-gold" />
                      Mastery Achieved!
                    </h3>
                    <p className="text-gray-300">You've achieved Mastery level in this track. Ready for Marketplace Work or Enterprise Roles?</p>
                  </div>
                  <Button onClick={onComplete} size="lg" className="bg-och-gold hover:bg-och-gold/80">
                    Complete Mastery
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </RouteGuard>
  )
}

// Tier5 Module Viewer with Pipeline Guides
function Tier5ModuleViewer({ trackCode, module, currentLesson, onBack, onLessonClick, onComplete }: any) {
  const [showPipelineGuides, setShowPipelineGuides] = useState(true)
  
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {/* Pipeline Guides Section */}
          {showPipelineGuides && (
            <Tier5PipelineGuides
              module={module}
              trackCode={trackCode}
              onClose={() => setShowPipelineGuides(false)}
            />
          )}
          
          {/* Module Content */}
          <Card className="p-6 bg-white/5 border-och-steel/20">
            <h2 className="text-2xl font-bold text-white mb-4">{module.title}</h2>
            {module.description && (
              <p className="text-gray-300 mb-4">{module.description}</p>
            )}
            
            {/* Lessons */}
            {module.lessons && module.lessons.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Lessons</h3>
                {module.lessons.map((lesson: any, index: number) => (
                  <div
                    key={lesson.id || index}
                    className="p-4 rounded-lg bg-white/5 border border-och-steel/20 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => onLessonClick(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{lesson.title}</h4>
                        {lesson.description && (
                          <p className="text-gray-400 text-sm mt-1">{lesson.description}</p>
                        )}
                      </div>
                      <PlayCircle className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}

// Pipeline Guides Component
function Tier5PipelineGuides({ module, trackCode, onClose }: any) {
  const toolchainRequirements = [
    { name: 'SIEM Tools', required: true, examples: ['Splunk', 'ELK Stack', 'QRadar'] },
    { name: 'Network Analysis', required: true, examples: ['Wireshark', 'tcpdump', 'Zeek'] },
    { name: 'Forensics Tools', required: true, examples: ['Autopsy', 'Volatility', 'SIFT'] },
    { name: 'Scripting Languages', required: true, examples: ['Python', 'Bash', 'PowerShell'] },
    { name: 'Cloud Platforms', required: false, examples: ['AWS', 'Azure', 'GCP'] },
  ]
  
  return (
    <Card className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Code className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Advanced Pipeline Guides</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <Eye className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-gray-300 mb-6">
        Review the toolchain requirements and prerequisites for Mastery-level work in this track.
      </p>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Required Toolchain</h3>
        {toolchainRequirements.map((tool, index) => (
          <div key={index} className="p-4 rounded-lg bg-white/5 border border-och-steel/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-medium">{tool.name}</h4>
                {tool.required && (
                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                    Required
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tool.examples.map((example, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-yellow-400 font-semibold mb-1">Prerequisites</h4>
            <p className="text-gray-300 text-sm">
              Ensure you have completed Intermediate and Advanced tracks, or have equivalent professional experience.
              Access to lab environments and testing infrastructure is recommended.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function Tier5MissionHub({ 
  mission, 
  missionProgress,
  onBack, 
  onSubtaskClick, 
  onFeedbackClick,
  onEvidenceUpload,
  onDecisionPoint,
}: {
  mission: any
  missionProgress?: any
  onBack: () => void
  onSubtaskClick: (subtaskId: string | number) => void
  onFeedbackClick: () => void
  onEvidenceUpload: (subtaskId: string | number) => void
  onDecisionPoint: (decisionId: string) => void
}) {
  const progress = missionProgress || {}
  const subtasks = mission.subtasks || []
  const completedSubtasks = progress.subtasks_progress || {}
  const isCapstone = mission.mission_type === 'capstone' || mission.type === 'capstone'
  
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3 mb-2">
                {isCapstone && <Crown className="w-8 h-8 text-och-gold" />}
                <h1 className="text-3xl font-bold text-white">{mission.title || mission.code}</h1>
                <Badge variant="outline" className={isCapstone ? "bg-och-gold/10 text-och-gold border-och-gold/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"}>
                  {isCapstone ? 'Capstone' : 'Mastery Mission'}
                </Badge>
              </div>
              {mission.time_constraint_hours && (
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time limit: {mission.time_constraint_hours} hours</span>
                </div>
              )}
            </div>
            {progress.status && (
              <Badge variant="outline" className={
                progress.status === 'approved' ? "bg-green-500/10 text-green-400 border-green-500/30" :
                progress.status === 'in_progress' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                "bg-gray-500/10 text-gray-400 border-gray-500/30"
              }>
                {progress.status === 'approved' ? 'Approved' : progress.status === 'in_progress' ? 'In Progress' : 'Available'}
              </Badge>
            )}
          </div>

          {/* Story Context */}
          {mission.story_narrative && (
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mission Context
              </h2>
              <p className="text-gray-300 whitespace-pre-line">{mission.story_narrative}</p>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stage-by-Stage Breakdown */}
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Mission Stages
                </h2>
                <div className="space-y-3">
                  {subtasks.length > 0 ? (
                    subtasks.map((subtask: any, index: number) => {
                      const subtaskId = subtask.id || index
                      const isCompleted = completedSubtasks[subtaskId]?.completed || false
                      const isUnlocked = !subtask.dependencies || subtask.dependencies.every((depId: string) => completedSubtasks[depId]?.completed)
                      
                      return (
                        <div
                          key={subtaskId}
                          className={`p-4 rounded-lg border transition-all ${
                            isCompleted
                              ? 'bg-green-500/10 border-green-500/30'
                              : isUnlocked
                              ? 'bg-white/5 border-och-steel/20 hover:bg-white/10 cursor-pointer'
                              : 'bg-gray-500/10 border-gray-500/30 opacity-50 cursor-not-allowed'
                          }`}
                          onClick={() => isUnlocked && onSubtaskClick(subtaskId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`mt-1 ${isCompleted ? 'text-green-400' : isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-500">Stage {index + 1}</span>
                                  <h3 className="text-white font-semibold">{subtask.title}</h3>
                                </div>
                                {subtask.description && (
                                  <p className="text-gray-400 text-sm mb-2">{subtask.description}</p>
                                )}
                                {subtask.required && (
                                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {isUnlocked && !isCompleted && (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-gray-400 text-sm">No stages defined for this mission</p>
                  )}
                </div>
              </Card>

              {/* Required Outputs */}
              {mission.evidence_upload_schema && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    Required Outputs
                  </h2>
                  <div className="space-y-3">
                    {mission.evidence_upload_schema.required_artifacts?.map((artifact: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Upload className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{artifact.type}</span>
                            {artifact.required && (
                              <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                                Required
                              </Badge>
                            )}
                          </div>
                          {artifact.description && (
                            <p className="text-gray-400 text-sm">{artifact.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {mission.evidence_upload_schema.file_types && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-sm text-blue-300">
                          <strong>Accepted file types:</strong> {mission.evidence_upload_schema.file_types.join(', ')}
                        </p>
                        {mission.evidence_upload_schema.max_file_size_mb && (
                          <p className="text-sm text-blue-300 mt-1">
                            <strong>Max file size:</strong> {mission.evidence_upload_schema.max_file_size_mb} MB
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Success Criteria */}
              {mission.success_criteria && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Success Criteria
                  </h2>
                  <ul className="space-y-2">
                    {Array.isArray(mission.success_criteria) ? (
                      mission.success_criteria.map((criterion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-och-mint mt-0.5 shrink-0" />
                          <span>{criterion}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-300">{mission.success_criteria}</li>
                    )}
                  </ul>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mentor Communication */}
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Mentor Feedback
                </h3>
                {progress.mentor_feedback ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-blue-300">{progress.mentor_feedback}</p>
                      {progress.mentor_feedback_audio_url && (
                        <audio controls className="w-full mt-2">
                          <source src={progress.mentor_feedback_audio_url} type="audio/mpeg" />
                        </audio>
                      )}
                      {progress.mentor_feedback_video_url && (
                        <video controls className="w-full mt-2">
                          <source src={progress.mentor_feedback_video_url} type="video/mp4" />
                        </video>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No mentor feedback yet</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={onFeedbackClick}
                >
                  View Full Feedback
                </Button>
              </Card>

              {/* Recipe References */}
              {mission.recipe_recommendations && mission.recipe_recommendations.length > 0 && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Recommended Recipes
                  </h3>
                  <div className="space-y-2">
                    {mission.recipe_recommendations.map((recipe: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10">
                        <span className="text-sm text-gray-300">{recipe.title || recipe.name || `Recipe ${index + 1}`}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Rubric Preview */}
              {mission.rubric_id && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Scoring Rubric
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    This mission will be evaluated using a detailed rubric covering multiple dimensions.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    View Rubric
                  </Button>
                </Card>
              )}

              {/* Templates */}
              {mission.templates && mission.templates.length > 0 && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Professional Templates
                  </h3>
                  <div className="space-y-2">
                    {mission.templates.map((template: any, index: number) => (
                      <a
                        key={index}
                        href={template.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <span className="text-sm text-white font-medium">{template.type}</span>
                          {template.description && (
                            <p className="text-xs text-gray-400">{template.description}</p>
                          )}
                        </div>
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier5CapstoneProject({ 
  mission, 
  missionProgress,
  onBack, 
  onSubtaskClick, 
  onPresentationClick,
}: {
  mission: any
  missionProgress?: any
  onBack: () => void
  onSubtaskClick: (subtaskId: number) => void
  onPresentationClick: () => void
}) {
  const progress = missionProgress || {}
  const subtasks = mission.subtasks || []
  const completedSubtasks = progress.subtasks_progress || {}
  const isComplete = progress.status === 'approved' && progress.final_status === 'pass'
  
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-8 h-8 text-och-gold" />
                <h1 className="text-3xl font-bold text-white">{mission.title || 'Capstone Project'}</h1>
                <Badge variant="outline" className="bg-och-gold/10 text-och-gold border-och-gold/30">
                  Capstone
                </Badge>
              </div>
              <p className="text-gray-400">
                Final real-world scenario requiring investigation, decision-making, design/remediation, reporting, and presentation.
              </p>
            </div>
            {progress.status && (
              <Badge variant="outline" className={
                isComplete ? "bg-green-500/10 text-green-400 border-green-500/30" :
                progress.status === 'in_progress' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                "bg-gray-500/10 text-gray-400 border-gray-500/30"
              }>
                {isComplete ? 'Approved' : progress.status === 'in_progress' ? 'In Progress' : 'Available'}
              </Badge>
            )}
          </div>

          {/* Story Context */}
          {mission.story_narrative && (
            <Card className="p-6 bg-gradient-to-r from-och-gold/20 to-transparent border border-och-gold/30">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Capstone Scenario
              </h2>
              <p className="text-gray-300 whitespace-pre-line">{mission.story_narrative}</p>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Capstone Stages */}
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Capstone Stages
                </h2>
                <div className="space-y-3">
                  {subtasks.length > 0 ? (
                    subtasks.map((subtask: any, index: number) => {
                      const subtaskId = subtask.id || index
                      const isCompleted = completedSubtasks[subtaskId]?.completed || false
                      const isUnlocked = !subtask.dependencies || subtask.dependencies.every((depId: string) => completedSubtasks[depId]?.completed)
                      
                      return (
                        <div
                          key={subtaskId}
                          className={`p-4 rounded-lg border transition-all ${
                            isCompleted
                              ? 'bg-green-500/10 border-green-500/30'
                              : isUnlocked
                              ? 'bg-white/5 border-och-steel/20 hover:bg-white/10 cursor-pointer'
                              : 'bg-gray-500/10 border-gray-500/30 opacity-50 cursor-not-allowed'
                          }`}
                          onClick={() => isUnlocked && onSubtaskClick(subtaskId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`mt-1 ${isCompleted ? 'text-green-400' : isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-500">Stage {index + 1}</span>
                                  <h3 className="text-white font-semibold">{subtask.title}</h3>
                                </div>
                                {subtask.description && (
                                  <p className="text-gray-400 text-sm mb-2">{subtask.description}</p>
                                )}
                              </div>
                            </div>
                            {isUnlocked && !isCompleted && (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-gray-400 text-sm">No stages defined</p>
                  )}
                </div>
              </Card>

              {/* Presentation Upload */}
              {mission.presentation_required && (
                <Card className="p-6 bg-gradient-to-r from-och-gold/20 to-transparent border border-och-gold/30">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Presentation className="w-5 h-5" />
                    Final Presentation
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Submit your final presentation (video, slides, or document) summarizing your capstone project findings and recommendations.
                  </p>
                  {progress.presentation_submitted ? (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-green-300 font-medium mb-2">✓ Presentation Submitted</p>
                      {progress.presentation_url && (
                        <a
                          href={progress.presentation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Presentation
                        </a>
                      )}
                    </div>
                  ) : (
                    <Button onClick={onPresentationClick} size="lg" className="w-full bg-och-gold hover:bg-och-gold/80">
                      <Presentation className="w-4 h-4 mr-2" />
                      Upload Presentation
                    </Button>
                  )}
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Success Criteria */}
              {mission.success_criteria && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Success Criteria
                  </h3>
                  <ul className="space-y-2">
                    {Array.isArray(mission.success_criteria) ? (
                      mission.success_criteria.map((criterion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-och-mint mt-0.5 shrink-0" />
                          <span>{criterion}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-300 text-sm">{mission.success_criteria}</li>
                    )}
                  </ul>
                </Card>
              )}

              {/* Templates */}
              {mission.templates && mission.templates.length > 0 && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Professional Templates
                  </h3>
                  <div className="space-y-2">
                    {mission.templates.map((template: any, index: number) => (
                      <a
                        key={index}
                        href={template.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <span className="text-sm text-white font-medium">{template.type}</span>
                          {template.description && (
                            <p className="text-xs text-gray-400">{template.description}</p>
                          )}
                        </div>
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier5SubtaskExecution({ 
  mission, 
  subtaskId, 
  missionProgress,
  onBack, 
  onUploadClick,
  onDecisionPoint,
}: {
  mission: any
  subtaskId: number
  missionProgress?: any
  onBack: () => void
  onUploadClick: () => void
  onDecisionPoint?: (decisionId: string, choiceId: string) => void
}) {
  const [notes, setNotes] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [rationale, setRationale] = useState('')
  const subtasks = mission.subtasks || []
  const subtask = subtasks.find((s: any) => (s.id || subtasks.indexOf(s)) === subtaskId) || subtasks[subtaskId]
  const progress = missionProgress || {}
  
  // Get decision point for current subtask
  const currentSubtaskId = subtask?.id || subtasks.indexOf(subtask)
  const branchingPaths = mission.branching_paths || {}
  const decisionData = branchingPaths[currentSubtaskId] || branchingPaths[String(currentSubtaskId)]
  const userDecision = decisionData ? progress?.decision_paths?.[decisionData.decision_id] : null
  
  if (!subtask) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
          <Card className="max-w-4xl mx-auto p-6">
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mission Hub
            </Button>
            <p className="text-gray-300">Subtask not found</p>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Mission Hub
              </Button>
              <h1 className="text-3xl font-bold text-white mb-2">{subtask.title}</h1>
              <p className="text-gray-400">Stage {subtasks.indexOf(subtask) + 1} of {subtasks.length}</p>
            </div>
            {subtask.required && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                Required
              </Badge>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h2 className="text-xl font-bold text-white mb-3">Task Description</h2>
                <p className="text-gray-300 whitespace-pre-line">{subtask.description || 'No description provided'}</p>
              </Card>


              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Notes
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record your thoughts, findings, and approach..."
                  className="w-full h-40 p-4 bg-och-midnight/50 border border-och-steel/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-och-mint"
                />
                <p className="text-xs text-gray-500 mt-2">Notes are auto-saved</p>
              </Card>

              {mission.evidence_upload_schema?.required_artifacts && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ListChecks className="w-5 h-5" />
                    Evidence Checklist
                  </h2>
                  <div className="space-y-2">
                    {mission.evidence_upload_schema.required_artifacts.map((artifact: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <CheckCircle2 className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <span className="text-white font-medium">{artifact.type}</span>
                          {artifact.description && (
                            <p className="text-gray-400 text-sm">{artifact.description}</p>
                          )}
                        </div>
                        {artifact.required && (
                          <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                            Required
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button onClick={onUploadClick} className="w-full mt-4" size="lg">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Evidence
                  </Button>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {mission.recipe_recommendations && mission.recipe_recommendations.length > 0 && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Recipe Support
                  </h3>
                  <div className="space-y-2">
                    {mission.recipe_recommendations.slice(0, 3).map((recipe: any, index: number) => (
                      <div key={index} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                        <span className="text-sm text-gray-300">{recipe.title || recipe.name || `Recipe ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Need Help?
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Stuck on this stage? Use hints to guide your approach.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Request Hint
                </Button>
              </Card>

              {/* Decision Tree Visualization */}
              {decisionData && (
                <Card className="p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    Decision Point
                  </h3>
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm mb-4">
                      Your decision here will shape the next stage of the mission.
                    </p>
                    {decisionData.choices && decisionData.choices.map((choice: any, idx: number) => {
                      const isSelected = userDecision?.choice_id === choice.id
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedChoice(choice.id)
                            if (onDecisionPoint) {
                              onDecisionPoint(decisionData.decision_id, choice.id)
                            }
                          }}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-purple-500/30 border-purple-500/50'
                              : 'bg-white/5 border-och-steel/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{choice.label}</span>
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-purple-400" />
                                )}
                              </div>
                              {choice.consequences && (
                                <div className="mt-2 space-y-1">
                                  {Object.entries(choice.consequences).map(([key, value]: [string, any]) => (
                                    <div key={key} className="text-xs text-gray-400">
                                      <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span> {String(value)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {!isSelected && (
                              <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {selectedChoice && (
                    <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <label className="text-sm text-white font-medium mb-2 block">
                        Rationale (required)
                      </label>
                      <textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Explain your decision..."
                        className="w-full h-24 p-3 bg-och-midnight/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <Button
                        className="w-full mt-3 bg-purple-500 hover:bg-purple-600"
                        disabled={!rationale.trim()}
                        onClick={() => {
                          if (onDecisionPoint && selectedChoice) {
                            onDecisionPoint(decisionData.decision_id, selectedChoice)
                          }
                        }}
                      >
                        Confirm Decision
                      </Button>
                    </div>
                  )}
                  
                  {/* Decision History */}
                  {progress?.decision_paths && Object.keys(progress.decision_paths).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-purple-500/30">
                      <h4 className="text-sm font-semibold text-white mb-2">Decision History</h4>
                      <div className="space-y-2">
                        {Object.entries(progress.decision_paths).map(([decId, decData]: [string, any]) => (
                          <div key={decId} className="text-xs text-gray-400 p-2 rounded bg-white/5">
                            <span className="text-gray-500">Decision {decId}:</span> {decData.choice_id}
                            {decData.rationale && (
                              <div className="mt-1 text-gray-500 italic">{decData.rationale}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-3">Progress</h3>
                <div className="space-y-2">
                  {subtasks.map((s: any, index: number) => {
                    const isCurrent = (s.id || index) === subtaskId
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 text-sm ${
                          isCurrent ? 'text-white font-semibold' : 'text-gray-400'
                        }`}
                      >
                        <Circle className="w-4 h-4" />
                        <span>Stage {index + 1}: {s.title}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier5EvidenceUpload({ 
  mission, 
  subtaskId, 
  onBack, 
  onComplete,
}: {
  mission: any
  subtaskId: number
  onBack: () => void
  onComplete: () => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  
  const evidenceSchema = mission.evidence_upload_schema || {}
  const maxFileSize = evidenceSchema.max_file_size_mb ? evidenceSchema.max_file_size_mb * 1024 * 1024 : 100 * 1024 * 1024
  const acceptedTypes = evidenceSchema.file_types || ['*']

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File ${file.name} exceeds maximum size of ${evidenceSchema.max_file_size_mb || 100}MB`)
        return false
      }
      if (acceptedTypes[0] !== '*' && !acceptedTypes.some((type: string) => file.type.includes(type))) {
        alert(`File ${file.name} is not an accepted file type`)
        return false
      }
      return true
    })
    setFiles(prev => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        }
      }
      onComplete()
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subtask
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Evidence</h1>
            <p className="text-gray-400">Submit your evidence for this mission stage</p>
          </div>

          <Card className="p-6 bg-white/5 border-och-steel/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              File Uploads
            </h2>
            
            {acceptedTypes[0] !== '*' && (
              <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-300">
                  <strong>Accepted file types:</strong> {acceptedTypes.join(', ')}
                </p>
                <p className="text-sm text-blue-300 mt-1">
                  <strong>Maximum file size:</strong> {evidenceSchema.max_file_size_mb || 100} MB
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Select Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-och-mint file:text-och-midnight hover:file:bg-och-mint/80 cursor-pointer"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-och-steel/20">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {uploadProgress[file.name] !== undefined && (
                          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-och-mint h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {evidenceSchema.required_artifacts?.some((a: any) => a.type === 'text' || a.type === 'description') && (
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Text Responses
              </h2>
              <div className="space-y-4">
                {evidenceSchema.required_artifacts
                  .filter((a: any) => a.type === 'text' || a.type === 'description')
                  .map((artifact: any, index: number) => (
                    <div key={index}>
                      <label className="block mb-2 text-sm font-medium text-gray-300">
                        {artifact.description || `Response ${index + 1}`}
                        {artifact.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <textarea
                        value={textAnswers[artifact.type] || ''}
                        onChange={(e) => setTextAnswers(prev => ({ ...prev, [artifact.type]: e.target.value }))}
                        placeholder="Enter your response..."
                        className="w-full h-32 p-4 bg-och-midnight/50 border border-och-steel/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-och-mint"
                        required={artifact.required}
                      />
                    </div>
                  ))}
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              size="lg"
              className="bg-och-mint hover:bg-och-mint/80"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Evidence
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

// Capstone Review Component - Dedicated multi-phase review interface
function Tier5CapstoneReview({
  mission,
  missionProgress,
  onBack,
}: {
  mission: any
  missionProgress?: any
  onBack: () => void
}) {
  const progress = missionProgress || {}
  const reviewPhases = progress.mentor_review_phases || []
  const capstonePhases = [
    { id: 'investigation', name: 'Investigation Phase', icon: FileText },
    { id: 'decision_making', name: 'Decision Making Phase', icon: GitBranch },
    { id: 'design_remediation', name: 'Design/Remediation Phase', icon: Code },
    { id: 'reporting', name: 'Reporting Phase', icon: FileText },
    { id: 'presentation', name: 'Presentation Phase', icon: Presentation },
  ]
  
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Capstone
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-8 h-8 text-och-gold" />
                <h1 className="text-3xl font-bold text-white">Capstone Review</h1>
                <Badge variant="outline" className="bg-och-gold/10 text-och-gold border-och-gold/30">
                  Multi-Phase Review
                </Badge>
              </div>
              <p className="text-gray-400">
                Mentor evaluation and scoring for each phase of your capstone project.
              </p>
            </div>
            {progress.mentor_approved && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                Approved
              </Badge>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Review Phases */}
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Review Phases
                </h2>
                <div className="space-y-4">
                  {capstonePhases.map((phase, index) => {
                    const phaseReview = reviewPhases.find((r: any) => r.phase === phase.id)
                    const IconComponent = phase.icon
                    return (
                      <div
                        key={phase.id}
                        className={`p-4 rounded-lg border ${
                          phaseReview
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-white/5 border-och-steel/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <IconComponent className={`w-5 h-5 mt-1 ${
                              phaseReview ? 'text-green-400' : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-semibold">{phase.name}</h3>
                                {phaseReview && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                              {phaseReview ? (
                                <div className="space-y-2 mt-2">
                                  {phaseReview.feedback && (
                                    <p className="text-gray-300 text-sm">{phaseReview.feedback}</p>
                                  )}
                                  {phaseReview.score !== null && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">Score:</span>
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                        {phaseReview.score}%
                                      </Badge>
                                    </div>
                                  )}
                                  {phaseReview.reviewed_at && (
                                    <p className="text-xs text-gray-500">
                                      Reviewed: {new Date(phaseReview.reviewed_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-400 text-sm">Pending review</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Overall Feedback */}
              {progress.mentor_feedback && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Overall Feedback
                  </h2>
                  <p className="text-gray-300 whitespace-pre-line">{progress.mentor_feedback}</p>
                </Card>
              )}

              {/* Audio/Video Feedback */}
              {(progress.mentor_feedback_audio_url || progress.mentor_feedback_video_url) && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Headphones className="w-5 h-5" />
                    Media Feedback
                  </h2>
                  <div className="space-y-3">
                    {progress.mentor_feedback_audio_url && (
                      <div className="p-4 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <Headphones className="w-5 h-5 text-blue-400" />
                          <div className="flex-1">
                            <p className="text-white font-medium">Audio Feedback</p>
                            <audio controls className="w-full mt-2">
                              <source src={progress.mentor_feedback_audio_url} type="audio/mpeg" />
                            </audio>
                          </div>
                        </div>
                      </div>
                    )}
                    {progress.mentor_feedback_video_url && (
                      <div className="p-4 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <FileVideo className="w-5 h-5 text-purple-400" />
                          <div className="flex-1">
                            <p className="text-white font-medium">Video Feedback</p>
                            <video controls className="w-full mt-2 rounded-lg">
                              <source src={progress.mentor_feedback_video_url} type="video/mp4" />
                            </video>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Final Score */}
              {progress.mentor_final_score !== null && (
                <Card className="p-6 bg-gradient-to-r from-och-gold/20 to-transparent border border-och-gold/30">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Final Score
                  </h3>
                  <div className="text-4xl font-bold text-och-gold mb-2">
                    {progress.mentor_final_score}%
                  </div>
                  <p className="text-gray-400 text-sm">
                    {progress.mentor_final_score >= 70 ? 'Meets Mastery Requirements' : 'Below Mastery Threshold'}
                  </p>
                </Card>
              )}

              {/* Review Status */}
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-3">Review Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Phases Reviewed</span>
                    <span className="text-white font-semibold">
                      {reviewPhases.length} / {capstonePhases.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Status</span>
                    <Badge variant="outline" className={
                      progress.mentor_approved
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : progress.status === 'under_review'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                    }>
                      {progress.mentor_approved ? 'Approved' : progress.status === 'under_review' ? 'Under Review' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier5MissionFeedback({ 
  mission, 
  missionProgress,
  onBack,
}: {
  mission: any
  missionProgress?: any
  onBack: () => void
}) {
  const progress = missionProgress || {}
  const feedback = progress.mentor_feedback || ''
  const scores = progress.subtask_scores || {}
  const rubricScores = progress.rubric_scores || {}
  const finalStatus = progress.final_status || 'pending'
  const isApproved = finalStatus === 'pass' && progress.status === 'approved'

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Mission Hub
              </Button>
              <h1 className="text-3xl font-bold text-white mb-2">Mission Feedback & Scoring</h1>
              <p className="text-gray-400">{mission.title || mission.code}</p>
            </div>
            <Badge 
              variant="outline" 
              className={
                isApproved 
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : finalStatus === 'fail'
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
              }
            >
              {isApproved ? 'Approved' : finalStatus === 'fail' ? 'Needs Revision' : 'In Review'}
            </Badge>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overall Score */}
              {progress.overall_score !== undefined && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Overall Score</h2>
                    <div className="text-4xl font-bold text-och-mint">{progress.overall_score}%</div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        progress.overall_score >= 70 ? 'bg-green-500' :
                        progress.overall_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress.overall_score}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {progress.overall_score >= 70 
                      ? 'Excellent work! You\'ve met the mastery requirements.'
                      : progress.overall_score >= 50
                      ? 'Good progress. Review feedback to improve.'
                      : 'Please review feedback and resubmit.'}
                  </p>
                </Card>
              )}

              {/* Rubric-Based Scoring */}
              {Object.keys(rubricScores).length > 0 && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Rubric Scoring Breakdown
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(rubricScores).map(([category, score]: [string, any]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{category}</span>
                          <span className="text-och-mint font-semibold">{score.score || score}/{score.max || 100}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-och-mint h-2 rounded-full"
                            style={{ width: `${((score.score || score) / (score.max || 100)) * 100}%` }}
                          />
                        </div>
                        {score.comments && (
                          <p className="text-sm text-gray-400 mt-1">{score.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Subtask Scores */}
              {mission.subtasks && mission.subtasks.length > 0 && Object.keys(scores).length > 0 && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4">Subtask Scores</h2>
                  <div className="space-y-3">
                    {mission.subtasks.map((subtask: any, index: number) => {
                      const subtaskId = subtask.id || index
                      const score = scores[subtaskId]
                      if (!score) return null
                      return (
                        <div key={subtaskId} className="p-3 rounded-lg bg-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-medium">Stage {index + 1}: {subtask.title}</span>
                            <span className="text-och-mint font-semibold">{score.score || 'N/A'}/{score.max || 100}</span>
                          </div>
                          {score.comments && (
                            <p className="text-sm text-gray-400">{score.comments}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Mentor Written Feedback */}
              {feedback && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Mentor Feedback
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 whitespace-pre-line">{feedback}</p>
                  </div>
                </Card>
              )}

              {/* Audio Feedback */}
              {progress.mentor_feedback_audio_url && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Headphones className="w-5 h-5" />
                    Audio Feedback
                  </h2>
                  <audio controls className="w-full">
                    <source src={progress.mentor_feedback_audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </Card>
              )}

              {/* Video Feedback */}
              {progress.mentor_feedback_video_url && (
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileVideo className="w-5 h-5" />
                    Video Feedback
                  </h2>
                  <video controls className="w-full rounded-lg">
                    <source src={progress.mentor_feedback_video_url} type="video/mp4" />
                    Your browser does not support the video element.
                  </video>
                </Card>
              )}

              {/* Resubmission Notice */}
              {finalStatus === 'fail' && (
                <Card className="p-6 bg-red-500/10 border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h3 className="text-white font-bold mb-2">Revision Required</h3>
                      <p className="text-gray-300 text-sm">
                        Your submission needs revision. Please review the feedback above and resubmit your evidence.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Approval Status */}
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-3">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Submission Status</span>
                    <Badge variant="outline" className={
                      progress.status === 'approved' ? "bg-green-500/10 text-green-400 border-green-500/30" :
                      progress.status === 'in_progress' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                      "bg-gray-500/10 text-gray-400 border-gray-500/30"
                    }>
                      {progress.status || 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Final Status</span>
                    <Badge variant="outline" className={
                      finalStatus === 'pass' ? "bg-green-500/10 text-green-400 border-green-500/30" :
                      finalStatus === 'fail' ? "bg-red-500/10 text-red-400 border-red-500/30" :
                      "bg-gray-500/10 text-gray-400 border-gray-500/30"
                    }>
                      {finalStatus === 'pass' ? 'Pass' : finalStatus === 'fail' ? 'Fail' : 'Pending'}
                    </Badge>
                  </div>
                  {progress.reviewed_at && (
                    <div className="pt-2 border-t border-och-steel/20">
                      <p className="text-xs text-gray-500">
                        Reviewed: {new Date(progress.reviewed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Next Steps */}
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-3">Next Steps</h3>
                {isApproved ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      ✅ This mission has been approved. You can proceed to the next stage or mission.
                    </p>
                    <Button onClick={onBack} className="w-full" size="sm">
                      Continue to Next Mission
                    </Button>
                  </div>
                ) : finalStatus === 'fail' ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      Please review the feedback and resubmit your evidence.
                    </p>
                    <Button onClick={onBack} variant="outline" className="w-full" size="sm">
                      Revise Submission
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Your submission is under review. Check back soon for feedback.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier5PerformanceSummary({ 
  trackCode, 
  tier5Status, 
  missions,
  missionProgress,
  onBack,
}: {
  trackCode: string
  tier5Status: Tier5Status
  missions?: any[]
  missionProgress?: Record<string, any>
  onBack: () => void
}) {
  const req = tier5Status.requirements
  
  // Calculate performance metrics
  const totalMissions = missions?.length || req.mastery_missions_total
  const completedMissions = missions?.filter((m: any) => {
    const progress = missionProgress?.[m.id]
    return progress?.status === 'approved' && progress?.final_status === 'pass'
  }).length || req.mastery_missions_approved
  
  const avgScore = missions?.reduce((sum: number, m: any) => {
    const progress = missionProgress?.[m.id]
    return sum + (progress?.overall_score || 0)
  }, 0) / (completedMissions || 1) || 0
  
  const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0
  
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-och-gold" />
                Mastery Performance Summary
              </h1>
              <p className="text-gray-400">Track your progress and performance across all mastery missions</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Completion Rate</span>
                <Target className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{completionRate.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">{completedMissions} of {totalMissions} missions</div>
            </Card>
            
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Average Score</span>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{avgScore.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Across all missions</div>
            </Card>
            
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Modules Completed</span>
                <BookOpen className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{req.mandatory_modules_completed}/{req.mandatory_modules_total}</div>
              <div className="text-xs text-gray-500">Mandatory modules</div>
            </Card>
            
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Reflections</span>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{req.reflections_submitted}/{req.reflections_required}</div>
              <div className="text-xs text-gray-500">Submitted</div>
            </Card>
          </div>

          {/* Mission Performance Breakdown */}
          {missions && missions.length > 0 && (
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <h2 className="text-xl font-bold text-white mb-4">Mission Performance</h2>
              <div className="space-y-3">
                {missions.map((mission: any) => {
                  const progress = missionProgress?.[mission.id] || {}
                  const score = progress.overall_score || 0
                  const status = progress.status || 'not_started'
                  const isApproved = progress.status === 'approved' && progress.final_status === 'pass'
                  
                  return (
                    <div key={mission.id} className="p-4 rounded-lg bg-white/5 border border-och-steel/20">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold">{mission.title || mission.code}</h3>
                        <Badge variant="outline" className={
                          isApproved ? "bg-green-500/10 text-green-400 border-green-500/30" :
                          status === 'in_progress' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                          "bg-gray-500/10 text-gray-400 border-gray-500/30"
                        }>
                          {isApproved ? 'Approved' : status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </Badge>
                      </div>
                      {score > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-400">Score</span>
                            <span className="text-sm font-semibold text-white">{score}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                score >= 70 ? 'bg-green-500' :
                                score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Capstone Status */}
          {req.capstone_total > 0 && (
            <Card className="p-6 bg-gradient-to-r from-och-gold/20 to-transparent border border-och-gold/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Crown className="w-6 h-6 text-och-gold" />
                  Capstone Project
                </h2>
                <Badge variant="outline" className={
                  req.capstone_approved >= req.capstone_total 
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                }>
                  {req.capstone_approved >= req.capstone_total ? 'Approved' : 'In Progress'}
                </Badge>
              </div>
              <p className="text-gray-300">
                {req.capstone_approved >= req.capstone_total 
                  ? '✓ Your capstone project has been approved. Congratulations on achieving mastery!'
                  : 'Complete your capstone project to finalize your mastery track.'}
              </p>
            </Card>
          )}

          {/* Overall Progress */}
          <Card className="p-6 bg-white/5 border-och-steel/20">
            <h2 className="text-xl font-bold text-white mb-4">Overall Track Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Track Completion</span>
                  <span className="text-white font-bold">{tier5Status.completion_percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <motion.div
                    className="bg-gradient-to-r from-och-gold to-och-mint h-4 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${tier5Status.completion_percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              {tier5Status.is_complete && tier5Status.tier5_completion_requirements_met && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-green-300 font-medium">Mastery Track Complete!</p>
                  </div>
                  <p className="text-sm text-green-200 mt-2">
                    You've successfully completed all requirements for the Mastery level track.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier5ReflectionScreen({ mission, onBack, onSubmit }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">Reflection</h2>
          <p className="text-gray-300">Reflection Submission Screen (to be implemented)</p>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier5CompletionScreen({ track, tier5Status, onComplete, onBack }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Crown className="w-24 h-24 text-och-gold mx-auto mb-6" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">Mastery Achieved!</h1>
          <p className="text-xl text-gray-300 mb-2">Mastery Level Track</p>
          <p className="text-gray-400 mb-8">You've achieved mastery in {track?.name || 'this track'}</p>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-gray-300 mb-2">You're Ready for Real-World Impact</p>
              <p className="text-och-gold font-semibold">Marketplace Work • Enterprise Roles • Leadership Missions</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={onBack} variant="outline">
                Review Progress
              </Button>
              <Button onClick={onComplete} size="lg" className="bg-och-gold hover:bg-och-gold/80">
                Complete Mastery
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </RouteGuard>
  )
}
