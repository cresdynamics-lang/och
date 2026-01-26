'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { UserManagementModal } from '@/components/admin/UserManagementModal'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
  role_type: string
  is_system: boolean
}

interface AuditLog {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  result: string
  timestamp: string
  actor_identifier: string
}

interface APIKey {
  id: number
  name: string
  key_prefix: string
  key_type: string
  is_active: boolean
  created_at: string
}

export default function AdminClient() {
  const { user } = useAuth()
  const { users, totalCount, isLoading: usersLoading, refetch: refetchUsers } = useUsers({ page: 1, page_size: 100 })
  
  // Panel states
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set(['overview']))
  const [roles, setRoles] = useState<Role[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadRoles(),
        loadAuditLogs(),
        loadApiKeys(),
      ])
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      // Handle both array and paginated response
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Failed to load roles:', error)
      setRoles([])
    }
  }

  const loadAuditLogs = async () => {
    try {
      const data = await apiGateway.get<{ results: AuditLog[] } | AuditLog[]>('/audit-logs/', {
        params: { range: 'week', page_size: 50 }
      })
      // Handle both array and paginated response
      const logsArray = Array.isArray(data) ? data : (data?.results || [])
      setAuditLogs(logsArray)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      setAuditLogs([])
    }
  }

  const loadApiKeys = async () => {
    try {
      const data = await apiGateway.get<APIKey[]>('/api-keys/')
      setApiKeys(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load API keys:', error)
      // API keys endpoint might not exist yet, set empty array
      setApiKeys([])
    }
  }

  const togglePanel = (panelId: string) => {
    setExpandedPanels((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(panelId)) {
        newSet.delete(panelId)
      } else {
        newSet.add(panelId)
      }
      return newSet
    })
  }

  // Filter users by role
  const filteredUsers = useMemo(() => {
    if (selectedRoleFilter === 'all') return users
    return users.filter((u) => {
      const userRoles = u.roles || []
      return userRoles.some((r: any) => r.role === selectedRoleFilter)
    })
  }, [users, selectedRoleFilter])

  // Statistics
  const stats = useMemo(() => {
    const programDirectors = users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'program_director')
    ).length
    const financeUsers = users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'finance')
    ).length
    const mentees = users.filter((u) => 
      u.roles?.some((r: any) => r.role === 'mentee' || r.role === 'student')
    ).length
    const activeUsers = users.filter((u) => u.is_active && u.account_status === 'active').length

    return {
      total: totalCount || users.length,
      active: activeUsers,
      programDirectors,
      financeUsers,
      mentees,
    }
  }, [users, totalCount])

  // Audit log stats
  const auditStats = useMemo(() => {
    const success = auditLogs.filter((log) => log.result === 'success').length
    const failure = auditLogs.filter((log) => log.result === 'failure').length
    const today = auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp)
      const today = new Date()
      return logDate.toDateString() === today.toDateString()
    }).length

    return { total: auditLogs.length, success, failure, today }
  }, [auditLogs])

  const assignRole = async (userId: number, roleId: number) => {
    try {
      await apiGateway.post(`/users/${userId}/roles`, { role_id: roleId, scope: 'global' })
      await refetchUsers()
      await loadRoles()
    } catch (error: any) {
      alert(`Failed to assign role: ${error.message}`)
    }
  }

  const revokeRole = async (userId: number, roleId: number) => {
    try {
      await apiGateway.delete(`/users/${userId}/roles/${roleId}`)
      await refetchUsers()
    } catch (error: any) {
      alert(`Failed to revoke role: ${error.message}`)
    }
  }

  // Simple chart component
  const SimpleBarChart = ({ data, labels, color }: { data: number[], labels: string[], color: string }) => {
    const max = Math.max(...data, 1)
    return (
      <div className="flex items-end gap-2 h-32">
        {data.map((value, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all hover:opacity-80"
              style={{
                height: `${(value / max) * 100}%`,
                backgroundColor: color,
                minHeight: value > 0 ? '4px' : '0',
              }}
            />
            <span className="text-xs text-och-steel mt-1 text-center">{labels[idx]}</span>
            <span className="text-xs font-semibold text-white mt-1">{value}</span>
          </div>
        ))}
      </div>
    )
  }

  const PanelHeader = ({ 
    id, 
    title, 
    icon, 
    badge, 
    badgeColor = 'defender' 
  }: { 
    id: string
    title: string
    icon: string
    badge?: string | number
    badgeColor?: 'defender' | 'mint' | 'gold' | 'orange'
  }) => (
    <button
      onClick={() => togglePanel(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-och-midnight/50 transition-colors rounded-lg"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {badge !== undefined && (
          <Badge variant={badgeColor}>{badge}</Badge>
        )}
      </div>
      <span className="text-och-steel">
        {expandedPanels.has(id) ? '▼' : '▶'}
      </span>
    </button>
  )

  if (isLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
          <p className="text-och-steel">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-och-midnight">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-gold">Admin Dashboard</h1>
          <p className="text-och-steel">Comprehensive platform management and oversight</p>
        </div>

        {/* Overview Stats */}
        {expandedPanels.has('overview') && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">Platform Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-och-mint">{stats.active}</p>
                </div>
                <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Program Directors</p>
                  <p className="text-3xl font-bold text-och-defender">{stats.programDirectors}</p>
                </div>
                <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Finance Users</p>
                  <p className="text-3xl font-bold text-och-gold">{stats.financeUsers}</p>
                </div>
                <div className="text-center p-4 bg-och-midnight/50 rounded-lg">
                  <p className="text-och-steel text-sm mb-1">Mentees</p>
                  <p className="text-3xl font-bold text-och-mint">{stats.mentees}</p>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">User Activity (Last 7 Days)</h3>
                  <SimpleBarChart
                    data={[
                      auditStats.today,
                      Math.floor(auditStats.total / 7),
                      Math.floor(auditStats.total / 7),
                      Math.floor(auditStats.total / 7),
                      Math.floor(auditStats.total / 7),
                      Math.floor(auditStats.total / 7),
                      Math.floor(auditStats.total / 7),
                    ]}
                    labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                    color="#33FFC1"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">User Roles Distribution</h3>
                  <SimpleBarChart
                    data={[
                      stats.programDirectors,
                      stats.financeUsers,
                      stats.mentees,
                      users.filter((u) => u.roles?.some((r: any) => r.role === 'mentor')).length,
                    ]}
                    labels={['Directors', 'Finance', 'Mentees', 'Mentors']}
                    color="#0648A8"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Management Panels */}
        <div className="space-y-4">
          {/* Platform Management */}
          <Card>
            <PanelHeader
              id="platform"
              title="Platform Management"
              icon="⚙️"
              badge={apiKeys.length}
            />
            {expandedPanels.has('platform') && (
              <div className="p-6 pt-0 space-y-4 border-t border-och-steel/20 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-och-steel mb-2 uppercase">System Configuration</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        System Settings
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Integration Management
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Subscription Rules
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Payment Gateway Settings
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-och-steel mb-2 uppercase">Security & API</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        API Keys ({apiKeys.length})
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Webhook Management
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Security Policies
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        MFA Configuration
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-och-steel mb-2 uppercase">Content Management</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Curriculum
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Missions
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Tracks
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Programs
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </Card>

          {/* Program Directors Management */}
          <Card>
            <PanelHeader
              id="directors"
              title="Program Directors"
              icon="👔"
              badge={stats.programDirectors}
              badgeColor="defender"
            />
            {expandedPanels.has('directors') && (
              <div className="p-6 pt-0 border-t border-och-steel/20 mt-4">
                <div className="mb-4 flex items-center gap-4">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="all">All Users</option>
                    <option value="program_director">Program Directors Only</option>
                  </select>
                  <Button variant="mint" size="sm">
                    + Add Director
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Roles</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .filter((u) => selectedRoleFilter === 'all' || u.roles?.some((r: any) => r.role === 'program_director'))
                        .map((u) => (
                          <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                            <td className="p-3">
                              <div>
                                <p className="text-white font-semibold">
                                  {u.first_name} {u.last_name}
                                </p>
                                <p className="text-xs text-och-steel">ID: {u.id}</p>
                              </div>
                            </td>
                            <td className="p-3 text-och-steel text-sm">{u.email}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {u.roles?.map((r: any, idx: number) => (
                                  <Badge key={idx} variant="defender" className="text-xs">
                                    {r.role}
                                  </Badge>
          ))}
        </div>
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
                                  onClick={() => setSelectedUser(u)}
                                >
                                  Manage Roles
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* Finance Directors Management */}
          <Card>
            <PanelHeader
              id="finance"
              title="Finance Directors"
              icon="💰"
              badge={stats.financeUsers}
              badgeColor="gold"
            />
            {expandedPanels.has('finance') && (
              <div className="p-6 pt-0 border-t border-och-steel/20 mt-4">
                <div className="mb-4 flex items-center gap-4">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="all">All Users</option>
                    <option value="finance">Finance Only</option>
                  </select>
                  <Button variant="gold" size="sm">
                    + Add Finance User
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-och-gold">$0</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Pending Refunds</p>
                    <p className="text-2xl font-bold text-och-orange">0</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-och-mint">0</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .filter((u) => selectedRoleFilter === 'all' || u.roles?.some((r: any) => r.role === 'finance'))
                        .map((u) => (
                          <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                            <td className="p-3">
                              <p className="text-white font-semibold">
                                {u.first_name} {u.last_name}
                              </p>
                            </td>
                            <td className="p-3 text-och-steel text-sm">{u.email}</td>
                            <td className="p-3">
                              <Badge
                                variant={u.is_active && u.account_status === 'active' ? 'mint' : 'orange'}
                              >
                                {u.account_status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
            </div>
            )}
          </Card>

          {/* Mentees Management */}
          <Card>
            <PanelHeader
              id="mentees"
              title="Mentees & Students"
              icon="🎓"
              badge={stats.mentees}
              badgeColor="mint"
            />
            {expandedPanels.has('mentees') && (
              <div className="p-6 pt-0 border-t border-och-steel/20 mt-4">
                <div className="mb-4 flex items-center gap-4">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                  >
                    <option value="all">All Users</option>
                    <option value="mentee">Mentees Only</option>
                    <option value="student">Students Only</option>
                  </select>
                  <Button variant="mint" size="sm">
                    + Add Mentee
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Cohort</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .filter((u) => 
                          selectedRoleFilter === 'all' || 
                          u.roles?.some((r: any) => r.role === 'mentee' || r.role === 'student')
                        )
                        .slice(0, 20)
                        .map((u) => (
                          <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                            <td className="p-3">
                              <p className="text-white font-semibold">
                                {u.first_name} {u.last_name}
                              </p>
                            </td>
                            <td className="p-3 text-och-steel text-sm">{u.email}</td>
                            <td className="p-3 text-och-steel text-sm">{u.cohort_id || 'N/A'}</td>
                            <td className="p-3">
                              <Badge
                                variant={u.is_active && u.account_status === 'active' ? 'mint' : 'orange'}
                              >
                                {u.account_status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Reset Onboarding
                                </Button>
                                <Button variant="outline" size="sm">
                                  View Profile
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
            </div>
            )}
          </Card>

          {/* Audit & Compliance */}
          <Card>
            <PanelHeader
              id="audit"
              title="Audit Logs & Compliance"
              icon="📋"
              badge={auditStats.total}
              badgeColor="defender"
            />
            {expandedPanels.has('audit') && (
              <div className="p-6 pt-0 border-t border-och-steel/20 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Total Logs</p>
                    <p className="text-2xl font-bold text-white">{auditStats.total}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Success</p>
                    <p className="text-2xl font-bold text-och-mint">{auditStats.success}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Failures</p>
                    <p className="text-2xl font-bold text-och-orange">{auditStats.failure}</p>
                  </div>
                  <div className="p-4 bg-och-midnight/50 rounded-lg">
                    <p className="text-och-steel text-sm mb-1">Today</p>
                    <p className="text-2xl font-bold text-och-defender">{auditStats.today}</p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-och-midnight">
                      <tr className="border-b border-och-steel/20">
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Timestamp</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Action</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Actor</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Resource</th>
                        <th className="text-left p-3 text-och-steel text-sm font-semibold">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 50).map((log) => (
                        <tr key={log.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                          <td className="p-3 text-och-steel text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge variant="steel" className="text-xs">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-3 text-och-steel text-sm">{log.actor_identifier}</td>
                          <td className="p-3 text-och-steel text-sm">
                            {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={log.result === 'success' ? 'mint' : 'orange'}
                              className="text-xs"
                            >
                              {log.result}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
            )}
          </Card>

          {/* Role Management */}
          <Card>
            <PanelHeader
              id="roles"
              title="Role & Policy Management"
              icon="🔐"
              badge={roles.length}
              badgeColor="defender"
            />
            {expandedPanels.has('roles') && (
              <div className="p-6 pt-0 border-t border-och-steel/20 mt-4">
                <div className="mb-4">
                  <Button variant="defender" size="sm">
                    + Create Role
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <div key={role.id} className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{role.display_name}</h4>
                          <p className="text-xs text-och-steel">{role.name}</p>
                        </div>
                        {role.is_system && (
                          <Badge variant="gold" className="text-xs">System</Badge>
                        )}
                      </div>
                      <p className="text-sm text-och-steel mb-3">{role.description}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Permissions
                        </Button>
                      </div>
              </div>
                  ))}
              </div>
              </div>
            )}
          </Card>
        </div>

        {/* User Management Modal */}
        {selectedUser && (
          <UserManagementModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={async () => {
              await refetchUsers()
              setSelectedUser(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
