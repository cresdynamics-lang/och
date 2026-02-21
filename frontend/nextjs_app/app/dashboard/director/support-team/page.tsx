'use client'

import { useState, useMemo, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { djangoClient } from '@/services/djangoClient'
import type { User } from '@/services/types'
import { LifeBuoy, UserPlus, X } from 'lucide-react'

export default function DirectorSupportTeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supportRoleId = useMemo(() => {
    const r = roles.find((x) => x.name === 'support')
    return r?.id ?? null
  }, [roles])

  const supportUsers = useMemo(() => {
    return users.filter((u) =>
      u.roles?.some((r: { role?: string }) => (r as { role?: string }).role === 'support')
    )
  }, [users])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      djangoClient.users.listUsers({ page: 1, page_size: 500 }),
      djangoClient.roles.listRoles(),
    ])
      .then(([usersRes, rolesList]) => {
        if (cancelled) return
        setUsers(usersRes.results ?? [])
        setAllUsers(usersRes.results ?? [])
        setRoles(rolesList.map((r: { id: number; name: string }) => ({ id: r.id, name: r.name })))
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const usersWithoutSupport = useMemo(() => {
    return allUsers.filter(
      (u) => !u.roles?.some((r: { role?: string }) => (r as { role?: string }).role === 'support')
    )
  }, [allUsers])

  const handleAssignSupport = async () => {
    if (!selectedUserId || !supportRoleId) {
      setError('Please select a user')
      return
    }
    setAssigning(true)
    setError(null)
    try {
      await djangoClient.roles.assignRole(selectedUserId, {
        role_id: supportRoleId,
        scope: 'global',
      })
      const updated = await djangoClient.users.listUsers({ page: 1, page_size: 500 })
      setUsers(updated.results ?? [])
      setAllUsers(updated.results ?? [])
      setShowAddModal(false)
      setSelectedUserId(null)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to assign role'
      setError(msg)
    } finally {
      setAssigning(false)
    }
  }

  const handleRevokeSupport = async (userId: number, userRoleId: number) => {
    if (!confirm('Remove this user from the Support team?')) return
    try {
      await djangoClient.roles.revokeRole(userId, userRoleId)
      const updated = await djangoClient.users.listUsers({ page: 1, page_size: 500 })
      setUsers(updated.results ?? [])
      setAllUsers(updated.results ?? [])
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to revoke role')
    }
  }

  if (loading) {
    return (
      <RouteGuard requiredRoles={['program_director', 'admin']}>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[200px] text-och-steel">Loading...</div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-7 h-7 text-och-defender" aria-hidden />
                Support Team
              </h1>
              <p className="text-och-steel text-sm mt-1">
                Add or remove internal support users. Support staff can access the Support dashboard (tickets and problem codes).
              </p>
            </div>
            <Button variant="defender" size="sm" onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" aria-hidden />
              Add support user
            </Button>
          </div>

          {error && !showAddModal && (
            <div className="mb-4 p-3 bg-och-orange/10 border border-och-orange/30 rounded-lg text-och-orange text-sm">
              {error}
            </div>
          )}

          <Card className="bg-och-midnight border border-och-steel/20">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Support users</h2>
              {supportUsers.length === 0 ? (
                <p className="text-och-steel text-sm">No support users yet. Add one above.</p>
              ) : (
                <ul className="space-y-3">
                  {supportUsers.map((u) => {
                    const supportRole = u.roles?.find((r: { role?: string }) => (r as { role?: string }).role === 'support') as { id?: number; user_role_id?: number } | undefined
                    const userRoleId = supportRole?.id ?? supportRole?.user_role_id
                    return (
                      <li
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-och-midnight/80 border border-och-steel/10"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {u.first_name} {u.last_name}
                          </p>
                          <p className="text-och-steel text-sm">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="defender">Support</Badge>
                          {userRoleId != null && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeSupport(u.id!, userRoleId as number)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>

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
                <label className="block text-sm font-medium text-white mb-2">
                  Select a user to grant the Support role
                </label>
                {usersWithoutSupport.length === 0 ? (
                  <p className="text-och-steel text-sm py-4">
                    All users already have the Support role, or no users found.
                  </p>
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
      </DirectorLayout>
    </RouteGuard>
  )
}
