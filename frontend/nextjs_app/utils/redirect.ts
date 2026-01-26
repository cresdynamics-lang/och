/**
 * Centralized redirect utility for role-based dashboard routing
 * Ensures consistent redirect behavior across the application
 */

import { User } from '@/services/types/user'
import { getPrimaryRole, getDashboardRoute } from './rbac'

/**
 * Get the correct dashboard route for a user based on their role
 * This is the single source of truth for role-based redirects
 * 
 * Priority:
 * 1. Admin → /dashboard/admin (always highest priority)
 * 2. Other roles → based on priority order
 */
export function getRedirectRoute(user: User | null): string {
  if (!user) {
    console.warn('getRedirectRoute: No user provided, defaulting to student dashboard')
    return '/dashboard/student'
  }

  console.log('=== getRedirectRoute: Determining redirect route ===')
  console.log('User:', { id: user.id, email: user.email })
  console.log('User roles:', user.roles)

  // CRITICAL: Check for admin role FIRST before any other logic
  // Admin users should ALWAYS go to /dashboard/admin
  if (user.roles && Array.isArray(user.roles)) {
    const hasAdminRole = user.roles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
      return roleName?.toLowerCase().trim() === 'admin'
    })
    
    if (hasAdminRole) {
      console.log('✅ getRedirectRoute: Admin role detected - redirecting to /dashboard/admin')
      return '/dashboard/admin'
    }
  }

  // If not admin, use the standard role-based routing
  const primaryRole = getPrimaryRole(user)
  
  if (!primaryRole) {
    console.warn('getRedirectRoute: No primary role found, defaulting to student dashboard')
    return '/dashboard/student'
  }

  const route = getDashboardRoute(primaryRole)
  
  console.log('✅ getRedirectRoute: Final route determined', {
    primaryRole,
    route,
    userRoles: user.roles,
    isAdmin: false
  })

  return route
}

/**
 * Role to dashboard mapping (for reference)
 * This matches the mapping in rbac.ts getDashboardRoute function
 */
export const ROLE_DASHBOARD_MAP = {
  'student': '/dashboard/student',
  'mentee': '/dashboard/student',
  'mentor': '/dashboard/mentor',
  'admin': '/dashboard/admin',
  'program_director': '/dashboard/director',
  'sponsor_admin': '/dashboard/sponsor',
  'analyst': '/dashboard/analyst',
  'employer': '/dashboard/employer',
  'finance': '/dashboard/finance',
} as const

