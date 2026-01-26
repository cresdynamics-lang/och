/**
 * Timer Display Component
 * Shows time remaining with pause/resume functionality
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TimerDisplayProps {
  timeLeft: number // seconds
  isPaused?: boolean
  onPause?: () => void
  onResume?: () => void
  className?: string
}

export function TimerDisplay({
  timeLeft,
  isPaused: externalPaused,
  onPause,
  onResume,
  className = '',
}: TimerDisplayProps) {
  const [internalTime, setInternalTime] = useState(timeLeft)
  const [internalPaused, setInternalPaused] = useState(externalPaused || false)

  const isPaused = externalPaused !== undefined ? externalPaused : internalPaused

  useEffect(() => {
    setInternalTime(timeLeft)
  }, [timeLeft])

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setInternalTime((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const handleToggle = () => {
    if (externalPaused === undefined) {
      setInternalPaused(!internalPaused)
    } else {
      if (isPaused) {
        onResume?.()
      } else {
        onPause?.()
      }
    }
  }

  const getColor = () => {
    const hours = internalTime / 3600
    if (hours < 1) return 'text-mission-critical'
    if (hours < 2) return 'text-mission-warning'
    return 'text-mission-success'
  }

  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-2 bg-white rounded-xl border-2 border-slate-200 ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Clock className={`w-5 h-5 ${getColor()}`} />
      <div className="flex flex-col">
        <span className={`text-lg font-bold ${getColor()}`}>
          {formatTime(internalTime)}
        </span>
        <span className="text-xs text-slate-500">remaining</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="ml-2"
        aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
      >
        {isPaused ? (
          <Play className="w-4 h-4" />
        ) : (
          <Pause className="w-4 h-4" />
        )}
      </Button>
    </motion.div>
  )
}

