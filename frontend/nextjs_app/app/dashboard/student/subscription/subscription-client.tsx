'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { CheckCircle2, CreditCard, Calendar, Zap, Shield, Clock, AlertCircle } from 'lucide-react'

interface SubscriptionStatus {
  tier: 'free' | 'starter' | 'professional'
  plan_name: string
  status: string
  days_enhanced_left: number | null
  enhanced_access_until: string | null
  can_upgrade: boolean
  features: string[]
  next_payment: string | null
  current_period_end: string | null
}

interface Plan {
  id: string
  name: string
  tier: string
  price_monthly: number
  features: string[]
  enhanced_access_days: number | null
  mentorship_access: boolean
  talentscope_access: string
  missions_access_type: string
  mode_note: string
}

interface BillingRecord {
  date: string
  amount: number
  currency: string
  plan_name: string
  status: string
  transaction_id: string
}

const TIER_LEVEL: Record<string, number> = { free: 0, starter: 1, professional: 2, premium: 2 }

export default function SubscriptionClient() {
  const { user } = useAuth()
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<BillingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) loadAll()
  }, [user?.id])

  const loadAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statusRes, plansRes, billingRes] = await Promise.all([
        apiGateway.get('/subscription/status') as Promise<SubscriptionStatus>,
        apiGateway.get('/subscription/plans') as Promise<Plan[]>,
        apiGateway.get('/subscription/billing-history').catch(() => []) as Promise<BillingRecord[]>,
      ])
      setSubStatus(statusRes as SubscriptionStatus)
      setPlans(Array.isArray(plansRes) ? plansRes : [])
      setBilling(Array.isArray(billingRes) ? billingRes : [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load subscription data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSimulatePayment = async (planName: string) => {
    try {
      setActionLoading(true)
      setError(null)
      await apiGateway.post('/subscription/simulate-payment', { plan: planName })
      await loadAll()
    } catch (err: any) {
      setError(err?.message || 'Payment simulation failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? Access continues until end of billing period.')) return
    try {
      setActionLoading(true)
      setError(null)
      await apiGateway.post('/subscription/cancel', {})
      await loadAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getTierBadge = (tier: string) => {
    if (tier === 'professional' || tier === 'premium') return 'gold' as const
    if (tier === 'starter') return 'mint' as const
    return 'steel' as const
  }

  const getStatusBadge = (s: string) => {
    if (s === 'active') return 'mint' as const
    if (s === 'past_due') return 'orange' as const
    return 'steel' as const
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-och-mint border-t-transparent rounded-full animate-spin" />
          <p className="text-och-steel text-sm">Loading subscription...</p>
        </div>
      </div>
    )
  }

  const currentTierLevel = TIER_LEVEL[subStatus?.tier || 'free'] ?? 0

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Subscription</h1>
        <p className="text-och-steel">Manage your plan and unlock full platform access</p>
      </div>

      {error && (
        <Card className="p-4 bg-och-orange/10 border-och-orange/30">
          <div className="flex items-center gap-2 text-och-orange">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Current Plan */}
      {subStatus && (
        <Card className="p-6 border border-och-steel/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-och-gold/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-och-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Current Plan</h2>
              <p className="text-xs text-och-steel">Your active subscription</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-och-steel mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Tier
              </p>
              <Badge variant={getTierBadge(subStatus.tier)} className="text-xs font-bold capitalize">
                {subStatus.tier}
              </Badge>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-och-steel mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Status
              </p>
              <Badge variant={getStatusBadge(subStatus.status)} className="text-xs font-bold capitalize">
                {subStatus.status}
              </Badge>
            </div>
            {subStatus.next_payment && (
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-och-steel mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Next Renewal
                </p>
                <p className="text-sm text-white font-medium">{formatDate(subStatus.next_payment)}</p>
              </div>
            )}
            {subStatus.days_enhanced_left !== null && subStatus.days_enhanced_left !== undefined && (
              <div className="p-3 bg-och-gold/5 border border-och-gold/20 rounded-xl">
                <p className="text-xs text-och-steel mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Enhanced Access
                </p>
                <p className="text-sm text-och-gold font-bold">{subStatus.days_enhanced_left}d left</p>
              </div>
            )}
          </div>

          {subStatus.features.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-och-steel uppercase tracking-wider mb-3">Included Features</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subStatus.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-och-mint shrink-0" />
                    {f.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {subStatus.status === 'active' && subStatus.tier !== 'free' && (
            <div className="pt-4 border-t border-och-steel/10">
              <Button variant="outline" size="sm" disabled={actionLoading} onClick={handleCancel}>
                {actionLoading ? 'Processing...' : 'Cancel Subscription'}
              </Button>
              <p className="text-xs text-och-steel mt-2">
                Access continues until {formatDate(subStatus.current_period_end)}.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-5 text-white">Available Plans</h2>
        {plans.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-och-steel">No plans available. Contact support.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const planLevel = TIER_LEVEL[plan.tier] ?? 0
              const isCurrent = plan.tier === subStatus?.tier ||
                (plan.tier === 'premium' && subStatus?.tier === 'professional')
              const isUpgrade = planLevel > currentTierLevel
              const isDowngrade = planLevel < currentTierLevel

              return (
                <Card
                  key={plan.id}
                  className={`p-6 relative ${isCurrent ? 'border-2 border-och-mint' : ''}`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-4">
                      <Badge variant="mint" className="text-xs font-bold">Current Plan</Badge>
                    </div>
                  )}
                  {(plan.tier === 'premium') && !isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="gold" className="text-xs font-bold">Most Popular</Badge>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1 capitalize">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-och-mint">
                        ${plan.price_monthly.toFixed(0)}
                      </span>
                      <span className="text-och-steel text-sm">/month</span>
                    </div>
                    {plan.enhanced_access_days && plan.enhanced_access_days > 0 && (
                      <p className="text-xs text-och-gold mt-1">
                        {Math.round(plan.enhanced_access_days / 30)} months Enhanced Access included
                      </p>
                    )}
                    {plan.mode_note && (
                      <p className="text-xs text-och-steel mt-1">{plan.mode_note}</p>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-6 min-h-[80px]">
                    {plan.features.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-start text-sm text-och-steel gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-och-mint shrink-0 mt-0.5" />
                        {f.replace(/_/g, ' ')}
                      </li>
                    ))}
                    {plan.mentorship_access && (
                      <li className="flex items-center text-sm text-white gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-och-gold shrink-0" />
                        Human mentorship access
                      </li>
                    )}
                  </ul>

                  <Button
                    variant={
                      isCurrent ? 'outline'
                        : isUpgrade
                          ? (plan.tier === 'premium' ? 'gold' : 'mint')
                          : 'outline'
                    }
                    className="w-full"
                    disabled={isCurrent || actionLoading}
                    onClick={() => !isCurrent && handleSimulatePayment(plan.name)}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : isUpgrade
                        ? `Upgrade — $${plan.price_monthly.toFixed(0)}/mo`
                        : `Downgrade — $${plan.price_monthly.toFixed(0)}/mo`}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Billing History */}
      {billing.length > 0 ? (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-och-steel/20">
                  <th className="text-left py-2 px-3 text-och-steel font-semibold">Date</th>
                  <th className="text-left py-2 px-3 text-och-steel font-semibold">Plan</th>
                  <th className="text-left py-2 px-3 text-och-steel font-semibold">Amount</th>
                  <th className="text-left py-2 px-3 text-och-steel font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b, i) => (
                  <tr key={i} className="border-b border-och-steel/10">
                    <td className="py-2 px-3 text-och-steel">{formatDate(b.date)}</td>
                    <td className="py-2 px-3 text-white">{b.plan_name}</td>
                    <td className="py-2 px-3 text-white">${b.amount} {b.currency}</td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={b.status === 'completed' ? 'mint' : 'steel'}
                        className="text-xs"
                      >
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <CreditCard className="w-10 h-10 text-och-steel mx-auto mb-3" />
          <p className="text-och-steel">No billing history yet.</p>
          <p className="text-och-steel text-sm mt-1">
            Upgrade to a paid plan to begin your subscription.
          </p>
        </Card>
      )}
    </div>
  )
}
