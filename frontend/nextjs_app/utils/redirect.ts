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

  // Validate that the route exists and is accessible
  if (!route || !route.startsWith('/dashboard/')) {
    console.error('getRedirectRoute: Invalid route generated:', route, 'for role:', primaryRole)
    return '/dashboard/student' // Fallback to student dashboard
  }

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
  'mentor': '/mentor/dashboard',
  'admin': '/dashboard/admin',
  'program_director': '/dashboard/director',
  'sponsor_admin': '/dashboard/sponsor',
  'analyst': '/dashboard/analyst',
  'employer': '/dashboard/employer',
  'finance': '/dashboard/finance',
} as const

/**
 * Validate that a dashboard route exists and is properly formatted
 */
export function isValidDashboardRoute(route: string): boolean {
  if (!route || typeof route !== 'string') {
    return false
  }

  // Must start with /dashboard/
  if (!route.startsWith('/dashboard/')) {
    return false
  }

  // Extract the role from the path
  const role = route.split('/')[2]
  if (!role) {
    return false
  }

  // Check if it's a known role
  const validRoles = Object.keys(ROLE_DASHBOARD_MAP)
  return validRoles.some(validRole => ROLE_DASHBOARD_MAP[validRole as keyof typeof ROLE_DASHBOARD_MAP] === route)
}

/**
 * Get fallback route for when primary route fails
 */
export function getFallbackRoute(user: User | null): string {
  // For students/mentees, always fallback to student dashboard
  if (user?.roles) {
    const hasStudentRole = user.roles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      return ['student', 'mentee'].includes(roleName?.toLowerCase().trim())
    })
    if (hasStudentRole) {
      return '/dashboard/student'
    }
  }

  // Default fallback
  return '/dashboard/student'
}

/**
 * Test utility for validating routing logic (for development/testing)
 */
export function testRoutingLogic(): void {
  const testUsers = [
    { roles: [{ role: 'admin' }], expected: '/dashboard/admin' },
    { roles: [{ role: 'program_director' }], expected: '/dashboard/director' },
    { roles: [{ role: 'mentor' }], expected: '/mentor/dashboard' },
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

