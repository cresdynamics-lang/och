'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiGateway } from '@/services/apiGateway'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!email) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const response = await apiGateway.post<any>('/auth/request-password-reset/', { email })
      
      // Check if the response indicates an error
      if (response?.error) {
        setError(response.error)
        setLoading(false)
        return
      }
      
      // Success - email sent (or security response)
      setSuccess(true)
    } catch (err: any) {
      // Handle different error scenarios
      const errorResponse = err?.response?.data || err?.data
      const statusCode = err?.response?.status || err?.status
      
      if (statusCode === 400) {
        setError(errorResponse?.error || 'Invalid request. Please check your email address.')
      } else if (statusCode === 500) {
        // Server error - likely email service issue
        setError(
          errorResponse?.error || 
          'Email service error. Please check backend logs. The Resend package may not be installed or configured correctly.'
        )
      } else {
        // For network errors or other issues, show generic message
        setError(
          'Unable to send email. Please check that:\n' +
          '1. The Django backend is running\n' +
          '2. RESEND_API_KEY is configured in .env\n' +
          '3. The resend package is installed: pip install resend'
        )
      }
    } finally {
      setLoading(false)
    }
  }

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
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Auth Card */}
        <Card gradient="defender" glow className="p-8 shadow-xl border border-defender-blue/40 rounded-2xl">
          {success ? (
            // Success State
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-cyber-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-cyber-mint" />
                </div>
                <h2 className="text-h2 text-white mb-2">Check Your Email</h2>
                <p className="text-body-m text-steel-grey mb-4">
                  If an account with <span className="text-white font-medium">{email}</span> exists, 
                  we've sent you a password reset link.
                </p>
                <p className="text-sm text-steel-grey">
                  The link will expire in 1 hour. Please check your spam folder if you don't see it in your inbox.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="defender"
                  className="w-full"
                  onClick={() => router.push('/login/student')}
                  glow
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          ) : (
            // Form State
            <>
              <h2 className="text-h2 text-white mb-6 text-center">Forgot Password</h2>

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
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-steel-grey"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-steel-grey" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-och-midnight border border-steel-grey rounded-md text-white placeholder-steel-grey/50 focus:outline-none focus:ring-2 focus:ring-cyber-mint focus:border-transparent transition-all"
                      disabled={loading}
                      required
                      autoComplete="email"
                    />
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Reset Link
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
            </>
          )}
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-steel-grey/70">
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-cyber-mint hover:text-cyber-mint/80 transition-colors font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

