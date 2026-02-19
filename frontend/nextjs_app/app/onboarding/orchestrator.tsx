'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface OnboardingStatus {
  onboarding_complete: boolean
  next_step?: string
  email?: string
  code?: string
  message?: string
  redirect_url?: string
}

export default function OnboardingOrchestrator() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get email and code from URL params (for email link flow)
  const email = searchParams.get('email')
  const code = searchParams.get('code')

  useEffect(() => {
    checkOnboardingStatus()
  }, [email, code])

  const checkOnboardingStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (email) params.append('email', email)
      if (code) params.append('code', code)

      const response = await fetch(
        `http://localhost:8000/api/v1/auth/onboarding/status?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to check onboarding status')
      }

      const data: OnboardingStatus = await response.json()
      setStatus(data)

      // Route based on status
      if (data.onboarding_complete) {
        // Already onboarded - show message and redirect
        setTimeout(() => {
          router.push(data.redirect_url || '/dashboard')
        }, 3000)
      } else {
        // Route to next step
        routeToNextStep(data)
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err)
      setError('Failed to check onboarding status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const routeToNextStep = (data: OnboardingStatus) => {
    switch (data.next_step) {
      case 'setup_password':
        router.push(`/auth/setup-password?email=${data.email}&code=${data.code}`)
        break
      case 'login':
        router.push(`/login/student?email=${data.email}`)
        break
      case 'verify_email':
        router.push(`/auth/verify-email?email=${data.email}`)
        break
      case 'setup_mfa':
        router.push(`/dashboard/mfa-required`)
        break
      case 'ai_profiling':
        router.push('/onboarding/ai-profiler')
        break
      case 'signup':
        router.push('/signup/student')
        break
      default:
        setError('Unknown onboarding step. Please contact support.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
            <p className="text-och-steel">Checking your onboarding status...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-och-steel mb-6">{error}</p>
            <Button onClick={checkOnboardingStatus} variant="defender" glow>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (status?.onboarding_complete) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-och-mint text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-4">Welcome Back!</h2>
            <p className="text-och-steel mb-6">{status.message}</p>
            <p className="text-sm text-och-steel/70">Redirecting to dashboard...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <p className="text-och-steel">Routing to next step...</p>
        </div>
      </Card>
    </div>
  )
}
