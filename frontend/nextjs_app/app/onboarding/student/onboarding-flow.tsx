'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, Circle, Lock, Eye, EyeOff, Loader2, AlertCircle, Sparkles, Shield, Mail, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { apiGateway } from '@/services/apiGateway'
import { djangoClient } from '@/services/djangoClient'
import { useAuth } from '@/hooks/useAuth'

type OnboardingStep = 'password' | 'login' | 'mfa' | 'profiling' | 'complete'

interface StepStatus {
  password: 'pending' | 'completed' | 'current'
  login: 'pending' | 'completed' | 'current'
  mfa: 'pending' | 'completed' | 'current'
  profiling: 'pending' | 'completed' | 'current'
}

export function StudentOnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, user, reloadUser, completeMFA, sendMFAChallenge } = useAuth()
  
  const email = searchParams.get('email')
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('password')
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    password: 'current',
    login: 'pending',
    mfa: 'pending',
    profiling: 'pending',
  })
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [mfaPending, setMfaPending] = useState<{
    refresh_token: string
    mfa_method: string
    mfa_methods_available?: string[]
  } | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'sms' | 'email'>('totp')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Check user status on mount
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!email) {
        setError('Email is required. Please use the link from your onboarding email.')
        setCheckingStatus(false)
        return
      }
      
      setCheckingStatus(true)
      try {
        const statusResponse = await apiGateway.get('/auth/check-password-status/', {
          params: { email },
        }) as any
        
        const userHasPassword = statusResponse?.has_password === true
        const mfaEnabled = statusResponse?.mfa_enabled === true
        setHasPassword(userHasPassword)
        
        if (userHasPassword) {
          // User has password - go to login step
          setCurrentStep('login')
          setStepStatus({
            password: 'completed',
            login: 'current',
            mfa: mfaEnabled ? 'completed' : 'pending',
            profiling: 'pending',
          })
        } else {
          // User needs to set password
          setCurrentStep('password')
          setStepStatus({
            password: 'current',
            login: 'pending',
            mfa: 'pending',
            profiling: 'pending',
          })
        }
      } catch (err: any) {
        console.error('Failed to check user status:', err)
        // Default to password setup
        setHasPassword(false)
        setCurrentStep('password')
      } finally {
        setCheckingStatus(false)
      }
    }

    checkUserStatus()
  }, [email])

  // Handle password setup
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please enter both password fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await apiGateway.post('/auth/setup-password/', {
        email,
        password,
        confirm_password: confirmPassword,
      })
      
      // Password set successfully - move to login step
      setStepStatus({
        password: 'completed',
        login: 'current',
        mfa: 'pending',
        profiling: 'pending',
      })
      setCurrentStep('login')
      setPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const errorResponse = err?.response?.data || err?.data
      const errorMessage = errorResponse?.error || errorResponse?.detail || 'Password setup failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!loginPassword) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const loginResult = await login({
        email: email!,
        password: loginPassword,
        device_fingerprint: 'web-' + Date.now(),
        device_name: 'Web Browser',
      })
      
      // Check if MFA is required (login returns mfaRequired flag)
      if (loginResult && 'mfaRequired' in loginResult && loginResult.mfaRequired) {
        // MFA required - show MFA challenge (same as login page)
        const backendMethod = (loginResult.mfa_method || 'totp').toLowerCase()
        const available: string[] = Array.isArray((loginResult as any).mfa_methods_available)
          ? (loginResult as any).mfa_methods_available
          : [backendMethod]
        
        setMfaPending({
          refresh_token: loginResult.refresh_token!,
          mfa_method: backendMethod,
          mfa_methods_available: available,
        })
        
        if (backendMethod === 'sms' || backendMethod === 'email') {
          setMfaMethod(backendMethod === 'sms' ? 'sms' : 'email')
        } else {
          setMfaMethod('totp')
        }
        
        setMfaCode('')
        setStepStatus({
          password: 'completed',
          login: 'completed',
          mfa: 'current',
          profiling: 'pending',
        })
        setCurrentStep('mfa')
      } else {
        // No MFA required or MFA not set up - go to profiling
        setStepStatus({
          password: 'completed',
          login: 'completed',
          mfa: 'completed',
          profiling: 'current',
        })
        setCurrentStep('profiling')
        setTimeout(() => router.push('/onboarding/ai-profiler'), 1500)
      }
    } catch (err: any) {
      const errorResponse = err?.response?.data || err?.data
      const errorMessage = errorResponse?.error || errorResponse?.detail || 'Login failed. Please check your password and try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-och-defender animate-spin mx-auto" />
            <p className="text-och-steel">Checking your account status...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Tracker */}
          <div className="md:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-white mb-6">Onboarding Progress</h2>
              <div className="space-y-6">
                {/* Step 1: Set Password */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {stepStatus.password === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-och-mint" />
                    ) : stepStatus.password === 'current' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-och-defender flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-och-defender"></div>
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-och-steel/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${stepStatus.password === 'current' ? 'text-och-defender' : stepStatus.password === 'completed' ? 'text-och-mint' : 'text-och-steel/60'}`}>
                      Set Password
                    </h3>
                    <p className="text-xs text-och-steel/70 mt-1">
                      Create a secure password for your account
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="ml-3 h-8 w-0.5 bg-och-steel/20"></div>

                {/* Step 2: Login */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {stepStatus.login === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-och-mint" />
                    ) : stepStatus.login === 'current' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-och-defender flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-och-defender"></div>
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-och-steel/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${stepStatus.login === 'current' ? 'text-och-defender' : stepStatus.login === 'completed' ? 'text-och-mint' : 'text-och-steel/60'}`}>
                      Confirm Login
                    </h3>
                    <p className="text-xs text-och-steel/70 mt-1">
                      Verify you can access your account
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="ml-3 h-8 w-0.5 bg-och-steel/20"></div>

                {/* Step 3: MFA Setup */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {stepStatus.mfa === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-och-mint" />
                    ) : stepStatus.mfa === 'current' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-och-defender flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-och-defender"></div>
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-och-steel/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${stepStatus.mfa === 'current' ? 'text-och-defender' : stepStatus.mfa === 'completed' ? 'text-och-mint' : 'text-och-steel/60'}`}>
                      MFA Setup
                    </h3>
                    <p className="text-xs text-och-steel/70 mt-1">
                      Secure your account with SMS
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="ml-3 h-8 w-0.5 bg-och-steel/20"></div>

                {/* Step 4: AI Profiling */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {stepStatus.profiling === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-och-mint" />
                    ) : stepStatus.profiling === 'current' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-och-defender flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-och-defender"></div>
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-och-steel/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${stepStatus.profiling === 'current' ? 'text-och-defender' : stepStatus.profiling === 'completed' ? 'text-och-mint' : 'text-och-steel/60'}`}>
                      AI Profiling
                    </h3>
                    <p className="text-xs text-och-steel/70 mt-1">
                      Get matched to your perfect track
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="p-8">
              {/* Password Setup Step */}
              {currentStep === 'password' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-och-defender/20 rounded-full flex items-center justify-center">
                        <Lock className="w-10 h-10 text-och-defender" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-och-defender">Set Up Your Password</h1>
                    <p className="text-och-steel text-sm">
                      Welcome! Create a password to secure your account.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-och-orange flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-och-orange">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSetupPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-10 bg-och-midnight/70 border border-och-steel/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender focus:border-transparent"
                          placeholder="Enter your password"
                          disabled={loading}
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-och-steel hover:text-white transition-colors"
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2 text-xs">
                          <div className={password.length >= 8 ? 'text-och-mint' : 'text-och-orange'}>
                            • At least 8 characters
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-10 bg-och-midnight/70 border border-och-steel/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender focus:border-transparent"
                          placeholder="Confirm your password"
                          disabled={loading}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-och-steel hover:text-white transition-colors"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="mt-2 text-xs text-och-orange">Passwords do not match</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="defender"
                      className="w-full"
                      disabled={loading || password.length < 8 || password !== confirmPassword}
                      glow
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting Password...
                        </>
                      ) : (
                        'Set Password & Continue'
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Login Step */}
              {currentStep === 'login' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-och-defender/20 rounded-full flex items-center justify-center">
                        <Lock className="w-10 h-10 text-och-defender" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-och-defender">Confirm Your Password</h1>
                    <p className="text-och-steel text-sm">
                      Please log in to verify you can access your account.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-och-orange flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-och-orange">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-och-midnight/70 border border-och-steel/40 rounded-lg text-och-steel text-sm cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-10 bg-och-midnight/70 border border-och-steel/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender focus:border-transparent"
                          placeholder="Enter your password"
                          disabled={loading}
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-och-steel hover:text-white transition-colors"
                          disabled={loading}
                        >
                          {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="defender"
                      className="w-full"
                      disabled={loading || !loginPassword}
                      glow
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Logging In...
                        </>
                      ) : (
                        'Continue to Profiling'
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* MFA Step - Challenge existing MFA */}
              {currentStep === 'mfa' && mfaPending && (
                <div>
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-och-defender/20 rounded-full flex items-center justify-center">
                        <Shield className="w-10 h-10 text-och-defender" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-och-defender">Verify Your Identity</h1>
                    <p className="text-och-steel text-sm">
                      {mfaMethod === 'totp'
                        ? 'Enter the code from your authenticator app'
                        : mfaMethod === 'sms'
                        ? 'Enter the code sent to your phone'
                        : 'Enter the code sent to your email'}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-och-orange flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-och-orange">{error}</p>
                    </div>
                  )}

                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    if (!mfaCode.trim() || !mfaPending) return
                    setError(null)
                    setLoading(true)
                    try {
                      const result = await completeMFA({
                        refresh_token: mfaPending.refresh_token,
                        code: mfaCode.trim(),
                        method: mfaMethod,
                      })
                      
                      // Wait for auth state to fully update
                      await new Promise(resolve => setTimeout(resolve, 1000))
                      
                      setMfaPending(null)
                      setMfaCode('')
                      setStepStatus({
                        password: 'completed',
                        login: 'completed',
                        mfa: 'completed',
                        profiling: 'current',
                      })
                      setCurrentStep('profiling')
                      
                      // Wait a bit before redirect to ensure tokens are set
                      await new Promise(resolve => setTimeout(resolve, 500))
                      router.push('/onboarding/ai-profiler')
                    } catch (e: any) {
                      setError(e?.data?.detail || e?.message || 'Invalid code')
                    } finally {
                      setLoading(false)
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        className="w-full px-4 py-3 bg-och-midnight/70 border border-och-steel/40 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-och-defender focus:border-transparent"
                        placeholder="000000"
                        disabled={loading}
                        required
                        autoFocus
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="defender"
                      className="w-full"
                      disabled={loading || !mfaCode.trim()}
                      glow
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Continue'
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Profiling Step */}
              {currentStep === 'profiling' && (
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-och-mint/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-och-mint" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold mb-2 text-och-defender">Ready for AI Profiling!</h1>
                    <p className="text-och-steel mb-4">
                      Redirecting you to the AI Profiler to find your perfect track...
                    </p>
                  </div>
                  <Loader2 className="w-8 h-8 text-och-defender animate-spin mx-auto" />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
