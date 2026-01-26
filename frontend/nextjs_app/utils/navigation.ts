/**
 * Navigation utilities for role-aware routing
 * Provides context-aware navigation helpers that respect the current user's role
 */

import { User } from '@/services/types/user'
import { getPrimaryRole, getDashboardRoute } from './rbac'

/**
 * Get the base dashboard path for a user based on their role
 * This is used to ensure all links stay within the correct dashboard context
 */
export function getDashboardBasePath(user: User | null): string {
  if (!user) {
    return '/dashboard/student'
  }

  // Check for admin role first
  if (user.roles && Array.isArray(user.roles)) {
    const hasAdminRole = user.roles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      return roleName?.toLowerCase().trim() === 'admin'
    })
    
    if (hasAdminRole) {
      return '/dashboard/admin'
    }
  }

  const primaryRole = getPrimaryRole(user)
  if (!primaryRole) {
    return '/dashboard/student'
  }

  return getDashboardRoute(primaryRole)
}

/**
 * Get the settings/profile path for a user based on their role
 */
export function getSettingsPath(user: User | null): string {
  const basePath = getDashboardBasePath(user)
  return `${basePath}/settings`
}

/**
 * Get the profile path for a user based on their role
 */
export function getProfilePath(user: User | null): string {
  const basePath = getDashboardBasePath(user)
  // Some dashboards use /profile, others use /settings/profile
  if (basePath.includes('/mentor') || basePath.includes('/director') || basePath.includes('/admin')) {
    return `${basePath}/profile`
  }
  return `${basePath}/settings/profile`
}

/**
 * Get the dashboard home path for a user based on their role
 */
export function getDashboardHomePath(user: User | null): string {
  return getDashboardBasePath(user)
}

/**
 * Check if a path belongs to a specific role's dashboard
 */
export function isRoleDashboardPath(path: string, role: string): boolean {
  const roleMap: Record<string, string> = {
    'student': '/dashboard/student',
    'mentee': '/dashboard/student',
    'mentor': '/dashboard/mentor',
    'admin': '/dashboard/admin',
    'program_director': '/dashboard/director',
    'director': '/dashboard/director',
    'sponsor_admin': '/dashboard/sponsor',
    'sponsor': '/dashboard/sponsor',
    'analyst': '/dashboard/analyst',
    'employer': '/dashboard/employer',
  }
  
  const dashboardPath = roleMap[role.toLowerCase()]
  return dashboardPath ? path.startsWith(dashboardPath) : false
}

/**
 * Get the current dashboard context from a pathname
 * Returns the role dashboard base path if the path is within a dashboard
 */
export function getDashboardContextFromPath(pathname: string): string | null {
  const dashboardPatterns = [
    '/dashboard/student',
    '/dashboard/mentor',
    '/dashboard/admin',
    '/dashboard/director',
    '/dashboard/sponsor',
    '/dashboard/analyst',
    '/dashboard/employer',
  ]
  
  for (const pattern of dashboardPatterns) {
    if (pathname.startsWith(pattern)) {
      return pattern
    }
  }
  
  return null
}

