'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ProfilingWelcomeProps {
  onStart: () => void
}

export default function ProfilingWelcome({ onStart }: ProfilingWelcomeProps) {
  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card gradient="defender" glow className="p-8 md:p-12 border border-defender-blue/40 rounded-2xl">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-center mb-8"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome to Your Profiling Journey
            </h1>
            <p className="text-xl text-steel-grey">
              Discover Your Future-You Persona
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6 mb-8"
          >
            <div className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30">
              <h2 className="text-xl font-semibold text-white mb-3">
                What is the Profiling Engine?
              </h2>
              <p className="text-steel-grey leading-relaxed">
                The Profiling Engine (Future-You Profiler) is your mandatory Tier 0 entry gateway into the OCH ecosystem.
                It's designed to identify your strengths, technical abilities, and aptitude before you can access any tracks or foundations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-och-midnight/50 rounded-lg p-4 border border-steel-grey/30">
                <div className="text-2xl mb-2">⏱️</div>
                <h3 className="font-semibold text-white mb-2">Time Required</h3>
                <p className="text-sm text-steel-grey">Approximately 2-3 minutes</p>
              </div>
              <div className="bg-och-midnight/50 rounded-lg p-4 border border-steel-grey/30">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-white mb-2">What You'll Get</h3>
                <p className="text-sm text-steel-grey">Personalized track recommendations</p>
              </div>
            </div>

            <div className="bg-cyber-mint/10 rounded-lg p-4 border border-cyber-mint/30">
              <p className="text-sm text-cyber-mint">
                <strong>Note:</strong> This is a mandatory requirement for all students signing up to the OCH platform.
                Your progress is automatically saved, so you can resume if interrupted.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={onStart}
              variant="defender"
              className="w-full py-4 text-lg font-semibold"
            >
              Begin Profiling Journey
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}



