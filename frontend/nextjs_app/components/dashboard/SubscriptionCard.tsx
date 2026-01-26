'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { subscriptionClient } from '@/services/subscriptionClient'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import type { Subscription, Usage } from '@/services/types/subscription'
import { useRouter } from 'next/navigation'

export function SubscriptionCard() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!menteeId) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [subData, usageData] = await Promise.all([
          subscriptionClient.getSubscription(menteeId),
          subscriptionClient.getUsage(menteeId).catch(() => null),
        ])

        setSubscription(subData)
        setUsage(usageData)
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [menteeId])

  const getTierColor = (tier: string) => {
    if (tier === 'enterprise') return 'gold'
    if (tier === 'premium') return 'defender'
    return 'steel'
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'mint'
    if (status === 'trial') return 'defender'
    if (status === 'expired') return 'orange'
    return 'steel'
  }

  const getDaysUntilRenewal = (renewalDate?: string) => {
    if (!renewalDate) return null
    const renewal = new Date(renewalDate)
    const now = new Date()
    const diff = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const handleUpgrade = () => {
    router.push('/dashboard/student/subscription/upgrade')
  }

  if (isLoading) {
    return (
      <Card gradient="defender" className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-och-steel/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-och-steel/20 rounded w-2/3"></div>
        </div>
      </Card>
    )
  }

  if (error || !subscription) {
    return (
      <Card gradient="defender" className="mb-6">
        <div className="text-och-orange">Error loading subscription: {error || 'No subscription found'}</div>
      </Card>
    )
  }

  const daysUntilRenewal = getDaysUntilRenewal(subscription.renewal_date || subscription.current_period_end)
  const isExpiringSoon = daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal > 0
  const isExpired = subscription.status === 'expired' || (daysUntilRenewal !== null && daysUntilRenewal <= 0)

  return (
    <Card gradient="defender" className="mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Subscription</h2>
          <div className="flex items-center gap-2">
            <Badge variant={getTierColor(subscription.tier) as any} className="text-sm">
              {subscription.tier.toUpperCase()}
            </Badge>
            <Badge variant={getStatusColor(subscription.status) as any} className="text-sm">
              {subscription.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Renewal Info */}
      {subscription.renewal_date && (
        <div className="mb-4 p-3 bg-och-midnight/50 rounded-lg">
          <div className="text-sm text-och-steel mb-1">Renewal Date</div>
          <div className="text-white font-semibold">
            {new Date(subscription.renewal_date).toLocaleDateString()}
            {daysUntilRenewal !== null && (
              <span className="text-sm text-och-steel ml-2">
                ({daysUntilRenewal > 0 ? `${daysUntilRenewal} days` : 'Expired'})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Usage Limits */}
      {usage && subscription.limits && (
        <div className="mb-4 space-y-2">
          <div className="text-sm font-semibold text-och-steel mb-2">Usage Limits</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-och-steel">Portfolio Items:</span>
              <span className="text-white">
                {usage.portfolio_items_used} / {subscription.limits.portfolio_items}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-och-steel">Mentorship Sessions:</span>
              <span className="text-white">
                {usage.mentorship_sessions_used} / {subscription.limits.mentorship_sessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-och-steel">AI Coaching:</span>
              <span className="text-white">
                {usage.ai_coaching_sessions_used} / {subscription.limits.ai_coaching_sessions}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {isExpiringSoon && (
        <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/40 rounded-lg">
          <div className="text-sm text-och-orange">
            ⚠️ Your subscription expires in {daysUntilRenewal} days
          </div>
        </div>
      )}

      {isExpired && (
        <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/40 rounded-lg">
          <div className="text-sm text-och-orange">
            ⚠️ Your subscription has expired. Upgrade to continue access.
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {subscription.tier !== 'enterprise' && (
        <Button
          variant="mint"
          onClick={handleUpgrade}
          className="w-full"
        >
          {isExpired ? 'Renew Subscription' : 'Upgrade Plan'}
        </Button>
      )}
    </Card>
  )
}
