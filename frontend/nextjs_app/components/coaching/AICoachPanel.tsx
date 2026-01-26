'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAICoaching } from '@/hooks/useAICoaching'
import { useAuth } from '@/hooks/useAuth'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Briefcase, TrendingUp } from 'lucide-react'

export function AICoachPanel() {
  const router = useRouter()
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const {
    nudges,
    coachMessages,
    learningPlan,
    isLoading,
    error,
    requestNewPlan,
    refreshRecommendations,
  } = useAICoaching(menteeId)

  // Portfolio integration for coaching recommendations
  const { items, approvedItems, healthMetrics } = usePortfolio(menteeId)

  const [isExpanded, setIsExpanded] = useState(false)
  const [isRequestingPlan, setIsRequestingPlan] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRequestPlan = async () => {
    setIsRequestingPlan(true)
    try {
      await requestNewPlan()
    } catch (err) {
      console.error('Failed to request plan:', err)
    } finally {
      setIsRequestingPlan(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshRecommendations()
    } catch (err) {
      console.error('Failed to refresh:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getNudgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'orange'
      case 'medium':
        return 'defender'
      default:
        return 'steel'
    }
  }

  const getNudgeIcon = (type: string) => {
    // Icons removed
    return ''
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading AI Coach...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 border-och-orange">
        <div className="text-och-orange text-sm">{error}</div>
      </Card>
    )
  }

  return (
    <Card className="bg-defender-gradient">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">AI Coach</h3>
              <p className="text-sm text-och-steel">Your personalized learning assistant</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {/* Daily Nudges */}
        {nudges.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Today's Focus</h4>
            <div className="space-y-2">
              {nudges.slice(0, isExpanded ? nudges.length : 2).map((nudge) => (
                <div
                  key={nudge.id}
                  className="p-3 bg-och-midnight/50 rounded-lg flex items-start gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getNudgeColor(nudge.priority) as any} className="text-xs">
                        {nudge.priority}
                      </Badge>
                      <span className="text-xs text-och-steel">{nudge.type}</span>
                    </div>
                    <p className="text-sm text-white">{nudge.message}</p>
                    {nudge.action_url && nudge.action_label && (
                      <Button
                        variant="mint"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.href = nudge.action_url!}
                      >
                        {nudge.action_label}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach Messages */}
        {isExpanded && coachMessages.length > 0 && (
          <div className="mb-4 border-t border-white/20 pt-4">
            <h4 className="text-sm font-semibold text-white mb-2">Recent Feedback</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {coachMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-3 bg-och-midnight/50 rounded-lg"
                >
                  <p className="text-sm text-white mb-2">{message.message}</p>
                  {message.next_actions && message.next_actions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-och-steel mb-1">Next Actions:</p>
                      <ul className="list-disc list-inside text-xs text-white space-y-1">
                        {message.next_actions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Integration */}
        {isExpanded && items.length > 0 && (
          <div className="mb-4 border-t border-white/20 pt-4">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Portfolio Progress
            </h4>
            <div className="p-3 bg-och-midnight/50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-lg font-bold text-white">{items.length}</div>
                  <div className="text-xs text-och-steel">Total Items</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-och-mint">{approvedItems.length}</div>
                  <div className="text-xs text-och-steel">Approved</div>
                </div>
              </div>
              {healthMetrics && (
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-och-mint" />
                  <span className="text-xs text-white">
                    Health: {Math.round(healthMetrics.healthScore * 10)}/100
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full text-white border-white/20 hover:bg-white/10"
                onClick={() => router.push('/dashboard/student/portfolio')}
              >
                View Portfolio
              </Button>
            </div>
          </div>
        )}

        {/* Learning Plan */}
        {learningPlan && (
          <div className="mb-4 border-t border-white/20 pt-4">
            <h4 className="text-sm font-semibold text-white mb-2">Current Learning Plan</h4>
            <div className="p-3 bg-och-midnight/50 rounded-lg">
              <h5 className="font-medium text-white mb-1">{learningPlan.title}</h5>
              <p className="text-xs text-och-steel mb-2">{learningPlan.description}</p>
              <Badge variant="mint" className="text-xs">
                {learningPlan.difficulty}
              </Badge>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t border-white/20 pt-4">
          <Button
            variant="mint"
            size="sm"
            onClick={handleRequestPlan}
            disabled={isRequestingPlan}
            className="flex-1"
          >
            {isRequestingPlan ? 'Requesting...' : 'New Plan'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 text-white border-white/20 hover:bg-white/10"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

