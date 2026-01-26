/**
 * Coaching OS Dashboard Page
 * Main entry point for the Coaching OS experience
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CoachingHub } from '@/components/ui/coaching/CoachingHub'
import { CoachingSidebar } from '@/components/ui/coaching/CoachingSidebar'
import { CoachingNudge } from '@/components/coaching/CoachingNudge'
import { useCoachingStore } from '@/lib/coaching/store'
import { habitsAPI, goalsAPI, reflectionsAPI, metricsAPI } from '@/lib/coaching/api'
import { useAuth } from '@/hooks/useAuth'

export default function CoachingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [activeSection, setActiveSection] = useState<'overview' | 'habits' | 'goals' | 'reflect'>('overview')
  const { 
    setHabits, 
    setGoals, 
    setReflections, 
    setMetrics, 
    setHabitLogs,
    setLoading,
    setError 
  } = useCoachingStore()
  
  useEffect(() => {
    // Only load coaching data if user is authenticated
    if (authLoading) return // Wait for auth to load
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    const loadCoachingData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Load all data in parallel (userId handled by auth in API)
        const [habits, goals, reflections, metrics, habitLogs] = await Promise.all([
          habitsAPI.getAll().catch(() => []),
          goalsAPI.getAll().catch(() => []),
          reflectionsAPI.getAll().catch(() => []),
          metricsAPI.getMetrics().catch(() => ({
            alignmentScore: 0,
            totalStreakDays: 0,
            activeHabits: 0,
            completedGoals: 0,
            reflectionCount: 0,
          })),
          // Load logs for all habits
          Promise.all(
            (await habitsAPI.getAll()).map(habit =>
              habitsAPI.getLogs(habit.id).catch(() => [])
            )
          ).then(logs => logs.flat()).catch(() => []),
        ])

        setHabits(habits)
        setGoals(goals)
        setReflections(reflections)
        setMetrics(metrics)
        setHabitLogs(habitLogs)

        // Core habits are created automatically when Profiler is completed
        // No need to initialize here
      } catch (error) {
        console.error('Failed to load coaching data:', error)
        setError('Failed to load coaching data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadCoachingData()
  }, [isAuthenticated, authLoading, setHabits, setGoals, setReflections, setMetrics, setHabitLogs, setLoading, setError])
  
  const handleNavigate = (section: 'overview' | 'habits' | 'goals' | 'reflect') => {
    setActiveSection(section)
    // Scroll to section or open modal
    const element = document.getElementById(`coaching-${section}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  // Show login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">Personal Coaching OS</h1>
          <p className="text-sm text-slate-300 mb-6">
            Unlock your potential with AI-powered coaching. Track habits, set goals, and get personalized guidance for your cybersecurity career.
          </p>
          <div className="space-y-3">
            <Link href="/signup/student">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-sm py-2">
                Start Your Coaching Journey
              </Button>
            </Link>
            <Link href="/login/student">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 text-sm py-2">
                Sign In to Continue
              </Button>
            </Link>
          </div>
          <div className="mt-6 text-xs text-slate-400">
            <p className="mb-2">What you'll get:</p>
            <ul className="text-left space-y-1">
              <li>• Personalized habit tracking</li>
              <li>• Goal setting and progress monitoring</li>
              <li>• AI-powered coaching insights</li>
              <li>• Career alignment metrics</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <CoachingSidebar onNavigate={handleNavigate} />
      <CoachingHub activeSection={activeSection} setActiveSection={setActiveSection} />
      <CoachingNudge userId={user?.id?.toString()} autoLoad={true} />
    </div>
  )
}

