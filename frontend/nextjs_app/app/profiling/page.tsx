'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { djangoClient } from '@/services/djangoClient'
import ProfilingWelcome from './components/ProfilingWelcome'
import ProfilingInstructions from './components/ProfilingInstructions'
import ProfilingAssessment from './components/ProfilingAssessment'
import ProfilingResults from './components/ProfilingResults'

type ProfilingSection = 'welcome' | 'instructions' | 'aptitude' | 'behavioral' | 'results'

export default function ProfilingPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [currentSection, setCurrentSection] = useState<ProfilingSection>('welcome')
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[ProfilingPage] Auth state:', { isAuthenticated, isLoading, user: user?.email })

    if (!isLoading && !isAuthenticated) {
      console.log('[ProfilingPage] User not authenticated, redirecting to login')
      router.push('/login/student')
      return
    }

    if (isLoading || !isAuthenticated) {
      console.log('[ProfilingPage] Still loading or not authenticated, waiting...')
      return
    }

    // Redirect students to the new AI profiler
    const userRoles = user?.roles || []
    console.log('[ProfilingPage] User roles:', userRoles)

    // Check multiple ways roles might be formatted
    const isStudent = userRoles.some((r: any) => {
      if (typeof r === 'string') {
        const roleName = r.toLowerCase()
        console.log('[ProfilingPage] Checking string role:', roleName)
        return roleName === 'student' || roleName === 'mentee'
      } else if (r && typeof r === 'object') {
        const roleName = (r.role || r.name || r.title || '').toLowerCase()
        console.log('[ProfilingPage] Checking object role:', roleName, r)
        return roleName === 'student' || roleName === 'mentee'
      }
      return false
    })

    console.log('[ProfilingPage] Is student?', isStudent)
    if (isStudent) {
      console.log('[ProfilingPage] Redirecting student to AI profiler')
      router.push('/onboarding/ai-profiler')
      return
    }

    console.log('[ProfilingPage] User is not a student, proceeding with old profiler')

    // Check if profiling is required
    const checkProfiling = async () => {
      try {
        const status = await djangoClient.profiler.checkRequired()
        
        if (!status.required || status.completed) {
          // Profiling not required or already completed
          router.push('/dashboard/student')
          return
        }

        if (status.has_active_session && status.session_token) {
          // Resume existing session
          setSessionData({
            session_id: status.session_id,
            session_token: status.session_token,
            current_section: status.current_section || 'welcome',
          })
          setCurrentSection((status.current_section as ProfilingSection) || 'welcome')
        }

        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to check profiling status')
        setLoading(false)
      }
    }

    checkProfiling()
  }, [isAuthenticated, isLoading, router, user])

  const handleStart = async () => {
    try {
      setLoading(true)
      const session = await djangoClient.profiler.start()
      setSessionData(session)
      setCurrentSection('instructions')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to start profiling')
      setLoading(false)
    }
  }

  const handleContinue = () => {
    setCurrentSection('aptitude')
  }

  const handleSectionComplete = async (section: 'aptitude' | 'behavioral', responses: Record<string, any>) => {
    if (!sessionData?.session_token) return

    try {
      await djangoClient.profiler.completeSection(sessionData.session_token, section, responses)
      
      if (section === 'aptitude') {
        setCurrentSection('behavioral')
      } else {
        // Complete profiling
        const result = await djangoClient.profiler.complete(sessionData.session_token)
        setSessionData({ ...sessionData, result: result.result })
        setCurrentSection('results')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete section')
    }
  }

  const handleComplete = () => {
    router.push('/dashboard/student')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-white text-xl">Loading profiling...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-och-midnight">
      {currentSection === 'welcome' && (
        <ProfilingWelcome onStart={handleStart} />
      )}
      {currentSection === 'instructions' && (
        <ProfilingInstructions onContinue={handleContinue} />
      )}
      {(currentSection === 'aptitude' || currentSection === 'behavioral') && sessionData && (
        <ProfilingAssessment
          sessionToken={sessionData.session_token}
          sessionId={sessionData.session_id}
          section={currentSection}
          questions={
            currentSection === 'aptitude'
              ? sessionData.aptitude_questions || []
              : sessionData.behavioral_questions || []
          }
          onComplete={(responses) => handleSectionComplete(currentSection, responses)}
        />
      )}
      {currentSection === 'results' && sessionData?.result && (
        <ProfilingResults
          result={sessionData.result}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}



