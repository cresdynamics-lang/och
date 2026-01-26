'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ProfilingResultsProps {
  result: {
    overall_score: number
    aptitude_score: number
    behavioral_score: number
    strengths: string[]
    areas_for_growth: string[]
    aptitude_breakdown: Record<string, any>
    behavioral_traits: Record<string, number>
    och_mapping: Record<string, any>
  }
  onComplete: () => void
}

export default function ProfilingResults({ result, onComplete }: ProfilingResultsProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [displayedScore, setDisplayedScore] = useState(0)

  useEffect(() => {
    // Animate score counting
    const duration = 2000
    const steps = 60
    const increment = result.overall_score / steps
    const stepDuration = duration / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= result.overall_score) {
        setDisplayedScore(result.overall_score)
        clearInterval(timer)
      } else {
        setDisplayedScore(current)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [result.overall_score])

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d'][
                    Math.floor(Math.random() * 4)
                  ],
                }}
                initial={{ y: -100, opacity: 1, rotate: 0 }}
                animate={{
                  y: window.innerHeight + 100,
                  opacity: 0,
                  rotate: 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-4xl z-10"
      >
        {/* Celebration Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: 2, delay: 0.5 }}
            className="text-7xl mb-4"
          >
            🎉
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Congratulations!
          </h1>
          <p className="text-xl text-steel-grey">
            You've completed your profiling assessment
          </p>
        </motion.div>

        <Card gradient="defender" glow className="p-8 md:p-12 border border-defender-blue/40 rounded-2xl">
          {/* Overall Score */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="text-center mb-12"
          >
            <div className="inline-block relative">
              <div className="text-6xl md:text-7xl font-bold text-cyber-mint mb-2">
                {Math.round(displayedScore)}%
              </div>
              <div className="text-steel-grey text-lg">Overall Score</div>
              <motion.div
                className="absolute -top-4 -right-4 text-4xl"
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                ⭐
              </motion.div>
            </div>
          </motion.div>

          {/* Score Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Aptitude Score</h3>
              <div className="text-4xl font-bold text-defender-blue mb-2">
                {Math.round(result.aptitude_score)}%
              </div>
              <div className="w-full bg-steel-grey/20 rounded-full h-2 mt-4">
                <motion.div
                  className="bg-defender-blue h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.aptitude_score}%` }}
                  transition={{ delay: 0.8, duration: 1 }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Behavioral Score</h3>
              <div className="text-4xl font-bold text-cyber-mint mb-2">
                {Math.round(result.behavioral_score)}%
              </div>
              <div className="w-full bg-steel-grey/20 rounded-full h-2 mt-4">
                <motion.div
                  className="bg-cyber-mint h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.behavioral_score}%` }}
                  transition={{ delay: 0.9, duration: 1 }}
                />
              </div>
            </motion.div>
          </div>

          {/* Strengths */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-8"
          >
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>💪</span>
              <span>Your Strengths</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {result.strengths.map((strength, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.1 + idx * 0.1 }}
                  className="bg-cyber-mint/10 border border-cyber-mint/30 rounded-lg p-4 text-white"
                >
                  {strength}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Areas for Growth */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mb-8"
          >
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>📈</span>
              <span>Areas for Growth</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {result.areas_for_growth.map((area, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.4 + idx * 0.1 }}
                  className="bg-defender-blue/10 border border-defender-blue/30 rounded-lg p-4 text-white"
                >
                  {area}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* OCH Mapping */}
          {result.och_mapping && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="bg-gradient-to-r from-defender-blue/20 to-cyber-mint/20 rounded-lg p-6 border border-defender-blue/30 mb-8"
            >
              <h3 className="text-xl font-semibold text-white mb-3">
                🎯 Your OCH System Mapping
              </h3>
              <div className="space-y-2 text-steel-grey">
                <div>
                  <strong className="text-white">Tier:</strong> {result.och_mapping.tier || 'Tier 0'}
                </div>
                <div>
                  <strong className="text-white">Readiness Score:</strong>{' '}
                  {Math.round(result.och_mapping.readiness_score || result.overall_score)}%
                </div>
              </div>
            </motion.div>
          )}

          {/* Continue Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            <Button
              onClick={onComplete}
              variant="defender"
              className="w-full py-4 text-lg font-semibold"
            >
              Continue to Dashboard
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}



