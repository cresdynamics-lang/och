'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'

interface CountdownProps {
  deadline: string | Date
  onExpired?: () => void
}

export function Countdown({ deadline, onExpired }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const deadlineTime = new Date(deadline).getTime()
      const difference = deadlineTime - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
        if (onExpired) onExpired()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, total: difference })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [deadline, onExpired])

  if (!timeLeft) return null

  const isUrgent = timeLeft.total < 24 * 60 * 60 * 1000 // Less than 24 hours
  const isCritical = timeLeft.total < 6 * 60 * 60 * 1000 // Less than 6 hours
  const isExpired = timeLeft.total === 0

  const getVariant = () => {
    if (isExpired) return 'orange' as const
    if (isCritical) return 'orange' as const
    if (isUrgent) return 'defender' as const
    return 'steel' as const
  }

  const formatTime = () => {
    if (isExpired) return 'Expired'
    if (timeLeft.days > 0) return `${timeLeft.days}d ${timeLeft.hours}h`
    if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m`
    return `${timeLeft.minutes}m ${timeLeft.seconds}s`
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getVariant()} className="text-xs font-semibold">
        {isExpired ? '⚠️ Expired' : isCritical ? '🔴 Due Soon' : isUrgent ? '🟡 Due Today' : '⏰ '}
        {formatTime()}
      </Badge>
    </div>
  )
}

