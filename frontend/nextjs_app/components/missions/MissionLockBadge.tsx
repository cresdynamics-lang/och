/**
 * MissionLockBadge Component
 *
 * Displays lock status and provides information about why a mission is locked.
 * Shows a lock icon with tooltip explaining the lock reason.
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react'
import type { LockReason } from '@/utils/missionLocking'
import { getLockReasonIcon } from '@/utils/missionLocking'

interface MissionLockBadgeProps {
  is_locked: boolean
  lock_reason: LockReason
  lock_message: string
  className?: string
}

export const MissionLockBadge: React.FC<MissionLockBadgeProps> = ({
  is_locked,
  lock_reason,
  lock_message,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!is_locked) {
    return null
  }

  const iconType = getLockReasonIcon(lock_reason)

  const iconConfigs: Record<
    'lock' | 'alert' | 'info' | 'clock',
    { icon: React.FC<any>; color: string; bgColor: string }
  > = {
    lock: {
      icon: Lock,
      color: 'text-och-steel',
      bgColor: 'bg-och-steel/10 border-och-steel/30'
    },
    alert: {
      icon: AlertTriangle,
      color: 'text-och-orange',
      bgColor: 'bg-och-orange/10 border-och-orange/30'
    },
    info: {
      icon: Info,
      color: 'text-och-defender',
      bgColor: 'bg-och-defender/10 border-och-defender/30'
    },
    clock: {
      icon: Clock,
      color: 'text-och-gold',
      bgColor: 'bg-och-gold/10 border-och-gold/30'
    }
  }

  const config = iconConfigs[iconType]
  const IconComponent = config.icon

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-help ${config.bgColor}`}
      >
        <IconComponent className={`w-4 h-4 ${config.color}`} />
        <span className={`text-xs font-semibold ${config.color} uppercase tracking-wide`}>
          Locked
        </span>
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none"
          >
            <div className="bg-och-midnight border border-och-gold/40 rounded-xl shadow-2xl px-4 py-3 max-w-xs backdrop-blur-sm">
              <p className="text-xs text-och-gold font-semibold uppercase tracking-wide mb-1">
                {lock_reason === 'not_enrolled' && '⚠️ Profile Setup Required'}
                {lock_reason === 'wrong_track' && '🔒 Different Track'}
                {lock_reason === 'pending_profile' && '⏳ Loading...'}
              </p>
              <p className="text-xs text-och-steel leading-relaxed">
                {lock_message}
              </p>

              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5">
                <div className="border-8 border-transparent border-t-och-midnight/80" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MissionLockBadge
