'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { auditClient } from '@/services/auditClient'

interface SubscriptionPlan {
  id: string
  name: string
  tier: 'free' | 'starter' | 'premium'
  price_monthly: number | null
  features: string[]
  enhanced_access_days: number | null
}

interface UserSubscription {
  id: string
  user: {
    id: string
    email: string
    username: string
    first_name: string
    last_name: string
  }
  plan: SubscriptionPlan
  status: 'active' | 'past_due' | 'canceled' | 'trial'
  current_period_start: string | null
  current_period_end: string | null
  enhanced_access_expires_at: string | null
  days_enhanced_left: number | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

interface PaymentTransaction {
  id: string
  user_email: string
  gateway_name: string | null
  amount: string
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'canceled'
  gateway_transaction_id: string
  gateway_response: any
  failure_reason: string | null
  processed_at: string | null
  created_at: string
}

export default function UserSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  
  // Selected subscription for detail view
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  
  // Action states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load subscriptions
      const subsResponse = await apiGateway.get('/admin/subscriptions/') as UserSubscription[] | { results: UserSubscription[] }
      setSubscriptions(Array.isArray(subsResponse) ? subsResponse : (subsResponse.results || []))
      
      // Load plans
      const plansResponse = await apiGateway.get('/admin/plans/') as SubscriptionPlan[] | { results: SubscriptionPlan[] }
      setPlans(Array.isArray(plansResponse) ? plansResponse : (plansResponse.results || []))
    } catch (err: any) {
      console.error('Error loading subscriptions:', err)
      setError(err.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (userId: string) => {
    try {
      setLoadingTransactions(true)
      const response = await apiGateway.get(`/admin/transactions/?user=${userId}`) as PaymentTransaction[] | { results: PaymentTransaction[] }
      setTransactions(Array.isArray(response) ? response : (response.results || []))
    } catch (err: any) {
      console.error('Error loading transactions:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleViewDetails = async (subscription: UserSubscription) => {
    setSelectedSubscription(subscription)
    setShowDetailModal(true)
    await loadTransactions(subscription.user.id)
  }

  const handleUpgrade = async (planId: string) => {
    if (!selectedSubscription) return
    
    try {
      setActionLoading(true)
      await apiGateway.post(`/admin/subscriptions/${selectedSubscription.id}/upgrade/`, {
        plan_id: planId
      })
      
      await loadData()
      setShowUpgradeModal(false)
      setSelectedSubscription(null)
      
      // Show success message
      alert('Subscription upgraded successfully!')
    } catch (err: any) {
      console.error('Error upgrading subscription:', err)
      alert(err.message || 'Failed to upgrade subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDowngrade = async (planId: string) => {
    if (!selectedSubscription) return
    
    try {
      setActionLoading(true)
      await apiGateway.post(`/admin/subscriptions/${selectedSubscription.id}/downgrade/`, {
        plan_id: planId
      })
      
      await loadData()
      setShowDowngradeModal(false)
      setSelectedSubscription(null)
      
      // Show success message
      alert('Subscription downgrade scheduled!')
    } catch (err: any) {
      console.error('Error downgrading subscription:', err)
      alert(err.message || 'Failed to downgrade subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedTransaction) return
    
    try {
      setActionLoading(true)
      await apiGateway.post(`/admin/transactions/${selectedTransaction.id}/refund/`)
      
      await loadTransactions(selectedSubscription?.user.id || '')
      setShowRefundModal(false)
      setSelectedTransaction(null)
      
      // Show success message
      alert('Transaction marked as refunded!')
    } catch (err: any) {
      console.error('Error refunding transaction:', err)
      alert(err.message || 'Failed to refund transaction')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchesSearch = !searchQuery || 
        sub.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.user.username.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
      const matchesPlan = planFilter === 'all' || sub.plan.id === planFilter
      
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [subscriptions, searchQuery, statusFilter, planFilter])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeVariant = (status: string): 'defender' | 'mint' | 'gold' | 'orange' | 'steel' | 'outline' => {
    switch (status) {
      case 'active': return 'mint'
      case 'past_due': return 'orange'
      case 'canceled': return 'steel'
      case 'trial': return 'defender'
      default: return 'steel'
    }
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'premium': return 'gold'
      case 'starter': return 'defender'
      case 'free': return 'steel'
      default: return 'steel'
    }
  }

  if (loading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint"></div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-gold">User Subscriptions</h1>
            <p className="text-och-steel">Manage individual user subscriptions, billing cycles, and tier transitions</p>
          </div>

          {error && (
            <Card className="p-4 bg-och-orange/20 border-och-orange">
              <p className="text-och-orange">{error}</p>
            </Card>
          )}

          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-och-steel mb-2">Search Users</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or username..."
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                />
              </div>
              
              <div>
                <label className="block text-sm text-och-steel mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                  <option value="trial">Trial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-och-steel mb-2">Plan</label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Plans</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} (${plan.price_monthly || 0}/mo)</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-och-steel/20">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Current Period</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Enhanced Access</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-och-steel">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-och-steel">
                        {loading ? 'Loading...' : 'No subscriptions found'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{sub.user.email}</p>
                            <p className="text-sm text-och-steel">{sub.user.username}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getTierBadgeVariant(sub.plan.tier)}>
                            {sub.plan.name} (${sub.plan.price_monthly || 0}/mo)
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusBadgeVariant(sub.status)}>
                            {sub.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-och-steel">
                          {sub.current_period_start && sub.current_period_end ? (
                            <div>
                              <p>{formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}</p>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {sub.enhanced_access_expires_at ? (
                            <div>
                              <p className="text-sm text-och-mint">
                                {sub.days_enhanced_left !== null ? `${sub.days_enhanced_left} days left` : 'Active'}
                              </p>
                              <p className="text-xs text-och-steel">Expires: {formatDate(sub.enhanced_access_expires_at)}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-och-steel">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(sub)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Detail Modal */}
          {showDetailModal && selectedSubscription && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Subscription Details</h2>
                    <Button variant="outline" onClick={() => {
                      setShowDetailModal(false)
                      setSelectedSubscription(null)
                    }}>
                      Close
                    </Button>
                  </div>

                  {/* User Info */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">User Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-och-steel">Email</p>
                        <p className="text-white">{selectedSubscription.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-och-steel">Username</p>
                        <p className="text-white">{selectedSubscription.user.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Subscription Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-och-steel">Plan</p>
                        <Badge variant={getTierBadgeVariant(selectedSubscription.plan.tier)}>
                          {selectedSubscription.plan.name} (${selectedSubscription.plan.price_monthly || 0}/mo)
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-och-steel">Status</p>
                        <Badge variant={getStatusBadgeVariant(selectedSubscription.status)}>
                          {selectedSubscription.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-och-steel">Current Period Start</p>
                        <p className="text-white">{formatDate(selectedSubscription.current_period_start)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-och-steel">Current Period End</p>
                        <p className="text-white">{formatDate(selectedSubscription.current_period_end)}</p>
                      </div>
                      {selectedSubscription.enhanced_access_expires_at && (
                        <div>
                          <p className="text-sm text-och-steel">Enhanced Access Expires</p>
                          <p className="text-white">
                            {formatDate(selectedSubscription.enhanced_access_expires_at)}
                            {selectedSubscription.days_enhanced_left !== null && (
                              <span className="ml-2 text-och-mint">({selectedSubscription.days_enhanced_left} days left)</span>
                            )}
                          </p>
                        </div>
                      )}
                      {selectedSubscription.stripe_subscription_id && (
                        <div>
                          <p className="text-sm text-och-steel">Stripe Subscription ID</p>
                          <p className="text-white font-mono text-sm">{selectedSubscription.stripe_subscription_id}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Entitlements/Features */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Entitlements (Feature Flags)</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubscription.plan.features.map((feature, idx) => (
                        <Badge key={idx} variant="mint">{feature}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mb-6 flex gap-3">
                    <Button
                      variant="defender"
                      onClick={() => {
                        setShowUpgradeModal(true)
                      }}
                      disabled={selectedSubscription.plan.tier === 'premium'}
                    >
                      Upgrade Plan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDowngradeModal(true)
                      }}
                      disabled={selectedSubscription.plan.tier === 'free'}
                    >
                      Downgrade Plan
                    </Button>
                  </div>

                  {/* Transactions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Payment Transactions</h3>
                    {loadingTransactions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-och-mint"></div>
                      </div>
                    ) : transactions.length === 0 ? (
                      <p className="text-och-steel">No transactions found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-och-steel/20">
                              <th className="text-left py-2 px-3 text-sm font-semibold text-och-steel">Date</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-och-steel">Amount</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-och-steel">Gateway</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-och-steel">Status</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-och-steel">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((txn) => (
                              <tr key={txn.id} className="border-b border-och-steel/10">
                                <td className="py-2 px-3 text-sm text-och-steel">{formatDate(txn.created_at)}</td>
                                <td className="py-2 px-3 text-sm text-white">{txn.amount} {txn.currency}</td>
                                <td className="py-2 px-3 text-sm text-och-steel">{txn.gateway_name || 'N/A'}</td>
                                <td className="py-2 px-3">
                                  <Badge variant={txn.status === 'completed' ? 'mint' : txn.status === 'failed' ? 'orange' : 'steel'}>
                                    {txn.status.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3">
                                  {txn.status !== 'refunded' && txn.status === 'completed' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedTransaction(txn)
                                        setShowRefundModal(true)
                                      }}
                                    >
                                      Refund
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Upgrade Modal */}
          {showUpgradeModal && selectedSubscription && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Upgrade Subscription</h2>
                  <p className="text-och-steel mb-4">Select a plan to upgrade to:</p>
                  
                  <div className="space-y-2 mb-4">
                    {plans
                      .filter(plan => {
                        const tierLevels = { free: 0, starter: 1, premium: 2 }
                        const currentLevel = tierLevels[selectedSubscription.plan.tier as keyof typeof tierLevels] || 0
                        const planLevel = tierLevels[plan.tier as keyof typeof tierLevels] || 0
                        return planLevel > currentLevel
                      })
                      .map(plan => (
                        <button
                          key={plan.id}
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={actionLoading}
                          className="w-full p-3 text-left border border-och-steel/20 rounded-lg hover:border-och-mint transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{plan.name}</p>
                              <p className="text-sm text-och-steel">${plan.price_monthly}/month</p>
                            </div>
                            <Badge variant={getTierBadgeVariant(plan.tier)}>{plan.tier}</Badge>
                          </div>
                        </button>
                      ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Downgrade Modal */}
          {showDowngradeModal && selectedSubscription && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Downgrade Subscription</h2>
                  <p className="text-och-steel mb-4">Select a plan to downgrade to (takes effect at end of billing cycle):</p>
                  
                  <div className="space-y-2 mb-4">
                    {plans
                      .filter(plan => {
                        const tierLevels = { free: 0, starter: 1, premium: 2 }
                        const currentLevel = tierLevels[selectedSubscription.plan.tier as keyof typeof tierLevels] || 0
                        const planLevel = tierLevels[plan.tier as keyof typeof tierLevels] || 0
                        return planLevel < currentLevel
                      })
                      .map(plan => (
                        <button
                          key={plan.id}
                          onClick={() => handleDowngrade(plan.id)}
                          disabled={actionLoading}
                          className="w-full p-3 text-left border border-och-steel/20 rounded-lg hover:border-och-orange transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{plan.name}</p>
                              <p className="text-sm text-och-steel">${plan.price_monthly || 0}/month</p>
                            </div>
                            <Badge variant={getTierBadgeVariant(plan.tier)}>{plan.tier}</Badge>
                          </div>
                        </button>
                      ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowDowngradeModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Refund Modal */}
          {showRefundModal && selectedTransaction && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Refund Transaction</h2>
                  <p className="text-och-steel mb-4">
                    Are you sure you want to mark this transaction as refunded?
                  </p>
                  
                  <div className="bg-och-midnight/50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-och-steel">Amount</p>
                    <p className="text-white font-medium">{selectedTransaction.amount} {selectedTransaction.currency}</p>
                    <p className="text-sm text-och-steel mt-2">Date</p>
                    <p className="text-white">{formatDate(selectedTransaction.created_at)}</p>
                    <p className="text-sm text-och-steel mt-2">Gateway</p>
                    <p className="text-white">{selectedTransaction.gateway_name || 'N/A'}</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => {
                      setShowRefundModal(false)
                      setSelectedTransaction(null)
                    }}>
                      Cancel
                    </Button>
                    <Button variant="orange" onClick={handleRefund} disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : 'Confirm Refund'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}




























