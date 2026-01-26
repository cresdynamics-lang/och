/**
 * Google OAuth Callback Page
 * Handles the redirect from Google after user authenticates
 */
'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { googleOAuthClient } from '@/services/googleOAuthClient'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function GoogleOAuthCallbackPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing Google authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')

        // Handle OAuth errors from Google
        if (errorParam) {
          setStatus('error')
          setError(`Google authentication failed: ${errorParam}`)
          return
        }

        if (!code || !state) {
          setStatus('error')
          setError('Missing authorization code or state parameter')
          return
        }

        // Get device fingerprint
        const deviceFingerprint = typeof window !== 'undefined' 
          ? `web-${Date.now()}-${navigator.userAgent.slice(0, 50)}`
          : 'unknown'
        
        const deviceName = typeof window !== 'undefined'
          ? navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Web Browser'
          : 'Unknown Device'

        // Exchange code for tokens and create/activate account
        const response = await googleOAuthClient.callback({
          code,
          state,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName,
        })

        // Store tokens in localStorage
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token)
          localStorage.setItem('auth_token', response.access_token)
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token)
          }
          // Also set HttpOnly cookies via Next.js API for SSR consistency
          try {
            await fetch('/api/auth/ssologin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                user: response.user,
              }),
            })
          } catch (e) {
            console.error('[OAuth] Failed to set cookies via ssologin route', e)
          }
        }

        setStatus('success')
        setMessage(
          response.account_created
            ? 'Account created and activated successfully!'
            : 'Login successful!'
        )

        // Determine redirect path
        const userRoles = response.user?.roles || []
        console.log('[OAuth Callback] User roles:', userRoles)
        
        const isStudent = userRoles.some((r: any) => {
          const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase()
          console.log('[OAuth Callback] Checking role:', roleName)
          return roleName === 'student' || roleName === 'mentee'
        })

        const redirectPath = isStudent ? '/onboarding/ai-profiler' : '/dashboard'
        console.log('[OAuth Callback] Will redirect to:', redirectPath)

        // Redirect with page reload to ensure token/cookies are available everywhere
        setTimeout(() => {
          window.location.href = redirectPath
        }, 1500)

      } catch (err: any) {
        console.error('Google OAuth callback error:', err)
        setStatus('error')
        setError(
          err?.data?.detail || 
          err?.message || 
          'Failed to complete Google authentication'
        )
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center space-y-4">
          {status === 'processing' && (
            <>
              <Loader2 className="w-12 h-12 text-och-orange animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-white">Processing...</h2>
              <p className="text-gray-300">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-och-mint mx-auto" />
              <h2 className="text-xl font-bold text-white">Success!</h2>
              <p className="text-gray-300">{message}</p>
              <p className="text-sm text-gray-400">Redirecting to your dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Authentication Failed</h2>
              <p className="text-gray-300">{error}</p>
              <Button
                onClick={() => router.push('/login/student')}
                variant="outline"
                className="mt-4"
              >
                Return to Login
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <GoogleOAuthCallbackPageInner />
    </Suspense>
  )
}
