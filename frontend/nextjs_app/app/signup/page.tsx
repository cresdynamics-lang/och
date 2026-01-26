'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { djangoClient } from '@/services/djangoClient'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!firstName || !lastName) {
      setError('First name and last name are required')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await djangoClient.auth.signup({ 
        email, 
        password,
        first_name: firstName,
        last_name: lastName
      })
      // Redirect to OTP verification
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('Google signup is not yet implemented')
  }

  const handleAppleSignup = async () => {
    setError('Apple signup is not yet implemented')
  }

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Join OCH Platform</h1>
          <p className="text-och-steel">Create your account (default role: Mentee)</p>
        </div>

        <Card className="mb-6">
          {error && (
            <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/40 rounded-lg text-och-orange text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <span>🔵</span>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleAppleSignup}
              disabled={loading}
            >
              <span>⚫</span>
              Continue with Apple ID
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-och-steel/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-och-midnight text-och-steel">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-och-steel mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  placeholder="John"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-och-steel mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  placeholder="Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-och-steel mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-och-steel mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={8}
              />
              <p className="mt-1 text-xs text-och-steel">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-och-steel mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="defender"
              className="w-full"
              glow
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-och-steel text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-och-defender hover:text-och-mint transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

