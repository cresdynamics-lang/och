'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'
import { UserManagementModal } from '@/components/admin/UserManagementModal'
import { djangoClient } from '@/services/djangoClient'
import { apiGateway } from '@/services/apiGateway'
import { auditClient, type AuditLog } from '@/services/auditClient'
import type { User } from '@/services/types'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
}

export default function DirectorsPage() {
  const [directors, setDirectors] = useState<any[]>([])
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignUserEmail, setAssignUserEmail] = useState('')
  const [assignRoleId, setAssignRoleId] = useState<number | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all')
  const [selectedDirectorForLogs, setSelectedDirectorForLogs] = useState<User | null>(null)
  const [directorLogs, setDirectorLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilters, setLogFilters] = useState({
    range: 'month' as 'today' | 'week' | 'month' | 'year' | undefined,
    action: '' as string,
    resource_type: '' as string,
  })

  // Fetch program directors using role filter
  const { users: allUsers, isLoading: usersLoading, refetch: refetchUsers } = useUsers({
    page: 1,
    page_size: 100,
    role: 'program_director',
    search: searchQuery || undefined,
  })

  useEffect(() => {
    loadDirectors()
    loadRoles()
    loadPendingUsers()
  }, [allUsers, searchQuery])

  const loadDirectors = async () => {
    try {
      setIsLoading(true)
      // Filter directors from the fetched users
      const directorsList = allUsers.filter((u) =>
        u.roles?.some((r: any) => r.role === 'program_director')
      )
      setDirectors(directorsList)
    } catch (error) {
      console.error('Error loading directors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
      
      // Set default role to program_director if available
      const programDirectorRole = rolesArray.find(r => r.name === 'program_director')
      if (programDirectorRole) {
        setAssignRoleId(programDirectorRole.id)
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const loadPendingUsers = async () => {
    try {
      // Fetch users with pending_verification status
      const response = await djangoClient.users.listUsers({
        page: 1,
        page_size: 50,
      })
      const pending = (response.results || []).filter(
        (u: any) => u.account_status === 'pending_verification'
      )
      setPendingUsers(pending)
    } catch (error) {
      console.error('Error loading pending users:', error)
    }
  }

  const handleAssignRole = async () => {
    if (!assignUserEmail || !assignRoleId) {
      alert('Please select a user and role')
      return
    }

    setIsAssigning(true)
    try {
      // First, find the user by email
      const searchResponse = await djangoClient.users.listUsers({
        search: assignUserEmail,
        page: 1,
        page_size: 10,
      })
      
      const user = searchResponse.results?.find(
        (u: any) => u.email.toLowerCase() === assignUserEmail.toLowerCase()
      )

      if (!user) {
        alert('User not found. Please check the email address.')
        return
      }

      // Check if user already has the role
      const hasRole = user.roles?.some((r: any) => {
        const role = roles.find(ro => ro.id === assignRoleId)
        return role && (r.role === role.name || r.role_id === role.id)
      })

      if (hasRole) {
        alert('User already has this role assigned')
        return
      }

      // Assign the role
      await djangoClient.roles.assignRole(user.id, {
        role_id: assignRoleId,
        scope: 'global',
      })

      alert('Role assigned successfully!')
      setShowAssignModal(false)
      setAssignUserEmail('')
      await refetchUsers()
      await loadDirectors()
    } catch (error: any) {
      console.error('Error assigning role:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to assign role'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleApproveUser = async (user: any) => {
    if (!confirm(`Approve ${user.email} and activate their account?`)) {
      return
    }

    try {
      // Update user account status to active
      await djangoClient.users.updateUser(user.id, {
        account_status: 'active',
        is_active: true,
        email_verified: true,
      })

      alert('User approved and activated successfully!')
      await loadPendingUsers()
      await refetchUsers()
    } catch (error: any) {
      console.error('Error approving user:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve user'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleApproveAndAssign = async (user: any) => {
    if (!confirm(`Approve ${user.email}, activate their account, and assign Program Director role?`)) {
      return
    }

    try {
      // First approve the user
      await djangoClient.users.updateUser(user.id, {
        account_status: 'active',
        is_active: true,
        email_verified: true,
      })

      // Then assign program_director role
      const programDirectorRole = roles.find(r => r.name === 'program_director')
      if (programDirectorRole) {
        await djangoClient.roles.assignRole(user.id, {
          role_id: programDirectorRole.id,
          scope: 'global',
        })
      }

      alert('User approved and Program Director role assigned successfully!')
      await loadPendingUsers()
      await refetchUsers()
      await loadDirectors()
    } catch (error: any) {
      console.error('Error approving and assigning role:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve user'
      alert(`Error: ${errorMessage}`)
    }
  }

  const filteredDirectors = useMemo(() => {
    let filtered = directors

    if (filterStatus === 'active') {
      filtered = filtered.filter(u => u.is_active && u.account_status === 'active')
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(u => u.account_status === 'pending_verification')
    }

    return filtered
  }, [directors, filterStatus])

  const loadDirectorLogs = async (director: User) => {
    if (!director.email) return

    setLogsLoading(true)
    try {
      // Filter for critical director actions
      const criticalResourceTypes = [
        'program',
        'cohort',
        'track',
        'milestone',
        'module',
        'enrollment',
        'mentor_assignment',
        'mission',
        'user',
        'role',
      ]

      const logs = await auditClient.getAuditLogs({
        user_id: director.id,
        resource_types: criticalResourceTypes.join(','),
        range: logFilters.range,
        action: logFilters.action || undefined,
        resource_type: logFilters.resource_type || undefined,
      })

      // Filter for critical actions only (create, update, delete, role_assigned, role_revoked)
      const criticalActions = ['create', 'update', 'delete', 'role_assigned', 'role_revoked']
      const filteredLogs = logs.filter((log) => criticalActions.includes(log.action))

      setDirectorLogs(filteredLogs)
    } catch (error: any) {
      console.error('Error loading director logs:', error)
      alert(error.message || 'Failed to load activity logs')
      setDirectorLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const handleViewLogs = (director: User) => {
    setSelectedDirectorForLogs(director)
    loadDirectorLogs(director)
  }

  useEffect(() => {
    if (selectedDirectorForLogs) {
      loadDirectorLogs(selectedDirectorForLogs)
    }
  }, [logFilters, selectedDirectorForLogs])

  const getActionBadgeVariant = (action: string) => {
    if (action === 'create') return 'mint'
    if (action === 'update') return 'defender'
    if (action === 'delete') return 'orange'
    if (action === 'role_assigned' || action === 'role_revoked') return 'defender'
    return 'steel'
  }

  const getResourceTypeLabel = (resourceType: string) => {
    const labels: Record<string, string> = {
      program: 'Program',
      cohort: 'Cohort',
      track: 'Track',
      enrollment: 'Enrollment',
      mentor_assignment: 'Mentor Assignment',
      mission: 'Mission',
      user: 'User',
      role: 'Role',
      milestone: 'Milestone',
      module: 'Module',
    }
    return labels[resourceType] || resourceType
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      role_assigned: 'Role Assigned',
      role_revoked: 'Role Revoked',
    }
    return labels[action] || action
  }

  const programDirectorRole = roles.find(r => r.name === 'program_director')

  if (isLoading || usersLoading) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
              <p className="text-och-steel">Loading directors...</p>
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
              <h1 className="text-4xl font-bold mb-2 text-och-gold">Program Directors</h1>
              <p className="text-och-steel">Manage program directors and their assignments</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchUsers()}
              >
                Refresh
              </Button>
              <Button
                variant="defender"
                size="sm"
                onClick={() => setShowAssignModal(true)}
              >
                + Assign Director Role
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <div className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Pending Applications Section */}
          {pendingUsers.length > 0 && (
            <Card className="mb-6">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Pending Applications</h2>
                <p className="text-och-steel mb-4">
                  Users waiting for approval. You can approve them and optionally assign the Program Director role.
                </p>
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-och-midnight/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-semibold">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-och-steel">{user.email}</p>
                        <p className="text-xs text-och-steel mt-1">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveUser(user)}
                        >
                          Approve Only
                        </Button>
                        <Button
                          variant="defender"
                          size="sm"
                          onClick={() => handleApproveAndAssign(user)}
                        >
                          Approve & Assign Director
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Directors List */}
          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Program Directors ({filteredDirectors.length})
                </h2>
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
                    {filteredDirectors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-och-steel">
                          {searchQuery
                            ? 'No directors found matching your search'
                            : 'No program directors found'}
                        </td>
                      </tr>
                    ) : (
                      filteredDirectors.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-och-steel/10 hover:bg-och-midnight/50"
                        >
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
                                <Badge
                                  key={idx}
                                  variant={
                                    r.role === 'program_director' ? 'defender' : 'steel'
                                  }
                                  className="text-xs"
                                >
                                  {r.role_display_name || r.role}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                u.is_active && u.account_status === 'active'
                                  ? 'mint'
                                  : u.account_status === 'pending_verification'
                                  ? 'orange'
                                  : 'steel'
                              }
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
                              <Button
                                variant="defender"
                                size="sm"
                                onClick={() => handleViewLogs(u)}
                              >
                                View Activity
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Assign Role Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="w-full max-w-md m-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Assign Program Director Role</h2>
                    <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        User Email <span className="text-och-orange">*</span>
                      </label>
                      <input
                        type="email"
                        value={assignUserEmail}
                        onChange={(e) => setAssignUserEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      />
                      <p className="text-xs text-och-steel mt-1">
                        Enter the email address of the user to assign the role
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-1">
                        Role <span className="text-och-orange">*</span>
                      </label>
                      <select
                        value={assignRoleId || ''}
                        onChange={(e) => setAssignRoleId(Number(e.target.value) || null)}
                        className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                      >
                        <option value="">Select a role...</option>
                        {roles
                          .filter((r) => r.name === 'program_director')
                          .map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.display_name} - {role.description}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAssignModal(false)}
                        className="flex-1"
                        disabled={isAssigning}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="defender"
                        onClick={handleAssignRole}
                        className="flex-1"
                        disabled={!assignUserEmail || !assignRoleId || isAssigning}
                        glow
                      >
                        {isAssigning ? 'Assigning...' : 'Assign Role'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* User Management Modal */}
          {selectedUser && (
            <UserManagementModal
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdate={async () => {
                setSelectedUser(null)
                await refetchUsers()
                await loadDirectors()
              }}
            />
          )}

          {/* Director Activity Logs Modal */}
          {selectedDirectorForLogs && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Activity Logs - {selectedDirectorForLogs.first_name}{' '}
                        {selectedDirectorForLogs.last_name}
                      </h2>
                      <p className="text-och-steel text-sm">{selectedDirectorForLogs.email}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedDirectorForLogs(null)}>
                      ✕
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-4">
                    <select
                      value={logFilters.range || ''}
                      onChange={(e) =>
                        setLogFilters({ ...logFilters, range: e.target.value as any })
                      }
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                    >
                      <option value="">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="year">Last Year</option>
                    </select>

                    <select
                      value={logFilters.action}
                      onChange={(e) => setLogFilters({ ...logFilters, action: e.target.value })}
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                    >
                      <option value="">All Actions</option>
                      <option value="create">Create</option>
                      <option value="update">Update</option>
                      <option value="delete">Delete</option>
                      <option value="role_assigned">Role Assigned</option>
                      <option value="role_revoked">Role Revoked</option>
                    </select>

                    <select
                      value={logFilters.resource_type}
                      onChange={(e) =>
                        setLogFilters({ ...logFilters, resource_type: e.target.value })
                      }
                      className="px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                    >
                      <option value="">All Resources</option>
                      <option value="program">Programs</option>
                      <option value="cohort">Cohorts</option>
                      <option value="track">Tracks</option>
                      <option value="enrollment">Enrollments</option>
                      <option value="mentor_assignment">Mentor Assignments</option>
                      <option value="mission">Missions</option>
                      <option value="user">Users</option>
                      <option value="role">Roles</option>
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadDirectorLogs(selectedDirectorForLogs)}
                      disabled={logsLoading}
                    >
                      {logsLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                {/* Logs List */}
                <div className="flex-1 overflow-y-auto p-6">
                  {logsLoading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-mint mx-auto mb-2"></div>
                        <p className="text-och-steel">Loading logs...</p>
                      </div>
                    </div>
                  ) : directorLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-och-steel">No activity logs found for this director</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {directorLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20 hover:border-och-defender/40 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge variant={getActionBadgeVariant(log.action)}>
                                {getActionLabel(log.action)}
                              </Badge>
                              <Badge variant="steel">
                                {getResourceTypeLabel(log.resource_type)}
                              </Badge>
                              {log.result === 'failure' && (
                                <Badge variant="orange">Failed</Badge>
                              )}
                            </div>
                            <span className="text-xs text-och-steel">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            {log.resource_id && (
                              <p className="text-sm text-och-steel">
                                Resource ID: <span className="text-white">{log.resource_id}</span>
                              </p>
                            )}

                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <div className="mt-2 p-3 bg-och-midnight rounded text-xs">
                                <p className="text-och-steel mb-1 font-semibold">Changes:</p>
                                {Object.entries(log.changes).map(([field, change]: [string, any]) => (
                                  <div key={field} className="mb-1">
                                    <span className="text-och-mint">{field}:</span>{' '}
                                    <span className="text-och-steel">
                                      {JSON.stringify(change.old)} →{' '}
                                    </span>
                                    <span className="text-och-mint">
                                      {JSON.stringify(change.new)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="mt-2 p-3 bg-och-midnight rounded text-xs">
                                <p className="text-och-steel mb-1 font-semibold">Metadata:</p>
                                <pre className="text-och-steel whitespace-pre-wrap">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.ip_address && (
                              <p className="text-xs text-och-steel mt-1">
                                IP: {log.ip_address}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-och-steel/20 bg-och-midnight/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-och-steel">
                      Showing {directorLogs.length} critical action{directorLogs.length !== 1 ? 's' : ''}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDirectorForLogs(null)}
                    >
                      Close
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
