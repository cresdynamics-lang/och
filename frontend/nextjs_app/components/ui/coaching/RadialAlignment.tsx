/**
 * Radial Alignment Component
 * Shows Future-You alignment progress with radial progress indicator
 */
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RadialAlignmentProps {
  score: number // 0-100
  target?: number // Default 95
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

export function RadialAlignment({ 
  score, 
  target = 95, 
  size = 'md',
  className,
  showLabel = true 
}: RadialAlignmentProps) {
  const percentage = Math.min(100, Math.max(0, score))
  const circumference = 2 * Math.PI * 45 // radius = 45
  const offset = circumference - (percentage / 100) * circumference
  
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  }
  
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }
  
  // Color gradient based on score
  const getColor = () => {
    if (percentage >= 90) return '#10B981' // Emerald
    if (percentage >= 75) return '#3B82F6' // Blue
    if (percentage >= 60) return '#F59E0B' // Amber
    return '#EF4444' // Red
  }
  
  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      <svg
        className="transform -rotate-90"
        width={size === 'sm' ? 80 : size === 'md' ? 128 : 192}
        height={size === 'sm' ? 80 : size === 'md' ? 128 : 192}
      >
        {/* Background circle */}
        <circle
          cx={size === 'sm' ? 40 : size === 'md' ? 64 : 96}
          cy={size === 'sm' ? 40 : size === 'md' ? 64 : 96}
          r={size === 'sm' ? 35 : size === 'md' ? 56 : 84}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === 'sm' ? 4 : size === 'md' ? 6 : 8}
          className="text-slate-700"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size === 'sm' ? 40 : size === 'md' ? 64 : 96}
          cy={size === 'sm' ? 40 : size === 'md' ? 64 : 96}
          r={size === 'sm' ? 35 : size === 'md' ? 56 : 84}
          fill="none"
          stroke={getColor()}
          strokeWidth={size === 'sm' ? 4 : size === 'md' ? 6 : 8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}40)`,
          }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn('font-bold text-slate-100', textSizeClasses[size])}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.span>
        {showLabel && size !== 'sm' && (
          <span className="text-xs text-slate-400 mt-1">Aligned</span>
        )}
      </div>
      
      {/* Target indicator */}
      {target && percentage < target && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-slate-500">Target: {target}%</span>
        </div>
      )}
    </div>
  )
}


