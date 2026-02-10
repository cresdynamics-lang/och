/**
 * Beginner Tracks Track Page
 * 
 * Comprehensive Beginner Tracks implementation.
 * Provides track dashboard, module viewer, quizzes, reflections, mini-missions, and completion flow.
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { curriculumClient, Tier2Status } from '@/services/curriculumClient'
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  PlayCircle,
  FileText,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight,
  ArrowLeft,
  Clock,
  Target,
  Award,
  Sparkles,
  Brain,
  MessageSquare,
  Rocket,
  Loader2,
  AlertCircle,
  BarChart3,
  Trophy,
  Users,
  Zap,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import Link from 'next/link'
import type { CurriculumModuleDetail, Lesson, ModuleMission } from '@/services/types/curriculum'

type Tier2View = 'dashboard' | 'module-viewer' | 'quiz' | 'reflection' | 'mini-mission-preview' | 'mini-mission-submit' | 'completion' | 'resources' | 'sample-report' | 'mentor-feedback'

export default function Tier2TrackPage() {
  const params = useParams()
  const router = useRouter()
  const trackCode = params?.trackCode as string
  const { user, isLoading: authLoading } = useAuth()
  
  const [tier2Status, setTier2Status] = useState<Tier2Status | null>(null)
  const [currentView, setCurrentView] = useState<Tier2View>('dashboard')
  const [currentModule, setCurrentModule] = useState<CurriculumModuleDetail | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentMiniMission, setCurrentMiniMission] = useState<ModuleMission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const {
    track,
    progress,
    modules,
    loading: trackLoading,
    error: trackError,
    enrollInTrack,
    refetch,
  } = useCurriculumProgress(String(user?.id || ''), { trackCode })

  useEffect(() => {
    if (!authLoading && user && trackCode) {
      loadTier2Data()
    }
  }, [authLoading, user, trackCode, track])

  const loadTier2Data = async () => {
    try {
      setLoading(true)
      
      // Check if track is Beginner level
      if (track && track.tier !== 2) {
        setError('This page is only for Beginner level tracks')
        setLoading(false)
        return
      }

      // Load Beginner level status
      const status = await curriculumClient.getTier2Status(trackCode)
      setTier2Status(status)

      // If complete, show completion screen
      if (status.is_complete && status.tier2_completion_requirements_met) {
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
      // Start the module first to ensure progress entry exists
      await curriculumClient.startModule(moduleId)
      
      const module = await curriculumClient.getModule(moduleId)
      setCurrentModule(module)
      setCurrentView('module-viewer')
      
      // Refresh local progress to show module as in-progress
      await refetch()
    } catch (err: any) {
      setError(err.message || 'Failed to load module')
    }
  }

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    if (lesson.lesson_type === 'quiz') {
      setCurrentView('quiz')
    } else {
      // For videos/guides, show in module viewer
      setCurrentView('module-viewer')
    }
  }

  const handleQuizSubmit = async (score: number, answers: Record<string, any>) => {
    if (!currentLesson || !tier2Status) return

    try {
      const result = await curriculumClient.submitTier2Quiz(trackCode, {
        lesson_id: currentLesson.id,
        score,
        answers,
      })

      // Reload Beginner level status
      await loadTier2Data()

      // If complete, show completion
      if (result.is_complete) {
        setCurrentView('completion')
      } else {
        // Return to module viewer
        setCurrentView('module-viewer')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz')
    }
  }

  const handleReflectionSubmit = async (reflectionText: string) => {
    if (!currentModule || !tier2Status) return

    try {
      const result = await curriculumClient.submitTier2Reflection(trackCode, {
        module_id: currentModule.id,
        reflection_text: reflectionText,
      })

      // Reload Beginner level status
      await loadTier2Data()

      // Return to dashboard
      setCurrentView('dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to submit reflection')
    }
  }

  const handleMiniMissionClick = (mission: ModuleMission) => {
    setCurrentMiniMission(mission)
    setCurrentView('mini-mission-preview')
  }

  const handleMiniMissionSubmit = async (submissionData: Record<string, any>) => {
    if (!currentMiniMission || !tier2Status) return

    try {
      const result = await curriculumClient.submitTier2MiniMission(trackCode, {
        module_mission_id: currentMiniMission.id,
        submission_data: submissionData,
      })

      // Reload Beginner level status
      await loadTier2Data()

      // If complete, show completion
      if (result.is_complete) {
        setCurrentView('completion')
      } else {
        // Return to dashboard
        setCurrentView('dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit mini-mission')
    }
  }

  const handleCompleteTier2 = async () => {
    try {
      await curriculumClient.completeTier2(trackCode)
      
      // Redirect to curriculum page with success message
      router.push(`/dashboard/student/curriculum?tier2_complete=${trackCode}`)
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
              <div className="text-white text-lg">Loading track...</div>
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

  if (!tier2Status) {
    return null
  }

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <Tier2Dashboard
        track={track}
        trackCode={trackCode}
        tier2Status={tier2Status}
        modules={modules}
        progress={progress}
        onModuleClick={handleModuleClick}
        onLessonClick={handleLessonClick}
        onMiniMissionClick={handleMiniMissionClick}
        onReflectionClick={(module) => {
          setCurrentModule(module as any)
          setCurrentView('reflection')
        }}
        onComplete={handleCompleteTier2}
        onOpenResources={() => setCurrentView('resources')}
        onOpenSampleReport={() => setCurrentView('sample-report')}
        onOpenMentorFeedback={() => setCurrentView('mentor-feedback')}
      />
    )
  }

  // Mentor Feedback (learner view: comments from mentor on tasks)
  if (currentView === 'mentor-feedback') {
    return (
      <Tier2MentorFeedbackScreen
        trackCode={trackCode}
        trackName={track?.name}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Resources / Glossary / What to expect next
  if (currentView === 'resources') {
    return (
      <Tier2ResourcesScreen
        trackCode={trackCode}
        trackName={track?.name}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Sample mission report (modal-style or full view)
  if (currentView === 'sample-report') {
    return (
      <Tier2SampleReportScreen
        trackCode={trackCode}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Module Viewer
  if (currentView === 'module-viewer' && currentModule) {
    return (
      <Tier2ModuleViewer
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
          await loadTier2Data()
          setCurrentView('dashboard')
        }}
      />
    )
  }

  // Quiz View
  if (currentView === 'quiz' && currentLesson) {
    return (
      <Tier2QuizScreen
        lesson={currentLesson}
        onBack={() => setCurrentView('module-viewer')}
        onSubmit={handleQuizSubmit}
      />
    )
  }

  // Reflection View
  if (currentView === 'reflection' && currentModule) {
    return (
      <Tier2ReflectionScreen
        module={currentModule}
        onBack={() => {
          setCurrentView('dashboard')
          setCurrentModule(null)
        }}
        onSubmit={handleReflectionSubmit}
      />
    )
  }

  // Mini-Mission Preview
  if (currentView === 'mini-mission-preview' && currentMiniMission) {
    return (
      <Tier2MiniMissionPreview
        mission={currentMiniMission}
        onBack={() => {
          setCurrentView('dashboard')
          setCurrentMiniMission(null)
        }}
        onStart={() => setCurrentView('mini-mission-submit')}
      />
    )
  }

  // Mini-Mission Submit
  if (currentView === 'mini-mission-submit' && currentMiniMission) {
    return (
      <Tier2MiniMissionSubmit
        mission={currentMiniMission}
        onBack={() => setCurrentView('mini-mission-preview')}
        onSubmit={handleMiniMissionSubmit}
      />
    )
  }

  // Completion View
  if (currentView === 'completion') {
    return (
      <Tier2CompletionScreen
        track={track}
        tier2Status={tier2Status}
        onComplete={handleCompleteTier2}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  return null
}

// Beginner Tracks Dashboard Component (with persistent sidebar)
function Tier2Dashboard({
  track,
  trackCode,
  tier2Status,
  modules,
  progress,
  onModuleClick,
  onLessonClick,
  onMiniMissionClick,
  onReflectionClick,
  onComplete,
  onOpenResources,
  onOpenSampleReport,
}: {
  track: any
  trackCode: string
  tier2Status: Tier2Status
  modules: any[]
  progress: any
  onModuleClick: (moduleId: string) => void
  onLessonClick: (lesson: Lesson) => void
  onMiniMissionClick: (mission: ModuleMission) => void
  onReflectionClick: (module: any) => void
  onComplete: () => void
  onOpenResources: () => void
  onOpenSampleReport: () => void
  onOpenMentorFeedback: () => void
}) {
  const completionPct = tier2Status.completion_percentage
  const req = tier2Status.requirements
  const isFlexible = tier2Status.progression_mode === 'flexible'

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex">
        {/* Persistent sidebar - track modules + nav */}
        <aside className="w-64 shrink-0 border-r border-och-steel/30 bg-och-midnight/80 hidden lg:block">
          <div className="sticky top-4 p-4 space-y-4">
            <Link href="/dashboard/student/curriculum">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white w-full justify-start">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Curriculum
              </Button>
            </Link>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Track modules</div>
            <nav className="space-y-1">
              {modules.map((module, index) => {
                const locked = !isFlexible && module.order_index > 0 && (modules[index - 1]?.completion_percentage ?? 0) < 100
                const done = module.completion_percentage === 100
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => !locked && onModuleClick(module.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                      locked ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-white/10'
                    } ${done ? 'text-och-mint' : ''}`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <BookOpen className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{module.title}</span>
                  </button>
                )
              })}
            </nav>
            <div className="border-t border-och-steel/30 pt-4 space-y-1">
              <button
                type="button"
                onClick={onOpenResources}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 shrink-0" />
                Resources &amp; Glossary
              </button>
              <button
                type="button"
                onClick={onOpenSampleReport}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 shrink-0" />
                View sample report
              </button>
              <button
                type="button"
                onClick={onOpenMentorFeedback}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                Mentor feedback
              </button>
            </div>
          </div>
        </aside>
        <div className="flex-1 px-4 py-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header - mobile back button (sidebar has back on lg) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="lg:hidden mb-4">
              <Link href="/dashboard/student/curriculum">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Curriculum
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="gold" className="mb-2">Intermediate Level Track</Badge>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                  {track.name}
                </h1>
                <p className="text-gray-300">{track.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-och-mint mb-1">
                  {Math.round(completionPct)}%
                </div>
                <div className="text-sm text-gray-400">Complete</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-3 mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-och-orange to-och-crimson h-3 rounded-full"
              />
            </div>
          </motion.div>

          {/* Requirements Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Modules</span>
                <BookOpen className="w-4 h-4 text-och-gold" />
              </div>
              <div className="text-2xl font-black text-white">
                {req.mandatory_modules_completed} / {req.mandatory_modules_total}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {req.mandatory_modules_completed === req.mandatory_modules_total ? (
                  <span className="text-och-mint">✓ Complete</span>
                ) : (
                  <span>{req.mandatory_modules_total - req.mandatory_modules_completed} remaining</span>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Quizzes</span>
                <Brain className="w-4 h-4 text-och-mint" />
              </div>
              <div className="text-2xl font-black text-white">
                {req.quizzes_passed} / {req.quizzes_total}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {req.quizzes_passed === req.quizzes_total ? (
                  <span className="text-och-mint">✓ All Passed</span>
                ) : (
                  <span>{req.quizzes_total - req.quizzes_passed} remaining</span>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Mini-Missions</span>
                <Target className="w-4 h-4 text-och-orange" />
              </div>
              <div className="text-2xl font-black text-white">
                {req.mini_missions_completed} / {req.mini_missions_total}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(req.mini_missions_required ?? 1) <= req.mini_missions_completed ? (
                  <span className="text-och-mint">✓ Minimum Met</span>
                ) : (
                  <span>At least {req.mini_missions_required ?? 1} required</span>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-och-midnight/60 border border-och-steel/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Reflections</span>
                <MessageSquare className="w-4 h-4 text-och-defender" />
              </div>
              <div className="text-2xl font-black text-white">
                {req.reflections_submitted}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Submitted
              </div>
            </Card>
          </motion.div>

          {/* Optional: Milestone badges */}
          {(req.mandatory_modules_completed >= 1 || req.quizzes_passed >= 1 || req.mini_missions_completed >= 1 || req.reflections_submitted >= 1) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {req.mandatory_modules_completed >= 1 && (
                <Badge variant="gold" className="text-xs">First module completed</Badge>
              )}
              {req.quizzes_passed >= 1 && (
                <Badge variant="mint" className="text-xs">First quiz passed</Badge>
              )}
              {req.mini_missions_completed >= 1 && (
                <Badge variant="orange" className="text-xs">Mini-mission done</Badge>
              )}
              {req.reflections_submitted >= 1 && (
                <Badge variant="defender" className="text-xs">Reflection submitted</Badge>
              )}
            </motion.div>
          )}

          {/* Mentor notes (when any module has notes) */}
          {modules.some((m) => m.mentor_notes?.trim()) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-och-mint" />
                  Mentor notes
                </h3>
                <div className="space-y-3">
                  {modules
                    .filter((m) => m.mentor_notes?.trim())
                    .map((m) => (
                      <div key={m.id} className="border-l-2 border-och-mint/50 pl-4">
                        <div className="text-och-mint text-sm font-medium mb-1">{m.title}</div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{m.mentor_notes}</p>
                      </div>
                    ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Missing Requirements Alert */}
          {tier2Status.missing_requirements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card className="p-6 bg-amber-500/10 border-2 border-amber-500/30">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-2">Complete These Requirements to Finish This Track:</h3>
                    <ul className="space-y-1">
                      {tier2Status.missing_requirements.map((req, idx) => (
                        <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Modules List */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-och-gold" />
              Track Modules
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module, index) => {
                const isLocked = !isFlexible && (module.isLocked || (
                  module.order_index > 0 &&
                  (modules[index - 1]?.completion_percentage ?? 0) < 100
                ))
                const isCompleted = module.completion_percentage === 100

                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                        isCompleted
                          ? 'bg-och-mint/20 border-2 border-och-mint/50'
                          : isLocked
                          ? 'bg-och-midnight/40 border border-och-steel/20 opacity-60'
                          : 'bg-och-midnight/60 border border-och-steel/20'
                      }`}
                      onClick={() => !isLocked && onModuleClick(module.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {isLocked ? (
                            <Lock className="w-6 h-6 text-gray-500" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-och-mint" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-och-gold" />
                          )}
                          <div>
                            <h3 className="text-white font-bold text-lg">{module.title}</h3>
                            {module.is_required && (
                              <Badge variant="steel" className="text-xs mt-1">Required</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{module.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-4">
                          <span>{module.lesson_count} lessons</span>
                          {module.mission_count > 0 && (
                            <span>{module.mission_count} missions</span>
                          )}
                        </div>
                        {module.estimated_time_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{module.estimated_time_minutes} min</span>
                          </div>
                        )}
                      </div>
                      {!isLocked && (
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-och-orange to-och-crimson h-2 rounded-full transition-all"
                            style={{ width: `${module.completion_percentage}%` }}
                          />
                        </div>
                      )}
                      {isLocked && (
                        <div className="text-center text-gray-500 text-xs mt-2">
                          Complete previous modules to unlock
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Complete Button */}
          {tier2Status.can_progress_to_tier3 && (
            <div className="text-center">
              <Button
                onClick={onComplete}
                variant="mint"
                size="lg"
                className="font-black uppercase tracking-widest text-lg px-12 py-4"
                glow
              >
                <Rocket className="w-5 h-5 mr-2" />
                Complete & Unlock Next Level
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </RouteGuard>
  )
}

// Beginner Tracks Mentor Feedback Screen (learner view: list feedback by task)
function Tier2MentorFeedbackScreen({
  trackCode,
  trackName,
  onBack,
}: {
  trackCode: string
  trackName?: string
  onBack: () => void
}) {
  const [feedback, setFeedback] = useState<Array<{
    id: number
    comment_text: string
    lesson_title: string | null
    module_title: string | null
    created_at: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    curriculumClient.getTier2Feedback(trackCode).then((r) => setFeedback(r.feedback || [])).catch(() => setFeedback([])).finally(() => setLoading(false))
  }, [trackCode])

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button onClick={onBack} variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Track
          </Button>
          <Card className="p-8 bg-och-midnight/90 border border-och-steel/20">
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-och-mint" />
              Mentor feedback
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              {trackName ? `Feedback from your mentor for ${trackName}` : 'Comments and notes from your mentor on your work.'}
            </p>
            {loading && <p className="text-gray-400">Loading feedback…</p>}
            {!loading && feedback.length === 0 && (
              <p className="text-gray-400">No mentor feedback yet. Complete lessons and mini-missions to receive feedback.</p>
            )}
            {!loading && feedback.length > 0 && (
              <ul className="space-y-4">
                {feedback.map((f) => (
                  <li key={f.id} className="border border-och-steel/20 rounded-lg p-4 bg-och-midnight/50">
                    <div className="flex items-center gap-2 text-och-mint text-sm mb-2">
                      {(f.module_title || f.lesson_title) && (
                        <span>{[f.module_title, f.lesson_title].filter(Boolean).join(' — ')}</span>
                      )}
                      <span className="text-gray-500 text-xs">
                        {new Date(f.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{f.comment_text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}

// Beginner Tracks Resources / Glossary / What to expect next
function Tier2ResourcesScreen({
  trackCode,
  trackName,
  onBack,
}: {
  trackCode: string
  trackName?: string
  onBack: () => void
}) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button onClick={onBack} variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Track
          </Button>
          <Card className="p-8 bg-och-midnight/90 border border-och-steel/20">
            <h1 className="text-2xl font-bold text-white mb-2">Resources &amp; Glossary</h1>
            <p className="text-gray-400 text-sm mb-6">
              {trackName ? `Supporting materials for ${trackName}` : 'Key terms and resources for this track.'}
            </p>
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-och-mint mb-3">Glossary</h2>
              <p className="text-gray-300 text-sm mb-4">
                Key terms are introduced in each module. Use this space as a quick reference for definitions and concepts as you progress.
              </p>
              <ul className="text-gray-300 text-sm space-y-2 list-disc list-inside">
                <li>Core concepts are defined in the module viewer</li>
                <li>Quizzes reinforce terminology</li>
                <li>Bookmark lessons for later review</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-och-mint mb-3">Downloadable cheat sheets</h2>
              <p className="text-gray-300 text-sm">
                Cheat sheets will be available per module as you complete content. Check back after finishing each module.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-och-mint mb-3">What to expect next</h2>
              <p className="text-gray-300 text-sm mb-2">
                After completing this Beginner track you will:
              </p>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>Unlock the next level</li>
                <li>See preview of upcoming Intermediate missions</li>
                <li>Access the required recipes list for your next level</li>
                <li>Continue building portfolio artifacts</li>
              </ul>
            </section>
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}

// Beginner Tracks Sample mission report view
function Tier2SampleReportScreen({ trackCode, onBack }: { trackCode: string; onBack: () => void }) {
  const [report, setReport] = useState<{ title: string; description: string; sections: Array<{ heading: string; content: string }>; tip: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    curriculumClient.getTier2SampleReport(trackCode).then(setReport).catch(() => setReport(null)).finally(() => setLoading(false))
  }, [trackCode])

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button onClick={onBack} variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Track
          </Button>
          <Card className="p-8 bg-och-midnight/90 border border-och-steel/20">
            {loading && <p className="text-gray-400">Loading sample report…</p>}
            {!loading && report && (
              <>
                <h1 className="text-2xl font-bold text-white mb-2">{report.title}</h1>
                <p className="text-gray-400 text-sm mb-6">{report.description}</p>
                <div className="space-y-4 mb-6">
                  {report.sections.map((s, i) => (
                    <div key={i}>
                      <h3 className="text-och-mint font-semibold mb-1">{s.heading}</h3>
                      <p className="text-gray-300 text-sm">{s.content}</p>
                    </div>
                  ))}
                </div>
                <p className="text-och-gold text-sm border-l-2 border-och-gold/50 pl-4">{report.tip}</p>
              </>
            )}
            {!loading && !report && <p className="text-gray-400">Could not load sample report.</p>}
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}

// Beginner Tracks Module Viewer Component
function Tier2ModuleViewer({
  trackCode,
  module,
  currentLesson,
  onBack,
  onLessonClick,
  onComplete,
}: {
  trackCode: string
  module: CurriculumModuleDetail
  currentLesson?: Lesson | null
  onBack: () => void
  onLessonClick: (lesson: Lesson) => void
  onComplete: () => void
}) {
  const [watchPercentage, setWatchPercentage] = useState(0)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    curriculumClient.getBookmarks(trackCode).then((r) => setBookmarkedIds(new Set(r.bookmarks.map((b) => b.lesson_id)))).catch(() => {})
  }, [trackCode])

  const toggleBookmark = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation()
    const isBookmarked = bookmarkedIds.has(lessonId)
    try {
      if (isBookmarked) {
        await curriculumClient.removeLessonBookmark(lessonId)
        setBookmarkedIds((prev) => { const s = new Set(prev); s.delete(lessonId); return s })
      } else {
        await curriculumClient.addLessonBookmark(lessonId)
        setBookmarkedIds((prev) => new Set(prev).add(lessonId))
      }
    } catch (_) {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 bg-och-midnight/90">
          <h1 className="text-3xl font-black text-white mb-4">{module.title}</h1>
          <p className="text-gray-300 mb-6">{module.description}</p>

          {/* Lessons List */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Lessons</h2>
            <div className="space-y-3">
              {module.lessons?.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-2 w-full p-4 bg-white/5 rounded-lg border border-och-steel/20 hover:bg-white/10 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => onLessonClick(lesson)}
                    className="flex-1 text-left flex items-center justify-between min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {lesson.lesson_type === 'video' && <PlayCircle className="w-5 h-5 text-och-orange shrink-0" />}
                      {lesson.lesson_type === 'quiz' && <Brain className="w-5 h-5 text-och-mint shrink-0" />}
                      {lesson.lesson_type === 'guide' && <FileText className="w-5 h-5 text-och-gold shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{lesson.title}</div>
                        <div className="text-gray-400 text-sm truncate">{lesson.description}</div>
                      </div>
                    </div>
                    {lesson.is_completed && (
                      <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0 ml-2" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleBookmark(e, lesson.id)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-och-gold shrink-0"
                    title={bookmarkedIds.has(lesson.id) ? 'Remove bookmark' : 'Save for later'}
                  >
                    {bookmarkedIds.has(lesson.id) ? <BookmarkCheck className="w-5 h-5 text-och-gold" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Current Lesson Content */}
          {currentLesson && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">{currentLesson.title}</h2>
              
              {currentLesson.lesson_type === 'video' && currentLesson.content_url && (
                <div className="mb-6">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <iframe
                      src={currentLesson.content_url}
                      className="w-full h-full"
                      allowFullScreen
                      onLoad={() => setWatchPercentage(100)}
                    />
                  </div>
                  <div className="text-sm text-gray-400">
                    Video progress: {watchPercentage}%
                  </div>
                </div>
              )}

              {currentLesson.lesson_type === 'guide' && currentLesson.content_url && (
                <div className="prose prose-invert max-w-none">
                  <iframe
                    src={currentLesson.content_url}
                    className="w-full h-96 rounded-lg border border-och-steel/20"
                  />
                </div>
              )}

              {/* Summary (lesson description) */}
              {currentLesson.description?.trim() && (
                <section className="mt-6 p-4 rounded-lg bg-white/5 border border-och-steel/20">
                  <h3 className="text-och-mint font-semibold mb-2">Summary</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{currentLesson.description}</p>
                </section>
              )}

              {/* Resources (module recipes / supporting materials) */}
              {(module.recipe_recommendations?.length ?? 0) > 0 && (
                <section className="mt-6 p-4 rounded-lg bg-white/5 border border-och-steel/20">
                  <h3 className="text-och-mint font-semibold mb-2">Resources</h3>
                  <p className="text-gray-400 text-sm mb-3">Supporting materials and recipes for this module:</p>
                  <ul className="space-y-2">
                    {module.recipe_recommendations?.map((r: { id: string; recipe_title?: string; recipe_description?: string }) => (
                      <li key={r.id} className="text-gray-300 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-och-gold shrink-0" />
                        <span>{r.recipe_title ?? r.recipe_description ?? 'Recipe'}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Complete Module Button */}
          <div className="flex gap-4">
            <Button
              onClick={onComplete}
              variant="mint"
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Module as Complete
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Beginner Tracks Quiz Screen Component
function Tier2QuizScreen({
  lesson,
  onBack,
  onSubmit,
}: {
  lesson: Lesson
  onBack: () => void
  onSubmit: (score: number, answers: Record<string, any>) => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [passed, setPassed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load questions from lesson content_url or use default structure
  // TODO: In production, load actual quiz questions from lesson.content_url or quiz API
  const questions = lesson.content_url 
    ? [] // Will be loaded from content_url
    : [
        { 
          id: 'q1', 
          question: 'What is the main concept covered in this lesson?', 
          options: [
            { id: 'a', label: 'Option A' },
            { id: 'b', label: 'Option B' },
            { id: 'c', label: 'Option C' },
            { id: 'd', label: 'Option D' }
          ],
          correct_answer: 'a'
        },
      ]

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      setError('Please answer all questions before submitting.')
      return
    }

    setSubmitting(true)
    setError(null)
    
    try {
      // Calculate score based on correct answers
      let correctCount = 0
      questions.forEach((q: any) => {
        if (answers[q.id] === q.correct_answer) {
          correctCount++
        }
      })
      const calculatedScore = Math.round((correctCount / questions.length) * 100)
      const isPassed = calculatedScore >= 70
      
      setScore(calculatedScore)
      setPassed(isPassed)
      setSubmitted(true)
      
      // Call onSubmit callback
      await onSubmit(calculatedScore, answers)
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(null)
    setPassed(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8">
          <h1 className="text-3xl font-black text-white mb-6">Knowledge Check Quiz</h1>
          <p className="text-gray-400 mb-8">{lesson.title}</p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {submitted && score !== null ? (
            <div className="space-y-6 mb-8">
              <div className={`p-6 rounded-lg border-2 ${
                passed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="text-center">
                  <h2 className={`text-3xl font-bold mb-2 ${
                    passed ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {passed ? '✓ Passed!' : '✗ Not Passed'}
                  </h2>
                  <p className="text-white text-2xl font-semibold mb-2">Score: {score}%</p>
                  <p className="text-gray-300 text-sm">
                    {passed 
                      ? 'Congratulations! You passed the quiz. You can continue to the next lesson.'
                      : `You scored ${score}%. You need 70% to pass. Review the material and try again.`
                    }
                  </p>
                </div>
              </div>
              
              {!passed && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Review Your Answers:</h3>
                  {questions.map((q: any) => {
                    const userAnswer = answers[q.id]
                    const isCorrect = userAnswer === q.correct_answer
                    return (
                      <div key={q.id} className={`p-4 rounded-lg border ${
                        isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <p className="text-white font-medium mb-2">{q.question}</p>
                        <p className={`text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                          Your answer: {q.options.find((o: any) => o.id === userAnswer)?.label || 'Not answered'}
                          {!isCorrect && (
                            <span className="block mt-1 text-green-300">
                              Correct answer: {q.options.find((o: any) => o.id === q.correct_answer)?.label}
                            </span>
                          )}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-8">
                {questions.length > 0 ? (
                  questions.map((q: any) => (
                    <div key={q.id}>
                      <p className="text-white font-semibold mb-3">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt: any) => {
                          const optionId = typeof opt === 'string' ? opt : opt.id
                          const optionLabel = typeof opt === 'string' ? `Option ${opt}` : opt.label
                          return (
                            <label
                              key={optionId}
                              className={`flex items-center gap-3 p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 border transition-all ${
                                answers[q.id] === optionId 
                                  ? 'border-och-orange bg-och-orange/10' 
                                  : 'border-och-steel/20'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={optionId}
                                checked={answers[q.id] === optionId}
                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                className="accent-och-orange"
                                disabled={submitting}
                              />
                              <span className="text-gray-300">{optionLabel}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                      Quiz questions are loading from lesson content. If questions don't appear, please check back later.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="mint"
                  className="flex-1"
                  disabled={submitting || Object.keys(answers).length !== questions.length || questions.length === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </Button>
              </div>
            </>
          )}

          {submitted && !passed && (
            <div className="mt-6">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                Retry Quiz
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Beginner Tracks Reflection Screen Component
function Tier2ReflectionScreen({
  module,
  onBack,
  onSubmit,
}: {
  module: CurriculumModuleDetail
  onBack: () => void
  onSubmit: (reflectionText: string) => void
}) {
  const [reflectionText, setReflectionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reflectionText.trim()) return
    
    setSubmitting(true)
    await onSubmit(reflectionText)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8">
          <h1 className="text-3xl font-black text-white mb-4">Reflection</h1>
          <p className="text-gray-400 mb-2">Module: {module.title}</p>
          <p className="text-gray-300 mb-6">
            Take a moment to reflect on what you've learned. Your reflection will be stored in your portfolio.
          </p>
          
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              What are your key takeaways from this module?
            </label>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              className="w-full h-48 bg-och-midnight border border-och-steel/30 rounded-lg p-4 text-white"
              placeholder="Share your thoughts and insights..."
            />
          </div>

          <Button
            onClick={handleSubmit}
            variant="mint"
            className="w-full"
            disabled={submitting || !reflectionText.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Reflection'}
          </Button>
        </Card>
      </div>
    </div>
  )
}

// Beginner Tracks Mini-Mission Preview Component
function Tier2MiniMissionPreview({
  mission,
  onBack,
  onStart,
}: {
  mission: ModuleMission
  onBack: () => void
  onStart: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8 bg-och-midnight/90">
          <div className="text-center mb-8">
            <Target className="w-16 h-16 text-och-orange mx-auto mb-4" />
            <h1 className="text-3xl font-black text-white mb-4">Mini-Mission</h1>
            <h2 className="text-2xl font-bold text-och-gold mb-4">{mission.mission_title || 'Beginner Mission'}</h2>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-white font-bold mb-2">Context</h3>
              <p className="text-gray-300">
                This is a beginner-level mini-mission designed to build confidence and apply core concepts from the module.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">Expected output</h3>
              <p className="text-gray-300">
                Submit a short description of what you did and, if possible, a link to evidence (e.g. GitHub repo, screenshot, or report). Your mentor may review and leave feedback.
              </p>
            </div>

            {mission.mission_estimated_hours && (
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Estimated time: {mission.mission_estimated_hours} hours</span>
              </div>
            )}

            {mission.mission_difficulty && (
              <div>
                <Badge variant="steel">Difficulty: {mission.mission_difficulty}</Badge>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button onClick={onBack} variant="outline" className="flex-1">
              Back
            </Button>
            <Button onClick={onStart} variant="mint" className="flex-1">
              <Rocket className="w-4 h-4 mr-2" />
              Start Mission
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Beginner Tracks Mini-Mission Submit Component
function Tier2MiniMissionSubmit({
  mission,
  onBack,
  onSubmit,
}: {
  mission: ModuleMission
  onBack: () => void
  onSubmit: (submissionData: Record<string, any>) => void
}) {
  const [submissionData, setSubmissionData] = useState({
    description: '',
    evidence_url: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(submissionData)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Preview
        </Button>
        <Card className="p-8 bg-och-midnight/90">
          <h1 className="text-3xl font-black text-white mb-6">Submit Mini-Mission</h1>
          <p className="text-gray-300 mb-8">{mission.mission_title}</p>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-white font-semibold mb-2">
                Description of your work <span className="text-och-crimson">*</span>
              </label>
              <textarea
                value={submissionData.description}
                onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                className="w-full h-32 bg-och-midnight border border-och-steel/30 rounded-lg p-4 text-white"
                placeholder="Describe what you accomplished (required)..."
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Evidence URL (GitHub, screenshot, etc.)
              </label>
              <input
                type="url"
                value={submissionData.evidence_url}
                onChange={(e) => setSubmissionData({ ...submissionData, evidence_url: e.target.value })}
                className="w-full bg-och-midnight border border-och-steel/30 rounded-lg p-4 text-white"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Additional Notes
              </label>
              <textarea
                value={submissionData.notes}
                onChange={(e) => setSubmissionData({ ...submissionData, notes: e.target.value })}
                className="w-full h-24 bg-och-midnight border border-och-steel/30 rounded-lg p-4 text-white"
                placeholder="Any additional notes or reflections..."
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            variant="mint"
            className="w-full"
            disabled={submitting || !submissionData.description.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Mini-Mission'}
          </Button>
        </Card>
      </div>
    </div>
  )
}

// Beginner Tracks Completion Screen Component
function Tier2CompletionScreen({
  track,
  tier2Status,
  onComplete,
  onBack,
}: {
  track: any
  tier2Status: Tier2Status
  onComplete: () => void
  onBack: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center"
      >
        <Card className="p-12 bg-och-midnight/90 border-2 border-och-mint/50">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring" }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-och-mint to-och-gold mb-6"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Track complete!
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Congratulations! You've completed the {track.name} Beginner Level track.
          </p>
          <p className="text-lg font-semibold text-och-mint mb-8">
            You're Ready for the Next Level.
          </p>

          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h3 className="text-white font-bold mb-4">What You've Achieved:</h3>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-2xl font-black text-och-mint mb-1">
                  {tier2Status.requirements.mandatory_modules_completed}
                </div>
                <div className="text-sm text-gray-400">Modules Completed</div>
              </div>
              <div>
                <div className="text-2xl font-black text-och-mint mb-1">
                  {tier2Status.requirements.quizzes_passed}
                </div>
                <div className="text-sm text-gray-400">Quizzes Passed</div>
              </div>
              <div>
                <div className="text-2xl font-black text-och-mint mb-1">
                  {tier2Status.requirements.mini_missions_completed}
                </div>
                <div className="text-sm text-gray-400">Mini-Missions</div>
              </div>
              <div>
                <div className="text-2xl font-black text-och-mint mb-1">
                  {tier2Status.requirements.reflections_submitted}
                </div>
                <div className="text-sm text-gray-400">Reflections</div>
              </div>
            </div>
          </div>

          <div className="bg-och-gold/10 border border-och-gold/30 rounded-lg p-6 mb-8">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2 justify-center">
              <Rocket className="w-5 h-5 text-och-gold" />
              You're Ready for the Next Level
            </h3>
            <p className="text-gray-300">
              You're now ready to progress to the next level where you'll apply concepts using real tools and multi-step workflows.
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={onBack} variant="outline" className="flex-1">
              Review Progress
            </Button>
            <Button onClick={onComplete} variant="mint" size="lg" className="flex-1 font-black uppercase tracking-widest" glow>
              <Rocket className="w-5 h-5 mr-2" />
              Complete & Unlock Next Level
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
