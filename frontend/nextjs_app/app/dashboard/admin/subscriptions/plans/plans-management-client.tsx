'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface SubscriptionPlan {
  id: string
  name: string
  tier: 'free' | 'starter' | 'premium'
  price_monthly: number | null
  ai_coach_daily_limit: number | null
  portfolio_item_limit: number | null
  missions_access_type: 'none' | 'ai_only' | 'full'
  mentorship_access: boolean
  talentscope_access: 'none' | 'basic' | 'preview' | 'full'
  marketplace_contact: boolean
  enhanced_access_days: number | null
  features: string[]
  created_at?: string
  updated_at?: string
}

interface TierFeature {
  feature: string
  free: string
  starterEnhanced: string
  starterNormal: string
  premium: string
}

const TIER_FEATURES: TierFeature[] = [
  {
    feature: 'Curriculum',
    free: 'Read-only access',
    starterEnhanced: 'Full curriculum visibility',
    starterNormal: 'Limited curriculum visibility',
    premium: 'Full curriculum access'
  },
  {
    feature: 'AI Coach',
    free: 'Limited use (1 prompt per day)',
    starterEnhanced: 'Full AI features unlocked',
    starterNormal: 'Limited AI features',
    premium: 'Full AI and Lab integrations'
  },
  {
    feature: 'Community',
    free: 'Limited access',
    starterEnhanced: 'Full community access',
    starterNormal: 'Limited community access',
    premium: 'Full community access'
  },
  {
    feature: 'Missions',
    free: 'No access',
    starterEnhanced: 'Full mission catalog (AI-only missions)',
    starterNormal: 'Limited missions',
    premium: 'Full missions (including Capstones)'
  },
  {
    feature: 'Portfolio',
    free: 'No access',
    starterEnhanced: 'Unlimited portfolio capacity',
    starterNormal: 'Limited portfolio capacity (5 items)',
    premium: 'Unlimited portfolio'
  },
  {
    feature: 'TalentScope',
    free: 'No access',
    starterEnhanced: 'Preview mode',
    starterNormal: 'Basic TalentScope',
    premium: 'Full analytics (readiness, CV scoring, Mentor Influence Index, Career Readiness Report)'
  },
  {
    feature: 'Mentorship',
    free: 'No access',
    starterEnhanced: 'Access prevented',
    starterNormal: 'Access prevented',
    premium: 'Full mentorship (group sessions, recordings, mission reviews, pass/fail grades)'
  },
  {
    feature: 'Talent Discovery',
    free: 'No access',
    starterEnhanced: 'Access prevented',
    starterNormal: 'No employer contact',
    premium: 'Full visibility and employer contact enabled'
  }
]

export default function PlansManagementClient() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [viewingPlan, setViewingPlan] = useState<SubscriptionPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'manage'>('overview')

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setIsLoading(true)

      const response = await apiGateway.get<any>('/admin/plans/')
      console.log('📡 Plans API Response:', response)
      
      // Handle paginated response
      let plansData: SubscriptionPlan[] = []
      if (response?.results && Array.isArray(response.results)) {
        plansData = response.results
      } else if (Array.isArray(response)) {
        plansData = response
      } else if (response?.data && Array.isArray(response.data)) {
        plansData = response.data
      }
      
      console.log('✅ Loaded plans:', plansData.length)
      setPlans(plansData)
    } catch (error: any) {
      console.error('❌ Failed to load plans:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load plans'
      alert(`Error loading plans: ${errorMessage}`)
      setPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (planData: Partial<SubscriptionPlan>) => {
    try {
      if (editingPlan?.id) {
        await apiGateway.put(`/admin/plans/${editingPlan.id}/`, planData)
      } else {
        await apiGateway.post('/admin/plans/', planData)
      }
      await loadPlans()
      setIsModalOpen(false)
      setEditingPlan(null)
      alert('Plan saved successfully!')
    } catch (error: any) {
      console.error('Failed to save plan:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to save plan'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return
    }
    try {
      await apiGateway.delete(`/admin/plans/${planId}/`)
      await loadPlans()
      alert('Plan deleted successfully!')
    } catch (error: any) {
      console.error('Failed to delete plan:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete plan'
      alert(`Error: ${errorMessage}`)
    }
  }

  const tierConfig = {
    free: { label: 'Free Tier', color: 'steel' as const, bgColor: 'bg-och-steel/10' },
    starter: { label: 'Starter Tier ($3/month)', color: 'defender' as const, bgColor: 'bg-och-defender/10' },
    premium: { label: 'Premium Tier ($7/month)', color: 'mint' as const, bgColor: 'bg-och-mint/10' },
  }

  const getFreePlan = () => plans.find(p => p.tier === 'free')
  const getStarterPlan = () => plans.find(p => p.tier === 'starter')
  const getPremiumPlan = () => plans.find(p => p.tier === 'premium')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
          <p className="text-och-steel">Loading subscription plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Subscription Plans Management</h1>
          <p className="text-och-steel">Configure the three-tier subscription system: Free, Starter ($3), Premium ($7)</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'overview' ? 'defender' : 'outline'}
            onClick={() => setActiveView('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeView === 'manage' ? 'defender' : 'outline'}
            onClick={() => setActiveView('manage')}
          >
            Manage Plans
          </Button>
        </div>
      </div>

      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* System Overview */}
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Three-Tier Subscription System</h2>
              <p className="text-och-steel text-sm mb-6">
                The OCH platform operates a three-tiered subscription system that governs access to features and content.
                Access rights are defined by entitlements which are activated instantly upon successful payment.
              </p>

              {/* Feature Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left p-3 text-och-steel font-semibold">Feature</th>
                      <th className="text-left p-3 text-och-steel font-semibold">Free Tier</th>
                      <th className="text-left p-3 text-och-steel font-semibold">Starter ($3) - Enhanced (First 6 Months)</th>
                      <th className="text-left p-3 text-och-steel font-semibold">Starter ($3) - Normal Mode</th>
                      <th className="text-left p-3 text-och-steel font-semibold">Premium ($7)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIER_FEATURES.map((feature, idx) => (
                      <tr key={idx} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="p-3 text-white font-medium">{feature.feature}</td>
                        <td className="p-3 text-och-steel">{feature.free}</td>
                        <td className="p-3 text-och-steel">{feature.starterEnhanced}</td>
                        <td className="p-3 text-och-steel">{feature.starterNormal}</td>
                        <td className="p-3 text-och-steel">{feature.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Starter Tier Details */}
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">$3 Starter Tier - Enhanced Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-och-defender/10 rounded-lg border border-och-defender/20">
                  <h3 className="text-white font-semibold mb-2">Enhanced Access (First 6 Months)</h3>
                  <ul className="space-y-1 text-sm text-och-steel">
                    <li>• $3/month for the first 6 months</li>
                    <li>• Enhanced Access flag applied for 180 days</li>
                    <li>• Full AI features unlocked</li>
                    <li>• Full mission catalog (AI-only missions)</li>
                    <li>• Unlimited portfolio capacity</li>
                    <li>• Full curriculum visibility</li>
                    <li>• Full community access</li>
                    <li>• TalentScope preview mode</li>
                  </ul>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                  <h3 className="text-white font-semibold mb-2">Normal Mode (After 6 Months)</h3>
                  <ul className="space-y-1 text-sm text-och-steel">
                    <li>• $3/month after initial 6 months</li>
                    <li>• Enhanced Access flag removed</li>
                    <li>• Limited AI features</li>
                    <li>• Limited missions</li>
                    <li>• Limited portfolio capacity (5 items)</li>
                    <li>• Limited curriculum visibility</li>
                    <li>• Limited community access</li>
                    <li>• Basic TalentScope</li>
                    <li>• No mentorship or employer contact</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Premium Tier Details */}
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">$7 Premium Tier (Professional Tier)</h2>
              <p className="text-och-steel text-sm mb-4">
                Grants full platform capabilities, especially those involving human review and deeper data analytics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">Key Features</h3>
                  <ul className="space-y-1 text-sm text-och-steel">
                    <li>• $7/month</li>
                    <li>• Human Mentorship included</li>
                    <li>• Group sessions (plus recordings)</li>
                    <li>• Mission mentor reviews with pass/fail grades</li>
                    <li>• Full AI and Lab integrations</li>
                    <li>• Unlimited portfolio</li>
                    <li>• Full curriculum access</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Analytics & Talent</h3>
                  <ul className="space-y-1 text-sm text-och-steel">
                    <li>• Full TalentScope analytics</li>
                    <li>• Readiness breakdown</li>
                    <li>• CV scoring</li>
                    <li>• Mentor Influence Index</li>
                    <li>• Career Readiness Report</li>
                    <li>• Job fit score</li>
                    <li>• Hiring timeline prediction</li>
                    <li>• Talent contact enabled</li>
                    <li>• Full visibility in Talent Search</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription Management Flow */}
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Subscription Management Flow</h2>
              <div className="space-y-4">
                <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                  <h3 className="text-white font-semibold mb-2">Upgrade ($3 → $7)</h3>
                  <p className="text-och-steel text-sm">Takes effect instantly upon successful payment.</p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                  <h3 className="text-white font-semibold mb-2">Downgrade ($7 → $3)</h3>
                  <p className="text-och-steel text-sm">Takes effect after the billing cycle ends.</p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                  <h3 className="text-white font-semibold mb-2">Payment Failure</h3>
                  <p className="text-och-steel text-sm">
                    If payment fails, a 5-day grace period is initiated. After the grace period, 
                    if payment is still unsuccessful, the account auto-downgrades to the Free Tier (read-only mode).
                  </p>
                </div>
                <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                  <h3 className="text-white font-semibold mb-2">Entitlement Enforcement</h3>
                  <p className="text-och-steel text-sm">
                    Features like Mentor Review are gated by the user's entitlement status. 
                    For example, Mentors review missions only if the mentee has the $7 Premium entitlement.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeView === 'manage' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Manage Subscription Plans</h2>
            <Button
              variant="defender"
              onClick={() => {
                setEditingPlan(null)
                setIsModalOpen(true)
              }}
            >
              + Create Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const config = tierConfig[plan.tier]
              return (
                <Card key={plan.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Badge variant={config.color}>{config.label}</Badge>
                      <h3 className="text-xl font-bold text-white mt-2">{plan.name}</h3>
                      {plan.price_monthly && (
                        <p className="text-och-defender text-lg font-semibold mt-1">
                          ${plan.price_monthly}/month
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingPlan(plan)
                          setIsDetailModalOpen(true)
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPlan(plan)
                          setIsModalOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      {plan.tier !== 'free' && plan.tier !== 'starter' && plan.tier !== 'premium' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-och-steel">Missions:</span>
                      <span className="text-white ml-2 capitalize">{plan.missions_access_type.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-och-steel">Mentorship:</span>
                      <span className="text-white ml-2">{plan.mentorship_access ? 'Full Access' : 'No Access'}</span>
                    </div>
                    <div>
                      <span className="text-och-steel">TalentScope:</span>
                      <span className="text-white ml-2 capitalize">{plan.talentscope_access}</span>
                    </div>
                    <div>
                      <span className="text-och-steel">Talent Search:</span>
                      <span className="text-white ml-2">{plan.marketplace_contact ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    {plan.ai_coach_daily_limit !== null && (
                      <div>
                        <span className="text-och-steel">AI Coach:</span>
                        <span className="text-white ml-2">{plan.ai_coach_daily_limit} interactions/day</span>
                      </div>
                    )}
                    {plan.portfolio_item_limit !== null && (
                      <div>
                        <span className="text-och-steel">Portfolio:</span>
                        <span className="text-white ml-2">{plan.portfolio_item_limit} items</span>
                      </div>
                    )}
                    {plan.enhanced_access_days && (
                      <div>
                        <span className="text-och-steel">Enhanced Access:</span>
                        <span className="text-white ml-2">{plan.enhanced_access_days} days</span>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {plans.length === 0 && (
            <Card>
              <div className="p-6 text-center">
                <p className="text-och-steel mb-4">No subscription plans found.</p>
                <Button
                  variant="defender"
                  onClick={() => {
                    setEditingPlan(null)
                    setIsModalOpen(true)
                  }}
                >
                  Create First Plan
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {isModalOpen && (
        <PlanEditModal
          plan={editingPlan}
          onClose={() => {
            setIsModalOpen(false)
            setEditingPlan(null)
          }}
          onSave={handleSave}
        />
      )}

      {isDetailModalOpen && viewingPlan && (
        <PlanDetailModal
          plan={viewingPlan}
          onClose={() => {
            setIsDetailModalOpen(false)
            setViewingPlan(null)
          }}
          onEdit={() => {
            setIsDetailModalOpen(false)
            setEditingPlan(viewingPlan)
            setIsModalOpen(true)
          }}
        />
      )}
    </div>
  )
}

function PlanDetailModal({
  plan,
  onClose,
  onEdit,
}: {
  plan: SubscriptionPlan
  onClose: () => void
  onEdit: () => void
}) {
  const tierConfig = {
    free: { label: 'Free Tier', color: 'steel' as const },
    starter: { label: 'Starter Tier ($3/month)', color: 'defender' as const },
    premium: { label: 'Premium Tier ($7/month)', color: 'mint' as const },
  }

  const config = tierConfig[plan.tier] || { label: plan.tier, color: 'steel' as const }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge variant={config.color}>{config.label}</Badge>
              <h2 className="text-2xl font-bold text-white mt-2">{plan.name}</h2>
              {plan.price_monthly && (
                <p className="text-och-defender text-xl font-semibold mt-1">
                  ${plan.price_monthly}/month
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-och-steel hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-och-steel">Plan ID:</span>
                  <span className="text-white ml-2 font-mono text-xs">{plan.id}</span>
                </div>
                <div>
                  <span className="text-och-steel">Tier:</span>
                  <span className="text-white ml-2 capitalize">{plan.tier}</span>
                </div>
                {plan.created_at && (
                  <div>
                    <span className="text-och-steel">Created:</span>
                    <span className="text-white ml-2">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {plan.updated_at && (
                  <div>
                    <span className="text-och-steel">Last Updated:</span>
                    <span className="text-white ml-2">
                      {new Date(plan.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Access */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Feature Access</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                  <span className="text-och-steel">Missions Access:</span>
                  <span className="text-white capitalize">{plan.missions_access_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                  <span className="text-och-steel">Mentorship:</span>
                  <Badge variant={plan.mentorship_access ? 'mint' : 'steel'}>
                    {plan.mentorship_access ? 'Full Access' : 'No Access'}
                  </Badge>
                </div>
                <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                  <span className="text-och-steel">TalentScope:</span>
                  <span className="text-white capitalize">{plan.talentscope_access}</span>
                </div>
                <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                  <span className="text-och-steel">Talent Contact:</span>
                  <Badge variant={plan.marketplace_contact ? 'mint' : 'steel'}>
                    {plan.marketplace_contact ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Limits & Constraints</h3>
              <div className="space-y-2 text-sm">
                {plan.ai_coach_daily_limit !== null ? (
                  <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                    <span className="text-och-steel">AI Coach Daily Limit:</span>
                    <span className="text-white">{plan.ai_coach_daily_limit} interactions/day</span>
                  </div>
                ) : (
                  <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                    <span className="text-och-steel">AI Coach Daily Limit:</span>
                    <span className="text-white">Unlimited</span>
                  </div>
                )}
                {plan.portfolio_item_limit !== null ? (
                  <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                    <span className="text-och-steel">Portfolio Item Limit:</span>
                    <span className="text-white">{plan.portfolio_item_limit} items</span>
                  </div>
                ) : (
                  <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                    <span className="text-och-steel">Portfolio Item Limit:</span>
                    <span className="text-white">Unlimited</span>
                  </div>
                )}
                {plan.enhanced_access_days && (
                  <div className="flex justify-between p-2 bg-och-midnight/50 rounded">
                    <span className="text-och-steel">Enhanced Access Period:</span>
                    <span className="text-white">{plan.enhanced_access_days} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Features List */}
            {plan.features && plan.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Feature Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {plan.features.map((feature, idx) => (
                    <Badge key={idx} variant="defender">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-och-steel/20">
              <Button
                variant="defender"
                onClick={onEdit}
                className="flex-1"
              >
                Edit Plan
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function PlanEditModal({
  plan,
  onClose,
  onSave,
}: {
  plan: SubscriptionPlan | null
  onSave: (data: Partial<SubscriptionPlan>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: plan?.name || '',
    tier: plan?.tier || 'free',
    price_monthly: plan?.price_monthly || null,
    ai_coach_daily_limit: plan?.ai_coach_daily_limit || null,
    portfolio_item_limit: plan?.portfolio_item_limit || null,
    missions_access_type: plan?.missions_access_type || 'none',
    mentorship_access: plan?.mentorship_access || false,
    talentscope_access: plan?.talentscope_access || 'none',
    marketplace_contact: plan?.marketplace_contact || false,
    enhanced_access_days: plan?.enhanced_access_days || null,
    features: plan?.features || [],
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {plan ? 'Edit Plan' : 'Create Plan'}
            </h2>
            <button
              onClick={onClose}
              className="text-och-steel hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                placeholder="e.g., free, starter, premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
              >
                <option value="free">Free Tier</option>
                <option value="starter">Starter Tier ($3/month)</option>
                <option value="premium">Premium Tier ($7/month)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Monthly Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_monthly || ''}
                onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">AI Coach Daily Limit</label>
                <input
                  type="number"
                  value={formData.ai_coach_daily_limit || ''}
                  onChange={(e) => setFormData({ ...formData, ai_coach_daily_limit: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Portfolio Item Limit</label>
                <input
                  type="number"
                  value={formData.portfolio_item_limit || ''}
                  onChange={(e) => setFormData({ ...formData, portfolio_item_limit: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Missions Access Type</label>
              <select
                value={formData.missions_access_type}
                onChange={(e) => setFormData({ ...formData, missions_access_type: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
              >
                <option value="none">No Missions</option>
                <option value="ai_only">AI-Only Missions</option>
                <option value="full">Full Missions (including Capstones and Labs)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">TalentScope Access</label>
              <select
                value={formData.talentscope_access}
                onChange={(e) => setFormData({ ...formData, talentscope_access: e.target.value as any })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
              >
                <option value="none">No Access</option>
                <option value="basic">Basic TalentScope</option>
                <option value="preview">Preview Mode</option>
                <option value="full">Full Analytics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Enhanced Access Days</label>
              <input
                type="number"
                value={formData.enhanced_access_days || ''}
                onChange={(e) => setFormData({ ...formData, enhanced_access_days: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white"
                placeholder="e.g., 180 for Starter tier"
              />
              <p className="text-xs text-och-steel mt-1">Number of days Enhanced Access is active (e.g., 180 for first 6 months)</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.mentorship_access}
                  onChange={(e) => setFormData({ ...formData, mentorship_access: e.target.checked })}
                  className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                />
                <span className="text-white">Mentorship Access</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.marketplace_contact}
                  onChange={(e) => setFormData({ ...formData, marketplace_contact: e.target.checked })}
                  className="w-4 h-4 text-och-defender bg-och-midnight border-och-steel/30 rounded"
                />
                <span className="text-white">Talent Contact</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="defender"
                onClick={() => onSave(formData)}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
