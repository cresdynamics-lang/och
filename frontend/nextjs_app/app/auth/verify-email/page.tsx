'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || ''

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(0)

  // Get verification parameters from URL
  const token = searchParams.get('token')
  const code = searchParams.get('code')
  const email = searchParams.get('email')

  useEffect(() => {
    // Auto-verify on mount if we have the required params
    if (status === 'idle' && (token || (code && email))) {
      handleVerification()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, code, email, status])

  useEffect(() => {
    // Countdown timer for redirect
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && status === 'success') {
      // Redirect to login after countdown
      router.push('/login/student')
    }
  }, [countdown, status, router])

  const handleVerification = async () => {
    setStatus('loading')
    setError('')
    setMessage('Verifying your email...')

    try {
      const response = await fetch(`${DJANGO_API_URL}/api/v1/auth/verify-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(token && { token }),
          ...(code && email && { code, email }),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully! You can now log in.')
        setCountdown(5) // 5 second countdown before redirect
      } else {
        setStatus('error')
        setError(data.error || data.detail || 'Verification failed. Please try again.')
      }
    } catch (err) {
      setStatus('error')
      setError('Network error. Please check your connection and try again.')
      console.error('Verification error:', err)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is required to resend verification.')
      return
    }

    setStatus('loading')
    setError('')
    setMessage('Sending verification email...')

    try {
      // Request new verification email
      const response = await fetch(`${DJANGO_API_URL}/api/v1/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          // Note: This might require additional fields depending on your API
          // You may need to create a separate resend endpoint
        }),
      })

      if (response.ok) {
        setStatus('idle')
        setMessage('Verification email sent! Please check your inbox.')
        setError('')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to resend verification email.')
        setStatus('error')
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.')
      setStatus('error')
      console.error('Resend error:', err)
    }
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-och-defender animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2 text-och-defender">Verifying Your Email</h1>
                <p className="text-och-steel">{message || 'Please wait...'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Show success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-och-mint/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-och-mint" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2 text-och-defender">Email Verified!</h1>
                <p className="text-och-steel mb-4">{message}</p>
                {countdown > 0 && (
                  <p className="text-sm text-och-steel">
                    Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>
              <Button
                variant="defender"
                className="w-full"
                onClick={() => router.push('/login/student')}
                glow
              >
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Show error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-och-orange/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-och-orange" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2 text-och-defender">Verification Failed</h1>
                <p className="text-och-steel mb-4">{error}</p>
              </div>
              <div className="space-y-3">
                {email && (
                  <Button
                    variant="defender"
                    className="w-full"
                    onClick={handleResendVerification}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/login/student')}
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Initial/idle state - show instructions
  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-och-defender/20 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-och-defender" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-och-defender">Verify Your Email</h1>
              <p className="text-och-steel mb-4">
                {token || (code && email)
                  ? 'Click the button below to verify your email address.'
                  : 'Please check your email for a verification link.'}
              </p>
            </div>
            {(token || (code && email)) && (
              <Button
                variant="defender"
                className="w-full"
                onClick={handleVerification}
                glow
              >
                Verify Email
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login/student')}
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
          <Card className="p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-och-defender animate-spin mx-auto mb-4" />
              <p className="text-och-steel">Loading verification...</p>
            </div>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

