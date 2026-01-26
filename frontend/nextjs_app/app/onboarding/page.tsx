'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const totalSteps = 3

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Redirect to profile completion
      router.push('/profile')
    } catch (err) {
      console.error('Error completing onboarding:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-och-mint">Welcome to OCH Platform</h1>
            <span className="text-och-steel">Step {step} of {totalSteps}</span>
          </div>
          <ProgressBar value={(step / totalSteps) * 100} variant="defender" />
        </div>

        <Card>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Getting Started</h2>
                <p className="text-och-steel mb-6">
                  Let's set up your profile. This will help us personalize your learning experience
                  and match you with the right opportunities.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">What we'll ask:</h3>
                  <ul className="list-disc list-inside space-y-1 text-och-steel text-sm">
                    <li>Your learning goals</li>
                    <li>Career aspirations</li>
                    <li>Current experience level</li>
                    <li>Basic profile information</li>
                  </ul>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  variant="defender"
                  className="w-full"
                  glow
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">How It Works</h2>
                <p className="text-och-steel mb-6">
                  Our TalentScope system will analyze your responses to create a personalized baseline.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-defender/20">
                  <h3 className="font-semibold text-och-mint mb-2">TalentScope Analysis</h3>
                  <p className="text-och-steel text-sm">
                    Your profile data will feed into our TalentScope baseline calculations,
                    helping us understand your strengths and areas for growth.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    variant="defender"
                    className="flex-1"
                    glow
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Ready to Begin</h2>
                <p className="text-och-steel mb-6">
                  You'll now complete your profile. Some fields are required, but you can skip
                  non-critical ones and complete them later.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-och-midnight/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Next Steps:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-och-steel text-sm">
                    <li>Complete your profile information</li>
                    <li>Set your learning preferences</li>
                    <li>Define your career goals</li>
                    <li>Access your personalized dashboard</li>
                  </ol>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    variant="defender"
                    className="flex-1"
                    glow
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Complete Profile'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

