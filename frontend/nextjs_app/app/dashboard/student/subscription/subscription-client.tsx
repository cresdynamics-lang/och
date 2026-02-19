'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { CheckCircle2, CreditCard, Calendar, AlertCircle } from 'lucide-react'
import { formatCurrencyWithSymbol, convertUSDToLocal } from '@/lib/currency'

interface SubscriptionStatus {
  tier: string
  plan_name: string
  status: string
  days_enhanced_left: number | null
  next_payment: string | null
  current_period_end: string | null
}

interface Plan {
  id: string
  name: string
  tier: string
  price_monthly: number | null
  mentorship_access: boolean
  missions_access_type: string
  talentscope_access: string
  marketplace_contact: boolean
  ai_coach_daily_limit: number | null
  portfolio_item_limit: number | null
  enhanced_access_days: number | null
}

const TIER_LEVEL: Record<string, number> = { free: 0, starter: 1, professional: 2, premium: 2 }

export default function SubscriptionClient() {
  const { user } = useAuth()
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedCountry = user?.country?.toUpperCase() || 'KE'

  useEffect(() => {
    if (user?.id) loadAll()
  }, [user?.id])

  const loadAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statusRes, plansRes, billingRes] = await Promise.all([
        apiGateway.get('/subscription/status'),
        apiGateway.get('/subscription/plans'),
        apiGateway.get('/subscription/billing-history').catch(() => []),
      ])
      setSubStatus(statusRes as any)
      setPlans(Array.isArray(plansRes) ? plansRes : [])
      setBilling(Array.isArray(billingRes) ? billingRes : [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load subscription data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (planName: string) => {
    try {
      setActionLoading(true)
      setError(null)
      await apiGateway.post('/subscription/simulate-payment', { plan: planName })
      await loadAll()
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel subscription? Access continues until end of billing period.')) return
    try {
      setActionLoading(true)
      await apiGateway.post('/subscription/cancel', {})
      await loadAll()
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-och-mint border-t-transparent rounded-full animate-spin" />
          <p className="text-och-steel text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const currentTierLevel = TIER_LEVEL[subStatus?.tier || 'free'] ?? 0

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Subscription Plans</h1>
        <p className="text-och-steel">Choose the plan that fits your goals</p>
      </div>

      {error && (
        <Card className="p-4 bg-och-orange/10 border-och-orange/30">
          <div className="flex items-center gap-2 text-och-orange">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Current Plan Status */}
      {subStatus && (
        <Card className="p-6 border border-och-steel/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-och-steel mb-1">Current Plan</p>
              <p className="text-2xl font-bold text-white capitalize">{subStatus.plan_name}</p>
              <Badge variant="mint" className="mt-2">{subStatus.status}</Badge>
            </div>
            {subStatus.next_payment && (
              <div className="text-right">
                <p className="text-sm text-och-steel mb-1">Next Renewal</p>
                <p className="text-white">{new Date(subStatus.next_payment).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          {subStatus.status === 'active' && subStatus.tier !== 'free' && (
            <div className="mt-4 pt-4 border-t border-och-steel/10">
              <Button variant="outline" size="sm" disabled={actionLoading} onClick={handleCancel}>
                Cancel Subscription
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const planLevel = TIER_LEVEL[plan.tier] ?? 0
          const isCurrent = plan.tier === subStatus?.tier
          const isUpgrade = planLevel > currentTierLevel
          const isStarter = plan.tier === 'starter'
          const isPremium = plan.tier === 'premium'
          
          let monthlyPriceUSD = plan.price_monthly || 0
          let annualPriceUSD = null
          
          if (isStarter) {
            monthlyPriceUSD = plan.price_monthly || 5
            annualPriceUSD = monthlyPriceUSD * 12
          } else if (isPremium) {
            annualPriceUSD = 54
            monthlyPriceUSD = annualPriceUSD / 12
          }
          
          const monthlyLocal = monthlyPriceUSD > 0 ? convertUSDToLocal(monthlyPriceUSD, selectedCountry) : 0
          const annualLocal = annualPriceUSD ? convertUSDToLocal(annualPriceUSD, selectedCountry) : null

          return (
            <div
              key={plan.id}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                isPremium
                  ? 'bg-gradient-to-br from-och-mint/20 to-och-mint/5 border-och-mint/40'
                  : isStarter
                  ? 'bg-gradient-to-br from-och-defender/20 to-och-defender/5 border-och-defender/40'
                  : 'bg-gradient-to-br from-och-steel/20 to-och-steel/5 border-och-steel/30'
              } ${isCurrent ? 'ring-2 ring-och-mint' : ''}`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="gold" className="text-xs font-bold px-3 py-1">BEST VALUE</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="mint" className="text-xs font-bold">Current Plan</Badge>
                </div>
              )}

              <div className="mt-8">
                <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>

                {!plan.price_monthly || plan.price_monthly === 0 ? (
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-white">Free</p>
                    <p className="text-sm text-och-steel">14-day trial</p>
                  </div>
                ) : isStarter ? (
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-white">
                        {formatCurrencyWithSymbol(monthlyLocal, selectedCountry)}
                      </p>
                      <span className="text-sm text-och-steel">/month</span>
                    </div>
                    <p className="text-xs text-och-steel mt-1">${monthlyPriceUSD} USD/month</p>
                  </div>
                ) : isPremium ? (
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-3xl font-bold text-och-mint">
                        {formatCurrencyWithSymbol(annualLocal!, selectedCountry)}
                      </p>
                      <span className="text-sm text-och-steel">/year</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-och-steel line-through">
                        {formatCurrencyWithSymbol(convertUSDToLocal(60, selectedCountry), selectedCountry)}
                      </p>
                      <Badge variant="mint" className="text-xs">10% OFF</Badge>
                    </div>
                    <p className="text-xs text-och-mint">
                      💰 {formatCurrencyWithSymbol(monthlyLocal, selectedCountry)}/month
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2 mb-6 min-h-[120px]">
                  {plan.mentorship_access && (
                    <p className="text-xs text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-och-mint" />
                      Human Mentorship
                    </p>
                  )}
                  {plan.missions_access_type === 'full' && (
                    <p className="text-xs text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-och-mint" />
                      Full Mission Access
                    </p>
                  )}
                  {plan.talentscope_access === 'full' && (
                    <p className="text-xs text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-och-mint" />
                      Full TalentScope
                    </p>
                  )}
                  {plan.marketplace_contact && (
                    <p className="text-xs text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-och-mint" />
                      Employer Contact
                    </p>
                  )}
                  {plan.ai_coach_daily_limit === null && (
                    <p className="text-xs text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-och-mint" />
                      Unlimited AI Coach
                    </p>
                  )}
                  {plan.portfolio_item_limit === null && (
                    <p className="text-xs text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-och-mint" />
                      Unlimited Portfolio
                    </p>
                  )}
                </div>

                <Button
                  variant={isCurrent ? 'outline' : isUpgrade ? (isPremium ? 'gold' : 'mint') : 'outline'}
                  className="w-full"
                  disabled={isCurrent || actionLoading}
                  onClick={() => !isCurrent && handleUpgrade(plan.name)}
                >
                  {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison */}
      {plans.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-och-steel/20">
                  <th className="text-left p-3 text-white">Feature</th>
                  {plans.map(p => (
                    <th key={p.id} className="text-left p-3 text-white">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-och-steel/10">
                  <td className="p-3 text-white">Missions</td>
                  {plans.map(p => (
                    <td key={p.id} className="p-3">
                      <Badge variant={p.missions_access_type === 'full' ? 'mint' : 'steel'}>
                        {p.missions_access_type.replace('_', ' ')}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-och-steel/10">
                  <td className="p-3 text-white">Mentorship</td>
                  {plans.map(p => (
                    <td key={p.id} className="p-3">
                      <Badge variant={p.mentorship_access ? 'mint' : 'steel'}>
                        {p.mentorship_access ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-och-steel/10">
                  <td className="p-3 text-white">AI Coach</td>
                  {plans.map(p => (
                    <td key={p.id} className="p-3 text-och-steel">
                      {p.ai_coach_daily_limit ? `${p.ai_coach_daily_limit}/day` : 'Unlimited'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-och-steel/10">
                  <td className="p-3 text-white">Portfolio</td>
                  {plans.map(p => (
                    <td key={p.id} className="p-3 text-och-steel">
                      {p.portfolio_item_limit ? `${p.portfolio_item_limit} items` : 'Unlimited'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Billing History */}
      {billing.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-och-steel/20">
                  <th className="text-left py-2 px-3 text-och-steel">Date</th>
                  <th className="text-left py-2 px-3 text-och-steel">Plan</th>
                  <th className="text-left py-2 px-3 text-och-steel">Amount</th>
                  <th className="text-left py-2 px-3 text-och-steel">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b, i) => (
                  <tr key={i} className="border-b border-och-steel/10">
                    <td className="py-2 px-3 text-och-steel">
                      {new Date(b.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-white">{b.plan_name}</td>
                    <td className="py-2 px-3 text-white">
                      {formatCurrencyWithSymbol(
                        convertUSDToLocal(b.amount, selectedCountry),
                        selectedCountry
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={b.status === 'completed' ? 'mint' : 'steel'}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
