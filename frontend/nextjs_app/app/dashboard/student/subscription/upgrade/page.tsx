'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, reloadUser } = useAuth()
  const queryClient = useQueryClient()
  const [plan, setPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const planParam = searchParams.get('plan')
    setPlan(planParam)
  }, [searchParams])

  const handleUpgrade = async () => {
    if (!plan || !user?.id) return

    setIsProcessing(true)
    setError(null)

    try {
      // Call the upgrade API
      const response = await apiGateway.post('/subscription/upgrade', {
        plan: plan,
        mock: true, // Indicate this is a mock upgrade without payment
      }) as any

      if (response.success || response.message) {
        setSuccess(true)
        // Refresh user data to get updated subscription
        if (reloadUser) {
          await reloadUser()
        }
        // Invalidate query caches to refresh subscription data everywhere
        queryClient.invalidateQueries({ queryKey: ['user-entitlements'] })
        queryClient.invalidateQueries({ queryKey: ['user-settings'] })
        queryClient.invalidateQueries({ queryKey: ['subscription'] })
        
        // Redirect to subscription page after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/student/subscription')
        }, 2000)
      } else {
        setError('Failed to upgrade subscription. Please try again.')
      }
    } catch (err: any) {
      console.error('Upgrade error:', err)
      setError(err.message || 'Failed to upgrade subscription. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const planNames: Record<string, string> = {
    starter_3: 'Starter 3',
    professional_7: 'Professional 7',
  }

  const planPrices: Record<string, number> = {
    starter_3: 29,
    professional_7: 99,
  }

  const planFeatures: Record<string, string[]> = {
    starter_3: [
      'Full mission catalog access',
      'AI feedback on all missions',
      'Up to 10 mission submissions/month',
      'Portfolio access',
      'Progress tracking',
      'Community participation',
    ],
    professional_7: [
      'Everything in Starter 3',
      'Unlimited mission submissions',
      '7-tier mentor review system',
      'Priority mentor matching',
      'Advanced portfolio features',
      'Career readiness analytics',
      'Job placement support',
    ],
  }

  if (!plan) {
    return (
      <RouteGuard>
        <div className="p-6">
          <Card>
            <div className="p-6 text-center">
              <p className="text-och-steel">Invalid plan selected.</p>
              <Button
                variant="mint"
                className="mt-4"
                onClick={() => router.push('/dashboard/student/subscription')}
              >
                Back to Subscription
              </Button>
            </div>
          </Card>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <div className="p-6 max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {success ? (
          <Card className="bg-och-mint/10 border-2 border-och-mint">
            <div className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-och-mint mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Upgrade Successful!</h1>
              <p className="text-och-steel mb-6">
                Your subscription has been upgraded to {planNames[plan] || plan}.
              </p>
              <p className="text-sm text-och-steel">
                Redirecting to subscription page...
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white mb-6">Upgrade Subscription</h1>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{planNames[plan] || plan}</h2>
                    <Badge variant={plan === 'professional_7' ? 'gold' : 'mint'} className="mt-2">
                      {plan === 'professional_7' ? 'Popular' : 'Starter'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-och-mint">
                      ${planPrices[plan] || 0}
                    </div>
                    <div className="text-och-steel">per month</div>
                  </div>
                </div>

                <div className="bg-och-midnight/50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Features included:</h3>
                  <ul className="space-y-2">
                    {planFeatures[plan]?.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-och-steel">
                        <span className="text-och-mint mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                <div className="bg-och-gold/10 border border-och-gold/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-och-steel">
                    <strong className="text-white">Note:</strong> Payment processing is not yet implemented. 
                    This upgrade will be processed immediately without payment for development purposes.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="mint"
                    className="flex-1"
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${planNames[plan] || plan}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </RouteGuard>
  )
}

