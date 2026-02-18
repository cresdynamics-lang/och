'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { fastapiClient } from '@/services/fastapiClient'
import AIProfilerWelcome from './components/AIProfilerWelcome'
import AIProfilerInstructions from './components/AIProfilerInstructions'
import AIProfilerAssessment from './components/AIProfilerAssessment'
import AIProfilerResults from './components/AIProfilerResults'
import TrackConfirmation from './components/TrackConfirmation'

type ProfilingSection = 'welcome' | 'instructions' | 'assessment' | 'track-confirmation' | 'results'

interface ProfilingQuestion {
  id: string
  question: string
  category: string
  module?: string
  options: Array<{
    value: string
    text: string
  }>
}

interface ProfilingSession {
  session_id: string
  status?: string
  progress?: {
    session_id: string
    current_question: number
    total_questions: number
    progress_percentage: number
    estimated_time_remaining: number
  }
}

type ModuleKey =
  | 'identity_value'
  | 'cyber_aptitude'
  | 'technical_exposure'
  | 'scenario_preference'
  | 'work_style'
  | 'difficulty_selection'

interface ModuleProgress {
  modules: Record<
    string,
    {
      answered: number
      total: number
      completed: boolean
    }
  >
  current_module: string | null
  completed_modules: string[]
  remaining_modules: string[]
}

interface ProfilingResult {
  user_id: string
  session_id: string
  recommendations: Array<{
    track_key: string
    track_name: string
    score: number
    confidence_level: string
    reasoning: string[]
    career_suggestions: string[]
  }>
  primary_track: {
    key: string
    name: string
    description: string
    confidence_score: number
  }
  secondary_tracks: Array<{
    key: string
    name: string
    description: string
    confidence_score: number
  }>
  career_readiness_score: number
  learning_pathway: string[]
  recommended_focus: string[]
  strengths: string[]
  development_areas: string[]
  next_steps: string[]
  assessment_summary: string
  completed_at: string
  // AI-powered enhancements
  future_you_persona?: {
    name: string
    archetype: string
    projected_skills: string[]
    strengths: string[]
    career_vision: string
    confidence: number
    track: string
  }
  personalized_track_descriptions?: Record<string, string>
  ai_confidence?: number
  ai_reasoning?: string
}

// Mock data for AI Profiler when API is not available
const MOCK_PROFILING_QUESTIONS: ProfilingQuestion[] = [
  {
    id: 'q1',
    question: 'What motivates you most in your career?',
    category: 'identity_value',
    module: 'identity_value',
    options: [
      { value: 'helping_others', text: 'Helping others and making a positive impact' },
      { value: 'technical_challenge', text: 'Solving complex technical problems' },
      { value: 'innovation', text: 'Creating new solutions and innovating' },
      { value: 'leadership', text: 'Leading teams and driving change' },
      { value: 'stability', text: 'Building a stable, secure foundation' }
    ]
  },
  {
    id: 'q2',
    question: 'Which cybersecurity activity interests you most?',
    category: 'cyber_aptitude',
    module: 'cyber_aptitude',
    options: [
      { value: 'threat_hunting', text: 'Actively hunting for and stopping threats' },
      { value: 'incident_response', text: 'Responding to security incidents under pressure' },
      { value: 'vulnerability_assessment', text: 'Finding and fixing system weaknesses' },
      { value: 'security_design', text: 'Designing secure systems from the ground up' },
      { value: 'compliance_auditing', text: 'Ensuring systems meet security standards' }
    ]
  },
  {
    id: 'q3',
    question: 'What is your current technical background?',
    category: 'technical_exposure',
    module: 'technical_exposure',
    options: [
      { value: 'beginner', text: 'New to cybersecurity, basic computer knowledge' },
      { value: 'intermediate', text: 'Some IT experience, learning cybersecurity' },
      { value: 'advanced', text: 'Strong technical background, cybersecurity experience' },
      { value: 'expert', text: 'Extensive cybersecurity and technical expertise' }
    ]
  },
  {
    id: 'q4',
    question: 'What work environment do you prefer?',
    category: 'scenario_preference',
    module: 'scenario_preference',
    options: [
      { value: 'office_team', text: 'Collaborative office environment with a team' },
      { value: 'remote_flexible', text: 'Remote work with flexible hours' },
      { value: 'field_hands_on', text: 'Hands-on field work and client interaction' },
      { value: 'lab_research', text: 'Research and development lab environment' },
      { value: 'consulting', text: 'Consulting and advisory role with travel' }
    ]
  },
  {
    id: 'q5',
    question: 'How do you prefer to learn new skills?',
    category: 'work_style',
    module: 'work_style',
    options: [
      { value: 'structured_courses', text: 'Structured courses and certifications' },
      { value: 'hands_on_projects', text: 'Hands-on projects and practical experience' },
      { value: 'mentorship', text: 'Working with mentors and learning by example' },
      { value: 'self_paced', text: 'Self-paced learning with online resources' },
      { value: 'team_collaboration', text: 'Collaborating with peers and group learning' }
    ]
  },
  {
    id: 'q6',
    question: 'What challenge level do you prefer?',
    category: 'difficulty_selection',
    module: 'difficulty_selection',
    options: [
      { value: 'beginner', text: 'Start with fundamentals and build up gradually' },
      { value: 'intermediate', text: 'Balanced challenge with some complexity' },
      { value: 'advanced', text: 'High complexity with challenging problems' },
      { value: 'expert', text: 'Maximum challenge with cutting-edge concepts' }
    ]
  }
]

interface OCHBlueprint {
  track_recommendation: {
    primary_track: {
      key: string
      name: string
      description: string
      score: number
    }
    secondary_track?: {
      key: string
      name: string
    } | null
  }
  difficulty_level: {
    selected: string
    verified: boolean
    confidence: string
    suggested: string
  }
  suggested_starting_point: string
  learning_strategy: {
    optimal_path: string
    foundations: string[]
    strengths_to_leverage: string[]
    growth_opportunities: string[]
  }
  value_statement: string
  personalized_insights: {
    learning_preferences: Record<string, any>
    personality_traits: Record<string, any>
    career_alignment: {
      primary_track?: string
      secondary_track?: string | null
      career_readiness_score?: number
      career_paths?: string[]
    }
  }
  next_steps: string[]
}

export default function AIProfilerPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, reloadUser } = useAuth()
  const [currentSection, setCurrentSection] = useState<ProfilingSection>('welcome')
  const [session, setSession] = useState<ProfilingSession | null>(null)
  const [questions, setQuestions] = useState<ProfilingQuestion[]>([])
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null)
  const [currentModule, setCurrentModule] = useState<ModuleKey | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ProfilingResult | null>(null)
  const [blueprint, setBlueprint] = useState<OCHBlueprint | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assessmentStarted, setAssessmentStarted] = useState(false)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('[AIProfiler] Auth state:', { isAuthenticated, isLoading, user: user?.email })

    // Allow profiling to proceed even without authentication for demonstration purposes
    // Authentication is bypassed to allow users to access profiling questions directly

    if (!isLoading) {
      console.log('[AIProfiler] Checking profiling status (authentication bypassed for demo)')
      // Check profiling status first
      checkProfilingStatus()
    }
  }, [isLoading, router])

  // Listen for profiling completion event to refresh user
  useEffect(() => {
    const handleProfilingCompleted = () => {
      console.log('🔄 Profiling completed event received, refreshing user...')
      if (reloadUser) {
        reloadUser()
      }
    }

    window.addEventListener('profiling-completed', handleProfilingCompleted as EventListener)
    return () => {
      window.removeEventListener('profiling-completed', handleProfilingCompleted as EventListener)
    }
  }, [reloadUser])

  // Listen for answer recording events (for analytics/tracking)
  useEffect(() => {
    const handleAnswerRecorded = (event: CustomEvent) => {
      console.log('[AIProfiler] Answer recorded event:', event.detail)
      // Can be used for analytics, telemetry, etc.
    }

    window.addEventListener('profiling-answer-recorded', handleAnswerRecorded as EventListener)
    return () => {
      window.removeEventListener('profiling-answer-recorded', handleAnswerRecorded as EventListener)
    }
  }, [])

  // Auto-save progress to localStorage when assessment is active
  useEffect(() => {
    if (!assessmentStarted || !session) return

    const saveProgress = () => {
      const progressData = {
        session_id: session.session_id,
        currentQuestionIndex,
        responses,
        questions: questions.map(q => q.id),
        progressPercentage,
        lastSaved: new Date().toISOString(),
        user_id: user?.id?.toString()
      }
      localStorage.setItem('profiling_progress', JSON.stringify(progressData))
      console.log('[AIProfiler] Progress auto-saved:', {
        questionIndex: currentQuestionIndex,
        responsesCount: Object.keys(responses).length,
        percentage: `${progressPercentage}%`,
        timestamp: progressData.lastSaved
      })
    }

    // Debounce saves to avoid excessive localStorage writes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress()
    }, 500) // Save 500ms after last change

    // Also save on window beforeunload (immediate)
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveProgress()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [assessmentStarted, session, currentQuestionIndex, responses, progressPercentage, questions, user])

  // Load saved progress on mount (before questions load)
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return

    const loadSavedProgress = () => {
      try {
        const saved = localStorage.getItem('profiling_progress')
        if (!saved) {
          console.log('[AIProfiler] No saved progress found')
          return
        }

        const progressData = JSON.parse(saved)
        console.log('[AIProfiler] Found saved progress:', {
          sessionId: progressData.session_id,
          responsesCount: Object.keys(progressData.responses || {}).length,
          currentIndex: progressData.currentQuestionIndex,
          percentage: progressData.progressPercentage,
          lastSaved: progressData.lastSaved
        })

        // Only load if it's for the same user
        if (progressData.user_id && user?.id?.toString() !== progressData.user_id) {
          console.log('[AIProfiler] Saved progress is for different user, clearing')
          localStorage.removeItem('profiling_progress')
          return
        }

        // Restore responses immediately
        if (progressData.responses && Object.keys(progressData.responses).length > 0) {
          setResponses(progressData.responses)
          console.log('[AIProfiler] Restored', Object.keys(progressData.responses).length, 'saved responses')
        }

        // Restore progress percentage
        if (progressData.progressPercentage !== undefined) {
          setProgressPercentage(progressData.progressPercentage)
        }
      } catch (error) {
        console.error('[AIProfiler] Failed to load saved progress:', error)
        localStorage.removeItem('profiling_progress')
      }
    }

    loadSavedProgress()
  }, [user])

  // Calculate progress percentage whenever responses change
  useEffect(() => {
    if (questions.length === 0) return

    const answeredCount = Object.keys(responses).length
    const percentage = questions.length > 0 
      ? Math.round((answeredCount / questions.length) * 100) 
      : 0
    
    setProgressPercentage(percentage)
  }, [responses, questions])

  const checkProfilingStatus = async () => {
    let modProgress: any = null
    let status: any = null

    try {
      setLoading(true)
      console.log('[AIProfiler] Checking profiling status...')
      console.log('[AIProfiler] FastAPI URL:', process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'Not configured')
      console.log('[AIProfiler] User authenticated:', !!user)
      console.log('[AIProfiler] User ID:', user?.id)

      // CRITICAL: Check Django's profiling_complete as SOURCE OF TRUTH
      // This prevents redirect loops when admin resets profiling
      try {
        const { djangoClient } = await import('@/services/djangoClient')
        const freshUser = await djangoClient.auth.getCurrentUser()
        console.log('[AIProfiler] Django profiling_complete:', freshUser?.profiling_complete)
        console.log('[AIProfiler] Current section:', currentSection)
        console.log('[AIProfiler] Has result:', !!result)

        // If Django says profiling is complete AND we don't have results loaded, fetch and show results
        if (freshUser?.profiling_complete === true && !result) {
          console.log('✅ Profiling complete - loading results...')
          try {
            const { apiGateway } = await import('@/services/apiGateway')
            const resultsResponse = await apiGateway.get(`/profiler/me/results`)
            if (resultsResponse && resultsResponse.profiling_result) {
              setResult(resultsResponse.profiling_result)
              setBlueprint(resultsResponse.och_blueprint)
              setCurrentSection('results')
              setLoading(false)
              console.log('✅ Loaded completed profiling results')
              return
            }
          } catch (resultsError) {
            console.error('[AIProfiler] Failed to load results:', resultsError)
            // If results can't be loaded, redirect to dashboard
            window.location.href = '/dashboard/student'
            return
          }
        }

        // Django says not complete OR we're viewing results - allow user to stay
        console.log('[AIProfiler] Allowing profiler access - profiling_complete:', freshUser?.profiling_complete, 'viewing results:', currentSection === 'results' || !!result)
      } catch (djangoError) {
        console.error('[AIProfiler] Failed to check Django status:', djangoError)
        // Continue with FastAPI check as fallback
      }

      try {
        // Check FastAPI for session status (not for redirect decision)
        status = await fastapiClient.profiling.checkStatus()
        console.log('[AIProfiler] FastAPI status:', status)
        
        // NOTE: Don't redirect based on FastAPI status alone
        // FastAPI may have stale session data after admin reset
      } catch (apiError: any) {
        // Handle FastAPI being unavailable gracefully
        // If it's a 404 or connection error, FastAPI is likely not running
        // This is OK - we'll start a new session
        if (apiError?.status === 404 || apiError?.status === 0 || 
            apiError?.message?.includes('fetch') || 
            apiError?.message?.includes('ECONNREFUSED')) {
          console.log('[AIProfiler] FastAPI unavailable (expected if not running) - will start new session')
          status = {
            completed: false,
            session_id: null,
            has_active_session: false
          }
        } else {
          // For other errors, log but don't throw - allow user to proceed
          console.warn('[AIProfiler] FastAPI check failed (non-critical):', apiError)
          status = {
            completed: false,
            session_id: null,
            has_active_session: false
          }
        }
      }

      // Check if there's an active session
      if (typeof status === 'object' && status && (status as any).has_active_session && (status as any).session_id) {
        console.log('[AIProfiler] Resuming existing session:', (status as any).session_id)
        // Resume existing session
        setSession({
          session_id: (status as any).session_id,
          progress: (status as any).progress
        })
        // Get enhanced questions grouped by module, then flatten
        const enhanced = await fastapiClient.profiling.getEnhancedQuestions()
        const allQuestions: ProfilingQuestion[] = Object.values(enhanced.questions)
          .flat()
          .map((q: any) => {
            // Normalize options to ensure they have value and text properties
            const normalizedOptions = (q.options || []).map((opt: any, idx: number) => {
              if (typeof opt === 'string') {
                return { value: opt, text: opt }
              } else if (opt && typeof opt === 'object') {
                // Backend uses A, B, C, D, E as values - preserve them exactly
                const value = opt.value || opt.text || `option_${idx}`
                const text = opt.text || opt.value || value
                // Ensure A-E values are uppercase for consistency
                const normalizedValue = (value.length === 1 && /^[A-E]$/i.test(value))
                  ? value.toUpperCase()
                  : value
                return { value: normalizedValue, text }
              }
              return { value: `option_${idx}`, text: String(opt) }
            })
            
            return {
              id: q.id,
              question: q.question,
              category: q.category,
              module: q.module,
              options: normalizedOptions,
            }
          })
        setQuestions(allQuestions)

        // Get module-level progress
        modProgress = await fastapiClient.profiling.getModuleProgress((status as any).session_id)
        setModuleProgress(modProgress)
        setCurrentModule((modProgress.current_module as ModuleKey) || null)

        // Determine current question index based on answered count
        const answeredCount = Object.values(modProgress.modules).reduce(
          (sum: number, m: any) => sum + (m.answered || 0),
          0
        )
        const resumeIndex = Math.min(answeredCount as number, allQuestions.length - 1)
        setCurrentQuestionIndex(resumeIndex)
        
        // Activate assessment recording for resumed session
        setAssessmentStarted(true)
        
        // Calculate and set progress percentage
        const percentage = allQuestions.length > 0 
          ? Math.round((answeredCount / allQuestions.length) * 100) 
          : 0
        setProgressPercentage(percentage)
        
        console.log('[AIProfiler] Resumed session:', {
          sessionId: (status as any).session_id,
          answeredCount,
          resumeIndex,
          percentage: `${percentage}%`
        })
        
        setLoading(false)
        return
      }
      
      // Start new profiling session
      console.log('[AIProfiler] Starting new profiling session')
      initializeProfiling()
    } catch (err: any) {
      console.error('[AIProfiler] Error checking profiling status:', err)

      // Check if it's an authentication error (401) or network/API error
      const isAuthError = err?.status === 401 ||
                         err?.response?.status === 401 ||
                         err?.message?.includes('401') ||
                         err?.message?.includes('Authentication') ||
                         err?.message?.includes('credentials') ||
                         err?.message?.includes('Not authenticated') ||
                         err?.message?.includes('Unauthorized')

      // Check if it's a network/API unavailable error
      const isNetworkError = err?.message?.includes('fetch') ||
                            err?.message?.includes('Failed to fetch') ||
                            err?.message?.includes('NetworkError') ||
                            err?.message?.includes('ECONNREFUSED') ||
                            err?.message?.includes('Connection refused') ||
                            (err?.status === undefined && !isAuthError)

      // Show the real error instead of falling back to mock
      const errorMessage = isAuthError 
        ? 'Authentication failed. Please log in again.' 
        : isNetworkError
        ? 'Cannot connect to profiling service. Please check if FastAPI is running.'
        : err.message || 'Failed to check profiling status'
      
      console.error(`[AIProfiler] ${errorMessage}`, err)
      setError(errorMessage)
      setLoading(false)
    }
  }


  const initializeProfiling = async () => {
    try {
      setLoading(true)
      setError(null)

      // Start new profiling session
      let sessionResponse: any
      try {
        sessionResponse = await fastapiClient.profiling.startSession()
        setSession({
          session_id: sessionResponse.session_id,
          status: sessionResponse.status,
          progress: sessionResponse.progress
        })
      } catch (sessionError: any) {
        // Handle FastAPI being unavailable
        if (sessionError?.status === 404 || sessionError?.status === 0 || 
            sessionError?.message?.includes('fetch') || 
            sessionError?.message?.includes('ECONNREFUSED')) {
          console.warn('[AIProfiler] FastAPI unavailable for session start')
          setError('Profiling service is currently unavailable. Please ensure FastAPI is running on port 8000 and try again.')
          setLoading(false)
          return
        }
        throw sessionError
      }

      // Get enhanced questions grouped by module, then flatten
      let enhanced: any
      try {
        enhanced = await fastapiClient.profiling.getEnhancedQuestions()
        const allQuestions: ProfilingQuestion[] = Object.values(enhanced.questions)
          .flat()
          .map((q: any) => {
            // Normalize options to ensure they have value and text properties
            const normalizedOptions = (q.options || []).map((opt: any, idx: number) => {
              // Handle different option formats from API
              let value: string
              let text: string
              
              if (typeof opt === 'string') {
                value = opt
                text = opt
              } else if (opt && typeof opt === 'object') {
                // Ensure value exists - it's required for submission
                value = opt.value || opt.text || `option_${idx}`
                text = opt.text || opt.value || value
              } else {
                value = `option_${idx}`
                text = String(opt)
              }
              
              // NOTE: Backend uses A, B, C, D, E as option values - this is correct!
              // Keep single letter values as-is (they're valid)
              if (value.length === 1 && /^[A-E]$/i.test(value)) {
                // This is correct - backend expects A-E values
                console.log('[AIProfiler] Option value is A-E (correct):', {
                  questionId: q.id,
                  value: value,
                  index: idx,
                  text: text
                })
              }
              
              return { value, text }
            })
            
            return {
              id: q.id,
              question: q.question,
              category: q.category,
              module: q.module,
              options: normalizedOptions,
            }
          })
          // Filter out difficulty_selection question (removed per user request)
          .filter(q => q.id !== 'difficulty_selection' && q.category !== 'difficulty_selection')
        console.log('[AIProfiler] Loaded questions:', allQuestions.length, 'questions (difficulty_selection filtered out)')
        setQuestions(allQuestions)
        
        // Try to restore saved progress after questions load
        try {
          const saved = localStorage.getItem('profiling_progress')
          if (saved) {
            const progressData = JSON.parse(saved)
            // Only restore if session matches or no session yet
            const currentSessionId = sessionResponse?.session_id || session?.session_id
            if (!currentSessionId || progressData.session_id === currentSessionId || !progressData.session_id) {
              if (progressData.responses && Object.keys(progressData.responses).length > 0) {
                setResponses(progressData.responses)

                // Calculate correct index from number of answered questions
                // This prevents corruption from saved index
                const answeredCount = Object.keys(progressData.responses).length
                const correctIndex = Math.min(answeredCount, allQuestions.length - 1)
                setCurrentQuestionIndex(correctIndex)

                // Calculate percentage from restored responses
                const restoredPercentage = allQuestions.length > 0
                  ? Math.round((answeredCount / allQuestions.length) * 100)
                  : 0
                setProgressPercentage(restoredPercentage)
                
                console.log('[AIProfiler] Restored progress from localStorage:', {
                  responsesCount: Object.keys(progressData.responses).length,
                  currentIndex: correctIndex,
                  percentage: `${restoredPercentage}%`
                })
                
                // Auto-navigate to assessment if there's saved progress
                if (Object.keys(progressData.responses).length > 0) {
                  setCurrentSection('assessment')
                }
              }
            }
          }
        } catch (error) {
          console.error('[AIProfiler] Failed to restore saved progress:', error)
        }
        
        // Activate assessment recording after questions are loaded and progress restored
        setAssessmentStarted(true)
      } catch (questionsError: any) {
        // Handle FastAPI being unavailable for questions
        if (questionsError?.status === 404 || questionsError?.status === 0 || 
            questionsError?.message?.includes('fetch') || 
            questionsError?.message?.includes('ECONNREFUSED')) {
          console.warn('[AIProfiler] FastAPI unavailable for questions')
          setError('Unable to load profiling questions. Please ensure FastAPI is running on port 8001 and try again.')
          setLoading(false)
          return
        }
        throw questionsError
      }

      // Initialize module progress
      try {
        const modProgress = await fastapiClient.profiling.getModuleProgress(sessionResponse.session_id)
        setModuleProgress(modProgress)
        setCurrentModule((modProgress.current_module as ModuleKey) || null)
      } catch (progressError: any) {
        // Handle FastAPI being unavailable for progress - non-critical, log and continue
        if (progressError?.status === 404 || progressError?.status === 0 || 
            progressError?.message?.includes('fetch') || 
            progressError?.message?.includes('ECONNREFUSED')) {
          console.warn('[AIProfiler] FastAPI unavailable for progress - continuing without progress data')
          // Don't set error - progress is optional, user can still proceed
        } else {
          throw progressError
        }
      }

      setLoading(false)
    } catch (err: any) {
      console.error('[AIProfiler] Failed to initialize profiling:', err)
      
      const isAuthError = err?.status === 401
      const isNetworkError = err?.status === 404 || err?.status === 0 || 
                            err?.message?.includes('fetch') || 
                            err?.message?.includes('ECONNREFUSED')
      
      // Provide more specific error messages
      let errorMessage = 'Failed to initialize profiling'
      
      if (isAuthError) {
        errorMessage = 'Authentication required. Please log in to continue.'
      } else if (isNetworkError) {
        // Check if it's a CORS error (browser blocks cross-origin request)
        if (err?.message?.includes('CORS') || err?.message?.includes('cors')) {
          errorMessage = 'CORS error: FastAPI may not be allowing requests from this origin. Check CORS configuration.'
        } else if (err?.status === 0) {
          // Status 0 usually means network error or CORS
          errorMessage = 'Cannot connect to FastAPI backend. Please ensure:\n1. FastAPI is running on port 8001\n2. CORS is configured for your frontend origin\n3. No firewall is blocking the connection'
        } else {
          errorMessage = 'Cannot connect to profiling service. Please ensure FastAPI is running on port 8001.'
        }
      } else if (err?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again and try the profiler.'
      } else if (err?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      console.error('[AIProfiler] Initialization error:', {
        error: err,
        status: err?.status,
        message: err?.message,
        isNetworkError,
        url: err?.url
      })
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleStart = () => {
    setCurrentSection('instructions')
  }

  const handleContinue = () => {
    // Activate assessment recording when user clicks "Start Assessment"
    setAssessmentStarted(true)
    console.log('[AIProfiler] Assessment recording activated')
    
    // Load any saved progress from localStorage
    try {
      const saved = localStorage.getItem('profiling_progress')
      if (saved) {
        const progressData = JSON.parse(saved)
        if (progressData.responses && Object.keys(progressData.responses).length > 0) {
          const answeredCount = Object.keys(progressData.responses).length
          const correctIndex = Math.min(answeredCount, questions.length - 1)
          const correctPercentage = questions.length > 0
            ? Math.round((answeredCount / questions.length) * 100)
            : 0

          console.log('[AIProfiler] Restoring saved progress:', {
            responsesCount: answeredCount,
            currentIndex: correctIndex,
            percentage: correctPercentage
          })
          setResponses(progressData.responses)
          setCurrentQuestionIndex(correctIndex)
          setProgressPercentage(correctPercentage)
        }
      }
    } catch (error) {
      console.error('[AIProfiler] Failed to load saved progress:', error)
    }
    
    setCurrentSection('assessment')
  }

  const handleAnswer = async (questionId: string, answer: string) => {
    if (!session) return

    try {
      // Debug: Log the answer being sent
      console.log('[AIProfiler] Submitting answer:', { 
        questionId, 
        answer, 
        answerType: typeof answer,
        currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex]?.id,
        questionOptions: questions[currentQuestionIndex]?.options?.map(opt => ({ value: opt.value, text: opt.text }))
      })
      
      // NOTE: Backend expects A, B, C, D, E as option values - this is correct!
      // Single letter answers are valid - no correction needed
      if (answer && answer.length === 1 && /^[A-E]$/i.test(answer)) {
        console.log('[AIProfiler] Answer is A-E (valid):', answer)
        // Ensure uppercase for consistency
        answer = answer.toUpperCase()
      }
      
      // Submit response to FastAPI backend
      const response = await fastapiClient.profiling.submitResponse(
        session.session_id,
        questionId,
        answer
      )

      // Update session progress
      if (response.progress) {
        setSession(prev => prev ? {
          ...prev,
          progress: response.progress
        } : null)
      }

      // Update local responses and auto-save
      setResponses(prev => {
        const updated = { ...prev, [questionId]: answer }
        
        // Calculate progress percentage
        const answeredCount = Object.keys(updated).length
        const percentage = questions.length > 0 
          ? Math.round((answeredCount / questions.length) * 100) 
          : 0
        
        // Update progress percentage state
        setProgressPercentage(percentage)
        
        // Auto-save progress immediately (debounced in useEffect)
        // The useEffect hook will handle the actual save
        
        // Dispatch event for answer recording
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profiling-answer-recorded', {
            detail: {
              questionId,
              answer,
              answeredCount,
              totalQuestions: questions.length,
              percentage,
              timestamp: new Date().toISOString()
            }
          }))
        }
        
        console.log('[AIProfiler] Answer recorded:', {
          questionId,
          answer,
          answeredCount,
          totalQuestions: questions.length,
          percentage: `${percentage}%`
        })
        
        return updated
      })

      // Move to next question or complete
      const nextIndex = currentQuestionIndex + 1
      const currentQ = questions[currentQuestionIndex]
      const currentModuleKey = (currentQ?.module as ModuleKey) || currentModule

      // Refresh module progress so we know when a module is done
      if (session) {
        try {
          const modProgress = await fastapiClient.profiling.getModuleProgress(session.session_id)
          setModuleProgress(modProgress)
        } catch (progressError) {
          console.error('[AIProfiler] Failed to get module progress:', progressError)
          // Don't update progress if API fails - let the error surface
        }

        const moduleInfo = currentModuleKey && moduleProgress ? moduleProgress.modules[currentModuleKey] : null
        const moduleJustCompleted = moduleInfo && moduleInfo.completed

        if (moduleJustCompleted && nextIndex < questions.length && moduleProgress) {
          // Move to the next module boundary
          const remainingModules = moduleProgress.remaining_modules as ModuleKey[]
          const nextModule = remainingModules[0] || null
          setCurrentModule(nextModule)
          setCurrentQuestionIndex(nextIndex)
          return
        }

        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex)
          
          // Update progress percentage after moving to next question
          const newPercentage = Math.round(((Object.keys(responses).length + 1) / questions.length) * 100)
          setProgressPercentage(newPercentage)
        } else {
          // All questions answered -> complete profiling
          await completeProfiling()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer')
    }
  }

  const completeProfiling = async () => {
    if (!session) return

    try {
      setLoading(true)
      
      // Variable to hold the final result (either from FastAPI or mock)
      let finalResult: ProfilingResult
      
      // Complete profiling session in FastAPI (enhanced engine under the hood)
      const resultResponse = await fastapiClient.profiling.completeEnhancedSession(session.session_id)
      
      // Transform API response to match our interface
      const transformedResult: ProfilingResult = {
        user_id: resultResponse.user_id,
        session_id: resultResponse.session_id,
        recommendations: resultResponse.recommendations,
        primary_track: resultResponse.primary_track,
        secondary_tracks: resultResponse.secondary_tracks || [],
        career_readiness_score: resultResponse.career_readiness_score,
        learning_pathway: resultResponse.learning_pathway || [],
        recommended_focus: resultResponse.recommended_focus || [],
        strengths: resultResponse.strengths || [],
        development_areas: resultResponse.development_areas || [],
        next_steps: resultResponse.next_steps || [],
        assessment_summary: resultResponse.assessment_summary,
        completed_at: resultResponse.completed_at,
        // AI-powered enhancements
        future_you_persona: resultResponse.future_you_persona,
        personalized_track_descriptions: resultResponse.personalized_track_descriptions,
        ai_confidence: resultResponse.ai_confidence,
        ai_reasoning: resultResponse.ai_reasoning
      }
      
      finalResult = transformedResult
      setResult(transformedResult)

      // Fetch OCH Blueprint for deeper analysis
      const bp = await fastapiClient.profiling.getBlueprint(session.session_id)
      setBlueprint(bp)
      
      // Sync with Django backend to update user.profiling_complete
      try {
        const { apiGateway } = await import('@/services/apiGateway')
        const syncResponse = await apiGateway.post('/profiler/sync-fastapi', {
          user_id: user?.id?.toString(),
          session_id: finalResult.session_id,
          completed_at: finalResult.completed_at,
          primary_track: finalResult.primary_track.key,
          recommendations: finalResult.recommendations.map(rec => ({
            track_key: rec.track_key,
            score: rec.score,
            confidence_level: rec.confidence_level
          }))
        })
        console.log('✅ Profiling synced with Django backend:', syncResponse)
        
        // Refresh user auth state to reflect profiling completion
        if (typeof window !== 'undefined') {
          // Dispatch event for auth hook to refresh user
          window.dispatchEvent(new CustomEvent('profiling-completed', { 
            detail: { sessionId: finalResult.session_id }
          }))
          
          // Also reload user directly after a short delay to allow sync to complete
          setTimeout(() => {
            if (reloadUser) {
              reloadUser()
            }
          }, 500)
        }
      } catch (syncError: any) {
        console.warn('⚠️ Failed to sync with Django:', syncError)
        // Continue anyway - the profiling is complete in FastAPI
        // User can still proceed, sync can happen later
      }
      
      // Show results directly with AI-powered insights
      // Clear saved progress on completion
      localStorage.removeItem('profiling_progress')
      console.log('[AIProfiler] Profiling completed - cleared saved progress')

      // Sync to Django in the background
      try {
        const { apiGateway } = await import('@/services/apiGateway')
        await apiGateway.post('/profiler/sync-fastapi', {
          user_id: user?.id?.toString(),
          session_id: resultResponse.session_id,
          completed_at: resultResponse.completed_at,
          primary_track: resultResponse.primary_track.key,
          recommendations: resultResponse.recommendations.map(rec => ({
            track_key: rec.track_key,
            score: rec.score,
            confidence_level: rec.confidence_level
          }))
        })
        console.log('✅ Results synced to Django')

        // Refresh user state
        if (reloadUser) {
          await reloadUser()
        }
      } catch (syncError: any) {
        console.warn('⚠️ Background sync failed (non-critical):', syncError)
        // Continue anyway - user can proceed with viewing results
      }

      setCurrentSection('results')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to complete profiling')
      setLoading(false)
    }
  }

  const handleTrackConfirm = async (trackKey: string) => {
    try {
      setLoading(true)
      
      // Update the result with confirmed track
      if (result) {
        // Update sync with confirmed track
        try {
          const { apiGateway } = await import('@/services/apiGateway')
          const syncResponse = await apiGateway.post('/profiler/sync-fastapi', {
            user_id: user?.id?.toString(),
            session_id: result.session_id,
            completed_at: result.completed_at,
            primary_track: trackKey, // Use confirmed track
            recommendations: result.recommendations.map(rec => ({
              track_key: rec.track_key,
              score: rec.score,
              confidence_level: rec.confidence_level
            }))
          })
          console.log('✅ Track confirmed and synced:', trackKey, syncResponse)
        } catch (syncError: any) {
          console.warn('⚠️ Failed to sync confirmed track:', syncError)
          // Continue anyway - user can proceed
        }
      }
      
      // Refresh user state
      if (reloadUser) {
        await reloadUser()
      }
      
      // Small delay to ensure sync completes
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Show results screen
      setCurrentSection('results')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to confirm track')
      setLoading(false)
    }
  }

  const handleTrackDecline = async () => {
    // Restart profiling from the beginning instead of manual track selection
    try {
      setLoading(true)

      // Call Django endpoint to reset profiling_complete
      const { apiGateway } = await import('@/services/apiGateway')
      await apiGateway.post('/profiler/reset', {})
      console.log('Profiling reset - restarting from beginning')

      // Refresh user auth state
      if (reloadUser) {
        await reloadUser()
      }

      // Clear saved progress from localStorage
      localStorage.removeItem('profiling_progress')
      console.log('[AIProfiler] Cleared saved progress from localStorage')

      // Reset all local state to start fresh
      setSession(null)
      setQuestions([])
      setModuleProgress(null)
      setCurrentModule(null)
      setCurrentQuestionIndex(0)
      setResponses({})
      setResult(null)
      setBlueprint(null)
      setError(null)
      setProgressPercentage(0)
      setCurrentSection('welcome')
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to reset profiling:', err)
      setError('Failed to restart profiling. Please try again.')
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    // Ensure user state is refreshed before redirecting
    if (reloadUser) {
      await reloadUser()
    }

    // Small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 300))

    // Use Next.js router instead of full page reload
    if (result?.primary_track) {
      router.push(`/dashboard/student?track=${result.primary_track.key}&welcome=true`)
    } else {
      router.push('/dashboard/student')
    }
  }

  const handleRejectProfiling = async () => {
    try {
      setRejecting(true)

      // Call Django endpoint to reset profiling_complete
      const { apiGateway } = await import('@/services/apiGateway')
      await apiGateway.post('/profiler/reset', {})
      console.log('Profiling reset successfully')

      // Refresh user auth state
      if (reloadUser) {
        await reloadUser()
      }

      // Clear saved progress from localStorage
      localStorage.removeItem('profiling_progress')
      console.log('[AIProfiler] Cleared saved progress from localStorage')

      // Reset all local state to start fresh
      setSession(null)
      setQuestions([])
      setModuleProgress(null)
      setCurrentModule(null)
      setCurrentQuestionIndex(0)
      setResponses({})
      setResult(null)
      setBlueprint(null)
      setError(null)
      setProgressPercentage(0)
      setCurrentSection('welcome')
      setRejecting(false)
    } catch (err: any) {
      console.error('Failed to reset profiling:', err)
      setError('Failed to reset profiling. Please try again.')
      setRejecting(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  // Calculate progress based on ANSWERED questions, not current question index
  const answeredCount = Object.keys(responses).length
  const calculatedPercentage = questions.length > 0
    ? Math.round((answeredCount / questions.length) * 100)
    : 0

  const progress = session?.progress || {
    session_id: session?.session_id || '',
    current_question: answeredCount + 1,
    total_questions: questions.length,
    progress_percentage: calculatedPercentage,
    estimated_time_remaining: (questions.length - answeredCount) * 120
  }

  if (loading && currentSection !== 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-orange mx-auto mb-4"></div>
          <div className="text-white text-xl">
            {currentSection === 'welcome' ? 'Initializing AI Profiler...' :
             currentSection === 'assessment' ? 'Processing your responses...' :
             'Analyzing your profile...'}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Profiling Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-och-orange hover:bg-och-orange/80 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
      {currentSection === 'welcome' && (
        <AIProfilerWelcome onStart={handleStart} />
      )}
      {currentSection === 'instructions' && (
        <AIProfilerInstructions
          onContinue={handleContinue}
          totalQuestions={questions.length}
        />
      )}
      {currentSection === 'assessment' && currentQuestion && (
        <AIProfilerAssessment
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          progress={progress}
          onAnswer={handleAnswer}
          previousAnswer={responses[currentQuestion.id]}
        />
      )}
      {currentSection === 'track-confirmation' && result && (
        <TrackConfirmation
          recommendedTrack={{
            key: result.primary_track.key,
            name: result.primary_track.name,
            description: result.primary_track.description
          }}
          allTracks={[
            {
              key: 'defender',
              name: 'Defender',
              description: 'Protect systems, detect threats, and respond to incidents'
            },
            {
              key: 'offensive',
              name: 'Offensive',
              description: 'Ethical hacking, penetration testing, and security research'
            },
            {
              key: 'grc',
              name: 'GRC',
              description: 'Governance, risk management, and compliance'
            },
            {
              key: 'innovation',
              name: 'Innovation',
              description: 'Build security solutions, innovate, and create new technologies'
            },
            {
              key: 'leadership',
              name: 'Leadership',
              description: 'Lead security teams, strategize, and drive organizational change'
            }
          ]}
          onConfirm={handleTrackConfirm}
          onDecline={handleTrackDecline}
        />
      )}
      {currentSection === 'results' && result && (
        <AIProfilerResults
          result={result}
          blueprint={blueprint}
          onComplete={handleComplete}
          onReject={handleRejectProfiling}
          rejecting={rejecting}
        />
      )}
    </div>
  )
}
























