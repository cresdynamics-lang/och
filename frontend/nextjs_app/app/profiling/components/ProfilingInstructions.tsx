'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ProfilingInstructionsProps {
  onContinue: () => void
}

export default function ProfilingInstructions({ onContinue }: ProfilingInstructionsProps) {
  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <Card gradient="defender" glow className="p-8 md:p-12 border border-defender-blue/40 rounded-2xl">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-center mb-8"
          >
            <div className="text-5xl mb-4">📋</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Instructions
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6 mb-8"
          >
            <div className="space-y-4">
              <div className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span>1️⃣</span>
                  <span>Aptitude Assessment</span>
                </h2>
                <p className="text-steel-grey leading-relaxed ml-8">
                  You'll answer questions about your technical knowledge and problem-solving abilities.
                  These questions help us understand your current skill level.
                </p>
              </div>

              <div className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span>2️⃣</span>
                  <span>Behavioral Assessment</span>
                </h2>
                <p className="text-steel-grey leading-relaxed ml-8">
                  You'll answer questions about your work style, preferences, and behavioral traits.
                  This helps us understand how you learn and work best.
                </p>
              </div>

              <div className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span>💾</span>
                  <span>Auto-Save</span>
                </h2>
                <p className="text-steel-grey leading-relaxed ml-8">
                  Your responses are automatically saved every 10 seconds. If you're interrupted,
                  you can resume from where you left off.
                </p>
              </div>

              <div className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Be Honest</span>
                </h2>
                <p className="text-steel-grey leading-relaxed ml-8">
                  There are no right or wrong answers. Be honest about your current abilities and preferences
                  to get the most accurate recommendations.
                </p>
              </div>
            </div>

            <div className="bg-signal-orange/10 rounded-lg p-4 border border-signal-orange/30">
              <p className="text-sm text-signal-orange">
                <strong>Important:</strong> This is a one-time assessment. Once completed, you cannot retake it
                unless an administrator resets your session.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4"
          >
            <Button
              onClick={onContinue}
              variant="defender"
              className="flex-1 py-4 text-lg font-semibold"
            >
              I Understand, Let's Begin
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}



