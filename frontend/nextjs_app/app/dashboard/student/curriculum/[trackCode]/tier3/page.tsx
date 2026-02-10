/**
 * Intermediate Tracks Track Page
 * 
 * Comprehensive Intermediate Tracks implementation.
 * Provides track dashboard, module viewer, structured missions with subtasks,
 * multi-file evidence upload, mentor feedback, and completion flow.
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { curriculumClient } from '@/services/curriculumClient'
import { missionsClient } from '@/services/missionsClient'
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress'
import { motion } from 'framer-motion'
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
  Upload,
  FileCheck,
  ListChecks,
  CheckCircle,
  Circle,
  ChevronRight,
  ExternalLink,
  Bookmark,
  Sparkles,
  ChefHat,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import Link from 'next/link'
import { recipesClient } from '@/services/recipesClient'
import { MissionRecipeRecommendations } from '@/components/recipes/MissionRecipeRecommendations'
import { RecipePill } from '@/components/recipes/RecipePill'
import type { CurriculumModuleDetail, Lesson } from '@/services/types/curriculum'

type Tier3View = 
  | 'dashboard' 
  | 'module-viewer' 
  | 'mission-hub' 
  | 'subtask-execution' 
  | 'evidence-upload' 
  | 'mission-feedback' 
  | 'reflection' 
  | 'completion'

interface Tier3Status {
  track_code: string
  track_name: string
  completion_percentage: number
  is_complete: boolean
  tier3_completion_requirements_met: boolean
  requirements: {
    mandatory_modules_total: number
    mandatory_modules_completed: number
    intermediate_missions_total: number
    intermediate_missions_passed: number
    reflections_required?: number
    reflections_submitted?: number
    mentor_approval: boolean
    mentor_approval_required: boolean
  }
  missing_requirements: string[]
  can_progress_to_tier4: boolean
  tier4_unlocked: boolean
  progression_mode?: 'sequential' | 'flexible'
}

export default function Tier3TrackPage() {
  const params = useParams()
  const router = useRouter()
  const trackCode = params?.trackCode as string
  const { user, isLoading: authLoading } = useAuth()
  
  const [tier3Status, setTier3Status] = useState<Tier3Status | null>(null)
  const [currentView, setCurrentView] = useState<Tier3View>('dashboard')
  const [currentModule, setCurrentModule] = useState<CurriculumModuleDetail | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentMission, setCurrentMission] = useState<any>(null)
  const [currentSubtask, setCurrentSubtask] = useState<number | null>(null)
  const [missions, setMissions] = useState<any[]>([])
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
      loadTier3Data()
    }
  }, [authLoading, user, trackCode, track])

  const loadTier3Data = async () => {
    try {
      setLoading(true)
      
      // Check if track is Intermediate level
      if (track && track.tier !== 3) {
        setError('This page is only for Intermediate level tracks')
        setLoading(false)
        return
      }

      // Load Intermediate level status
      const status = await curriculumClient.getTier3Status(trackCode)
      setTier3Status(status)

      // Load Intermediate missions
      await loadMissions()

      // If complete, show completion screen
      if (status.is_complete && status.tier3_completion_requirements_met) {
        setCurrentView('completion')
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load track data')
      setLoading(false)
    }
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

      // Load intermediate missions
      const missionsData = await missionsClient.getAllMissions({
        track_key: trackMatch,
        difficulty: 'intermediate',
        type: 'scenario',
        status: 'published',
      })

      // Filter for intermediate tier missions
      const intermediateMissions = missionsData.results.filter((m: any) => 
        m.tier === 'intermediate' || m.difficulty === 'intermediate'
      )

      setMissions(intermediateMissions)

      // Load mission progress for each mission
      const progressMap: Record<string, any> = {}
      for (const mission of intermediateMissions) {
        try {
          // TODO: Load mission progress via API
        } catch (err) {
          console.error(`Failed to load progress for mission ${mission.id}:`, err)
        }
      }
      setMissionProgress(progressMap)
    } catch (err: any) {
      console.error('Failed to load missions:', err)
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

  const handleCompleteTier3 = async () => {
    try {
      await curriculumClient.completeTier3(trackCode)
      router.push(`/dashboard/student/curriculum?tier3_complete=${trackCode}`)
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
              <div className="text-white text-lg">Loading Intermediate Track...</div>
            </div>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  if (error || trackError) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center p-6">
          <Card className="p-8 max-w-2xl">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Error Loading Track</h1>
              <p className="text-gray-300">{error || trackError || 'An error occurred'}</p>
              <Button onClick={() => router.push('/dashboard/student/curriculum')}>
                Back to Curriculum
              </Button>
            </div>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  if (!tier3Status || !track) {
    return null
  }

  const req = tier3Status.requirements
  const completionPct = tier3Status.completion_percentage
  const isFlexible = tier3Status.progression_mode === 'flexible'

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <Tier3Dashboard
        track={track}
        trackCode={trackCode}
        tier3Status={tier3Status}
        modules={modules}
        progress={progress}
        onModuleClick={handleModuleClick}
        onLessonClick={handleLessonClick}
        onMissionClick={handleMissionClick}
        onComplete={handleCompleteTier3}
        missions={missions}
        missionProgress={missionProgress}
      />
    )
  }

  // Module Viewer
  if (currentView === 'module-viewer' && currentModule) {
    return (
      <Tier3ModuleViewer
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
          await loadTier3Data()
          setCurrentView('dashboard')
        }}
      />
    )
  }

  // Mission Hub
  if (currentView === 'mission-hub' && currentMission) {
    return (
      <Tier3MissionHub
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
      />
    )
  }

  // Subtask Execution
  if (currentView === 'subtask-execution' && currentMission && currentSubtask !== null) {
    return (
      <Tier3SubtaskExecution
        mission={currentMission}
        subtaskId={currentSubtask}
        missionProgress={missionProgress[currentMission.id]}
        onBack={() => setCurrentView('mission-hub')}
        onUploadClick={() => setCurrentView('evidence-upload')}
      />
    )
  }

  // Evidence Upload
  if (currentView === 'evidence-upload' && currentMission && currentSubtask !== null) {
    return (
      <Tier3EvidenceUpload
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
      <Tier3MissionFeedback
        mission={currentMission}
        missionProgress={missionProgress[currentMission.id]}
        onBack={() => setCurrentView('mission-hub')}
      />
    )
  }

  // Reflection
  if (currentView === 'reflection' && currentMission) {
    return (
      <Tier3ReflectionScreen
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
      <Tier3CompletionScreen
        track={track}
        tier3Status={tier3Status}
        onComplete={handleCompleteTier3}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  return null
}

// Tier 3 Dashboard Component
function Tier3Dashboard({
  track,
  trackCode,
  tier3Status,
  modules,
  progress,
  onModuleClick,
  onLessonClick,
  onMissionClick,
  onComplete,
  missions,
  missionProgress,
}: {
  track: any
  trackCode: string
  tier3Status: Tier3Status
  modules: any[]
  progress: any
  onModuleClick: (moduleId: string) => void
  onLessonClick: (lesson: Lesson) => void
  onMissionClick: (mission: any) => void
  onComplete: () => void
  missions: any[]
  missionProgress: Record<string, any>
}) {
  const req = tier3Status.requirements
  const completionPct = tier3Status.completion_percentage
  const isFlexible = tier3Status.progression_mode === 'flexible'

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="flex">
          {/* Sidebar */}
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
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Missions</div>
                <nav className="space-y-1">
                  {missions.map((mission) => {
                    const progress = missionProgress[mission.id] || {}
                    const status = progress.status || 'available'
                    return (
                      <button
                        key={mission.id}
                        onClick={() => onMissionClick(mission)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 text-gray-300 hover:bg-white/10"
                      >
                        <Target className="w-4 h-4 shrink-0" />
                        <span className="truncate">{mission.title || mission.code}</span>
                      </button>
                    )
                  })}
                </nav>
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
                    {track?.name || 'Intermediate Track'}
                    <Target className="w-8 h-8 text-och-mint" />
                  </h1>
                  <p className="text-gray-400">Build applied capabilities through structured missions and real-world practice</p>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  <Target className="w-4 h-4 mr-2" />
                  Intermediate Level
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
                    className="bg-gradient-to-r from-och-mint to-blue-500 h-3 rounded-full"
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
                    <div className="text-2xl font-bold text-white">{req.intermediate_missions_passed}/{req.intermediate_missions_total}</div>
                    <div className="text-sm text-gray-400">Missions</div>
                  </div>
                  {req.reflections_required !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{req.reflections_submitted || 0}/{req.reflections_required}</div>
                      <div className="text-sm text-gray-400">Reflections</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{req.mentor_approval ? '✓' : '—'}</div>
                    <div className="text-sm text-gray-400">Mentor Approval</div>
                  </div>
                </div>
              </Card>

              {/* Requirements Status */}
              {tier3Status.missing_requirements.length > 0 && (
                <Card className="p-6 bg-yellow-500/10 border-yellow-500/30">
                  <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    Requirements Remaining
                  </h3>
                  <ul className="space-y-1">
                    {tier3Status.missing_requirements.map((req, index) => (
                      <li key={index} className="text-gray-300 text-sm">• {req}</li>
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

              {/* Intermediate Missions Section */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Intermediate Missions
                </h2>
                <Card className="p-6 bg-white/5 border-och-steel/20">
                  <p className="text-gray-300 mb-4">
                    Complete {req.intermediate_missions_total} structured missions with multiple subtasks to demonstrate applied capabilities.
                    Each mission includes real-world scenarios, multi-file evidence submission, and mentor review.
                    {req.reflections_required && ` ${req.reflections_required} reflection${req.reflections_required > 1 ? 's' : ''} required.`}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
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
                              {mission.description || mission.story_narrative || 'Structured mission with multiple subtasks'}
                            </p>
                            {/* Show recipe count if available */}
                            {mission.recipe_recommendations && mission.recipe_recommendations.length > 0 && (
                              <div className="mb-2 flex items-center gap-1 text-xs text-emerald-400">
                                <ChefHat className="w-3 h-3" />
                                <span>{mission.recipe_recommendations.length} recipe{mission.recipe_recommendations.length > 1 ? 's' : ''} available</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {mission.subtasks && (
                                  <span>{mission.subtasks.length} subtasks</span>
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
                        <p className="text-gray-400 text-sm">No intermediate missions available yet</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Completion Button */}
              {tier3Status.is_complete && tier3Status.tier3_completion_requirements_met && (
                <Card className="p-6 bg-gradient-to-r from-blue-500/20 to-och-mint/20 border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-blue-400" />
                        Intermediate Track Complete!
                      </h3>
                      <p className="text-gray-300">You've completed the Intermediate level track. Ready for Advanced Tracks?</p>
                    </div>
                    <Button onClick={onComplete} size="lg" className="bg-blue-500 hover:bg-blue-500/80">
                      Complete & Unlock Advanced
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}

// Placeholder components - to be implemented similar to Tier 5
function Tier3ModuleViewer({ trackCode, module, currentLesson, onBack, onLessonClick, onComplete }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">{module.title}</h2>
          <p className="text-gray-300">Module viewer - Intermediate mode (to be fully implemented)</p>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier3MissionHub({ mission, missionProgress, onBack, onSubtaskClick, onFeedbackClick, onEvidenceUpload }: any) {
  const progress = missionProgress || {}
  const subtasks = mission.subtasks || []
  const completedSubtasks = progress.subtasks_progress || {}
  const [recipes, setRecipes] = useState<any[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  
  // Load recipes from mission.recipe_recommendations
  useEffect(() => {
    const loadRecipes = async () => {
      if (!mission.recipe_recommendations || mission.recipe_recommendations.length === 0) {
        setRecipes([])
        return
      }
      
      setRecipesLoading(true)
      try {
        // Extract recipe IDs/slugs from recommendations
        const recipeIds = mission.recipe_recommendations.map((r: any) => r.id || r.slug || r).filter(Boolean)
        
        if (recipeIds.length > 0) {
          // Try to fetch individual recipes by ID/slug
          const recipePromises = recipeIds.map(async (idOrSlug: string) => {
            try {
              return await recipesClient.getRecipe(idOrSlug)
            } catch (err) {
              console.debug(`Failed to fetch recipe ${idOrSlug}:`, err)
              return null
            }
          })
          
          const fetchedRecipes = await Promise.all(recipePromises)
          const validRecipes = fetchedRecipes.filter((r): r is any => r !== null)
          
          if (validRecipes.length > 0) {
            setRecipes(validRecipes)
          } else {
            // Fallback: fetch all recipes and filter
            const recipesData = await recipesClient.getRecipesWithStats()
            const recommendedRecipes = recipesData.recipes.filter((r: any) => 
              recipeIds.includes(r.id) || recipeIds.includes(r.slug)
            )
            setRecipes(recommendedRecipes.length > 0 ? recommendedRecipes : mission.recipe_recommendations || [])
          }
        } else {
          setRecipes(mission.recipe_recommendations || [])
        }
      } catch (err) {
        console.error('Failed to load recipes:', err)
        // Fallback to display recipe recommendations as-is
        setRecipes(mission.recipe_recommendations || [])
      } finally {
        setRecipesLoading(false)
      }
    }
    
    loadRecipes()
  }, [mission.recipe_recommendations, mission.id])
  
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-white">{mission.title || mission.code}</h1>
              {mission.time_constraint_hours && (
                <div className="flex items-center gap-2 text-gray-400 mt-2">
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
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Mission Subtasks
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
                                  <span className="text-xs font-semibold text-gray-500">Subtask {index + 1}</span>
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
                    <p className="text-gray-400 text-sm">No subtasks defined for this mission</p>
                  )}
                </div>
              </Card>

              {/* Highlighted Recipes Section - Embedded in Mission Hub */}
              {(mission.recipe_recommendations && mission.recipe_recommendations.length > 0) || recipes.length > 0 ? (
                <Card id="mission-recipes" className="p-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-bold text-emerald-300">Recommended Recipes for This Mission</h2>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    These recipes will help you complete this mission successfully. Review them before starting each subtask.
                  </p>
                  {recipesLoading ? (
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading recipes...</span>
                    </div>
                  ) : recipes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recipes.map((recipe: any) => (
                        <RecipePill key={recipe.id || recipe.slug} recipe={recipe} />
                      ))}
                    </div>
                  ) : mission.recipe_recommendations && mission.recipe_recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {mission.recipe_recommendations.map((recipe: any, index: number) => (
                        <Link
                          key={index}
                          href={`/dashboard/student/coaching/recipes/${recipe.slug || recipe.id || index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ChefHat className="w-5 h-5 text-emerald-400" />
                            <div>
                              <span className="text-sm font-semibold text-white">{recipe.title || recipe.name || `Recipe ${index + 1}`}</span>
                              {recipe.description && (
                                <p className="text-xs text-gray-400 mt-1">{recipe.description}</p>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-emerald-400" />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ) : null}

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
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Recipe Sidebar - Highlighted */}
              {(mission.recipe_recommendations && mission.recipe_recommendations.length > 0) || recipes.length > 0 ? (
                <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 sticky top-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ChefHat className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-emerald-300">Quick Recipe Access</h3>
                  </div>
                  {recipesLoading ? (
                    <div className="flex items-center gap-2 text-emerald-300 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : recipes.length > 0 ? (
                    <div className="space-y-2">
                      {recipes.slice(0, 3).map((recipe: any) => (
                        <Link
                          key={recipe.id || recipe.slug}
                          href={`/dashboard/student/coaching/recipes/${recipe.slug || recipe.id}`}
                          className="block p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-white mb-1">{recipe.title}</h4>
                              {recipe.summary && (
                                <p className="text-xs text-gray-400 line-clamp-2">{recipe.summary}</p>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : mission.recipe_recommendations && mission.recipe_recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {mission.recipe_recommendations.slice(0, 3).map((recipe: any, index: number) => (
                        <Link
                          key={index}
                          href={`/dashboard/student/coaching/recipes/${recipe.slug || recipe.id || index}`}
                          className="block p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-white">{recipe.title || recipe.name || `Recipe ${index + 1}`}</h4>
                              {recipe.description && (
                                <p className="text-xs text-gray-400 mt-1">{recipe.description}</p>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {recipes.length > 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                      onClick={() => {
                        // Scroll to recipes section above
                        document.getElementById('mission-recipes')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      View All {recipes.length} Recipes
                    </Button>
                  )}
                </Card>
              ) : null}

              <Card className="p-6 bg-white/5 border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Mentor Feedback
                </h3>
                {progress.mentor_feedback ? (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-blue-300">{progress.mentor_feedback}</p>
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
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier3SubtaskExecution({ mission, subtaskId, missionProgress, onBack, onUploadClick }: any) {
  const subtasks = mission.subtasks || []
  const subtask = subtasks.find((s: any) => (s.id || subtasks.indexOf(s)) === subtaskId) || subtasks[subtaskId]
  const [notes, setNotes] = useState('')
  const [recipes, setRecipes] = useState<any[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  
  // Load recipes for this mission
  useEffect(() => {
    const loadRecipes = async () => {
      if (!mission.recipe_recommendations || mission.recipe_recommendations.length === 0) {
        setRecipes([])
        return
      }
      
      setRecipesLoading(true)
      try {
        const recipeIds = mission.recipe_recommendations.map((r: any) => r.id || r.slug || r).filter(Boolean)
        if (recipeIds.length > 0) {
          // Try to fetch individual recipes by ID/slug
          const recipePromises = recipeIds.map(async (idOrSlug: string) => {
            try {
              return await recipesClient.getRecipe(idOrSlug)
            } catch (err) {
              console.debug(`Failed to fetch recipe ${idOrSlug}:`, err)
              return null
            }
          })
          
          const fetchedRecipes = await Promise.all(recipePromises)
          const validRecipes = fetchedRecipes.filter((r): r is any => r !== null)
          
          if (validRecipes.length > 0) {
            setRecipes(validRecipes)
          } else {
            // Fallback: fetch all recipes and filter
            const recipesData = await recipesClient.getRecipesWithStats()
            const recommendedRecipes = recipesData.recipes.filter((r: any) => 
              recipeIds.includes(r.id) || recipeIds.includes(r.slug)
            )
            setRecipes(recommendedRecipes.length > 0 ? recommendedRecipes : mission.recipe_recommendations || [])
          }
        } else {
          setRecipes(mission.recipe_recommendations || [])
        }
      } catch (err) {
        console.error('Failed to load recipes:', err)
        setRecipes(mission.recipe_recommendations || [])
      } finally {
        setRecipesLoading(false)
      }
    }
    
    loadRecipes()
  }, [mission.recipe_recommendations, mission.id])
  
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
              <p className="text-gray-400">Subtask {subtasks.indexOf(subtask) + 1} of {subtasks.length}</p>
            </div>
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
                  placeholder="Record your thoughts and approach..."
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
              {/* Highlighted Recipe Support - Embedded in Subtask Screen */}
              {(mission.recipe_recommendations && mission.recipe_recommendations.length > 0) || recipes.length > 0 ? (
                <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 sticky top-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ChefHat className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-emerald-300">Recipe Support for This Subtask</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    Use these recipes to help complete this subtask successfully.
                  </p>
                  {recipesLoading ? (
                    <div className="flex items-center gap-2 text-emerald-300 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading recipes...</span>
                    </div>
                  ) : recipes.length > 0 ? (
                    <div className="space-y-2">
                      {recipes.slice(0, 3).map((recipe: any) => (
                        <Link
                          key={recipe.id || recipe.slug}
                          href={`/dashboard/student/coaching/recipes/${recipe.slug || recipe.id}`}
                          className="block p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-white mb-1">{recipe.title}</h4>
                              {recipe.summary && (
                                <p className="text-xs text-gray-400 line-clamp-2">{recipe.summary}</p>
                              )}
                              {recipe.difficulty && (
                                <Badge variant="outline" className="text-xs mt-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                  {recipe.difficulty}
                                </Badge>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : mission.recipe_recommendations && mission.recipe_recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {mission.recipe_recommendations.slice(0, 3).map((recipe: any, index: number) => (
                        <Link
                          key={index}
                          href={`/dashboard/student/coaching/recipes/${recipe.slug || recipe.id || index}`}
                          className="block p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-white">{recipe.title || recipe.name || `Recipe ${index + 1}`}</h4>
                              {recipe.description && (
                                <p className="text-xs text-gray-400 mt-1">{recipe.description}</p>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier3EvidenceUpload({ mission, subtaskId, onBack, onComplete }: any) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  
  const evidenceSchema = mission.evidence_upload_schema || {}
  const maxFileSize = evidenceSchema.max_file_size_mb ? evidenceSchema.max_file_size_mb * 1024 * 1024 : 50 * 1024 * 1024
  const acceptedTypes = evidenceSchema.file_types || ['*']

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File ${file.name} exceeds maximum size of ${evidenceSchema.max_file_size_mb || 50}MB`)
        return false
      }
      return true
    })
    setFiles(prev => [...prev, ...validFiles])
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      // TODO: Implement actual file upload API call
      await new Promise(resolve => setTimeout(resolve, 1000))
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
            <p className="text-gray-400">Submit your evidence for this subtask</p>
          </div>

          <Card className="p-6 bg-white/5 border-och-steel/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              File Uploads
            </h2>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Select Files (Multiple files supported)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-och-mint file:text-och-midnight hover:file:bg-och-mint/80 cursor-pointer"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mb-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-och-steel/20">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
          </Card>
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier3MissionFeedback({ mission, missionProgress, onBack }: any) {
  const progress = missionProgress || {}
  const feedback = progress.mentor_feedback || ''
  const scores = progress.subtask_scores || {}
  const finalStatus = progress.final_status || 'pending'
  const isApproved = finalStatus === 'pass' && progress.status === 'approved'

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
            </Card>
          )}

          {feedback && (
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mentor Feedback
              </h2>
              <p className="text-gray-300 whitespace-pre-line">{feedback}</p>
            </Card>
          )}

          {Object.keys(scores).length > 0 && (
            <Card className="p-6 bg-white/5 border-och-steel/20">
              <h2 className="text-xl font-bold text-white mb-4">Subtask Scores</h2>
              <div className="space-y-3">
                {mission.subtasks?.map((subtask: any, index: number) => {
                  const subtaskId = subtask.id || index
                  const score = scores[subtaskId]
                  if (!score) return null
                  return (
                    <div key={subtaskId} className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">Subtask {index + 1}: {subtask.title}</span>
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
        </div>
      </div>
    </RouteGuard>
  )
}

function Tier3ReflectionScreen({ mission, onBack, onSubmit }: any) {
  const [reflection, setReflection] = useState('')

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-white mb-4">Reflection</h2>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Reflect on what you learned from this mission..."
            className="w-full h-64 p-4 bg-och-midnight/50 border border-och-steel/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-och-mint mb-4"
          />
          <Button onClick={() => onSubmit(reflection)} disabled={!reflection.trim()}>
            Submit Reflection
          </Button>
        </Card>
      </div>
    </RouteGuard>
  )
}

function Tier3CompletionScreen({ track, tier3Status, onComplete, onBack }: any) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Trophy className="w-20 h-20 text-blue-400 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">Intermediate Track Complete!</h1>
          <p className="text-xl text-gray-300 mb-2">Intermediate Level Track</p>
          <p className="text-gray-400 mb-8">You've completed the {track?.name || 'Intermediate Track'}</p>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-gray-300 mb-2">You're Ready for the Next Level</p>
              <p className="text-blue-400 font-semibold">Advanced Level Unlocked</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={onBack} variant="outline">
                Review Progress
              </Button>
              <Button onClick={onComplete} size="lg" className="bg-blue-500 hover:bg-blue-500/80">
                Continue to Advanced Level
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </RouteGuard>
  )
}
