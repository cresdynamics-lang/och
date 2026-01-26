'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { djangoClient } from '@/services/djangoClient'
import { apiGateway } from '@/services/apiGateway'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
  role_type: string
  is_system: boolean
}

interface SystemRole {
  name: string
  displayName: string
  keyPermissions: string[]
  accessScope: string
  mfaRequired: boolean
  sessionHours: number
}

const SYSTEM_ROLES: SystemRole[] = [
  {
    name: 'admin',
    displayName: 'Admin',
    keyPermissions: [
      'Full platform management',
      'Manage roles/policies',
      'Manage tenants',
      'Manage secrets',
      'System settings',
      'Adjust curriculum/missions',
      'Manage integrations',
      'Access audit logs',
      'Oversee community'
    ],
    accessScope: 'Global platform access',
    mfaRequired: true,
    sessionHours: 2
  },
  {
    name: 'program_director',
    displayName: 'Program Director (PD)',
    keyPermissions: [
      'Manage programs, cohorts, tracks',
      'Approve enrollments',
      'Modify scoring breakdowns',
      'Assign mentors',
      'Publish/adjust missions'
    ],
    accessScope: 'All data within owned programs/tracks/cohorts',
    mfaRequired: true,
    sessionHours: 2
  },
  {
    name: 'mentor',
    displayName: 'Mentor',
    keyPermissions: [
      'Review mission submissions',
      'Score capstone projects',
      'Run sessions',
      'Leave feedback',
      'Tag technical competencies'
    ],
    accessScope: 'Access restricted to assigned mentees and associated cohorts',
    mfaRequired: false,
    sessionHours: 12
  },
  {
    name: 'mentee',
    displayName: 'Mentee (Student)',
    keyPermissions: [
      'Complete onboarding',
      'Access Coaching OS',
      'Work on missions',
      'Build portfolio',
      'Track progress',
      'Upgrade/downgrade subscription'
    ],
    accessScope: 'Personal modules (profiling, learning, portfolio, mentorship) and own program/cohort',
    mfaRequired: false,
    sessionHours: 24
  },
  {
    name: 'employer',
    displayName: 'Employer',
    keyPermissions: [
      'Browse talent',
      'Filter by skill/readiness',
      'Contact Professional-tier mentees',
      'Post assignments'
    ],
    accessScope: 'Limited access via talent entitlements and subscription visibility rules',
    mfaRequired: false,
    sessionHours: 24
  },
  {
    name: 'finance',
    displayName: 'Finance',
    keyPermissions: [
      'Access billing/revenue',
      'Manage refunds',
      'Manage sponsorship wallets',
      'Create products and prices',
      'Manage seat caps'
    ],
    accessScope: 'Financial dashboards and invoicing data; no student PII beyond billing data',
    mfaRequired: true,
    sessionHours: 2
  },
  {
    name: 'sponsor_admin',
    displayName: 'Sponsor/Employer Admin',
    keyPermissions: [
      'Manage sponsored users',
      'View permitted profiles (per consent)'
    ],
    accessScope: 'Limited to sponsored users and associated organization data',
    mfaRequired: false,
    sessionHours: 12
  }
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'roles' | 'rbac' | 'abac' | 'security' | 'compliance'>('roles')
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setIsLoading(true)
      const data = await djangoClient.roles.listRoles()
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      // Map to ensure all required Role fields are present
      const mappedRoles: Role[] = rolesArray.map((role: any) => ({
        id: role.id,
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        role_type: role.role_type || 'custom',
        is_system: role.is_system || false,
      }))
      setRoles(mappedRoles)
    } catch (error) {
      console.error('Failed to load roles:', error)
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading roles...</p>
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
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Role & Policy Management</h1>
              <p className="text-och-steel">Manage RBAC roles, ABAC policies, security, and compliance</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-och-steel/20">
            <div className="flex gap-4">
              {[
                { id: 'roles', label: 'System Roles', icon: '👥' },
                { id: 'rbac', label: 'RBAC Configuration', icon: '🔐' },
                { id: 'abac', label: 'ABAC Policies', icon: '⚖️' },
                { id: 'security', label: 'Security Policies', icon: '🛡️' },
                { id: 'compliance', label: 'Compliance & Privacy', icon: '📋' },
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

          {/* Tab Content */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">System Role Definitions</h2>
                  <p className="text-och-steel text-sm mb-6">
                    Primary user roles within the OCH platform with their key permissions and access scopes.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Role</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Key Permissions</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Access Scope</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Security</th>
                          <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SYSTEM_ROLES.map((role) => (
                          <tr key={role.name} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                            <td className="p-3">
                              <div>
                                <p className="text-white font-semibold">{role.displayName}</p>
                                <p className="text-xs text-och-steel">{role.name}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <ul className="text-sm text-och-steel space-y-1">
                                {role.keyPermissions.slice(0, 3).map((perm, idx) => (
                                  <li key={idx}>• {perm}</li>
                                ))}
                                {role.keyPermissions.length > 3 && (
                                  <li className="text-och-gold">+ {role.keyPermissions.length - 3} more</li>
                                )}
                              </ul>
                            </td>
                            <td className="p-3">
                              <p className="text-sm text-och-steel max-w-xs">{role.accessScope}</p>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={role.mfaRequired ? 'orange' : 'steel'}>
                                    MFA {role.mfaRequired ? 'Required' : 'Optional'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-och-steel">
                                  Session: {role.sessionHours}h
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRole(role)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              {/* Role Details Modal */}
              {selectedRole && (
                <Card className="border-och-gold/50">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white">{selectedRole.displayName}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRole(null)}
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Key Permissions</h4>
                        <ul className="space-y-1">
                          {selectedRole.keyPermissions.map((perm, idx) => (
                            <li key={idx} className="text-och-steel text-sm flex items-start gap-2">
                              <span className="text-och-gold">•</span>
                              <span>{perm}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-2">Access Scope & Context</h4>
                        <p className="text-och-steel text-sm">{selectedRole.accessScope}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-white font-semibold mb-2">MFA Requirement</h4>
                          <Badge variant={selectedRole.mfaRequired ? 'orange' : 'steel'}>
                            {selectedRole.mfaRequired ? 'Mandatory' : 'Optional'}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">Session Expiration</h4>
                          <Badge variant="defender">{selectedRole.sessionHours} hours</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'rbac' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Role-Based Access Control (RBAC)</h2>
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
                        <Badge variant="mint">✓ Active</Badge>
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
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Cohort-scoped roles (cohort_id)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Track-scoped roles (track_key)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Organization-scoped roles (org_id)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
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
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Feature-level entitlement checks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Mentors access reviews only if mentee has $7 Premium entitlement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
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
                        Strong authentication policies including multi-factor authentication (MFA), required for Admin, Finance, and Director roles.
                      </p>
                      <div className="space-y-2">
                        {SYSTEM_ROLES.filter(r => r.mfaRequired).map((role) => (
                          <div key={role.name} className="flex items-center justify-between p-2 bg-och-midnight rounded">
                            <span className="text-white text-sm">{role.displayName}</span>
                            <Badge variant="orange">MFA Required</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Session Security */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Session Security</h3>
                      <p className="text-och-steel text-sm mb-3">
                        Session tokens must auto-expire after defined periods based on role.
                      </p>
                      <div className="space-y-2">
                        {SYSTEM_ROLES.map((role) => (
                          <div key={role.name} className="flex items-center justify-between p-2 bg-och-midnight rounded">
                            <span className="text-white text-sm">{role.displayName}</span>
                            <Badge variant="defender">{role.sessionHours} hours</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Audit Trail */}
                    <div className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <h3 className="text-white font-semibold mb-2">Audit Trail</h3>
                      <p className="text-och-steel text-sm mb-3">
                        The system maintains a full, immutable Activity Audit Trail tracking all security-relevant actions.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Who changed what</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">When changes occurred</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
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
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">profiling.share_with_mentor</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">portfolio.public_page</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
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
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Row-Level Security (RLS) implemented</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Column-Level Security (CLS) implemented</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
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
                          <Badge variant="mint">✓</Badge>
                          <span className="text-white text-sm">Content removal capability</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="mint">✓</Badge>
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
