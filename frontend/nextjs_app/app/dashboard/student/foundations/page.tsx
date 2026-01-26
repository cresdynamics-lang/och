'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { foundationsClient, FoundationsModule, FoundationsStatus } from '@/services/foundationsClient'
import { fastapiClient } from '@/services/fastapiClient'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  BookOpen, 
  Target,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Brain,
  Compass,
  Rocket,
  Shield,
  FileText,
  Users,
  Briefcase,
  Loader2
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type FoundationsView = 'landing' | 'modules' | 'module-viewer' | 'assessment' | 'reflection' | 'track-confirmation' | 'completion'

export default function FoundationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, reloadUser } = useAuth()
  const [status, setStatus] = useState<FoundationsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<FoundationsView>('landing')
  const [currentModule, setCurrentModule] = useState<FoundationsModule | null>(null)
  const [blueprint, setBlueprint] = useState<any>(null)
  const [profilerResult, setProfilerResult] = useState<any>(null)
  const hasLoadedRef = useRef(false)
  const isCompletingRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (authLoading || !isAuthenticated) return
    
    // Prevent infinite loops - only load once or if explicitly needed
    if (hasLoadedRef.current && !isCompletingRef.current) return

    loadFoundationsData()
  }, [isAuthenticated, authLoading])

  const loadFoundationsData = async (force = false) => {
    // Prevent multiple simultaneous loads
    if (hasLoadedRef.current && !force) return
    
    try {
      hasLoadedRef.current = true
      setLoading(true)
      
      // Check profiling status first
      const profilingStatus = await fastapiClient.profiling.checkStatus()
      if (!profilingStatus.completed) {
        router.push('/onboarding/ai-profiler')
        hasLoadedRef.current = false
        setLoading(false)
        return
      }

      // Load Foundations status
      const foundationsStatus = await foundationsClient.getStatus()
      
      if (!foundationsStatus.foundations_available) {
        setError('Please complete the AI profiler first or Foundations is not available')
        hasLoadedRef.current = false
        setLoading(false)
        return
      }

      setStatus(foundationsStatus)

      // If already complete, show completion screen
      if (foundationsStatus.is_complete) {
        setCurrentView('completion')
        setLoading(false)
        return
      }

      // Load profiler blueprint for track confirmation
      if (profilingStatus.session_id) {
        try {
          const blueprintData = await fastapiClient.profiling.getBlueprint(profilingStatus.session_id)
          setBlueprint(blueprintData)
          setProfilerResult({
            primary_track: blueprintData.track_recommendation?.primary_track,
            recommended_track: blueprintData.track_recommendation?.primary_track?.key
          })
        } catch (err) {
          console.warn('Failed to load blueprint:', err)
        }
      }

      // Determine starting view
      if (foundationsStatus.status === 'not_started') {
        setCurrentView('landing')
      } else {
        setCurrentView('modules')
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load Foundations')
      hasLoadedRef.current = false
      setLoading(false)
    }
  }

  const handleStartFoundations = () => {
    setCurrentView('modules')
  }

  const handleModuleClick = (module: FoundationsModule) => {
    setCurrentModule(module)
    if (module.module_type === 'assessment') {
      setCurrentView('assessment')
    } else if (module.module_type === 'reflection') {
      setCurrentView('reflection')
    } else {
      setCurrentView('module-viewer')
    }
  }

  const handleModuleComplete = async (moduleId: string, watchPercentage: number = 100) => {
    try {
      await foundationsClient.completeModule(moduleId, watchPercentage)
      hasLoadedRef.current = false
      await loadFoundationsData(true) // Reload to get updated status
      
      // Return to modules view
      setCurrentView('modules')
      setCurrentModule(null)
    } catch (err: any) {
      setError(err.message || 'Failed to complete module')
    }
  }

  const handleAssessmentSubmit = async (answers: Record<string, string>) => {
    try {
      const result = await foundationsClient.submitAssessment(answers)
      
      // Check if Foundations is now complete
      if (result.is_complete) {
        // Set flag to prevent reload loops
        isCompletingRef.current = true
        
        // Refresh user to update foundations_complete flag (but don't wait for it to trigger reloads)
        if (reloadUser) {
          reloadUser().catch(console.error)
        }
        
        // Reload Foundations data once to get updated status
        hasLoadedRef.current = false
        await loadFoundationsData(true)
        
        // Automatically complete Foundations and redirect
        await handleCompleteFoundations()
      } else {
        // Reload data to show updated progress
        hasLoadedRef.current = false
        await loadFoundationsData(true)
        // Show results, then return to modules to complete remaining items
        // The assessment component will show results first
        // User can click "Continue" to go back to modules
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment')
      isCompletingRef.current = false
    }
  }

  const handleReflectionSubmit = async (goalsReflection: string, valueStatement?: string) => {
    try {
      await foundationsClient.submitReflection(goalsReflection, valueStatement)
      hasLoadedRef.current = false
      await loadFoundationsData(true)
      
      // After reflection, show track confirmation if not already confirmed
      if (!status?.confirmed_track_key && profilerResult?.recommended_track) {
        setCurrentView('track-confirmation')
      } else {
        setCurrentView('modules')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit reflection')
    }
  }

  const handleTrackConfirm = async (trackKey: string, isOverride: boolean = false) => {
    try {
      await foundationsClient.confirmTrack(trackKey, isOverride)
      hasLoadedRef.current = false
      await loadFoundationsData(true)
      setCurrentView('modules')
    } catch (err: any) {
      setError(err.message || 'Failed to confirm track')
    }
  }

  const handleCompleteFoundations = async () => {
    try {
      isCompletingRef.current = true
      await foundationsClient.completeFoundations()
      
      // Refresh user to update foundations_complete flag (fire and forget to avoid loops)
      if (reloadUser) {
        reloadUser().catch(console.error)
      }
      
      // Reset flags
      hasLoadedRef.current = false
      isCompletingRef.current = false
      
      // Redirect to dashboard immediately
      router.push('/dashboard/student?foundations_complete=true')
    } catch (err: any) {
      setError(err.message || 'Failed to complete Foundations')
      isCompletingRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-och-orange animate-spin mx-auto" />
            <div className="text-white text-lg">Loading Foundations...</div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
        <Card className="p-12 max-w-md">
          <div className="text-center space-y-4">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-white text-2xl font-bold">Error</h2>
            <p className="text-gray-300">{error}</p>
            <Button onClick={() => router.push('/dashboard/student')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!status) return null

  // Landing View
  if (currentView === 'landing') {
    return (
      <FoundationsLanding 
        onStart={handleStartFoundations}
        profilerResult={profilerResult}
        blueprint={blueprint}
      />
    )
  }

  // Modules List View
  if (currentView === 'modules') {
    return (
      <FoundationsModulesList
        status={status}
        onModuleClick={handleModuleClick}
        onBack={() => setCurrentView('landing')}
        onComplete={handleCompleteFoundations}
      />
    )
  }

  // Module Viewer
  if (currentView === 'module-viewer' && currentModule) {
    return (
      <FoundationsModuleViewer
        module={currentModule}
        onComplete={(watchPercentage) => handleModuleComplete(currentModule.id, watchPercentage)}
        onBack={() => {
          setCurrentView('modules')
          setCurrentModule(null)
        }}
      />
    )
  }

  // Assessment View
  if (currentView === 'assessment') {
    return (
      <FoundationsAssessment
        onSubmit={handleAssessmentSubmit}
        onBack={() => {
          setCurrentView('modules')
          setCurrentModule(null)
        }}
      />
    )
  }

  // Reflection View
  if (currentView === 'reflection') {
    return (
      <FoundationsReflection
        valueStatement={blueprint?.value_statement || status?.goals_reflection}
        onSubmit={handleReflectionSubmit}
        onBack={() => {
          setCurrentView('modules')
          setCurrentModule(null)
        }}
      />
    )
  }

  // Track Confirmation View
  if (currentView === 'track-confirmation') {
    return (
      <FoundationsTrackConfirmation
        recommendedTrack={profilerResult?.recommended_track}
        primaryTrack={profilerResult?.primary_track}
        onConfirm={handleTrackConfirm}
        onBack={() => setCurrentView('modules')}
      />
    )
  }

  // Completion View
  if (currentView === 'completion') {
    return (
      <FoundationsCompletion
        confirmedTrack={status.confirmed_track_key}
        onComplete={handleCompleteFoundations}
      />
    )
  }

  return null
}

// Landing Component
function FoundationsLanding({ 
  onStart, 
  profilerResult,
  blueprint 
}: { 
  onStart: () => void
  profilerResult: any
  blueprint: any
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto w-full"
      >
        <Card className="p-8 sm:p-12 bg-och-midnight/90 border-2 border-och-gold/30">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-och-gold to-och-mint mb-6"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
              Your Journey Starts Here
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Welcome to Tier 1: Foundations
            </p>
            {profilerResult?.primary_track && (
              <Badge variant="gold" className="text-lg px-4 py-2 mb-4">
                Recommended Track: {profilerResult.primary_track.name}
              </Badge>
            )}
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
                <Compass className="w-6 h-6 text-och-gold" />
                What You'll Learn
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0 mt-0.5" />
                  <span>How OCH works end-to-end</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0 mt-0.5" />
                  <span>Understanding missions, recipes, and tracks</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0 mt-0.5" />
                  <span>The VIP (Value, Impact, Purpose) framework</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0 mt-0.5" />
                  <span>Navigating your dashboard and portfolio</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0 mt-0.5" />
                  <span>How to interact with mentors</span>
                </li>
              </ul>
            </div>

            {blueprint?.suggested_starting_point && (
              <div className="bg-och-gold/10 border border-och-gold/30 rounded-lg p-6">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-och-gold" />
                  Your Starting Point
                </h3>
                <p className="text-gray-300">{blueprint.suggested_starting_point}</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Button
              onClick={onStart}
              variant="mint"
              size="lg"
              className="font-black uppercase tracking-widest text-lg px-8 py-4"
              glow
            >
              <Rocket className="w-5 h-5 mr-2" />
              Begin Foundations
            </Button>
            <p className="text-gray-400 text-sm mt-4">
              Takes about 30-45 minutes • You can save and resume anytime
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

// Modules List Component
function FoundationsModulesList({
  status,
  onModuleClick,
  onBack,
  onComplete
}: {
  status: FoundationsStatus
  onModuleClick: (module: FoundationsModule) => void
  onBack: () => void
  onComplete: () => void
}) {
  const mandatoryModules = status.modules.filter(m => m.is_mandatory)
  const completedCount = mandatoryModules.filter(m => m.completed).length
  const progressPercentage = mandatoryModules.length > 0 
    ? (completedCount / mandatoryModules.length) * 100 
    : 0

  const canComplete = status.is_complete && 
    status.assessment_score !== undefined && 
    status.goals_reflection &&
    status.confirmed_track_key

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase">
              Foundations Modules
            </h1>
            <Badge variant="gold" className="text-lg px-4 py-2">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-r from-och-orange to-och-crimson h-3 rounded-full"
            />
          </div>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {status.modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                  module.completed
                    ? 'bg-och-mint/20 border-2 border-och-mint/50'
                    : 'bg-och-midnight/60 border border-och-steel/20'
                }`}
                onClick={() => onModuleClick(module)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {module.module_type === 'video' && <PlayCircle className="w-6 h-6 text-och-orange" />}
                    {module.module_type === 'interactive' && <Brain className="w-6 h-6 text-och-mint" />}
                    {module.module_type === 'assessment' && <FileText className="w-6 h-6 text-och-gold" />}
                    {module.module_type === 'reflection' && <Target className="w-6 h-6 text-och-defender" />}
                    <div>
                      <h3 className="text-white font-bold text-lg">{module.title}</h3>
                      {module.is_mandatory && (
                        <Badge variant="steel" className="text-xs mt-1">Required</Badge>
                      )}
                    </div>
                  </div>
                  {module.completed && (
                    <CheckCircle2 className="w-6 h-6 text-och-mint shrink-0" />
                  )}
                </div>
                <p className="text-gray-300 text-sm mb-4">{module.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{module.estimated_minutes} min</span>
                  </div>
                  {module.watch_percentage > 0 && !module.completed && (
                    <span>{Math.round(module.watch_percentage)}% watched</span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Complete Button */}
        {canComplete && (
          <div className="text-center">
            <Button
              onClick={onComplete}
              variant="mint"
              size="lg"
              className="font-black uppercase tracking-widest text-lg px-12 py-4"
              glow
            >
              <Rocket className="w-5 h-5 mr-2" />
              Complete Foundations & Start Your Track
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Module Viewer Component
function FoundationsModuleViewer({
  module,
  onComplete,
  onBack
}: {
  module: FoundationsModule
  onComplete: (watchPercentage: number) => void
  onBack: () => void
}) {
  const [watchPercentage, setWatchPercentage] = useState(module.watch_percentage || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Modules
        </Button>

        <Card className="p-8 bg-och-midnight/90">
          <h1 className="text-3xl font-black text-white mb-4">{module.title}</h1>
          <p className="text-gray-300 mb-6">{module.description}</p>

          {module.video_url && (
            <div className="mb-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <iframe
                  src={module.video_url}
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

          {module.diagram_url && (
            <div className="mb-6">
              <img src={module.diagram_url} alt={module.title} className="w-full rounded-lg" />
            </div>
          )}

          {module.content && (
            <div 
              className="prose prose-invert max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: module.content }}
            />
          )}

          <div className="flex gap-4">
            <Button
              onClick={() => onComplete(watchPercentage)}
              variant="mint"
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Assessment Component
function FoundationsAssessment({
  onSubmit,
  onBack,
  onComplete
}: {
  onSubmit: (answers: Record<string, string>) => void
  onBack: () => void
  onComplete?: () => void
}) {
  const [questions, setQuestions] = useState<Array<{
    id: string
    question: string
    options: Array<{ value: string; text: string }>
  }>>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<{
    score: number
    total_questions: number
    correct_answers: number
    detailed_results: Record<string, {
      correct: boolean
      selected: string
      correct_answer: string
      explanation: string
    }>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true)
        const data = await foundationsClient.getAssessmentQuestions()
        setQuestions(data.questions)
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment questions')
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [])

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) remaining.`)
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const result = await foundationsClient.submitAssessment(answers)
      setResults(result)
      // Call onSubmit to update parent state (this will check is_complete and redirect)
      onSubmit(answers)
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-och-orange animate-spin mx-auto mb-4" />
              <div className="text-white">Loading assessment questions...</div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button onClick={onBack} variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-8">
            <div className="text-center text-red-400">
              <p>{error}</p>
              <Button onClick={onBack} variant="outline" className="mt-4">
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 bg-och-midnight/90">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-och-mint to-och-gold mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-black text-white mb-4">Assessment Complete!</h1>
              <div className="text-4xl font-black text-och-mint mb-2">
                {results.score}%
              </div>
              <p className="text-gray-300">
                You got {results.correct_answers} out of {results.total_questions} questions correct
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {questions.map((q) => {
                const result = results.detailed_results[q.id]
                const isCorrect = result?.correct
                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'bg-och-mint/10 border-och-mint/50'
                        : 'bg-red-500/10 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-och-mint shrink-0 mt-0.5" />
                      ) : (
                        <span className="text-red-400 text-xl">✗</span>
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-2">{q.question}</p>
                        <div className="space-y-1 text-sm">
                          <p className={isCorrect ? 'text-och-mint' : 'text-red-400'}>
                            Your answer: {result?.selected} {isCorrect ? '✓' : '✗'}
                          </p>
                          {!isCorrect && (
                            <p className="text-och-gold">
                              Correct answer: {result?.correct_answer}
                            </p>
                          )}
                          <p className="text-gray-400 text-xs mt-2">
                            {result?.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="text-center">
              <Button onClick={onBack} variant="mint" size="lg" className="w-full">
                Continue to Modules
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8 bg-och-midnight/90">
          <h1 className="text-3xl font-black text-white mb-2">Orientation Assessment</h1>
          <p className="text-gray-400 mb-6">
            Test your understanding of OCH structure and concepts. Answer all {questions.length} questions.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-8 mb-8">
            {questions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white/5 rounded-lg border border-och-steel/20"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Badge variant="steel" className="shrink-0">
                    Question {index + 1}
                  </Badge>
                  <p className="text-white font-semibold text-lg flex-1">{q.question}</p>
                </div>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                        answers[q.id] === opt.value
                          ? 'bg-och-gold/20 border-2 border-och-gold/50'
                          : 'bg-white/5 border border-och-steel/20 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={answers[q.id] === opt.value}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="accent-och-orange mt-1 shrink-0"
                      />
                      <span className="text-gray-300 flex-1">{opt.text}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              {Object.keys(answers).length} of {questions.length} answered
            </div>
            <Button
              onClick={handleSubmit}
              variant="mint"
              size="lg"
              disabled={submitting || Object.keys(answers).length !== questions.length}
              className="font-black uppercase tracking-widest"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Assessment'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Reflection Component
function FoundationsReflection({
  valueStatement,
  onSubmit,
  onBack
}: {
  valueStatement?: string
  onSubmit: (goalsReflection: string, valueStatement?: string) => void
  onBack: () => void
}) {
  const [goalsReflection, setGoalsReflection] = useState('')
  const [valueStmt, setValueStmt] = useState(valueStatement || '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8">
          <h1 className="text-3xl font-black text-white mb-6">Goals & Reflection</h1>
          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                What do you want to achieve in cybersecurity?
              </label>
              <textarea
                value={goalsReflection}
                onChange={(e) => setGoalsReflection(e.target.value)}
                className="w-full h-32 bg-och-midnight border border-och-steel/30 rounded-lg p-4 text-white"
                placeholder="Share your goals and aspirations..."
              />
            </div>
            {valueStatement && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Your Value Statement (from Profiler)
                </label>
                <textarea
                  value={valueStmt}
                  onChange={(e) => setValueStmt(e.target.value)}
                  className="w-full h-24 bg-och-midnight border border-och-steel/30 rounded-lg p-4 text-white"
                />
              </div>
            )}
          </div>
          <Button
            onClick={() => onSubmit(goalsReflection, valueStmt)}
            variant="mint"
            className="w-full mt-6"
            disabled={!goalsReflection.trim()}
          >
            Submit Reflection
          </Button>
        </Card>
      </div>
    </div>
  )
}

// Track Confirmation Component
function FoundationsTrackConfirmation({
  recommendedTrack,
  primaryTrack,
  onConfirm,
  onBack
}: {
  recommendedTrack?: string
  primaryTrack?: any
  onConfirm: (trackKey: string, isOverride: boolean) => void
  onBack: () => void
}) {
  const tracks = [
    { key: 'defender', name: 'Defender', icon: '🛡️' },
    { key: 'offensive', name: 'Offensive', icon: '⚔️' },
    { key: 'innovation', name: 'Innovation', icon: '🔬' },
    { key: 'leadership', name: 'Leadership', icon: '👑' },
    { key: 'grc', name: 'GRC', icon: '📋' },
  ]

  const [selectedTrack, setSelectedTrack] = useState(recommendedTrack || '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8">
          <h1 className="text-3xl font-black text-white mb-4">Confirm Your Track</h1>
          <p className="text-gray-300 mb-8">
            {primaryTrack ? (
              <>Based on your profiler results, we recommend the <strong>{primaryTrack.name}</strong> track.</>
            ) : (
              'Select the track you want to pursue:'
            )}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {tracks.map((track) => (
              <button
                key={track.key}
                onClick={() => setSelectedTrack(track.key)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedTrack === track.key
                    ? 'border-och-mint bg-och-mint/20'
                    : 'border-och-steel/20 bg-och-midnight/60 hover:border-och-gold/50'
                }`}
              >
                <div className="text-4xl mb-2">{track.icon}</div>
                <div className="text-white font-bold">{track.name}</div>
                {recommendedTrack === track.key && (
                  <Badge variant="gold" className="text-xs mt-2">Recommended</Badge>
                )}
              </button>
            ))}
          </div>
          <Button
            onClick={() => onConfirm(selectedTrack, selectedTrack !== recommendedTrack)}
            variant="mint"
            className="w-full"
            disabled={!selectedTrack}
          >
            Confirm Track Selection
          </Button>
        </Card>
      </div>
    </div>
  )
}

// Completion Component
function FoundationsCompletion({
  confirmedTrack,
  onComplete
}: {
  confirmedTrack?: string
  onComplete: () => void
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
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Foundations Complete!
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            You're ready to begin your {confirmedTrack || 'cybersecurity'} journey
          </p>
          <Button
            onClick={onComplete}
            variant="mint"
            size="lg"
            className="font-black uppercase tracking-widest text-lg px-12 py-4"
            glow
          >
            <Rocket className="w-5 h-5 mr-2" />
            Begin Your Track
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}
