'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { fastapiClient } from '@/services/fastapiClient'
import AIProfilerWelcome from './components/AIProfilerWelcome'
import AIProfilerInstructions from './components/AIProfilerInstructions'
import AIProfilerAssessment from './components/AIProfilerAssessment'
import AIProfilerResults from './components/AIProfilerResults'

type ProfilingSection = 'welcome' | 'instructions' | 'assessment' | 'results'

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
  const [error, setError] = useState<string | null>(null)

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

  const checkProfilingStatus = async () => {
    let modProgress: any = null

    try {
      setLoading(true)
      console.log('[AIProfiler] Checking profiling status...')

      try {
        // Check if profiling is already completed
        const status = await fastapiClient.profiling.checkStatus()
        console.log('[AIProfiler] Profiling status:', status)

        if (typeof status === 'object' && status && (status as any).completed) {
          // Already completed, redirect to dashboard
          console.log('✅ Profiling already completed')
          window.location.href = '/dashboard/student'
          return
        }
      } catch (apiError: any) {
        // FastAPI is not available, proceed with mock profiling
        console.log('[AIProfiler] FastAPI unavailable, proceeding with mock profiling session...')
        initializeMockProfiling()
        return
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
          .map((q: any) => ({
            id: q.id,
            question: q.question,
            category: q.category,
            module: q.module,
            options: q.options,
          }))
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
        setCurrentQuestionIndex(Math.min(answeredCount as number, allQuestions.length - 1))
        
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

      if (isAuthError || isNetworkError) {
        // Allow profiling to proceed with mock data for demonstration purposes
        const errorType = isNetworkError ? 'API unavailable' : 'Authentication failed'
        console.log(`[AIProfiler] ${errorType}, proceeding with mock profiling session...`)

        // Set up mock questions and session
        setQuestions(MOCK_PROFILING_QUESTIONS)

        // Initialize mock module progress
        const mockModuleProgress: ModuleProgress = {
          modules: {
            identity_value: { answered: 0, total: 1, completed: false },
            cyber_aptitude: { answered: 0, total: 1, completed: false },
            technical_exposure: { answered: 0, total: 1, completed: false },
            scenario_preference: { answered: 0, total: 1, completed: false },
            work_style: { answered: 0, total: 1, completed: false },
            difficulty_selection: { answered: 0, total: 1, completed: false }
          },
          current_module: null,
          completed_modules: [],
          remaining_modules: ['identity_value', 'cyber_aptitude', 'technical_exposure', 'scenario_preference', 'work_style', 'difficulty_selection']
        }
        setModuleProgress(mockModuleProgress)

        // Set mock session
        setSession({
          session_id: 'mock-session-' + Date.now(),
          status: 'in_progress',
          progress: {
            session_id: 'mock-session-' + Date.now(),
            current_question: 0,
            total_questions: MOCK_PROFILING_QUESTIONS.length,
            progress_percentage: 0,
            estimated_time_remaining: MOCK_PROFILING_QUESTIONS.length * 2
          }
        })

        setCurrentSection('welcome')
        setError(null)
        setLoading(false)
        return
      }

      setError(err.message || 'Failed to check profiling status')
      setLoading(false)
    }
  }

  const initializeMockProfiling = () => {
    console.log('[AIProfiler] Setting up mock profiling session...')

    // Set up mock questions and session
    setQuestions(MOCK_PROFILING_QUESTIONS)

    // Initialize mock module progress
    const mockModuleProgress: ModuleProgress = {
      modules: {
        identity_value: { answered: 0, total: 1, completed: false },
        cyber_aptitude: { answered: 0, total: 1, completed: false },
        technical_exposure: { answered: 0, total: 1, completed: false },
        scenario_preference: { answered: 0, total: 1, completed: false },
        work_style: { answered: 0, total: 1, completed: false },
        difficulty_selection: { answered: 0, total: 1, completed: false }
      },
      current_module: null,
      completed_modules: [],
      remaining_modules: ['identity_value', 'cyber_aptitude', 'technical_exposure', 'scenario_preference', 'work_style', 'difficulty_selection']
    }

    setModuleProgress(mockModuleProgress)

    // Initialize mock session
    setSession({
      session_id: 'mock-session-' + Date.now(),
      progress: {
        session_id: 'mock-session-' + Date.now(),
        current_question: 0,
        total_questions: MOCK_PROFILING_QUESTIONS.length,
        progress_percentage: 0,
        estimated_time_remaining: MOCK_PROFILING_QUESTIONS.length * 2
      }
    })

    setCurrentSection('welcome')
    setError(null)
    setLoading(false)

    console.log('[AIProfiler] Mock profiling setup complete')
  }

  const initializeProfiling = async () => {
    try {
      setLoading(true)

      // Start new profiling session
      const sessionResponse = await fastapiClient.profiling.startSession()
      setSession({
        session_id: sessionResponse.session_id,
        status: sessionResponse.status,
        progress: sessionResponse.progress
      })

      // Get enhanced questions grouped by module, then flatten
      const enhanced = await fastapiClient.profiling.getEnhancedQuestions()
      const allQuestions: ProfilingQuestion[] = Object.values(enhanced.questions)
        .flat()
        .map((q: any) => ({
          id: q.id,
          question: q.question,
          category: q.category,
          module: q.module,
          options: q.options,
        }))
      setQuestions(allQuestions)

      // Initialize module progress
      const modProgress = await fastapiClient.profiling.getModuleProgress(sessionResponse.session_id)
      setModuleProgress(modProgress)
      setCurrentModule((modProgress.current_module as ModuleKey) || null)

      setLoading(false)
    } catch (err: any) {
      console.error('[AIProfiler] Error initializing profiling:', err)

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

      if (isAuthError || isNetworkError) {
        // Use mock questions for demonstration purposes
        const errorType = isNetworkError ? 'API unavailable' : 'Authentication failed'
        console.log(`[AIProfiler] ${errorType}, using mock questions for profiling assessment...`)
        setQuestions(MOCK_PROFILING_QUESTIONS)

        // Initialize mock module progress
        const mockModuleProgress: ModuleProgress = {
          modules: {
            identity_value: { answered: 0, total: 1, completed: false },
            cyber_aptitude: { answered: 0, total: 1, completed: false },
            technical_exposure: { answered: 0, total: 1, completed: false },
            scenario_preference: { answered: 0, total: 1, completed: false },
            work_style: { answered: 0, total: 1, completed: false },
            difficulty_selection: { answered: 0, total: 1, completed: false }
          },
          current_module: null,
          completed_modules: [],
          remaining_modules: ['identity_value', 'cyber_aptitude', 'technical_exposure', 'scenario_preference', 'work_style', 'difficulty_selection']
        }
        setModuleProgress(mockModuleProgress)

        // Set mock session
        setSession({
          session_id: 'mock-session-' + Date.now(),
          status: 'in_progress',
          progress: {
            session_id: 'mock-session-' + Date.now(),
            current_question: 0,
            total_questions: MOCK_PROFILING_QUESTIONS.length,
            progress_percentage: 0,
            estimated_time_remaining: MOCK_PROFILING_QUESTIONS.length * 2 // 2 minutes per question
          }
        })

        setError(null)
        setLoading(false)
        return
      }

      setError(err.message || 'Failed to initialize AI profiling')
      setLoading(false)
    }
  }

  const handleStart = () => {
    setCurrentSection('instructions')
  }

  const handleContinue = () => {
    setCurrentSection('assessment')
  }

  const handleAnswer = async (questionId: string, answer: string) => {
    if (!session) return

    try {
      // Check if this is a mock session
      const isMockSession = session.session_id.startsWith('mock-session-')
      
      if (isMockSession) {
        // Handle mock session locally without calling FastAPI
        console.log('[AIProfiler] Mock mode: Recording answer locally')
        
        // Update local responses
        setResponses(prev => ({ ...prev, [questionId]: answer }))
        
        // Update progress locally
        const answeredCount = Object.keys(responses).length + 1
        const progressPercentage = (answeredCount / questions.length) * 100
        
        setSession(prev => prev ? {
          ...prev,
          progress: {
            ...prev.progress,
            current_question: currentQuestionIndex + 1,
            progress_percentage: progressPercentage,
            estimated_time_remaining: (questions.length - answeredCount) * 120
          }
        } : null)
      } else {
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

        // Update local responses
        setResponses(prev => ({ ...prev, [questionId]: answer }))
      }

      // Move to next question or complete
      const nextIndex = currentQuestionIndex + 1
      const currentQ = questions[currentQuestionIndex]
      const currentModuleKey = (currentQ?.module as ModuleKey) || currentModule

      // Refresh module progress so we know when a module is done
      if (session) {
        const isMockSession = session.session_id.startsWith('mock-session-')
        
        if (isMockSession) {
          // For mock mode, update progress locally without calling FastAPI
          console.log('[AIProfiler] Mock mode: Updating progress locally')
          setModuleProgress(prev => {
            if (!prev) return prev
            const updatedModules = { ...prev.modules }
            if (currentModuleKey && updatedModules[currentModuleKey]) {
              updatedModules[currentModuleKey] = {
                ...updatedModules[currentModuleKey],
                answered: updatedModules[currentModuleKey].answered + 1
              }
            }
            return {
              ...prev,
              modules: updatedModules
            }
          })
        } else {
          // Real session: call FastAPI
          try {
            const modProgress = await fastapiClient.profiling.getModuleProgress(session.session_id)
            setModuleProgress(modProgress)
          } catch (progressError) {
            console.log('[AIProfiler] API unavailable for progress tracking, using mock progress')
            // For mock mode, update progress locally
            setModuleProgress(prev => {
              if (!prev) return prev
              const updatedModules = { ...prev.modules }
              if (currentModuleKey && updatedModules[currentModuleKey]) {
                updatedModules[currentModuleKey] = {
                  ...updatedModules[currentModuleKey],
                  answered: updatedModules[currentModuleKey].answered + 1
                }
              }
              return {
                ...prev,
                modules: updatedModules
              }
            })
          }
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

      try {
        // Complete profiling session in FastAPI (enhanced engine under the hood)
        const resultResponse = await fastapiClient.profiling.completeSession(session.session_id)
        // Transform API response to match our interface
        const transformedResult: ProfilingResult = {
          user_id: resultResponse.user_id || 'unknown',
          session_id: resultResponse.session_id,
          recommendations: resultResponse.recommendations || [],
          primary_track: resultResponse.primary_track || {
            key: 'defender',
            name: 'Cybersecurity Defender',
            description: 'Focus on defensive security operations',
            confidence_score: 75
          },
          secondary_tracks: resultResponse.secondary_tracks || [],
          career_readiness_score: resultResponse.career_readiness_score || 70,
          learning_pathway: resultResponse.learning_pathway || [],
          recommended_focus: resultResponse.recommended_focus || [],
          strengths: resultResponse.strengths || [],
          development_areas: resultResponse.development_areas || [],
          next_steps: resultResponse.next_steps || [],
          assessment_summary: resultResponse.assessment_summary || 'Assessment completed',
          completed_at: resultResponse.completed_at || new Date().toISOString()
        }
        finalResult = transformedResult
        setResult(transformedResult)
      } catch (apiError: any) {
        console.log('[AIProfiler] FastAPI unavailable for completion, generating mock results')

        // Generate mock profiling results
        const mockResults: ProfilingResult = {
          user_id: 'mock-user',
          session_id: session.session_id,
          recommendations: [
            {
              track_key: 'defender',
              track_name: 'Cybersecurity Defender',
              score: 85,
              confidence_level: 'high',
              reasoning: [
                'Strong analytical thinking and problem-solving abilities',
                'Interest in threat detection and security monitoring',
                'Attention to detail and methodical approach'
              ],
              career_suggestions: [
                'SOC Analyst',
                'Security Operations Engineer',
                'Threat Intelligence Analyst'
              ]
            },
            {
              track_key: 'grc',
              track_name: 'Governance, Risk & Compliance',
              score: 72,
              confidence_level: 'medium',
              reasoning: [
                'Understanding of security policies and frameworks',
                'Interest in organizational security posture',
                'Communication and documentation skills'
              ],
              career_suggestions: [
                'GRC Analyst',
                'Compliance Specialist',
                'Risk Assessment Consultant'
              ]
            }
          ],
          primary_track: {
            key: 'defender',
            name: 'Cybersecurity Defender',
            description: 'Focus on defensive security operations and threat detection',
            confidence_score: 85,
            focus_areas: [
              'Security Monitoring',
              'Threat Detection',
              'Incident Response',
              'Log Analysis',
              'SIEM Tools'
            ],
            career_paths: [
              'SOC Analyst',
              'Security Operations Engineer',
              'Threat Intelligence Analyst',
              'Incident Responder'
            ]
          },
          secondary_tracks: [
            {
              key: 'grc',
              name: 'Governance, Risk & Compliance',
              description: 'Specialize in security governance and compliance',
              confidence_score: 72
            }
          ],
          career_readiness_score: 78,
          learning_pathway: [
            'log-analysis-fundamentals',
            'siem-searching-basics',
            'alert-triage-intro'
          ],
          recommended_focus: [
            'threat_intelligence_analysis',
            'incident_response_coordination'
          ],
          strengths: [
            'Strong analytical skills',
            'Interest in threat detection',
            'Experience with log analysis'
          ],
          development_areas: [
            'Advanced threat hunting',
            'Incident response coordination'
          ],
          next_steps: [
            'Complete SOC Analyst certification',
            'Practice with real security tools',
            'Join cybersecurity community'
          ],
          assessment_summary: 'Strong foundation in cybersecurity with focus on defensive operations',
          completed_at: new Date().toISOString()
        }
        finalResult = mockResults
        setResult(mockResults)
      }

      // Fetch OCH Blueprint for deeper analysis
      try {
        const bp = await fastapiClient.profiling.getBlueprint(session.session_id)
        setBlueprint(bp)
      } catch (bpError) {
        console.log('[AIProfiler] FastAPI unavailable for blueprint, generating mock blueprint')

        // Generate mock blueprint
        const mockBlueprint: OCHBlueprint = {
          session_id: session.session_id,
          user_profile: {
            primary_motivation: 'career_advancement',
            learning_style: 'hands_on',
            time_commitment: 'moderate',
            technical_background: 'intermediate',
            career_goals: 'Become a cybersecurity analyst'
          },
          track_recommendation: {
            primary_track: 'defender',
            confidence_level: 85,
            reasoning: 'Based on your interest in threat detection and analytical skills'
          },
          learning_pathway: {
            recommended_starting_point: 'defender-beginner',
            foundational_modules: [
              'log-analysis-fundamentals',
              'network-security-basics',
              'threat-detection-intro'
            ],
            progression_timeline: '6-9 months to competency',
            milestone_checkpoints: [
              'Complete basic log analysis',
              'Pass defender certification',
              'Build incident response portfolio'
            ]
          },
          value_statement: 'You are a natural defender with strong analytical skills and a passion for protecting digital assets. Your methodical approach and attention to detail make you well-suited for cybersecurity defense roles.'
        }
        setBlueprint(mockBlueprint)
      }
      
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
      
      setCurrentSection('results')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to complete profiling')
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
    
    // Redirect to dashboard with track recommendation (full page reload to ensure token is available)
    if (result?.primary_track) {
      window.location.href = `/dashboard/student?track=${result.primary_track.key}&welcome=true`
    } else {
      window.location.href = '/dashboard/student'
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = session?.progress || {
    session_id: session?.session_id || '',
    current_question: currentQuestionIndex + 1,
    total_questions: questions.length,
    progress_percentage: questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0,
    estimated_time_remaining: (questions.length - currentQuestionIndex - 1) * 120
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
      {currentSection === 'results' && result && (
        <AIProfilerResults
          result={result}
          blueprint={blueprint}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
























