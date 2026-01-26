'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'

export function SubscriptionStatus() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { subscription, usage, isLoading, error, upgrade } = useSubscription(menteeId)
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async (tier: 'premium' | 'enterprise') => {
    setIsUpgrading(true)
    try {
      await upgrade(tier)
    } catch (err) {
      console.error('Upgrade failed:', err)
    } finally {
      setIsUpgrading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'gold'
      case 'premium':
        return 'mint'
      default:
        return 'steel'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'mint'
      case 'trial':
        return 'defender'
      case 'cancelled':
        return 'orange'
      default:
        return 'steel'
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading subscription...</div>
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

  if (!subscription || !usage) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">No subscription data available</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Subscription Banner */}
      <Card className={`bg-${getTierColor(subscription.tier)}-gradient`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-white">
                  {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                </h3>
                <Badge variant={getStatusColor(subscription.status) as any} className="capitalize">
                  {subscription.status}
                </Badge>
              </div>
              <div className="text-sm text-white/80">
                {subscription.auto_renew
                  ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Expires on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </div>
            </div>
            {subscription.tier !== 'enterprise' && (
              <Button
                variant="mint"
                onClick={() => handleUpgrade(subscription.tier === 'starter' ? 'premium' : 'enterprise')}
                disabled={isUpgrading}
              >
                {isUpgrading ? 'Processing...' : 'Upgrade Now'}
              </Button>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subscription.features.map((feature) => (
              <div key={feature.name} className="flex items-center gap-2">
                {feature.enabled ? (
                  <span className="text-och-mint">✓</span>
                ) : (
                  <span className="text-och-steel">✗</span>
                )}
                <span className="text-sm text-white">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Usage Limits */}
      <Card>
        <h3 className="text-xl font-bold mb-4 text-white">Usage & Limits</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white">Portfolio Items</span>
              <span className="text-sm text-och-steel">
                {usage.portfolio_items_used} / {subscription.limits.portfolio_items}
              </span>
            </div>
            <ProgressBar
              value={(usage.portfolio_items_used / subscription.limits.portfolio_items) * 100}
              variant="defender"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white">Missions Completed</span>
              <span className="text-sm text-och-steel">
                {usage.missions_completed} / {subscription.limits.missions_access || '∞'}
              </span>
            </div>
            {subscription.limits.missions_access && (
              <ProgressBar
                value={(usage.missions_completed / subscription.limits.missions_access) * 100}
                variant="mint"
              />
            )}
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white">AI Coaching Sessions</span>
              <span className="text-sm text-och-steel">
                {usage.ai_coaching_sessions_used} / {subscription.limits.ai_coaching_sessions || '∞'}
              </span>
            </div>
            {subscription.limits.ai_coaching_sessions && (
              <ProgressBar
                value={(usage.ai_coaching_sessions_used / subscription.limits.ai_coaching_sessions) * 100}
                variant="gold"
              />
            )}
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white">Analytics Access</span>
              <Badge variant="mint" className="capitalize">
                {subscription.limits.analytics_access}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

