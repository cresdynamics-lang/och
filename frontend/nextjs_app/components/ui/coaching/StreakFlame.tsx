/**
 * Streak Flame Component
 * Animated flame icon for habit streaks with gamification
 */
'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStreakEmoji } from '@/lib/coaching/utils'

interface StreakFlameProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
  isAtRisk?: boolean
}

export function StreakFlame({ 
  streak, 
  size = 'md',
  className,
  showText = true,
  isAtRisk = false 
}: StreakFlameProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }
  
  // Color based on streak length
  const getColor = () => {
    if (streak >= 90) return 'text-orange-600'
    if (streak >= 30) return 'text-orange-500'
    if (streak >= 14) return 'text-orange-400'
    if (streak >= 7) return 'text-yellow-500'
    return 'text-yellow-400'
  }
  
  // Animation intensity based on streak
  const animationIntensity = streak >= 30 ? 1.2 : streak >= 14 ? 1.1 : 1.05
  
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <motion.div
        animate={{
          scale: [1, animationIntensity, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn('relative', sizeClasses[size])}
      >
        {/* Glow effect */}
        <motion.div
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={cn('absolute inset-0 blur-md', getColor())}
          style={{
            filter: `blur(8px)`,
          }}
        />
        
        {/* Flame icon */}
        <Flame 
          className={cn('relative z-10', getColor(), sizeClasses[size])}
          fill="currentColor"
        />
      </motion.div>
      
      {showText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className={cn('font-bold', textSizeClasses[size], getColor())}>
            {streak} day{streak !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {getStreakEmoji(streak)} Streak
          </p>
          {isAtRisk && (
            <p className="text-xs text-amber-500 mt-1 animate-pulse">
              ⚠️ At risk
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}


