'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { djangoClient } from '@/services/djangoClient'
import { useAuth } from '@/hooks/useAuth'

interface Question {
  id: string
  question_text: string
  answer_type: string
  options?: string[]
  category: string
}

interface ProfilingAssessmentProps {
  sessionToken: string
  sessionId: string
  section: 'aptitude' | 'behavioral'
  questions: Question[]
  onComplete: (responses: Record<string, any>) => void
}

export default function ProfilingAssessment({
  sessionToken,
  sessionId,
  section,
  questions,
  onComplete,
}: ProfilingAssessmentProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState(false)

  // Autosave every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[ProfilingAssessment] User not authenticated, skipping autosave')
      return
    }

    const autosaveInterval = setInterval(() => {
      const currentQuestion = questions[currentIndex]
      if (currentQuestion && responses[currentQuestion.id]) {
        console.log('[ProfilingAssessment] Autosaving response for question:', currentQuestion.id)
        djangoClient.profiler.autosave(
          sessionToken,
          currentQuestion.id,
          responses[currentQuestion.id]
        ).catch((error) => {
          console.error('[ProfilingAssessment] Autosave failed:', error)
          if (error.status === 401) {
            console.error('[ProfilingAssessment] Authentication failed during autosave - redirecting to login')
            setAuthError(true)
            setTimeout(() => {
              router.push('/login/student')
            }, 2000)
          }
        })
      }
    }, 10000) // 10 seconds

    return () => clearInterval(autosaveInterval)
  }, [sessionToken, currentIndex, questions, responses, isAuthenticated])

  // Update progress when question changes
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[ProfilingAssessment] User not authenticated, skipping progress update')
      return
    }

    console.log('[ProfilingAssessment] Updating progress:', { sessionToken, section, currentIndex })
    djangoClient.profiler.updateProgress(sessionToken, section, currentIndex)
      .then(() => console.log('[ProfilingAssessment] Progress updated successfully'))
      .catch((error) => {
        console.error('[ProfilingAssessment] Progress update failed:', error)
        if (error.status === 401) {
          console.error('[ProfilingAssessment] Authentication failed - redirecting to login')
          setAuthError(true)
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login/student')
          }, 2000)
        }
      })
  }, [sessionToken, section, currentIndex, isAuthenticated, router])

  const handleAnswer = (questionId: string, answer: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      console.log('[ProfilingAssessment] Moving to next question:', currentIndex + 1)
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onComplete(responses)
    } catch (error) {
      console.error('Error completing section:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const canProceed = currentQuestion && responses[currentQuestion.id] !== undefined
  const allAnswered = questions.every((q) => responses[q.id] !== undefined)

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-white">Loading questions...</div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">🔒</div>
          <h2 className="text-white text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">
            Your session has expired. You will be redirected to the login page shortly.
          </p>
          <Button
            onClick={() => router.push('/login/student')}
            variant="defender"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-steel-grey mb-2">
            <span>
              {section === 'aptitude' ? 'Aptitude Assessment' : 'Behavioral Assessment'}
            </span>
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-steel-grey/20 rounded-full h-2">
            <motion.div
              className="bg-cyber-mint h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <Card gradient="defender" glow className="p-8 border border-defender-blue/40 rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <div className="text-sm text-steel-grey mb-2">{currentQuestion.category}</div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {currentQuestion.question_text}
                </h2>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion.answer_type === 'multiple_choice' && currentQuestion.options && (
                  <>
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          handleAnswer(currentQuestion.id, { value: option, selected: idx })
                        }
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          responses[currentQuestion.id]?.selected === idx
                            ? 'border-cyber-mint bg-cyber-mint/10 text-white'
                            : 'border-steel-grey bg-och-midnight/50 text-steel-grey hover:border-cyber-mint/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </>
                )}

                {currentQuestion.answer_type === 'scale' && (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-steel-grey mb-4">
                      <span>Not at all</span>
                      <span>Very much</span>
                    </div>
                    <div className="grid grid-cols-10 gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                        <button
                          key={value}
                          onClick={() =>
                            handleAnswer(currentQuestion.id, { value, type: 'scale' })
                          }
                          className={`p-3 rounded-lg border transition-all ${
                            responses[currentQuestion.id]?.value === value
                              ? 'border-cyber-mint bg-cyber-mint/20 text-white scale-110'
                              : 'border-steel-grey bg-och-midnight/50 text-steel-grey hover:border-cyber-mint/50'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.answer_type === 'likert' && (
                  <div className="grid grid-cols-5 gap-3">
                    {['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].map(
                      (label, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            handleAnswer(currentQuestion.id, { value: idx + 1, label })
                          }
                          className={`p-4 rounded-lg border transition-all text-sm ${
                            responses[currentQuestion.id]?.value === idx + 1
                              ? 'border-cyber-mint bg-cyber-mint/10 text-white'
                              : 'border-steel-grey bg-och-midnight/50 text-steel-grey hover:border-cyber-mint/50'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                )}

                {currentQuestion.answer_type === 'boolean' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleAnswer(currentQuestion.id, { value: true, label: 'Yes' })}
                      className={`p-6 rounded-lg border transition-all text-lg font-semibold ${
                        responses[currentQuestion.id]?.value === true
                          ? 'border-cyber-mint bg-cyber-mint/10 text-white'
                          : 'border-steel-grey bg-och-midnight/50 text-steel-grey hover:border-cyber-mint/50'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswer(currentQuestion.id, { value: false, label: 'No' })}
                      className={`p-6 rounded-lg border transition-all text-lg font-semibold ${
                        responses[currentQuestion.id]?.value === false
                          ? 'border-cyber-mint bg-cyber-mint/10 text-white'
                          : 'border-steel-grey bg-och-midnight/50 text-steel-grey hover:border-cyber-mint/50'
                      }`}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-4">
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="px-6"
                >
                  Previous
                </Button>

                {currentIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allAnswered || loading}
                    variant="defender"
                    className="px-8"
                  >
                    {loading ? 'Submitting...' : 'Complete Section'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    variant="defender"
                    className="px-8"
                  >
                    Next
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}



