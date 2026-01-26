'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiGateway } from '@/services/apiGateway'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)

  useEffect(() => {
    // Validate token exists
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
      setValidatingToken(false)
    } else {
      setValidatingToken(false)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
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
      await apiGateway.post('/auth/reset-password/', {
        token,
        new_password: password,
        confirm_password: confirmPassword,
      })
      
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login/student')
      }, 3000)
    } catch (err: any) {
      const errorResponse = err?.response?.data || err?.data
      const errorMessage = errorResponse?.error || errorResponse?.detail || 'Password reset failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Loading state while validating token
  if (validatingToken) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-och-defender animate-spin mx-auto" />
              <p className="text-steel-grey">Validating reset link...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fadeIn">
          <Card gradient="defender" glow className="p-8 shadow-xl border border-defender-blue/40 rounded-2xl">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-cyber-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-cyber-mint" />
                </div>
                <h2 className="text-h2 text-white mb-2">Password Reset Successful!</h2>
                <p className="text-body-m text-steel-grey mb-4">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <p className="text-sm text-steel-grey">
                  Redirecting to login page...
                </p>
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

  // Form state
  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 drop-shadow-glow">🔐</div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Reset Password
          </h1>
          <p className="text-body-s text-steel-grey mt-2 opacity-80">
            Enter your new password below
          </p>
        </div>

        {/* Auth Card */}
        <Card gradient="defender" glow className="p-8 shadow-xl border border-defender-blue/40 rounded-2xl">
          <h2 className="text-h2 text-white mb-6 text-center">New Password</h2>

          {/* Error */}
          {error && (
            <div
              className="bg-signal-orange/25 border border-signal-orange text-white px-4 py-3 rounded-md text-sm mb-5 animate-fadeIn flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-steel-grey"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-steel-grey" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-3 bg-och-midnight border border-steel-grey rounded-md text-white placeholder-steel-grey/50 focus:outline-none focus:ring-2 focus:ring-cyber-mint focus:border-transparent transition-all"
                  disabled={loading}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-steel-grey hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-steel-grey/70">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-steel-grey"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-steel-grey" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-3 bg-och-midnight border border-steel-grey rounded-md text-white placeholder-steel-grey/50 focus:outline-none focus:ring-2 focus:ring-cyber-mint focus:border-transparent transition-all"
                  disabled={loading}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-steel-grey hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              variant="defender"
              className="w-full py-3 text-base font-semibold rounded-md"
              glow
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-steel-grey/50">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-steel-grey hover:text-white"
              onClick={() => router.push('/login/student')}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-steel-grey/70">
            Need a new reset link?{' '}
            <button
              onClick={() => router.push('/forgot-password')}
              className="text-cyber-mint hover:text-cyber-mint/80 transition-colors font-medium"
            >
              Request another
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
          <Card className="p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-och-defender animate-spin mx-auto mb-4" />
              <p className="text-steel-grey">Loading...</p>
            </div>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}




