'use client'

import { useState, useMemo, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'
import { djangoClient } from '@/services/djangoClient'
import type { User } from '@/services/types'

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function FinancePage() {
  const { users, isLoading, refetch } = useUsers({ page: 1, page_size: 100 })
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'operations' | 'compliance'>('users')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUserForSettings, setSelectedUserForSettings] = useState<User | null>(null)
  const [availableFinanceUsers, setAvailableFinanceUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [financeAdminRoleId, setFinanceAdminRoleId] = useState<number | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Security settings state
  const [mfaEnforcement, setMfaEnforcement] = useState(true) // Mandatory for Finance
  const [sessionExpirationHours, setSessionExpirationHours] = useState(2) // 2 hours default
  const [piiMinimization, setPiiMinimization] = useState(true) // No PII access beyond billing
  const [auditTrailEnabled, setAuditTrailEnabled] = useState(true) // All actions logged

  const financeUsers = useMemo(() => {
    return users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'finance' || r.role === 'finance_admin')
    )
  }, [users])

  const financeAdminUsers = useMemo(() => {
    return financeUsers.filter((u) => 
      u.roles?.some((r: any) => r.role === 'finance_admin')
    )
  }, [financeUsers])

  // Load available finance users (users with finance role but not finance_admin)
  useEffect(() => {
    const loadAvailableFinanceUsers = async () => {
      try {
        const allUsers = await djangoClient.users.listUsers({ page: 1, page_size: 1000 })
        const financeOnlyUsers = allUsers.results.filter((u: User) => {
          const hasFinance = u.roles?.some((r: any) => r.role === 'finance')
          const hasFinanceAdmin = u.roles?.some((r: any) => r.role === 'finance_admin')
          return hasFinance && !hasFinanceAdmin
        })
        setAvailableFinanceUsers(financeOnlyUsers)
      } catch (err) {
        console.error('Failed to load available finance users:', err)
        setAvailableFinanceUsers([])
      }
    }

    if (showAssignModal) {
      loadAvailableFinanceUsers()
      loadFinanceAdminRole()
    }
  }, [showAssignModal])

  // Load finance_admin role ID
  const loadFinanceAdminRole = async () => {
    try {
      const roles = await djangoClient.roles.listRoles()
      const financeAdminRole = roles.results.find((r: any) => r.name === 'finance_admin')
      if (financeAdminRole) {
        setFinanceAdminRoleId(financeAdminRole.id)
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  const handleAssignFinanceAdmin = async () => {
    if (!selectedUserId || !financeAdminRoleId) {
      setError('Please select a user')
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      await djangoClient.roles.assignRole(selectedUserId, {
        role_id: financeAdminRoleId,
        scope: 'global',
      })
      
      setShowAssignModal(false)
      setSelectedUserId(null)
      await refetch()
    } catch (err: any) {
      console.error('Failed to assign finance_admin role:', err)
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to assign role'
      setError(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRevokeFinanceAdmin = async (userId: number, userRoleId: number) => {
    if (!confirm('Are you sure you want to revoke the finance_admin role from this user?')) {
      return
    }

    try {
      await djangoClient.roles.revokeRole(userId, userRoleId)
      await refetch()
    } catch (err: any) {
      console.error('Failed to revoke role:', err)
      alert(err?.response?.data?.detail || err?.message || 'Failed to revoke role')
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading finance users...</p>
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Finance Management</h1>
              <p className="text-och-steel">Manage finance users, security, operations, and compliance</p>
            </div>
            {activeTab === 'users' && (
              <Button variant="gold" size="sm" onClick={() => setShowAssignModal(true)}>
                + Assign Finance Admin
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-och-steel/20">
            <div className="flex gap-4">
              {[
                { id: 'users', label: 'User Management', icon: '👥' },
                { id: 'security', label: 'Security & Permissions', icon: '🔐' },
                { id: 'operations', label: 'Financial Operations', icon: '💰' },
                { id: 'compliance', label: 'Compliance & Audit', icon: '📋' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-och-gold text-och-gold'
                      : 'border-transparent text-och-steel hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-och-gold">$0</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Pending Refunds</p>
                <p className="text-2xl font-bold text-och-orange">0</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-och-steel text-sm mb-1">Active Subscriptions</p>
                <p className="text-2xl font-bold text-och-mint">0</p>
              </div>
            </Card>
          </div>

          {/* Tab Content */}
          {activeTab === 'users' && (
            <Card>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Roles</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">MFA Status</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-och-steel">
                            No finance users found
                          </td>
                        </tr>
                      ) : (
                        financeUsers.map((u) => {
                          const isFinanceAdmin = u.roles?.some((r: any) => r.role === 'finance_admin')
                          const financeAdminRole = u.roles?.find((r: any) => r.role === 'finance_admin')
                          const hasMFA = u.mfa_enabled || false
                          
                          return (
                            <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                              <td className="p-3">
                                <p className="text-white font-semibold">
                                  {u.first_name} {u.last_name}
                                </p>
                              </td>
                              <td className="p-3 text-och-steel text-sm">{u.email}</td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-2">
                                  {u.roles?.map((r: any) => (
                                    <Badge
                                      key={r.id || r.role}
                                      variant={r.role === 'finance_admin' ? 'gold' : 'steel'}
                                    >
                                      {r.role === 'finance_admin' ? 'Finance Admin' : r.role === 'finance' ? 'Finance' : r.role}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant={hasMFA ? 'mint' : 'orange'}>
                                  {hasMFA ? 'Enabled' : 'Required'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={u.is_active && u.account_status === 'active' ? 'mint' : 'orange'}
                                >
                                  {u.account_status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedUserForSettings(u)}
                                  >
                                    Settings
                                  </Button>
                                  {isFinanceAdmin && financeAdminRole && ((financeAdminRole as any).id || (financeAdminRole as any).user_role_id) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRevokeFinanceAdmin(u.id!, ((financeAdminRole as any).id || (financeAdminRole as any).user_role_id) as number)}
                                    >
                                      Revoke Admin
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Security & Authentication Settings</h3>
                  
                  <div className="space-y-6">
                    {/* MFA Enforcement */}
                    <div className="flex items-center justify-between p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <div>
                        <h4 className="text-white font-semibold mb-1">Mandatory Multi-Factor Authentication</h4>
                        <p className="text-och-steel text-sm">
                          Finance role requires mandatory MFA. All finance users must have MFA enabled.
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="orange">Mandatory</Badge>
                      </div>
                    </div>

                    {/* Session Control */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h4 className="text-white font-semibold mb-3">Session Auto-Expiration</h4>
                      <p className="text-och-steel text-sm mb-4">
                        Finance users have short session expiration periods for enhanced security.
                      </p>
                      <div className="flex items-center gap-4">
                        <label className="text-white text-sm">Session Duration:</label>
                        <select
                          value={sessionExpirationHours}
                          onChange={(e) => setSessionExpirationHours(Number(e.target.value))}
                          className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-gold"
                        >
                          <option value={1}>1 hour</option>
                          <option value={2}>2 hours (Recommended)</option>
                          <option value={4}>4 hours</option>
                        </select>
                        <Button variant="gold" size="sm">Save</Button>
                      </div>
                    </div>

                    {/* RBAC Configuration */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h4 className="text-white font-semibold mb-3">Role-Based Access Control (RBAC)</h4>
                      <p className="text-och-steel text-sm mb-4">
                        Finance users can read invoices and financial data, scoped by organization ID unless they hold global Admin role.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Read invoices (org-scoped)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Read financial data (org-scoped)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Create products and prices</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Manage seat caps</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Pricing & Products</h3>
                    <p className="text-och-steel text-sm mb-4">
                      Finance can define programs, duration, tracks, and pricing models. Manage versioned Product Catalog & Price Books.
                    </p>
                    <Button variant="outline" className="w-full">Manage Products</Button>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Refund & Adjustment Authority</h3>
                    <p className="text-och-steel text-sm mb-4">
                      Finance role has authority to approve refunds, manage invoice amendments, and post credits.
                    </p>
                    <Button variant="outline" className="w-full">View Refund Queue</Button>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Invoicing & Reporting</h3>
                    <p className="text-och-steel text-sm mb-4">
                      Create corporate invoices, track payment status with PO numbers, and access financial reports.
                    </p>
                    <Button variant="outline" className="w-full">View Invoices</Button>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Reward Governance</h3>
                    <p className="text-och-steel text-sm mb-4">
                      Oversight of rewards budgets, approve payouts exceeding threshold, and revoke vouchers.
                    </p>
                    <Button variant="outline" className="w-full">Manage Rewards</Button>
                  </div>
                </Card>
              </div>

              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Dunning Oversight</h3>
                  <p className="text-och-steel text-sm mb-4">
                    Monitor payment failure events and track related communication logs via NAS.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                      <span className="text-white text-sm">Failed Payment Notifications</span>
                      <Badge variant="orange">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg">
                      <span className="text-white text-sm">Payment Retry Attempts</span>
                      <Badge variant="defender">3 attempts</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Compliance & Data Protection</h3>
                  
                  <div className="space-y-6">
                    {/* PII Minimization */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">PII Minimization</h4>
                        <Badge variant="orange">Enforced</Badge>
                      </div>
                      <p className="text-och-steel text-sm mb-3">
                        Finance role has no access to student Personally Identifiable Information (PII) beyond billing data necessary for transaction management.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={piiMinimization}
                          onChange={(e) => setPiiMinimization(e.target.checked)}
                          className="w-4 h-4 text-och-gold bg-och-midnight border-och-steel rounded focus:ring-och-gold"
                        />
                        <label className="text-white text-sm">Enforce PII minimization policy</label>
                      </div>
                    </div>

                    {/* Audit Trail */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">Audit Trail</h4>
                        <Badge variant="mint">Active</Badge>
                      </div>
                      <p className="text-och-steel text-sm mb-3">
                        All financial changes and actions taken by Finance role are captured in the immutable Audit Trail. Key actions such as billing.refund.processed are logged with actor ID.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={auditTrailEnabled}
                          onChange={(e) => setAuditTrailEnabled(e.target.checked)}
                          className="w-4 h-4 text-och-gold bg-och-midnight border-och-steel rounded focus:ring-och-gold"
                        />
                        <label className="text-white text-sm">Enable comprehensive audit logging</label>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3">View Audit Logs</Button>
                    </div>

                    {/* Entitlement Integrity */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h4 className="text-white font-semibold mb-3">Entitlement Integrity</h4>
                      <p className="text-och-steel text-sm mb-3">
                        Finance role actions directly affect entitlements (e.g., cohort_seat, module_access). Payment success grants entitlements; failures or refunds appropriately revoke or downgrade access.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Automatic entitlement on payment success</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Automatic revocation on refund</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Downgrade access on payment failure</span>
                        </div>
                      </div>
                    </div>

                    {/* Data Deletion Exceptions */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h4 className="text-white font-semibold mb-3">Data Deletion Exceptions</h4>
                      <p className="text-och-steel text-sm mb-3">
                        Even upon user deletion request ("Right to be forgotten"), legal ledgers related to billing are retained for compliance.
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="orange">Protected</Badge>
                        <span className="text-white text-sm">Billing ledgers are retained per legal requirements</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Assign Finance Admin Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4 border-och-gold/50">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Assign Finance Admin Role</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAssignModal(false)
                        setSelectedUserId(null)
                        setError(null)
                      }}
                    >
                      <XIcon />
                    </Button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/50 rounded-lg">
                      <p className="text-och-orange text-sm">{error}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Select Finance User
                    </label>
                    {availableFinanceUsers.length === 0 ? (
                      <div className="p-4 bg-och-midnight/50 rounded-lg text-center text-och-steel">
                        <p>No finance users available to assign finance_admin role.</p>
                        <p className="text-xs mt-2">All finance users already have finance_admin role.</p>
                      </div>
                    ) : (
                      <select
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-gold"
                      >
                        <option value="">Select a finance user...</option>
                        {availableFinanceUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-och-steel/20">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAssignModal(false)
                        setSelectedUserId(null)
                        setError(null)
                      }}
                      disabled={isAssigning}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="gold"
                      onClick={handleAssignFinanceAdmin}
                      disabled={isAssigning || !selectedUserId || availableFinanceUsers.length === 0}
                    >
                      {isAssigning ? 'Assigning...' : 'Assign Finance Admin'}
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

