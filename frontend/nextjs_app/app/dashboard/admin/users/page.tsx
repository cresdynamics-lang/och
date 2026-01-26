'use client'

import { useState, useMemo, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsers } from '@/hooks/useUsers'
import { UserManagementModal } from '@/components/admin/UserManagementModal'
import { apiGateway } from '@/services/apiGateway'
// Icon components (simple SVG icons)
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const UsersIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className || "w-8 h-8"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const RefreshIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ITEMS_PER_PAGE = 20

export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      page_size: ITEMS_PER_PAGE,
    }
    
    if (selectedRoleFilter !== 'all') {
      params.role = selectedRoleFilter
    }
    
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim()
    }
    
    return params
  }, [currentPage, selectedRoleFilter, debouncedSearch])

  const { users, totalCount, isLoading, error, refetch } = useUsers(queryParams)

  // Calculate pagination
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Apply client-side status filter (since backend doesn't support it directly)
  const filteredUsers = useMemo(() => {
    if (statusFilter === 'all') return users
    return users.filter((u) => {
      if (statusFilter === 'active') {
        return u.is_active && u.account_status === 'active'
      }
      if (statusFilter === 'inactive') {
        return !u.is_active || u.account_status !== 'active'
      }
      return u.account_status === statusFilter
    })
  }, [users, statusFilter])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    setSelectedUserIds(new Set()) // Clear selection when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (filterType: 'role' | 'status', value: string) => {
    if (filterType === 'role') {
      setSelectedRoleFilter(value)
    } else {
      setStatusFilter(value)
    }
    setCurrentPage(1) // Reset to first page on filter change
    setSelectedUserIds(new Set()) // Clear selection when filters change
  }

  const handleClearFilters = () => {
    setSelectedRoleFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
    setDebouncedSearch('')
    setCurrentPage(1)
    setSelectedUserIds(new Set()) // Clear selection when filters are cleared
  }

  const handleUserUpdate = async () => {
    setSelectedUser(null)
    await refetch()
  }

  // Multi-select handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => String(u.id))))
    }
  }

  const handleClearSelection = () => {
    setSelectedUserIds(new Set())
  }

  // Bulk actions
  const handleBulkAssignRole = async (roleId: number, roleName: string) => {
    if (selectedUserIds.size === 0) return

    if (!confirm(`Assign role "${roleName}" to ${selectedUserIds.size} selected user(s)?`)) {
      return
    }

    setBulkActionLoading(true)
    try {
      const userIds = Array.from(selectedUserIds)
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          apiGateway.post(`/users/${userId}/roles`, {
            role_id: roleId,
            scope: 'global',
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        alert(`Failed to assign role to ${failed.length} user(s). ${userIds.length - failed.length} succeeded.`)
      } else {
        alert(`Successfully assigned role "${roleName}" to ${userIds.length} user(s)`)
      }

      handleClearSelection()
      await refetch()
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to assign roles'}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedUserIds.size === 0) return

    if (!confirm(`Update status to "${status}" for ${selectedUserIds.size} selected user(s)?`)) {
      return
    }

    setBulkActionLoading(true)
    try {
      const userIds = Array.from(selectedUserIds)
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          apiGateway.patch(`/users/${userId}/`, {
            account_status: status,
            is_active: status === 'active',
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        alert(`Failed to update status for ${failed.length} user(s). ${userIds.length - failed.length} succeeded.`)
      } else {
        alert(`Successfully updated status to "${status}" for ${userIds.length} user(s)`)
      }

      handleClearSelection()
      await refetch()
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to update statuses'}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return

    const confirmMessage = `⚠️ WARNING: This will permanently delete ${selectedUserIds.size} user(s).\n\nThis action cannot be undone. Are you absolutely sure?`
    if (!confirm(confirmMessage)) {
      return
    }

    // Double confirmation for destructive action
    const doubleConfirm = prompt(`Type "DELETE" to confirm deletion of ${selectedUserIds.size} user(s):`)
    if (doubleConfirm !== 'DELETE') {
      return
    }

    setBulkActionLoading(true)
    try {
      const userIds = Array.from(selectedUserIds)
      const results = await Promise.allSettled(
        userIds.map((userId) => apiGateway.delete(`/users/${userId}/`))
      )

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        alert(`Failed to delete ${failed.length} user(s). ${userIds.length - failed.length} deleted successfully.`)
      } else {
        alert(`Successfully deleted ${userIds.length} user(s)`)
      }

      handleClearSelection()
      await refetch()
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to delete users'}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkActivate = async () => {
    if (selectedUserIds.size === 0) return

    if (!confirm(`Activate ${selectedUserIds.size} selected user(s)?`)) {
      return
    }

    setBulkActionLoading(true)
    try {
      const userIds = Array.from(selectedUserIds)
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          apiGateway.patch(`/users/${userId}/`, {
            account_status: 'active',
            is_active: true,
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        alert(`Failed to activate ${failed.length} user(s). ${userIds.length - failed.length} activated successfully.`)
      } else {
        alert(`Successfully activated ${userIds.length} user(s)`)
      }

      handleClearSelection()
      await refetch()
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to activate users'}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.size === 0) return

    if (!confirm(`Deactivate ${selectedUserIds.size} selected user(s)?`)) {
      return
    }

    setBulkActionLoading(true)
    try {
      const userIds = Array.from(selectedUserIds)
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          apiGateway.patch(`/users/${userId}/`, {
            account_status: 'deactivated',
            is_active: false,
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        alert(`Failed to deactivate ${failed.length} user(s). ${userIds.length - failed.length} deactivated successfully.`)
      } else {
        alert(`Successfully deactivated ${userIds.length} user(s)`)
      }

      handleClearSelection()
      await refetch()
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to deactivate users'}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkErase = async () => {
    if (selectedUserIds.size === 0) return

    const confirmMessage = `⚠️ WARNING: This will erase all personal data for ${selectedUserIds.size} user(s) (GDPR compliance).\n\nUser accounts will be anonymized. This action cannot be undone. Continue?`
    if (!confirm(confirmMessage)) {
      return
    }

    // Double confirmation for GDPR erasure
    const doubleConfirm = prompt(`Type "ERASE" to confirm data erasure for ${selectedUserIds.size} user(s):`)
    if (doubleConfirm !== 'ERASE') {
      return
    }

    setBulkActionLoading(true)
    try {
      const userIds = Array.from(selectedUserIds)
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          apiGateway.patch(`/users/${userId}/`, {
            account_status: 'erased',
            is_active: false,
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        alert(`Failed to erase ${failed.length} user(s). ${userIds.length - failed.length} erased successfully.`)
      } else {
        alert(`Successfully erased data for ${userIds.length} user(s)`)
      }

      handleClearSelection()
      await refetch()
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to erase user data'}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Load roles for bulk assignment
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: number; name: string; display_name: string }>>([])
  
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await apiGateway.get<any>('/roles/')
        const rolesArray = data?.results ? data.results : (data ? (Array.isArray(data) ? data : []) : [])
        setAvailableRoles(rolesArray)
      } catch (error) {
        console.error('Failed to load roles:', error)
      }
    }
    loadRoles()
  }, [])

  const activeFiltersCount = [
    selectedRoleFilter !== 'all',
    statusFilter !== 'all',
    debouncedSearch.trim() !== '',
  ].filter(Boolean).length

  if (error) {
    return (
      <RouteGuard>
        <AdminLayout>
          <div className="max-w-7xl mx-auto">
            <Card>
              <div className="p-6 text-center">
                <p className="text-red-400 mb-4">Error: {error}</p>
                <Button onClick={() => refetch()} variant="defender">
                  <RefreshIcon className="mr-2" />
                  Retry
                </Button>
            </div>
            </Card>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-gold flex items-center gap-3">
                  <UsersIcon className="w-8 h-8" />
                  User Management
                </h1>
            <p className="text-och-steel">Manage all platform users and their roles</p>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
                <RefreshIcon className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Card */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <FilterIcon />
                <h2 className="text-lg font-semibold text-white">Filters</h2>
                {activeFiltersCount > 0 && (
                  <Badge variant="defender" className="ml-auto">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-och-steel">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-mint"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="program_director">Program Directors</option>
                  <option value="mentor">Mentors</option>
                  <option value="student">Students</option>
                  <option value="mentee">Mentees</option>
                  <option value="analyst">Analysts</option>
                  <option value="finance">Finance</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="sponsor_admin">Sponsor Admin</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4">
                  <Button onClick={handleClearFilters} variant="outline" size="sm">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Users Table Card */}
          <Card>
            <div className="p-6">
              {/* Table Header with Stats */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-och-steel">
                    Showing <span className="text-white font-semibold">{filteredUsers.length}</span> of{' '}
                    <span className="text-white font-semibold">{totalCount || 0}</span> users
                  </p>
                  {debouncedSearch && (
                    <p className="text-xs text-och-steel mt-1">
                      Search: "{debouncedSearch}"
                    </p>
                  )}
                </div>
              </div>

              {isLoading && filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-mint mx-auto mb-4"></div>
                    <p className="text-och-steel">Loading users...</p>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 text-och-steel/50 mx-auto mb-4">
                    <UsersIcon />
                  </div>
                  <p className="text-och-steel text-lg mb-2">No users found</p>
                  <p className="text-och-steel text-sm">
                    {activeFiltersCount > 0
                      ? 'Try adjusting your filters or search query'
                      : 'No users are registered on the platform yet'}
                  </p>
                  {activeFiltersCount > 0 && (
                    <Button onClick={handleClearFilters} variant="outline" className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Bulk Actions Bar */}
                  {selectedUserIds.size > 0 && (
                    <div className="mb-4 p-4 bg-och-mint/10 border border-och-mint/30 rounded-lg">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="mint" className="text-sm">
                            {selectedUserIds.size} selected
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearSelection}
                            disabled={bulkActionLoading}
                          >
                            Clear Selection
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-och-steel">Bulk Actions:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                const value = e.target.value
                                if (value.startsWith('role:')) {
                                  const roleId = parseInt(value.split(':')[1])
                                  const role = availableRoles.find(r => r.id === roleId)
                                  if (role) {
                                    handleBulkAssignRole(role.id, role.display_name)
                                  }
                                } else if (value.startsWith('status:')) {
                                  handleBulkUpdateStatus(value.split(':')[1])
                                } else if (value === 'activate') {
                                  handleBulkActivate()
                                } else if (value === 'deactivate') {
                                  handleBulkDeactivate()
                                } else if (value === 'delete') {
                                  handleBulkDelete()
                                } else if (value === 'erase') {
                                  handleBulkErase()
                                }
                                e.target.value = ''
                              }
                            }}
                            disabled={bulkActionLoading}
                            className="px-3 py-1.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint"
                          >
                            <option value="">Choose action...</option>
                            <optgroup label="Assign Role">
                              {availableRoles.map((role) => (
                                <option key={role.id} value={`role:${role.id}`}>
                                  Assign {role.display_name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Account Management">
                              <option value="activate">Activate Users</option>
                              <option value="deactivate">Deactivate Users</option>
                              <option value="status:active">Set Active Status</option>
                              <option value="status:inactive">Set Inactive Status</option>
                              <option value="status:pending">Set Pending Status</option>
                              <option value="status:suspended">Set Suspended Status</option>
                            </optgroup>
                            <optgroup label="⚠️ Dangerous Actions">
                              <option value="erase">Erase User Data (GDPR)</option>
                              <option value="delete">Delete Users Permanently</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                          <th className="text-left p-3 text-och-steel text-sm font-semibold w-12">
                            <input
                              type="checkbox"
                              checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-och-steel/30 bg-och-midnight/50 text-och-mint focus:ring-och-mint focus:ring-2 cursor-pointer"
                            />
                          </th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">User</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Email</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Roles</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Status</th>
                      <th className="text-left p-3 text-och-steel text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                          <tr
                            key={u.id}
                            className={`border-b border-och-steel/10 hover:bg-och-midnight/50 transition-colors ${
                              selectedUserIds.has(String(u.id)) ? 'bg-och-mint/5' : ''
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(String(u.id))}
                                onChange={() => handleSelectUser(String(u.id))}
                                className="w-4 h-4 rounded border-och-steel/30 bg-och-midnight/50 text-och-mint focus:ring-och-mint focus:ring-2 cursor-pointer"
                              />
                            </td>
                        <td className="p-3">
                          <div>
                            <p className="text-white font-semibold">
                              {u.first_name} {u.last_name}
                            </p>
                                <p className="text-xs text-och-steel">@{u.username || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-3 text-och-steel text-sm">{u.email}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                                {u.roles && u.roles.length > 0 ? (
                                  u.roles.map((r: any, idx: number) => (
                              <Badge key={idx} variant="defender" className="text-xs">
                                {r.role}
                              </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-och-steel">No roles</span>
                                )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                                variant={
                                  u.is_active && u.account_status === 'active'
                                    ? 'mint'
                                    : u.account_status === 'suspended'
                                    ? 'orange'
                                    : 'steel'
                                }
                          >
                                {u.account_status || (u.is_active ? 'active' : 'inactive')}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                          >
                            Manage Roles
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-och-steel">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!hasPrevPage || isLoading}
                        >
                          <span className="mr-1"><ChevronLeftIcon /></span>
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'defender' : 'outline'}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isLoading}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!hasNextPage || isLoading}
                        >
                          Next
                          <span className="ml-1"><ChevronRightIcon /></span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* User Management Modal */}
          {selectedUser && (
            <UserManagementModal
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onUpdate={handleUserUpdate}
            />
          )}
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}
