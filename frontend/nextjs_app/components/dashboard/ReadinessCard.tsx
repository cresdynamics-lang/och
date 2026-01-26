'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTalentscope } from '@/hooks/useTalentscope'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export function ReadinessCard() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { overview, isLoading, error } = useTalentscope(menteeId)
  const [showTooltip, setShowTooltip] = useState(false)

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-och-steel/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-och-steel/20 rounded w-full mb-2"></div>
        </div>
      </Card>
    )
  }

  if (error || !overview) {
    return (
      <Card className="mb-6">
        <div className="text-och-orange">Error loading readiness data: {error || 'No data available'}</div>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Readiness & Progress</h2>
        {overview.preview_mode && (
          <Badge variant="steel">Preview Mode</Badge>
        )}
      </div>

      {/* Overall Readiness */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-och-steel">Overall Readiness</span>
          <span className="text-2xl font-bold text-white">{overview.readiness_score}/100</span>
        </div>
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <ProgressBar value={overview.readiness_score} variant="defender" className="mb-2" />
          {showTooltip && overview.breakdown && (
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg z-10 min-w-[200px]">
              <div className="text-sm text-white mb-2">Breakdown:</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-och-steel">Technical:</span>
                  <span className="text-white">{overview.breakdown.technical}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Practical:</span>
                  <span className="text-white">{overview.breakdown.practical}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Theoretical:</span>
                  <span className="text-white">{overview.breakdown.theoretical}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-och-midnight/50 rounded-lg">
          <div className="text-2xl font-bold text-och-mint mb-1">{overview.missions_completed}</div>
          <div className="text-xs text-och-steel">Missions</div>
        </div>
        <div className="text-center p-3 bg-och-midnight/50 rounded-lg">
          <div className="text-2xl font-bold text-och-defender mb-1">{overview.habit_streak}</div>
          <div className="text-xs text-och-steel">Day Streak</div>
        </div>
        <div className="text-center p-3 bg-och-midnight/50 rounded-lg">
          <div className="text-2xl font-bold text-och-gold mb-1">{overview.portfolio_count}</div>
          <div className="text-xs text-och-steel">Portfolio</div>
        </div>
      </div>

      <Link href="/dashboard/student/analytics">
        <Button variant="outline" className="w-full">
          View Full Analytics
        </Button>
      </Link>
    </Card>
  )
}
