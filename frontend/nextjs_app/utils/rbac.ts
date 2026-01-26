/**
 * Role-Based Access Control (RBAC) utilities
 * Maps roles to allowed routes and features
 */

import { User, UserRole } from '@/services/types/user'

export type Role = 'mentee' | 'student' | 'mentor' | 'admin' | 'program_director' | 'sponsor_admin' | 'analyst' | 'employer' | 'finance'

export interface RoutePermission {
  path: string
  roles: Role[]
  requireAll?: boolean // If true, user must have ALL roles, otherwise ANY role
}

// Route permissions mapping
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Dashboard root (redirect page) - allow any authenticated role
  { path: '/dashboard', roles: ['mentee', 'student', 'mentor', 'admin', 'program_director', 'sponsor_admin', 'analyst', 'employer', 'finance'] },

  // Student/Mentee routes
  { path: '/dashboard/student', roles: ['mentee', 'student'] },
  { path: '/dashboard/profiler', roles: ['mentee', 'student'] },
  { path: '/dashboard/future-you', roles: ['mentee', 'student'] },
  { path: '/dashboard/coaching', roles: ['mentee', 'student'] },
  { path: '/dashboard/missions', roles: ['mentee', 'student'] },
  { path: '/dashboard/portfolio', roles: ['mentee', 'student'] },
  { path: '/dashboard/talentscope', roles: ['mentee', 'student'] },
  { path: '/dashboard/community', roles: ['mentee', 'student'] },
  { path: '/dashboard/subscription', roles: ['mentee', 'student'] },
  
  // Mentor routes
  { path: '/dashboard/mentor', roles: ['mentor'] },
  { path: '/dashboard/mentor/profile', roles: ['mentor'] },
  { path: '/dashboard/mentor/sessions', roles: ['mentor'] },
  { path: '/dashboard/mentor/missions', roles: ['mentor'] },
  { path: '/dashboard/mentor/scoring', roles: ['mentor'] },
  { path: '/dashboard/mentor/talentscope', roles: ['mentor'] },
  
  // Program Director routes - accessible by program_director and admin
  { path: '/dashboard/director', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/tracks', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/scoring', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/mentors', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/placements', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/analytics', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/missions', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/programs', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/cohorts', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/calendar', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/certificates', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/curriculum', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/enrollment', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/graduation', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/inbox', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/mentorship', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/notifications', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/reports', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/rules', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/settings', roles: ['program_director', 'admin'] },
  { path: '/dashboard/director/dashboard', roles: ['program_director', 'admin'] },
  
  // Employer routes
  { path: '/dashboard/employer', roles: ['employer'] },
  { path: '/dashboard/marketplace', roles: ['employer'] },
  { path: '/dashboard/marketplace/talent', roles: ['employer'] },
  { path: '/dashboard/marketplace/roles', roles: ['employer'] },
  
  // Sponsor/Employer Admin routes
  { path: '/dashboard/sponsor', roles: ['sponsor_admin'] },
  { path: '/dashboard/sponsor/marketplace', roles: ['sponsor_admin'] },
  { path: '/dashboard/sponsor/marketplace/talent', roles: ['sponsor_admin'] },
  { path: '/dashboard/sponsor/marketplace/jobs', roles: ['sponsor_admin'] },
  
  // Admin routes
  { path: '/dashboard/admin', roles: ['admin'] },
  { path: '/dashboard/admin/users', roles: ['admin'] },
  { path: '/dashboard/admin/users/applications', roles: ['admin'] },
  { path: '/dashboard/admin/users/directors', roles: ['admin'] },
  { path: '/dashboard/admin/users/mentors', roles: ['admin'] },
  { path: '/dashboard/admin/cohorts', roles: ['admin'] },
  { path: '/dashboard/admin/users/mentees', roles: ['admin'] },
  { path: '/dashboard/admin/users/finance', roles: ['admin'] },
  { path: '/dashboard/admin/settings', roles: ['admin'] },
  { path: '/dashboard/admin/subscriptions', roles: ['admin'] },
  { path: '/dashboard/admin/audit', roles: ['admin'] },
  { path: '/dashboard/admin/payments', roles: ['admin'] },
  { path: '/dashboard/admin/community', roles: ['admin'] },
  { path: '/dashboard/admin/curriculum', roles: ['admin'] },
  { path: '/dashboard/admin/integrations', roles: ['admin'] },
  { path: '/dashboard/admin/marketplace', roles: ['admin'] },
  { path: '/dashboard/admin/marketplace/employers', roles: ['admin'] },
  { path: '/dashboard/admin/marketplace/audit', roles: ['admin'] },
  { path: '/dashboard/admin/marketplace/governance', roles: ['admin'] },
  { path: '/dashboard/admin/marketplace/analytics', roles: ['admin'] },
  
  // Analyst routes
  { path: '/dashboard/analyst', roles: ['analyst'] },
  { path: '/dashboard/analytics', roles: ['analyst', 'admin', 'program_director'] },
  
  // Finance routes
  { path: '/dashboard/finance', roles: ['finance'] },
  { path: '/dashboard/finance/catalog', roles: ['finance'] },
  { path: '/dashboard/finance/analytics', roles: ['finance'] },
  { path: '/dashboard/finance/billing', roles: ['finance'] },
  { path: '/dashboard/finance/sponsorship', roles: ['finance'] },
  { path: '/dashboard/finance/rewards', roles: ['finance'] },
  { path: '/dashboard/finance/security', roles: ['finance'] },
  { path: '/dashboard/finance/profile', roles: ['finance'] },
]

/**
 * Get user's roles from user object
 */
export function getUserRoles(user: User | null): Role[] {
  if (!user || !user.roles) {
    console.log('getUserRoles: No user or roles found', { user: !!user, hasRoles: !!(user?.roles) })
    return []
  }
  
  console.log('getUserRoles: Processing roles', { roles: user.roles, rolesType: typeof user.roles, isArray: Array.isArray(user.roles) })
  
  const extractedRoles = user.roles.map((ur, index) => {
    let roleName: string
    console.log(`getUserRoles: Processing role ${index}:`, ur, { 
      type: typeof ur, 
      isString: typeof ur === 'string',
      isObject: typeof ur === 'object',
      hasRole: ur && typeof ur === 'object' && 'role' in ur
    })
    
    if (typeof ur === 'string') {
      roleName = ur
    } else if (ur && typeof ur === 'object') {
      // Backend returns: { role: 'admin', scope: 'global', scope_ref: null }
      // UserRole interface: { role: string, scope: string, scope_ref?: string }
      if ('role' in ur) {
        const roleValue = (ur as any).role
        if (typeof roleValue === 'string') {
          roleName = roleValue
        } else if (roleValue && typeof roleValue === 'object' && 'name' in roleValue) {
          roleName = roleValue.name
        } else {
          roleName = String(roleValue || '')
        }
      } else {
        // Fallback: try to extract from object directly
        // Priority: role > name > role_display_name
        roleName = String((ur as any).role || (ur as any).name || (ur as any).role_display_name || ur)
      }
    } else {
      roleName = String(ur)
    }
    
    console.log(`getUserRoles: Extracted role name "${roleName}" from:`, ur)
    
    // Normalize role names (backend uses exact names: 'mentor', 'admin', etc.)
    const normalized = roleName.toLowerCase().trim()
    
    // Map backend role names to frontend roles
    // This ensures all role variations are correctly identified
    // Check program_director FIRST before checking 'director' to avoid conflicts
    if (normalized === 'program_director' || normalized === 'program director' || normalized === 'programdirector') return 'program_director'
    if (normalized === 'director') return 'program_director' // 'director' is shorthand for program_director
    if (normalized === 'mentee') return 'mentee'
    if (normalized === 'student') return 'student'
    if (normalized === 'mentor') return 'mentor'
    if (normalized === 'admin') return 'admin'
    if (normalized === 'sponsor_admin' || normalized === 'sponsor' || normalized === 'sponsor/employer admin' || normalized === 'sponsoremployer admin') return 'sponsor_admin'
    if (normalized === 'analyst') return 'analyst'
    if (normalized === 'employer') return 'employer'
    if (normalized === 'finance' || normalized === 'finance_admin') return 'finance'
    
    // Log unknown roles for debugging
    console.warn('⚠️ Unknown role name:', roleName, 'normalized:', normalized, 'from user role:', ur)
    return normalized as Role
  }).filter((role): role is Role => Boolean(role))
  
  console.log('getUserRoles: Final extracted roles:', extractedRoles)
  return extractedRoles
}

/**
 * Check if user has access to a route
 */
export function hasRouteAccess(user: User | null, path: string): boolean {
  if (!user) return false
  
  // CRITICAL: Check for admin role FIRST (before extracting roles)
  // Admin users should have access to all routes
  if (user.roles && Array.isArray(user.roles)) {
    const hasAdminRole = user.roles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      return roleName?.toLowerCase().trim() === 'admin'
    })
    
    if (hasAdminRole) {
      console.log('✅ hasRouteAccess: Admin user detected - granting access to:', path)
      return true
    }
  }
  
  const userRoles = getUserRoles(user)
  if (userRoles.length === 0) return false
  
  // Double-check: Admin has access to everything
  if (userRoles.includes('admin')) return true
  
  // Find most-specific matching route permission (longest path wins)
  const matching = ROUTE_PERMISSIONS
    .filter(p => path === p.path || path.startsWith(p.path + '/') || path.startsWith(p.path))
    .sort((a, b) => b.path.length - a.path.length)
  const permission = matching[0]

  if (!permission) {
    // Default deny for dashboard routes; default allow for non-dashboard routes.
    if (path.startsWith('/dashboard')) return false
    return true
  }
  
  // Check if user has any of the required roles
  if (permission.requireAll) {
    return permission.roles.every(role => userRoles.includes(role))
  } else {
    return permission.roles.some(role => userRoles.includes(role))
  }
}

/**
 * Get primary role for routing
 */
export function getPrimaryRole(user: User | null): Role | null {
  if (!user) {
    console.log('getPrimaryRole: No user provided')
    return null
  }
  
  const roles = getUserRoles(user)
  console.log('getPrimaryRole: User roles extracted:', roles, 'from user.roles:', user.roles)
  
  if (roles.length === 0) {
    console.warn('getPrimaryRole: No roles found for user:', user.id, user.email)
    return null
  }
  
  // CRITICAL: Admin should ALWAYS be selected first if present
  // This is a safeguard to ensure admin users always go to admin dashboard
  if (roles.includes('admin')) {
    console.log('✅ getPrimaryRole: Admin role detected - selecting admin as primary role')
    console.log('✅ getPrimaryRole: All available roles:', roles)
    return 'admin'
  }
  
  // Priority order (higher priority roles first)
  // This ensures users with multiple roles get redirected to the most appropriate dashboard
  const priority: Role[] = ['program_director', 'finance', 'mentor', 'analyst', 'sponsor_admin', 'employer', 'mentee', 'student']
  
  console.log('getPrimaryRole: Checking priority order for roles:', roles)
  console.log('getPrimaryRole: Priority order:', priority)
  
  for (const role of priority) {
    if (roles.includes(role)) {
      console.log('✅ getPrimaryRole: Selected primary role:', role, 'from available roles:', roles)
      console.log('✅ getPrimaryRole: This role has priority over:', roles.filter(r => r !== role))
      return role
    }
  }
  
  // Fallback: use first role if no priority match (shouldn't happen with proper roles)
  console.warn('⚠️ getPrimaryRole: No priority match found, using first role as primary:', roles[0])
  return roles[0]
}

/**
 * Map role to dashboard route
 * This function ensures users are redirected to the correct dashboard based on their role
 */
export function getDashboardRoute(role: Role | null): string {
  if (!role) {
    console.warn('getDashboardRoute: No role provided, defaulting to student dashboard')
    return '/dashboard/student'
  }
  
  // Role to dashboard route mapping
  // This ensures users are redirected to the correct dashboard after authentication
  const routeMap: Record<Role, string> = {
    'student': '/dashboard/student',           // Student role → Student Dashboard
    'mentee': '/dashboard/student',            // Mentee role → Student Dashboard
    'mentor': '/dashboard/mentor',              // Mentor role → Mentor Dashboard
    'admin': '/dashboard/admin',               // Admin role → Admin Dashboard
    'program_director': '/dashboard/director', // Program Director role → Director Dashboard
    'sponsor_admin': '/dashboard/sponsor',     // Sponsor/Employer Admin → Sponsor Dashboard
    'analyst': '/dashboard/analyst',           // Analyst role → Analyst Dashboard
    'employer': '/dashboard/employer',         // Employer role → Employer Dashboard
    'finance': '/dashboard/finance',           // Finance role → Finance Dashboard
  }
  
  const route = routeMap[role]
  if (!route) {
    console.warn(`⚠️ getDashboardRoute: Unknown role "${role}", defaulting to student dashboard`)
    console.warn(`Available roles: ${Object.keys(routeMap).join(', ')}`)
    return '/dashboard/student'
  }
  
  console.log(`✅ getDashboardRoute: Role "${role}" → Dashboard "${route}"`)
  return route
}

