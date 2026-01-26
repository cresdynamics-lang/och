'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!email) {
      router.push('/signup')
    }
  }, [email, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    try {
      // OTP verification will be implemented with backend
      // For now, just redirect to onboarding
      router.push('/onboarding')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
    setLoading(true)
    setError('')
    try {
      // OTP resend will be implemented with backend
      setResendCooldown(60)
      setError('')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Verify Your Email</h1>
          <p className="text-och-steel">
            We sent a 6-digit code to <span className="text-och-defender">{email}</span>
          </p>
        </div>

        <Card>
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="p-3 bg-och-orange/20 border border-och-orange/40 rounded-lg text-och-orange text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="defender"
              className="w-full"
              glow
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center">
              <p className="text-och-steel text-sm mb-2">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="text-och-defender hover:text-och-mint transition text-sm disabled:text-och-steel disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <div className="text-och-steel">Loading verification...</div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}


