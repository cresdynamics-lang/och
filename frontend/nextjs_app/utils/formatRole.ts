/**
 * Utility functions to format and display user roles
 */

import { User } from '@/services/types/user'
import { getUserRoles, getPrimaryRole } from './rbac'

/**
 * Format role name for display
 * Converts role names like "program_director" to "Program Director"
 */
export function formatRoleName(role: string): string {
  if (!role) return 'User'
  
  // Handle common role variations
  const roleMap: Record<string, string> = {
    'student': 'Student',
    'mentee': 'Student',
    'mentor': 'Mentor',
    'admin': 'Admin',
    'program_director': 'Program Director',
    'director': 'Program Director',
    'sponsor_admin': 'Sponsor Admin',
    'sponsor': 'Sponsor',
    'analyst': 'Analyst',
    'employer': 'Employer',
  }
  
  const normalized = role.toLowerCase().trim()
  return roleMap[normalized] || role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

/**
 * Get the primary role display name for a user
 */
export function getUserRoleDisplay(user: User | null): string {
  if (!user) return 'User'
  
  const primaryRole = getPrimaryRole(user)
  if (!primaryRole) {
    // Fallback: try to get first role from user.roles
    if (user.roles && user.roles.length > 0) {
      const firstRole = user.roles[0]
      const roleName = typeof firstRole === 'string' ? firstRole : (firstRole?.role || '')
      return formatRoleName(roleName)
    }
    return 'User'
  }
  
  return formatRoleName(primaryRole)
}

/**
 * Get all role display names for a user
 */
export function getUserRolesDisplay(user: User | null): string[] {
  if (!user) return []
  
  const roles = getUserRoles(user)
  return roles.map(role => formatRoleName(role))
}

