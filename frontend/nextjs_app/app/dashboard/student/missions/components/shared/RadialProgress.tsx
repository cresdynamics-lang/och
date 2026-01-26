/**
 * Radial Progress Component
 * Circular progress indicator with customizable size and colors
 */
'use client'

import { motion } from 'framer-motion'

interface RadialProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}

export function RadialProgress({
  percentage,
  size = 60,
  strokeWidth = 6,
  color = '#3B82F6',
  className = '',
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage >= 80) return '#10B981' // mission-success
    if (percentage >= 50) return '#F59E0B' // mission-warning
    if (percentage >= 25) return '#3B82F6' // mission-primary
    return '#EF4444' // mission-critical
  }

  const progressColor = color || getColor()

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-label={`Progress: ${percentage}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color: progressColor }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  )
}

