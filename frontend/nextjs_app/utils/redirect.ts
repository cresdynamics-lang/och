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
    // No user - default to student (but this should rarely happen)
    console.warn('getRedirectRoute: No user provided, defaulting to student dashboard')
    return '/dashboard/student'
  }

  console.log('=== getRedirectRoute: Determining redirect route ===')
  console.log('User:', { id: user.id, email: user.email })
  console.log('User roles:', user.roles)

  // CRITICAL: Check for mentor role FIRST - before ANY other logic
  // This ensures mentors NEVER get student dashboard, even if other checks fail
  // This check happens MULTIPLE times to ensure mentors are NEVER associated with student routes
  if (user.roles && Array.isArray(user.roles)) {
    const hasMentorRoleAtEntry = user.roles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
      return roleName?.toLowerCase().trim() === 'mentor'
    })
    
    if (hasMentorRoleAtEntry) {
      console.log('✅ getRedirectRoute: Mentor role detected at ENTRY - immediately returning /dashboard/mentor')
      console.log('🚫 getRedirectRoute: Mentors are NEVER associated with student routes')
      return '/dashboard/mentor'
    }
  }

  // CRITICAL: Check for specific roles FIRST before any other logic
  // These roles should NEVER redirect to student dashboard
  if (user.roles && Array.isArray(user.roles)) {
    // Check for admin role FIRST
    const hasAdminRole = user.roles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
      return roleName?.toLowerCase().trim() === 'admin'
    })

    if (hasAdminRole) {
      console.log('✅ getRedirectRoute: Admin role detected - redirecting to /dashboard/admin')
      return '/dashboard/admin'
    }

    // CRITICAL: Check for mentor role - mentors should NEVER go to student dashboard
    const hasMentorRole = user.roles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
      return roleName?.toLowerCase().trim() === 'mentor'
    })

    if (hasMentorRole) {
      console.log('✅ getRedirectRoute: Mentor role detected - redirecting to /dashboard/mentor')
      return '/dashboard/mentor'
    }
  }

  // If not admin or mentor, use the standard role-based routing
  const primaryRole = getPrimaryRole(user)

  if (!primaryRole) {
    // CRITICAL: Check for mentor role BEFORE defaulting to student
    if (user.roles && Array.isArray(user.roles)) {
      const hasMentorRole = user.roles.some((ur: any) => {
        const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
        return roleName?.toLowerCase().trim() === 'mentor'
      })
      if (hasMentorRole) {
        console.log('✅ getRedirectRoute: Mentor role detected in fallback - redirecting to /dashboard/mentor')
        return '/dashboard/mentor'
      }
    }
    // Only default to student if user is NOT a mentor
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
  'finance': '/finance/dashboard',
} as const

/**
 * Validate that a dashboard route exists and is properly formatted
 */
export function isValidDashboardRoute(route: string): boolean {
  if (!route || typeof route !== 'string') {
    return false
  }

  // Check if it's a known route in the ROLE_DASHBOARD_MAP
  const validRoutes = Object.values(ROLE_DASHBOARD_MAP)
  const isValid = validRoutes.includes(route as any)
  console.log('[isValidDashboardRoute]', { route, validRoutes, isValid })
  return isValid
}

/**
 * Get fallback route for when primary route fails
 */
export function getFallbackRoute(user: User | null): string {
  if (!user?.roles) {
    // CRITICAL: Even with no roles, check if user might be a mentor
    // This is a safety net - mentors should NEVER get student dashboard
    return '/dashboard/student'
  }
  
  // CRITICAL: Check for mentor role FIRST - before any other logic
  const roles = user.roles.map((ur: any) => {
    const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
    return roleName?.toLowerCase().trim()
  })
  
  if (roles.includes('mentor')) {
    console.log('getFallbackRoute: Mentor role detected - returning /dashboard/mentor')
    return '/dashboard/mentor'
  }

  // Roles already extracted above - mentor check already done

  // Check for admin role
  if (roles.includes('admin')) {
    return '/dashboard/admin'
  }

  // Check for other roles
  if (roles.includes('program_director')) return '/dashboard/director'
  if (roles.includes('sponsor_admin') || roles.includes('sponsor')) return '/dashboard/sponsor'
  if (roles.includes('analyst')) return '/dashboard/analyst'
  if (roles.includes('employer')) return '/dashboard/employer'
  if (roles.includes('finance')) return '/finance/dashboard'

  // For students/mentees, fallback to student dashboard
  if (roles.some(r => ['student', 'mentee'].includes(r))) {
    return '/dashboard/student'
  }

  // Default fallback - mentors already handled above, so this is for non-mentors only
  return '/dashboard/student'
}

/**
 * Test utility for validating routing logic (for development/testing)
 */
export function testRoutingLogic(): void {
  const testUsers = [
    { roles: [{ role: 'admin' }], expected: '/dashboard/admin' },
    { roles: [{ role: 'program_director' }], expected: '/dashboard/director' },
    { roles: [{ role: 'mentor' }], expected: '/dashboard/mentor' },
    { roles: [{ role: 'analyst' }], expected: '/dashboard/analyst' },
    { roles: [{ role: 'sponsor_admin' }], expected: '/dashboard/sponsor' },
    { roles: [{ role: 'employer' }], expected: '/dashboard/employer' },
    { roles: [{ role: 'finance' }], expected: '/dashboard/finance' },
    { roles: [{ role: 'student' }], expected: '/dashboard/student' },
    { roles: [{ role: 'mentee' }], expected: '/dashboard/student' },
    { roles: [{ role: 'admin' }, { role: 'mentor' }], expected: '/dashboard/admin' }, // Admin takes priority
    { roles: [], expected: '/dashboard/student' },
  ];

  console.log('🧪 Testing routing logic...');

  testUsers.forEach((testCase, index) => {
    const mockUser = {
      id: `test-user-${index}`,
      email: `test${index}@example.com`,
      roles: testCase.roles
    };

    const result = getRedirectRoute(mockUser);
    const passed = result === testCase.expected;

    console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'}`, {
      roles: testCase.roles,
      expected: testCase.expected,
      got: result
    });

    if (!passed) {
      console.error(`❌ Routing test failed for user with roles:`, testCase.roles);
    }
  });

  console.log('🧪 Routing tests completed');
}

