/**
 * Mobile Floating Action Bar
 * Bottom action bar for mobile devices with gesture support
 */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMissionStore } from '@/lib/stores/missionStore'
import { useMissionProgress } from '../hooks/useMissionProgress'

interface MobileFloatingActionBarProps {
  onSave?: () => void
  onComplete?: () => void
  onPrevious?: () => void
  onNext?: () => void
  canGoPrevious?: boolean
  canGoNext?: boolean
}

export function MobileFloatingActionBar({
  onSave,
  onComplete,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: MobileFloatingActionBarProps) {
  const { saveNow } = useMissionProgress()
  const [showSaved, setShowSaved] = useState(false)

  const handleSave = () => {
    saveNow()
    onSave?.()
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-2xl">
      <div className="flex items-center gap-3 max-w-md mx-auto">
        {canGoPrevious && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            className="flex-1"
            aria-label="Previous subtask"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>
        )}

        <Button
          variant="defender"
          size="sm"
          onClick={handleSave}
          className="flex-1"
          aria-label="Save progress"
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>

        {onComplete && (
          <Button
            variant="mint"
            size="sm"
            onClick={onComplete}
            className="flex-1"
            aria-label="Mark subtask complete"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Complete
          </Button>
        )}

        {canGoNext && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            className="flex-1"
            aria-label="Next subtask"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Save Confirmation */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
            role="status"
            aria-live="polite"
          >
            Progress saved!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

