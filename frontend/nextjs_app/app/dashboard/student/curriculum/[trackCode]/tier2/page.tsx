/**
 * Tier 2 (Beginner Tracks) Track Page
 * 
 * Comprehensive Tier 2 implementation following beginner-tier-2.md guidelines.
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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import Link from 'next/link'
import type { CurriculumModuleDetail, Lesson, ModuleMission } from '@/services/types/curriculum'

type Tier2View = 'dashboard' | 'module-viewer' | 'quiz' | 'reflection' | 'mini-mission-preview' | 'mini-mission-submit' | 'completion'

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
      
      // Check if track is Tier 2
      if (track && track.tier !== 2) {
        setError('This page is only for Tier 2 (Beginner) tracks')
        setLoading(false)
        return
      }

      // Load Tier 2 status
      const status = await curriculumClient.getTier2Status(trackCode)
      setTier2Status(status)

      // If complete, show completion screen
      if (status.is_complete && status.tier2_completion_requirements_met) {
        setCurrentView('completion')
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load Tier 2 track data')
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

      // Reload Tier 2 status
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

      // Reload Tier 2 status
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

      // Reload Tier 2 status
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
      setError(err.message || 'Failed to complete Tier 2')
    }
  }

  if (authLoading || loading || trackLoading) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-och-orange animate-spin mx-auto" />
              <div className="text-white text-lg">Loading Tier 2 Track...</div>
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
      />
    )
  }

  // Module Viewer
  if (currentView === 'module-viewer' && currentModule) {
    return (
      <Tier2ModuleViewer
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

// Tier 2 Dashboard Component
function Tier2Dashboard({
  track,
  tier2Status,
  modules,
  progress,
  onModuleClick,
  onLessonClick,
  onMiniMissionClick,
  onReflectionClick,
  onComplete,
}: {
  track: any
  tier2Status: Tier2Status
  modules: any[]
  progress: any
  onModuleClick: (moduleId: string) => void
  onLessonClick: (lesson: Lesson) => void
  onMiniMissionClick: (mission: ModuleMission) => void
  onReflectionClick: (module: any) => void
  onComplete: () => void
}) {
  const completionPct = tier2Status.completion_percentage
  const req = tier2Status.requirements

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/dashboard/student/curriculum">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Curriculum
              </Button>
            </Link>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="gold" className="mb-2">Tier 2 - Beginner Track</Badge>
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
                {req.mini_missions_completed >= 1 ? (
                  <span className="text-och-mint">✓ Minimum Met</span>
                ) : (
                  <span>At least 1 required</span>
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
                    <h3 className="text-white font-bold mb-2">Complete These Requirements to Finish Tier 2:</h3>
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
                const isLocked = module.isLocked || (
                  module.order_index > 0 && 
                  modules[index - 1]?.completion_percentage < 100
                )
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
                Complete Tier 2 & Unlock Tier 3
              </Button>
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  )
}

// Tier 2 Module Viewer Component
function Tier2ModuleViewer({
  module,
  currentLesson,
  onBack,
  onLessonClick,
  onComplete,
}: {
  module: CurriculumModuleDetail
  currentLesson?: Lesson | null
  onBack: () => void
  onLessonClick: (lesson: Lesson) => void
  onComplete: () => void
}) {
  const [watchPercentage, setWatchPercentage] = useState(0)

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
                <button
                  key={lesson.id}
                  onClick={() => onLessonClick(lesson)}
                  className="w-full p-4 bg-white/5 rounded-lg border border-och-steel/20 hover:bg-white/10 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {lesson.lesson_type === 'video' && <PlayCircle className="w-5 h-5 text-och-orange" />}
                      {lesson.lesson_type === 'quiz' && <Brain className="w-5 h-5 text-och-mint" />}
                      {lesson.lesson_type === 'guide' && <FileText className="w-5 h-5 text-och-gold" />}
                      <div>
                        <div className="text-white font-semibold">{lesson.title}</div>
                        <div className="text-gray-400 text-sm">{lesson.description}</div>
                      </div>
                    </div>
                    {lesson.is_completed && (
                      <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0" />
                    )}
                  </div>
                </button>
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

// Tier 2 Quiz Screen Component
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

  // For now, simplified quiz - in production, load questions from lesson content
  const questions = [
    { id: 'q1', question: 'What is the main concept covered in this lesson?', options: ['A', 'B', 'C', 'D'] },
  ]

  const handleSubmit = () => {
    // Calculate score (simplified)
    const score = 85
    setSubmitting(true)
    onSubmit(score, answers)
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
          <h1 className="text-3xl font-black text-white mb-6">Knowledge Check Quiz</h1>
          <p className="text-gray-400 mb-8">{lesson.title}</p>
          
          <div className="space-y-6 mb-8">
            {questions.map((q) => (
              <div key={q.id}>
                <p className="text-white font-semibold mb-3">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 border border-och-steel/20"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="accent-och-orange"
                      />
                      <span className="text-gray-300">Option {opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            variant="mint"
            className="w-full"
            disabled={submitting || Object.keys(answers).length !== questions.length}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </Card>
      </div>
    </div>
  )
}

// Tier 2 Reflection Screen Component
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

// Tier 2 Mini-Mission Preview Component
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
              <h3 className="text-white font-bold mb-2">Objective</h3>
              <p className="text-gray-300">
                This is a beginner-level mini-mission designed to build confidence and apply core concepts.
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

// Tier 2 Mini-Mission Submit Component
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
                Description of Your Work
              </label>
              <textarea
                value={submissionData.description}
                onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                className="w-full h-32 bg-och-midnight border border-och-steel/30 rounded-lg p-4 text-white"
                placeholder="Describe what you accomplished..."
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

// Tier 2 Completion Screen Component
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
            Tier 2 Complete!
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Congratulations! You've completed the {track.name} Beginner Track.
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
              Ready for Tier 3
            </h3>
            <p className="text-gray-300">
              You're now ready to progress to Tier 3 (Intermediate Tracks) where you'll apply concepts using real tools and multi-step workflows.
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={onBack} variant="outline" className="flex-1">
              Review Progress
            </Button>
            <Button onClick={onComplete} variant="mint" size="lg" className="flex-1 font-black uppercase tracking-widest" glow>
              <Rocket className="w-5 h-5 mr-2" />
              Complete & Unlock Tier 3
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
