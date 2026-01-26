'use client'

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore } from '../lib/store/dashboardStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useRouter } from 'next/navigation'
import '../styles/dashboard.css'

export const NextActionsCarousel = memo(function NextActionsCarousel() {
  const { nextActions } = useDashboardStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const visibleActions = useMemo(() => nextActions.slice(0, 5), [nextActions])

  useEffect(() => {
    if (!isAutoScrolling || visibleActions.length <= 1) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleActions.length)
    }, 10000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAutoScrolling, visibleActions.length])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'defender'
      case 'medium':
        return 'orange'
      default:
        return 'steel'
    }
  }

  const handleActionClick = useCallback((actionUrl: string) => {
    router.push(actionUrl)
  }, [router])

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < visibleActions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsAutoScrolling(false)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsAutoScrolling(false)
    }
  }

  if (visibleActions.length === 0) {
    return (
      <Card className="glass-card p-6">
        <div className="text-center">
          <p className="text-och-steel mb-4">No actions available</p>
          <Button
            variant="mint"
            size="sm"
            onClick={() => router.push('/dashboard/student/missions')}
          >
            Browse Missions
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div 
      className="relative mb-0"
      role="region"
      aria-label="Next actions carousel"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-white">Next Actions</h3>
        <div className="flex gap-2">
          {visibleActions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx)
                setIsAutoScrolling(false)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-dashboard-accent w-6' : 'bg-och-steel/40'
              }`}
              aria-label={`Go to action ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex gap-2 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / Math.min(5, visibleActions.length))}%)` }}
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
        >
          {visibleActions.map((action, idx) => (
            <motion.div
              key={action.id}
              className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/5"
              whileHover={{ scale: 1.02 }}
            >
              <div onClick={() => handleActionClick(action.actionUrl)}>
                <Card className="glass-card glass-hover p-2 h-auto min-h-[80px] cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={getUrgencyColor(action.urgency)} className="text-xs">
                    {action.urgency === 'high' ? '🔴' : action.urgency === 'medium' ? '🟡' : '🟢'} {action.urgency}
                  </Badge>
                  {action.dueDate && (
                    <span className="text-xs text-och-steel">
                      {new Date(action.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">{action.title}</h4>
                
                {action.description && (
                  <p className="text-xs text-och-steel mb-3 line-clamp-2">{action.description}</p>
                )}
                
                {action.progress !== undefined && (
                  <div className="mb-3">
                    <ProgressBar value={action.progress} max={100} variant="mint" showLabel={false} className="h-1.5" />
                  </div>
                )}
                
                <Button
                  variant="mint"
                  size="sm"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleActionClick(action.actionUrl)
                  }}
                >
                  {action.type === 'mission' ? 'Start' : action.type === 'habit' ? 'Log' : action.type === 'upgrade' ? 'Upgrade' : 'View'}
                </Button>
              </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
})

