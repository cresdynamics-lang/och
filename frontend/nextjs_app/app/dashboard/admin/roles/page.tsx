'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { djangoClient, type RoleWithPermissions, type Permission } from '@/services/djangoClient'

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'abac' | 'security' | 'compliance'>('rbac')

  // RBAC: manage roles and permissions (admin only)
  const [apiRoles, setApiRoles] = useState<RoleWithPermissions[]>([])
  const [apiPermissions, setApiPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [permissionIdsForRole, setPermissionIdsForRole] = useState<number[]>([])
  const [rbacLoading, setRbacLoading] = useState(false)
  const [rbacSaving, setRbacSaving] = useState(false)
  const [rbacError, setRbacError] = useState<string | null>(null)
  const [rbacSuccess, setRbacSuccess] = useState<string | null>(null)

  const permissionsByResource = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const p of apiPermissions) {
      const key = p.resource_type
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    return Object.fromEntries(sorted)
  }, [apiPermissions])

  useEffect(() => {
    if (activeTab === 'rbac') {
      loadRbacData()
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedRoleId != null) {
      const role = apiRoles.find((r) => r.id === selectedRoleId)
      const perms = role?.permissions ?? []
      setPermissionIdsForRole(Array.isArray(perms) ? perms.map((p: { id: number }) => p.id) : [])
    } else {
      setPermissionIdsForRole([])
    }
  }, [selectedRoleId, apiRoles])

  const loadRbacData = async () => {
    setRbacError(null)
    setRbacLoading(true)
    try {
      const [rolesData, permsData] = await Promise.all([
        djangoClient.roles.listRoles(),
        djangoClient.permissions.listPermissions(),
      ])
      setApiRoles(rolesData)
      setApiPermissions(permsData)
      if (selectedRoleId == null && rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id)
      }
    } catch (err: any) {
      setRbacError(err?.message || 'Failed to load roles and permissions')
      setApiRoles([])
      setApiPermissions([])
    } finally {
      setRbacLoading(false)
    }
  }

  const saveRolePermissions = async () => {
    if (selectedRoleId == null) return
    setRbacError(null)
    setRbacSuccess(null)
    setRbacSaving(true)
    try {
      await djangoClient.roles.updateRole(selectedRoleId, { permission_ids: permissionIdsForRole })
      setRbacSuccess('Permissions saved.')
      const updated = await djangoClient.roles.getRole(selectedRoleId)
      setApiRoles((prev) => prev.map((r) => (r.id === selectedRoleId ? updated : r)))
      const nextPerms = updated?.permissions ?? []
      setPermissionIdsForRole(Array.isArray(nextPerms) ? nextPerms.map((p: { id: number }) => p.id) : [])
    } catch (err: any) {
      setRbacError(err?.message || 'Failed to save permissions')
    } finally {
      setRbacSaving(false)
    }
  }

  const togglePermission = (permId: number) => {
    setPermissionIdsForRole((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    )
  }

  const clearSectionPermissions = (permIds: number[]) => {
    setPermissionIdsForRole((prev) => prev.filter((id) => !permIds.includes(id)))
  }

  const selectSectionPermissions = (permIds: number[]) => {
    setPermissionIdsForRole((prev) => [...new Set([...prev, ...permIds])])
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Role & Policy Management</h1>
              <p className="text-och-steel">Manage RBAC roles, ABAC policies, security, and compliance</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-och-steel/20">
            <div className="flex gap-4">
              {[
                { id: 'rbac', label: 'RBAC Configuration' },
                { id: 'abac', label: 'ABAC Policies' },
                { id: 'security', label: 'Security Policies' },
                { id: 'compliance', label: 'Compliance & Privacy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-och-gold text-och-gold'
                      : 'border-transparent text-och-steel hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'rbac' && (
            <div className="space-y-6">
              {/* Manage roles and permissions – admin only */}
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Manage Roles & Permissions</h2>
                  <p className="text-och-steel text-sm mb-6">
                    Assign permissions to each role. Changes apply immediately; users get access based on their role&apos;s permissions.
                  </p>
                  {rbacError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {rbacError}
                    </div>
                  )}
                  {rbacSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-och-mint/10 border border-och-mint/30 text-och-mint text-sm">
                      {rbacSuccess}
                    </div>
                  )}
                  {!rbacLoading && apiPermissions.length === 0 && apiRoles.length > 0 && (
                    <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                      <p className="font-medium">No permissions in the database.</p>
                      <p className="mt-1">Run the backend seed to create permissions and assign them to roles:</p>
                      <code className="mt-2 block p-2 bg-och-midnight rounded text-xs">python manage.py seed_roles_permissions</code>
                      <p className="mt-2 text-och-steel">Run this in the backend container or from <code>backend/django_app</code>.</p>
                    </div>
                  )}
                  {!rbacLoading && selectedRoleId != null && permissionIdsForRole.length === 0 && apiPermissions.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-och-steel/20 border border-och-steel/30 text-och-steel text-sm">
                      This role has no permissions assigned. Select permissions below and click Save, or run the backend seed to assign defaults: <code className="text-xs">python manage.py seed_roles_permissions</code>
                    </div>
                  )}
                  {rbacLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-och-mint"></div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-och-steel mb-2">Select role</label>
                        <select
                          value={selectedRoleId ?? ''}
                          onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full max-w-xs bg-och-midnight border border-och-steel/30 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-och-gold focus:border-transparent"
                        >
                          <option value="">— Select role —</option>
                          {apiRoles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.display_name} ({r.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedRoleId != null && (
                        <>
                          <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
                            <span className="text-och-steel text-sm">
                              {permissionIdsForRole.length} permission(s) selected
                            </span>
                            <Button
                              onClick={saveRolePermissions}
                              disabled={rbacSaving}
                            >
                              {rbacSaving ? 'Saving…' : 'Save permissions'}
                            </Button>
                          </div>
                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(permissionsByResource).map(([resource, perms]) => {
                              const permIds = perms.map((p) => p.id)
                              const selectedInSection = permIds.filter((id) => permissionIdsForRole.includes(id)).length
                              return (
                              <div
                                key={resource}
                                className="p-4 rounded-lg border border-och-steel/20 bg-och-midnight/50"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-white font-semibold capitalize">{resource.replace(/_/g, ' ')}</h4>
                                  <div className="flex items-center gap-2">
                                    {selectedInSection < perms.length && (
                                      <button
                                        type="button"
                                        onClick={() => selectSectionPermissions(permIds)}
                                        className="text-xs text-och-steel hover:text-och-mint transition-colors"
                                      >
                                        Select all
                                      </button>
                                    )}
                                    {selectedInSection > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => clearSectionPermissions(permIds)}
                                        className="text-xs text-och-steel hover:text-och-orange transition-colors"
                                      >
                                        Deselect all
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <ul className="space-y-2">
                                  {perms.map((p) => (
                                    <li key={p.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`perm-${p.id}`}
                                        checked={permissionIdsForRole.includes(p.id)}
                                        onChange={() => togglePermission(p.id)}
                                        className="h-4 w-4 rounded border-och-steel/50 bg-och-midnight text-och-gold focus:ring-och-gold"
                                      />
                                      <label htmlFor={`perm-${p.id}`} className="text-sm text-och-steel cursor-pointer">
                                        {p.action}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )})}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">RBAC Overview</h2>
                  <p className="text-och-steel text-sm mb-6">
                    Authorization is governed by RBAC. Roles define permissions that grant access to resources and actions.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">RBAC Mechanism</h3>
                      <p className="text-och-steel text-sm mb-3">
                        Users are assigned roles, and roles have associated permissions. Access is granted based on role membership.
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="mint">Active</Badge>
                        <span className="text-white text-sm">RBAC is enforced at the API Gateway</span>
                      </div>
                    </div>

                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Role and Scope Granularity</h3>
                      <p className="text-och-steel text-sm mb-3">
                        Policies are evaluated based on attributes like cohort_id, track_key, org_id, and consent_scopes[].
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Cohort-scoped roles (cohort_id)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Track-scoped roles (track_key)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Organization-scoped roles (org_id)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Consent-based access (consent_scopes[])</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Example: Program Director Access</h3>
                      <p className="text-och-steel text-sm mb-2">
                        A Program Director can list cohort portfolios only if the user's cohort_id matches the request's cohort_id.
                      </p>
                      <div className="bg-och-midnight p-3 rounded text-xs font-mono text-och-steel">
                        IF user.role == 'program_director'<br />
                        AND user.cohort_id == request.cohort_id<br />
                        THEN allow LIST portfolios
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'abac' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Attribute-Based Access Control (ABAC)</h2>
                  <p className="text-och-steel text-sm mb-6">
                    ABAC policies are enforced at the API Gateway & Integration Layer (AGIL) using OPA/rego policies.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Authorization at the Edge</h3>
                      <p className="text-och-steel text-sm mb-3">
                        RBAC/ABAC is enforced at the API Gateway using OPA/rego policies that utilize claims such as:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Badge variant="defender">roles[]</Badge>
                        <Badge variant="defender">org_id</Badge>
                        <Badge variant="defender">cohort_id</Badge>
                        <Badge variant="defender">consent_scopes[]</Badge>
                        <Badge variant="defender">entitlements[]</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Example: Mentor Access to Mentee Profiling</h3>
                      <div className="bg-och-midnight p-3 rounded text-xs font-mono text-och-steel mb-2">
                        IF user.role == 'mentor'<br />
                        AND match_exists(user_id, mentor_id)<br />
                        AND consent_scopes.includes('share_with_mentor')<br />
                        THEN allow READ profiling
                      </div>
                      <p className="text-och-steel text-xs">
                        This policy ensures mentors can only access profiling data for their assigned mentees who have granted consent.
                      </p>
                    </div>

                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Example: Finance Access to Invoices</h3>
                      <div className="bg-och-midnight p-3 rounded text-xs font-mono text-och-steel mb-2">
                        IF user.role == 'finance'<br />
                        AND (invoice.org_id == user.org_id OR user.role == 'admin')<br />
                        THEN allow READ invoice
                      </div>
                      <p className="text-och-steel text-xs">
                        Finance users can only access invoices for their organization, unless they are global admins.
                      </p>
                    </div>

                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Entitlement Enforcement</h3>
                      <p className="text-och-steel text-sm mb-3">
                        The system enforces entitlements at the feature level. The Billing Module issues entitlements, which are checked by middleware at the request stage.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Feature-level entitlement checks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Mentors access reviews only if mentee has $7 Premium entitlement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Middleware enforces entitlements at request stage</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Security Policies</h2>
                  
                  <div className="space-y-6">
                    {/* Authentication Requirements */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Authentication Requirements</h3>
                      <p className="text-och-steel text-sm mb-3">
                        Strong authentication policies including multi-factor authentication (MFA). MFA is required for Admin, Finance, and Program Director roles as configured in platform settings.
                      </p>
                    </div>

                    {/* Session Security */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Session Security</h3>
                      <p className="text-och-steel text-sm mb-3">
                        Session tokens auto-expire after defined periods based on role. Session duration is configured per role in platform settings.
                      </p>
                    </div>

                    {/* Audit Trail */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Audit Trail</h3>
                      <p className="text-och-steel text-sm mb-3">
                        The system maintains a full, immutable Activity Audit Trail tracking all security-relevant actions.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Who changed what</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">When changes occurred</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Before/after values</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3">View Audit Logs</Button>
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
                  <h2 className="text-2xl font-bold text-white mb-4">Compliance & Privacy Policies</h2>
                  
                  <div className="space-y-6">
                    {/* Consent and Privacy */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Consent and Privacy (CPPC)</h3>
                      <p className="text-och-steel text-sm mb-3">
                        The Consent, Privacy & Policy Center (CPPC) defines explicit consent scopes. Access to sensitive data is denied if the required scope is missing.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">profiling.share_with_mentor</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">portfolio.public_page</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">analytics.share_with_sponsor</span>
                        </div>
                      </div>
                    </div>

                    {/* Data Minimization */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Data Minimization</h3>
                      <p className="text-och-steel text-sm mb-3">
                        The system enforces the principle of data minimization. Finance roles have no access to student PII beyond necessary billing data.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="orange">Enforced</Badge>
                          <span className="text-white text-sm">Finance: No PII access beyond billing data</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Row-Level Security (RLS) implemented</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Column-Level Security (CLS) implemented</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">PII masked outside permitted roles</span>
                        </div>
                      </div>
                    </div>

                    {/* Moderation Policy */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Moderation Policy</h3>
                      <p className="text-och-steel text-sm mb-3">
                        Community Governance rules covering harassment, cheating, plagiarism, and abuse of AI tools.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="orange">Active</Badge>
                          <span className="text-white text-sm">Harassment detection and prevention</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="orange">Active</Badge>
                          <span className="text-white text-sm">Cheating and plagiarism detection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="orange">Active</Badge>
                          <span className="text-white text-sm">AI tool abuse monitoring</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Content removal capability</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">Yes</Badge>
                          <span className="text-white text-sm">Account suspension capability</span>
                        </div>
                      </div>
                    </div>
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
