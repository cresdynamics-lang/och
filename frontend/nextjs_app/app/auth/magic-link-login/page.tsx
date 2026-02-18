'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { djangoClient } from '@/services/djangoClient'

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || ''

function MagicLinkLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const code = searchParams.get('code')
  const email = searchParams.get('email')
  const redirectTo = searchParams.get('redirect') || '/onboarding/ai-profiler'

  useEffect(() => {
    if (code && email && status === 'loading') {
      handleMagicLinkLogin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, email])

  const handleMagicLinkLogin = async () => {
    if (!code || !email) {
      setStatus('error')
      setError('Missing code or email')
      return
    }

    try {
      // Login with magic link code
      const response = await fetch(`${DJANGO_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store tokens
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
        }
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token)
        }
        if (data.auth_token) {
          localStorage.setItem('auth_token', data.auth_token)
        }

        setStatus('success')
        setMessage('Login successful! Redirecting...')

        // Redirect after short delay
        setTimeout(() => {
          router.push(redirectTo)
        }, 1000)
      } else {
        setStatus('error')
        setError(data.detail || data.error || 'Login failed. Please try again.')
      }
    } catch (err: any) {
      setStatus('error')
      setError('Network error. Please check your connection and try again.')
      console.error('Magic link login error:', err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center space-y-6">
            <Loader2 className="w-12 h-12 text-och-defender animate-spin mx-auto" />
            <div>
              <h1 className="text-2xl font-bold mb-2 text-och-defender">Logging You In</h1>
              <p className="text-och-steel">{message || 'Please wait...'}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-och-mint/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-och-mint" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-och-defender">Login Successful!</h1>
              <p className="text-och-steel mb-4">{message}</p>
            </div>
            <Button
              variant="defender"
              className="w-full"
              onClick={() => router.push(redirectTo)}
              glow
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-och-orange/20 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-och-orange" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-och-defender">Login Failed</h1>
              <p className="text-och-steel mb-4">{error}</p>
            </div>
            <Button
              variant="defender"
              className="w-full"
              onClick={() => router.push('/login/student')}
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return null
}

export default function MagicLinkLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
          <Card className="p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-och-defender animate-spin mx-auto mb-4" />
              <p className="text-och-steel">Loading...</p>
            </div>
          </Card>
        </div>
      }
    >
      <MagicLinkLoginContent />
    </Suspense>
  )
}
