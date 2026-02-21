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
import { LifeBuoy, UserPlus, X } from 'lucide-react'

export default function AdminSupportUsersPage() {
  const { users, isLoading, refetch } = useUsers({ page: 1, page_size: 500 })
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supportUsers = useMemo(() => {
    return users.filter((u) =>
      u.roles?.some((r: { role?: string }) => (r as { role?: string }).role === 'support')
    )
  }, [users])

  const usersWithoutSupport = useMemo(() => {
    return users.filter(
      (u) => !u.roles?.some((r: { role?: string }) => (r as { role?: string }).role === 'support')
    )
  }, [users])

  const supportRoleId = useMemo(() => {
    const r = roles.find((x) => x.name === 'support')
    return r?.id ?? null
  }, [roles])

  useEffect(() => {
    if (!showAddModal) return
    djangoClient.roles
      .listRoles()
      .then((list) => setRoles(list.map((r: { id: number; name: string }) => ({ id: r.id, name: r.name }))))
      .catch(() => setRoles([]))
  }, [showAddModal])

  const handleAssignSupport = async () => {
    if (!selectedUserId || !supportRoleId) {
      setError('Please select a user')
      return
    }
    setAssigning(true)
    setError(null)
    try {
      await djangoClient.roles.assignRole(selectedUserId, { role_id: supportRoleId, scope: 'global' })
      setShowAddModal(false)
      setSelectedUserId(null)
      await refetch()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to assign role'
      setError(msg)
    } finally {
      setAssigning(false)
    }
  }

  const handleRevokeSupport = async (userId: number, userRoleId: number) => {
    if (!confirm('Remove Support role from this user?')) return
    try {
      await djangoClient.roles.revokeRole(userId, userRoleId)
      await refetch()
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to revoke')
    }
  }

  if (isLoading) {
    return (
      <RouteGuard requiredRoles={['admin']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[300px] text-och-steel">Loading...</div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRoles={['admin']}>
      <AdminLayout>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-7 h-7 text-och-defender" aria-hidden />
                Support users
              </h1>
              <p className="text-och-steel text-sm mt-1">
                Internal support role. Typically added by Program Directors; admins can also assign or revoke.
              </p>
            </div>
            <Button variant="defender" size="sm" onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" aria-hidden />
              Add support user
            </Button>
          </div>

          <Card className="bg-och-midnight border border-och-steel/20">
            <div className="p-6 overflow-x-auto">
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
                  {supportUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-och-steel">
                        No support users. Add one or ask a Program Director to add from Director → Support Team.
                      </td>
                    </tr>
                  ) : (
                    supportUsers.map((u) => {
                      const supportRole = u.roles?.find((r: { role?: string }) => (r as { role?: string }).role === 'support') as { id?: number; user_role_id?: number } | undefined
                      const userRoleId = supportRole?.id ?? supportRole?.user_role_id
                      return (
                        <tr key={u.id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                          <td className="p-3 text-white font-medium">
                            {u.first_name} {u.last_name}
                          </td>
                          <td className="p-3 text-och-steel text-sm">{u.email}</td>
                          <td className="p-3">
                            <Badge variant={u.is_active ? 'mint' : 'steel'}>{u.account_status}</Badge>
                          </td>
                          <td className="p-3">
                            {userRoleId != null && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeSupport(u.id!, userRoleId as number)}
                              >
                                Revoke support
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4 border-och-steel/30">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Add support user</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedUserId(null)
                        setError(null)
                      }}
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" aria-hidden />
                    </Button>
                  </div>
                  {error && (
                    <div className="mb-4 p-3 bg-och-orange/20 border border-och-orange/50 rounded-lg text-och-orange text-sm">
                      {error}
                    </div>
                  )}
                  <label className="block text-sm font-medium text-white mb-2">Select user</label>
                  {usersWithoutSupport.length === 0 ? (
                    <p className="text-och-steel text-sm py-4">No users available to add as support.</p>
                  ) : (
                    <select
                      value={selectedUserId ?? ''}
                      onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                      aria-label="Select user"
                    >
                      <option value="">Select user...</option>
                      {usersWithoutSupport.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-och-steel/20">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedUserId(null)
                        setError(null)
                      }}
                      disabled={assigning}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="defender"
                      onClick={handleAssignSupport}
                      disabled={assigning || !selectedUserId || !supportRoleId || usersWithoutSupport.length === 0}
                    >
                      {assigning ? 'Adding...' : 'Add support role'}
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
