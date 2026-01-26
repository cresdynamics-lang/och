'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'

interface SubscriptionPlan {
  id: string
  name: string
  tier: 'free' | 'starter_3' | 'professional_7'
  price: number
  billing_cycle: 'monthly' | 'annual'
  features: string[]
  max_missions_monthly?: number
  ai_feedback: boolean
  mentor_review: boolean
  portfolio_access: boolean
}

export default function SubscriptionClient() {
  const { user } = useAuth()
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSubscriptionData()
  }, [user])

  const loadSubscriptionData = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      // Load current subscription
      const dashboardResponse = await apiGateway.get('/student/dashboard') as {
        subscription?: any
      }
      setCurrentSubscription(dashboardResponse.subscription)

      // Load available plans
      const plansResponse = await apiGateway.get('/subscriptions/plans') as SubscriptionPlan[]
      setPlans(plansResponse || [])
    } catch (error: any) {
      console.error('Failed to load subscription data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentTier = currentSubscription?.tier || 'free'

  const subscriptionPlans: SubscriptionPlan[] = plans.length > 0 ? plans : [
    {
      id: 'free',
      name: 'Free',
      tier: 'free',
      price: 0,
      billing_cycle: 'monthly',
      features: [
        'Access to basic dashboard',
        'Limited profile features',
        'Community access (read-only)',
      ],
      ai_feedback: false,
      mentor_review: false,
      portfolio_access: false,
    },
    {
      id: 'starter_3',
      name: 'Starter 3',
      tier: 'starter_3',
      price: 29,
      billing_cycle: 'monthly',
      features: [
        'Full mission catalog access',
        'AI feedback on all missions',
        'Up to 10 mission submissions/month',
        'Portfolio access',
        'Progress tracking',
        'Community participation',
      ],
      max_missions_monthly: 10,
      ai_feedback: true,
      mentor_review: false,
      portfolio_access: true,
    },
    {
      id: 'professional_7',
      name: 'Professional 7',
      tier: 'professional_7',
      price: 99,
      billing_cycle: 'monthly',
      features: [
        'Everything in Starter 3',
        'Unlimited mission submissions',
        '7-tier mentor review system',
        'Priority mentor matching',
        'Advanced portfolio features',
        'Career readiness analytics',
        'Job placement support',
      ],
      max_missions_monthly: -1,
      ai_feedback: true,
      mentor_review: true,
      portfolio_access: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-och-steel">Loading subscription information...</div>
      </div>
    )
  }

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Subscription</h1>
        <p className="text-och-steel">
          Manage your subscription and unlock premium features
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="mb-8 bg-defender-gradient border border-defender-blue/40">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Current Plan</h2>
                <Badge variant={currentTier === 'professional_7' ? 'gold' : currentTier === 'starter_3' ? 'mint' : 'steel'}>
                  {subscriptionPlans.find(p => p.tier === currentTier)?.name || 'Free'}
                </Badge>
              </div>
              {currentSubscription.next_billing_date && (
                <div className="text-right">
                  <div className="text-sm text-och-steel">Next billing</div>
                  <div className="text-white font-semibold">
                    {new Date(currentSubscription.next_billing_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
            {currentSubscription.status === 'active' && (
              <div className="text-sm text-och-steel">
                Your subscription is active and will renew automatically.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-white">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => {
            const isCurrent = plan.tier === currentTier
            const isUpgrade = 
              (currentTier === 'free' && plan.tier !== 'free') ||
              (currentTier === 'starter_3' && plan.tier === 'professional_7')

            return (
              <Card
                key={plan.id}
                className={`relative ${isCurrent ? 'border-2 border-och-mint' : ''} ${
                  plan.tier === 'professional_7' ? 'bg-gradient-to-br from-och-midnight to-och-midnight/80' : ''
                }`}
              >
                {plan.tier === 'professional_7' && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="gold">Popular</Badge>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-och-mint">${plan.price}</span>
                    <span className="text-och-steel">/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-och-steel">
                        <span className="text-och-mint mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isCurrent ? 'outline' : isUpgrade ? 'mint' : 'defender'}
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => {
                      if (isUpgrade) {
                        // Handle upgrade
                        window.location.href = `/dashboard/student/subscription/upgrade?plan=${plan.tier}`
                      }
                    }}
                  >
                    {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      {currentSubscription && currentTier !== 'free' && (
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Billing History</h2>
            <div className="text-och-steel">
              Billing history will be displayed here once invoices are available.
            </div>
          </div>
        </Card>
      )}

      {/* Manage Subscription */}
      {currentSubscription && currentTier !== 'free' && (
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Manage Subscription</h2>
            <div className="space-y-4">
              <Button variant="defender" onClick={() => {
                // Handle cancel subscription
                if (confirm('Are you sure you want to cancel your subscription?')) {
                  // Call cancel API
                }
              }}>
                Cancel Subscription
              </Button>
              <div className="text-sm text-och-steel">
                You can cancel your subscription at any time. Your access will continue until the end of your billing period.
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

