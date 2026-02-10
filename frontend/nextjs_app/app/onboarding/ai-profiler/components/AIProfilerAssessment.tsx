'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface ProfilingQuestion {
  id: string
  question: string
  category: string
  options: Array<{
    value: string
    text: string
  }>
}

interface Progress {
  session_id: string
  current_question: number
  total_questions: number
  progress_percentage: number
  estimated_time_remaining: number
}

interface AIProfilerAssessmentProps {
  question: ProfilingQuestion
  questionNumber: number
  totalQuestions: number
  progress: Progress
  onAnswer: (questionId: string, answer: string) => void
  previousAnswer?: string
}

export default function AIProfilerAssessment({
  question,
  questionNumber,
  totalQuestions,
  progress,
  onAnswer,
  previousAnswer
}: AIProfilerAssessmentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(previousAnswer || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-save answer selection to localStorage immediately
  useEffect(() => {
    if (selectedAnswer && selectedAnswer !== previousAnswer) {
      // Save to localStorage for immediate persistence
      const saveKey = `profiling_answer_${question.id}`
      localStorage.setItem(saveKey, selectedAnswer)
      console.log('[AIProfilerAssessment] Answer saved locally:', { questionId: question.id, answer: selectedAnswer })
    }
  }, [selectedAnswer, question.id, previousAnswer])

  const handleSubmit = async () => {
    if (!selectedAnswer || isSubmitting) return

    let answerToSubmit = selectedAnswer

    // NOTE: Backend expects A, B, C, D, E as option values - this is correct!
    // Ensure uppercase for consistency
    if (selectedAnswer.length === 1 && /^[A-E]$/i.test(selectedAnswer)) {
      answerToSubmit = selectedAnswer.toUpperCase()
      console.log('[AIProfilerAssessment] Answer is A-E (valid):', answerToSubmit)
    }

    setIsSubmitting(true)
    try {
      console.log('[AIProfilerAssessment] Submitting answer:', {
        questionId: question.id,
        answer: answerToSubmit,
        answerLength: answerToSubmit.length
      })
      await onAnswer(question.id, answerToSubmit)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryInfo = (category: string) => {
    const categories = {
      technical_aptitude: { icon: '🧠', name: 'Technical Aptitude', color: 'text-blue-400' },
      problem_solving: { icon: '💡', name: 'Problem Solving', color: 'text-green-400' },
      scenario_preference: { icon: '🎭', name: 'Scenario Analysis', color: 'text-purple-400' },
      work_style: { icon: '⚡', name: 'Work Style', color: 'text-yellow-400' }
    }
    return categories[category as keyof typeof categories] || { icon: '❓', name: category, color: 'text-gray-400' }
  }

  const categoryInfo = getCategoryInfo(question.category)
  const progressPercentage = Math.round(progress.progress_percentage)

  // Listen for answer selection events (for tracking)
  useEffect(() => {
    const handleAnswerSelected = (event: CustomEvent) => {
      console.log('[AIProfilerAssessment] Answer selection event received:', event.detail)
      // This event is already handled in onChange, but can be used for additional tracking
    }

    window.addEventListener('profiling-answer-selected', handleAnswerSelected as EventListener)
    return () => {
      window.removeEventListener('profiling-answer-selected', handleAnswerSelected as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto w-full"
      >
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-white text-lg font-semibold">
              Question {questionNumber} of {totalQuestions}
            </div>
            <div className="text-gray-400 text-sm">
              {Math.floor(progress.estimated_time_remaining / 60)}:{(progress.estimated_time_remaining % 60).toString().padStart(2, '0')} remaining
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-och-orange to-och-crimson h-3 rounded-full"
            />
          </div>

          <div className="text-center mt-2">
            <span className="text-gray-300 text-sm font-semibold">{progressPercentage}% Complete</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            💾 Your progress is automatically saved. You can return anytime to continue.
          </p>
        </motion.div>

        {/* Question Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8"
        >
          {/* Category Badge */}
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-3">{categoryInfo.icon}</span>
            <span className={`text-sm font-semibold ${categoryInfo.color}`}>
              {categoryInfo.name}
            </span>
          </div>

          {/* Question */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-2xl md:text-3xl font-bold text-white mb-8 leading-relaxed"
          >
            {question.question}
          </motion.h2>

          {/* Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="space-y-4"
          >
            {question.options.map((option, index) => {
              // Ensure option has valid value and text
              let optionValue = option.value || option.text || `option_${index}`
              const optionText = option.text || option.value || optionValue
              
              // NOTE: Backend uses A, B, C, D, E as option values - this is correct!
              // Normalize A-E values to uppercase for consistency
              if (optionValue.length === 1 && /^[A-E]$/i.test(optionValue)) {
                optionValue = optionValue.toUpperCase()
                console.log('[AIProfilerAssessment] Option value is A-E (normalized to uppercase):', {
                  questionId: question.id,
                  value: optionValue,
                  index: index,
                  text: optionText
                })
              }
              
              return (
                <motion.label
                  key={optionValue}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  className={`block p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedAnswer === optionValue
                      ? 'border-och-orange bg-och-orange/20 text-white'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionValue}
                    checked={selectedAnswer === optionValue}
                    onChange={(e) => {
                      const selectedValue = e.target.value
                      // NOTE: Backend uses A, B, C, D, E as option values - this is correct!
                      // Ensure uppercase for consistency
                      const normalizedValue = selectedValue.length === 1 && /^[A-E]$/i.test(selectedValue)
                        ? selectedValue.toUpperCase()
                        : selectedValue
                      
                      console.log('[AIProfilerAssessment] Option selected and recorded:', { 
                        selectedValue: normalizedValue, 
                        optionValue, 
                        optionText,
                        questionId: question.id,
                        match: normalizedValue === optionValue,
                        timestamp: new Date().toISOString()
                      })
                      setSelectedAnswer(normalizedValue)
                      
                      // Dispatch custom event for answer selection (for analytics/tracking)
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('profiling-answer-selected', {
                          detail: {
                            questionId: question.id,
                            answer: normalizedValue,
                            questionNumber: questionNumber,
                            timestamp: new Date().toISOString()
                          }
                        }))
                      }
                    }}
                    className="mr-4 accent-och-orange"
                  />
                  <span className="text-lg">{optionText}</span>
                </motion.label>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center"
        >
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className={`text-xl font-bold px-12 py-4 rounded-full shadow-lg transition-all duration-200 ${
              selectedAnswer && !isSubmitting
                ? 'bg-gradient-to-r from-och-orange to-och-crimson hover:from-och-orange/80 hover:to-och-crimson/80 text-white hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : questionNumber === totalQuestions ? (
              'Complete Assessment'
            ) : (
              'Next Question'
            )}
          </button>

          {selectedAnswer && !isSubmitting && (
            <p className="text-gray-400 text-sm mt-4">
              {questionNumber === totalQuestions
                ? 'Ready to see your OCH track recommendation?'
                : 'Click to continue to the next question'
              }
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}





































