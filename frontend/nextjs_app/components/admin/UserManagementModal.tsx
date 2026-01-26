'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import type { User } from '@/services/types'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
}

interface UserManagementModalProps {
  user: User | null
  onClose: () => void
  onUpdate: () => void
}

export function UserManagementModal({ user, onClose, onUpdate }: UserManagementModalProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadRoles()
      // Load fresh user data to ensure we have role IDs
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    try {
      const updatedUser = await apiGateway.get(`/users/${user.id}`) as { roles?: string[] }
      setUserRoles(updatedUser.roles || [])
    } catch (error) {
      console.error('Failed to load user data:', error)
      // Fallback to user.roles if API call fails
      setUserRoles(user.roles || [])
    }
  }

  const loadRoles = async () => {
    try {
      const data = await apiGateway.get<Role[] | { results: Role[] }>('/roles/')
      const rolesArray = Array.isArray(data) ? data : (data?.results || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleAssignRole = async () => {
    if (!user || !selectedRole) return

    setIsLoading(true)
    try {
      const response = await apiGateway.post(`/users/${user.id}/roles`, {
        role_id: selectedRole,
        scope: 'global',
      }) as { detail?: string }
      
      // Reload user data to get updated roles with IDs
      const updatedUser = await apiGateway.get(`/users/${user.id}`) as { roles?: string[] }
      setUserRoles(updatedUser.roles || [])
      setSelectedRole(null)
      
      // Show appropriate message
      if (response.detail) {
        if (response.detail.includes('already assigned')) {
          // Role already exists - just refresh UI silently
          console.log('Role already assigned to user')
        } else {
          alert('Role assigned successfully')
        }
      } else {
        alert('Role assigned successfully')
      }
      
      // Call onUpdate to refresh parent component
      await onUpdate()
    } catch (error: any) {
      console.error('Role assignment error:', error)
      let errorMessage = 'Unknown error'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      alert(`Failed to assign role: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeRole = async (userRoleId: number | string) => {
    if (!user) return

    if (!confirm('Are you sure you want to revoke this role?')) return

    setIsLoading(true)
    try {
      await apiGateway.delete(`/users/${user.id}/roles/${userRoleId}`)
      
      // Reload user data to get updated roles
      const updatedUser = await apiGateway.get(`/users/${user.id}`) as { roles?: string[] }
      setUserRoles(updatedUser.roles || [])
      
      alert('Role revoked successfully')
      
      // Call onUpdate to refresh parent component
      await onUpdate()
    } catch (error: any) {
      console.error('Role revocation error:', error)
      let errorMessage = 'Unknown error'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      alert(`Failed to revoke role: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Manage User</h2>
              <p className="text-och-steel">{user.email}</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-och-midnight/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-och-steel mb-1">Name</p>
                <p className="text-white">
                  {user.first_name} {user.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-och-steel mb-1">Status</p>
                <Badge
                  variant={user.is_active && user.account_status === 'active' ? 'mint' : 'orange'}
                >
                  {user.account_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-och-steel mb-1">Email Verified</p>
                <Badge variant={user.email_verified ? 'mint' : 'orange'}>
                  {user.email_verified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-och-steel mb-1">MFA Enabled</p>
                <Badge variant={user.mfa_enabled ? 'mint' : 'defender'}>
                  {user.mfa_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Current Roles */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Current Roles</h3>
            {userRoles.length === 0 ? (
              <p className="text-och-steel">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {userRoles.map((role: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-och-midnight/50 rounded-lg"
                  >
                    <div>
                      <Badge variant="defender">{role.role}</Badge>
                      {role.scope && (
                        <span className="text-xs text-och-steel ml-2">Scope: {role.scope}</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeRole(role.id)}
                      disabled={isLoading || !role.id}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Role */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Assign New Role</h3>
            <div className="flex gap-2">
              <select
                value={selectedRole || ''}
                onChange={(e) => setSelectedRole(Number(e.target.value) || null)}
                className="flex-1 px-4 py-2.5 bg-och-midnight/80 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender focus:ring-1 focus:ring-och-defender cursor-pointer transition-all"
              >
                <option value="" className="bg-och-midnight text-white">Select a role...</option>
                {roles
                  .filter((r) => !userRoles.some((ur: any) => ur.role === r.name || ur.role_id === r.id))
                  .sort((a, b) => a.display_name.localeCompare(b.display_name))
                  .map((role) => (
                    <option key={role.id} value={role.id} className="bg-och-midnight text-white">
                      {role.display_name} - {role.description}
                    </option>
                  ))}
              </select>
              <Button
                variant="mint"
                onClick={handleAssignRole}
                disabled={!selectedRole || isLoading}
              >
                Assign
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button variant="orange" className="flex-1">
              Reset Onboarding
            </Button>
            <Button variant="orange" className="flex-1">
              Hard Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}






