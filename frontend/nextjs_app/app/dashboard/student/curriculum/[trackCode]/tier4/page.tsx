/**
 * Advanced Tracks Track Page
 * 
 * Comprehensive Advanced Tracks implementation.
 * Provides track dashboard, module viewer, advanced missions hub, subtask execution,
 * evidence upload, mentor feedback, and completion flow.
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { curriculumClient } from '@/services/curriculumClient'
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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import Link from 'next/link'
import type { CurriculumModuleDetail, Lesson } from '@/services/types/curriculum'

type Tier4View = 
  | 'dashboard' 
  | 'module-viewer' 
  | 'mission-hub' 
  | 'subtask-execution' 
  | 'evidence-upload' 
  | 'mission-feedback' 
  | 'reflection' 
  | 'completion'

interface Tier4Status {
  track_code: string
  track_name: string
  completion_percentage: number
  is_complete: boolean
  tier4_completion_requirements_met: boolean
  requirements: {
    mandatory_modules_total: number
    mandatory_modules_completed: number
    advanced_missions_total: number
    advanced_missions_approved: number
    feedback_cycles_complete: number
    reflections_required: number
    reflections_submitted: number
    mentor_approval: boolean
    mentor_approval_required: boolean
  }
  missing_requirements: string[]
  can_progress_to_tier5: boolean
  tier5_unlocked: boolean
  progression_mode?: 'sequential' | 'flexible'
}

export default function Tier4TrackPage() {
  const params = useParams()
  const router = useRouter()
  const trackCode = params?.trackCode as string
  const { user, isLoading: authLoading } = useAuth()
  
  const [tier4Status, setTier4Status] = useState<Tier4Status | null>(null)
  const [currentView, setCurrentView] = useState<Tier4View>('dashboard')
  const [currentModule, setCurrentModule] = useState<CurriculumModuleDetail | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentMission, setCurrentMission] = useState<any>(null)
  const [currentSubtask, setCurrentSubtask] = useState<number | null>(null)
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
      loadTier4Data()
    }
  }, [authLoading, user, trackCode, track])

  const loadTier4Data = async () => {
    try {
      setLoading(true)
      
      // Check if track is Advanced level
      if (track && track.tier !== 4) {
        setError('This page is only for Advanced tracks')
        setLoading(false)
        return
      }

      // Load Advanced level status
      const status = await curriculumClient.getTier4Status(trackCode)
      setTier4Status(status)

      // If complete, show completion screen
      if (status.is_complete && status.tier4_completion_requirements_met) {
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
    setCurrentView('mission-hub')
  }

  const handleSubtaskClick = (subtaskId: number) => {
    setCurrentSubtask(subtaskId)
    setCurrentView('subtask-execution')
  }

  const handleCompleteTier4 = async () => {
    try {
      await curriculumClient.completeTier4(trackCode)
      router.push(`/dashboard/student/curriculum?tier4_complete=${trackCode}`)
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
              <div className="text-white text-lg">Loading Advanced Track...</div>
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

  if (!tier4Status) {
    return null
  }

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <Tier4Dashboard
        track={track}
        trackCode={trackCode}
        tier4Status={tier4Status}
        modules={modules}
        progress={progress}
        onModuleClick={handleModuleClick}
        onLessonClick={handleLessonClick}
        onMissionClick={handleMissionClick}
        onComplete={handleCompleteTier4}
      />
    )
  }

  // Module Viewer
  if (currentView === 'module-viewer' && currentModule) {
    return (
      <Tier4ModuleViewer
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
          await loadTier4Data()
          setCurrentView('dashboard')
        }}
      />
    )
  }

  // Mission Hub
  if (currentView === 'mission-hub' && currentMission) {
    return (
      <Tier4MissionHub
        mission={currentMission}
        onBack={() => {
          setCurrentView('dashboard')
          setCurrentMission(null)
        }}
        onSubtaskClick={handleSubtaskClick}
        onFeedbackClick={() => setCurrentView('mission-feedback')}
      />
    )
  }

  // Subtask Execution
  if (currentView === 'subtask-execution' && currentMission && currentSubtask !== null) {
    return (
      <Tier4SubtaskExecution
        mission={currentMission}
        subtaskId={currentSubtask}
        onBack={() => setCurrentView('mission-hub')}
        onUploadClick={() => setCurrentView('evidence-upload')}
      />
    )
  }

  // Evidence Upload
  if (currentView === 'evidence-upload' && currentMission && currentSubtask !== null) {
    return (
      <Tier4EvidenceUpload
        mission={currentMission}
        subtaskId={currentSubtask}
        onBack={() => setCurrentView('subtask-execution')}
        onComplete={() => setCurrentView('subtask-execution')}
      />
    )
  }

  // Mission Feedback
  if (currentView === 'mission-feedback' && currentMission) {
    return (
      <Tier4MissionFeedback
        mission={currentMission}
        onBack={() => setCurrentView('mission-hub')}
      />
    )
  }

  // Reflection
  if (currentView === 'reflection' && currentMission) {
    return (
      <Tier4ReflectionScreen
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
      <Tier4CompletionScreen
        track={track}
        tier4Status={tier4Status}
        onComplete={handleCompleteTier4}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  return null
}

// Advanced Tracks Dashboard Component
function Tier4Dashboard({
  track,
  trackCode,
  tier4Status,
  modules,
  progress,
  onModuleClick,
  onLessonClick,
  onMissionClick,
  onComplete,
}: {
  track: any
  trackCode: string
  tier4Status: Tier4Status
  modules: any[]
  progress: any
  onModuleClick: (moduleId: string) => void
  onLessonClick: (lesson: Lesson) => void
  onMissionClick: (mission: any) => void
  onComplete: () => void
}) {
  const completionPct = tier4Status.completion_percentage
  const req = tier4Status.requirements
  const isFlexible = tier4Status.progression_mode === 'flexible'

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
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{track?.name || 'Advanced Track'}</h1>
                <p className="text-gray-400">Master advanced cybersecurity skills through real-world missions</p>
              </div>
              <Badge variant="outline" className="bg-och-gold/10 text-och-gold border-och-gold/30">
                <Shield className="w-4 h-4 mr-2" />
                Advanced Tier
              </Badge>
            </div>

            {/* Progress Overview */}
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Track Progress</h2>
                <span className="text-2xl font-bold text-och-mint">{completionPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-och-steel/30 rounded-full h-3 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-och-orange to-och-mint h-3 rounded-full"
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
                  <div className="text-2xl font-bold text-white">{req.advanced_missions_approved}/{req.advanced_missions_total}</div>
                  <div className="text-sm text-gray-400">Missions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{req.feedback_cycles_complete}/{req.advanced_missions_total}</div>
                  <div className="text-sm text-gray-400">Reviewed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{req.reflections_submitted}/{req.reflections_required}</div>
                  <div className="text-sm text-gray-400">Reflections</div>
                </div>
              </div>
            </Card>

            {/* Requirements Status */}
            {tier4Status.missing_requirements.length > 0 && (
              <Card className="p-6 bg-yellow-500/10 border-yellow-500/30">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Requirements to Complete
                </h3>
                <ul className="space-y-2">
                  {tier4Status.missing_requirements.map((req, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
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

            {/* Advanced Missions Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-och-orange" />
                Advanced Missions
              </h2>
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <p className="text-gray-300 mb-4">
                  Complete {req.advanced_missions_total} advanced missions to master this track. Each mission includes multi-phase subtasks, evidence uploads, and mentor review.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* TODO: Load and display actual missions */}
                  <div className="p-4 rounded-lg bg-white/5 border border-och-steel/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">Mission Placeholder</h4>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        Approved
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">Advanced mission with 4-8 subtasks</p>
                    <Button
                      size="sm"
                      onClick={() => onMissionClick({ id: 'placeholder', title: 'Placeholder Mission' })}
                    >
                      View Mission
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Completion Button */}
            {tier4Status.is_complete && tier4Status.tier4_completion_requirements_met && (
              <Card className="p-6 bg-gradient-to-r from-och-orange/20 to-och-mint/20 border-och-orange/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Track Complete!</h3>
                    <p className="text-gray-300">You've mastered this Advanced Track. Ready for Mastery Tier?</p>
                  </div>
                  <Button onClick={onComplete} size="lg" className="bg-och-orange hover:bg-och-orange/80">
                    Unlock Mastery Tier
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

// Placeholder components - to be implemented
function Tier4ModuleViewer({ trackCode, module, currentLesson, onBack, onLessonClick, onComplete }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">{module.title}</h2>
          <p className="text-gray-300">Module viewer - Advanced mode (to be implemented)</p>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier4MissionHub({ mission, onBack, onSubtaskClick, onFeedbackClick }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">{mission.title}</h2>
          <p className="text-gray-300">Advanced Mission Hub (to be implemented)</p>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier4SubtaskExecution({ mission, subtaskId, onBack, onUploadClick }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mission
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">Subtask {subtaskId}</h2>
          <p className="text-gray-300">Subtask Execution Screen (to be implemented)</p>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier4EvidenceUpload({ mission, subtaskId, onBack, onComplete }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">Upload Evidence</h2>
          <p className="text-gray-300">Evidence Upload Modal (to be implemented)</p>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier4MissionFeedback({ mission, onBack }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">Mission Feedback</h2>
          <p className="text-gray-300">Mission Feedback & Scoring (to be implemented)</p>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier4ReflectionScreen({ mission, onBack, onSubmit }: any) {
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

function Tier4CompletionScreen({ track, tier4Status, onComplete, onBack }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Trophy className="w-24 h-24 text-och-gold mx-auto mb-6" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">Track Complete!</h1>
            <p className="text-xl text-gray-300 mb-2">Advanced Level Track</p>
            <p className="text-gray-400 mb-8">You've mastered {track?.name || 'this Advanced Track'}</p>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-gray-300 mb-2">You're Ready for the Next Level</p>
                <p className="text-och-mint font-semibold">Mastery Level Unlocked</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={onBack} variant="outline">
                  Review Progress
                </Button>
                <Button onClick={onComplete} size="lg" className="bg-och-orange hover:bg-och-orange/80">
                  Continue to Mastery Level
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
        </Card>
      </div>
    </RouteGuard>
  )
}
