/**
 * Next.js Middleware
 * Handles authentication checks and RBAC-based route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/sponsor'];
const openRoutes = [
  '/dashboard/student',
  '/dashboard/student/coaching',
  '/dashboard/student/coaching/recipes',
  '/dashboard/student/curriculum',
  '/dashboard/student/curriculum/learn',
  '/dashboard/student/missions',
  '/dashboard/student/portfolio',
  '/dashboard/student/mentorship',
  '/dashboard/student/marketplace',
  '/dashboard/student/profiling',
  '/dashboard/student/settings',
  '/dashboard/student/settings/profile',
  '/curriculum',
  '/curriculum/learn',
  '/onboarding',
  '/onboarding/ai-profiler'
];
const authRoutes = ['/login', '/signup'];

function getLoginRouteForPath(pathname: string) {
  // Map dashboard routes to their corresponding login routes
  if (pathname.startsWith('/dashboard/director')) return '/login/director'
  if (pathname.startsWith('/dashboard/admin')) return '/login/admin'
  if (pathname.startsWith('/dashboard/mentor')) return '/login/mentor'
  if (pathname.startsWith('/dashboard/sponsor')) return '/login/sponsor'
  if (pathname.startsWith('/dashboard/analyst') || pathname.startsWith('/dashboard/analytics')) return '/login/analyst'
  if (pathname.startsWith('/dashboard/employer') || pathname.startsWith('/dashboard/marketplace')) return '/login/employer'
  if (pathname.startsWith('/dashboard/finance')) return '/login/finance'
  // Student routes (including coaching OS)
  if (pathname.startsWith('/students/')) return '/login/student'
  return '/login/student'
}

function getLoginRouteForRole(role: string | null): string {
  // Map user roles to their corresponding login routes
  switch (role) {
    case 'admin': return '/login/admin'
    case 'program_director': return '/login/director'
    case 'mentor': return '/login/mentor'
    case 'analyst': return '/login/analyst'
    case 'sponsor_admin': return '/login/sponsor'
    case 'employer': return '/login/employer'
    case 'finance':
    case 'finance_admin':
      return '/login/finance'
    case 'mentee':
    case 'student':
    default:
      return '/login/student'
  }
}

function parseRolesCookie(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Normalize roles: map finance_admin to finance
      return parsed.map((r: string) => {
        const normalized = String(r).toLowerCase().trim()
        if (normalized === 'finance_admin') return 'finance'
        return String(r)
      })
    }
  } catch {
    // ignore
  }
  // fallback comma-separated
  return raw.split(',').map(s => {
    const normalized = s.trim().toLowerCase()
    if (normalized === 'finance_admin') return 'finance'
    return s.trim()
  }).filter(Boolean)
}

function dashboardForRole(role: string | null): string {
  switch (role) {
    case 'admin': return '/dashboard/admin'
    case 'program_director': return '/dashboard/director'
    case 'mentor': return '/dashboard/mentor'
    case 'analyst': return '/dashboard/analyst'
    case 'sponsor_admin': return '/dashboard/sponsor'
    case 'employer': return '/dashboard/employer'
    case 'finance':
    case 'finance_admin':
      return '/dashboard/finance'
    case 'mentee':
    case 'student':
    default:
      return '/dashboard/student'
  }
}

function canAccess(pathname: string, roles: string[]): boolean {
  if (roles.includes('admin')) return true

  // Handle student coaching OS routes - only students and mentees can access
  if (pathname.startsWith('/students/')) {
    return roles.includes('student') || roles.includes('mentee')
  }

  // Handle sponsor routes
  if (pathname.startsWith('/sponsor/')) {
    return roles.includes('sponsor') || roles.includes('sponsor_admin')
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (pathname.startsWith('/dashboard/director')) return roles.includes('program_director')
    if (pathname.startsWith('/dashboard/admin')) return roles.includes('admin')
    if (pathname.startsWith('/dashboard/mentor')) return roles.includes('mentor')
    if (pathname.startsWith('/dashboard/sponsor')) return roles.includes('sponsor_admin')
    if (pathname.startsWith('/dashboard/sponsor/marketplace')) return roles.includes('sponsor_admin')
    if (pathname.startsWith('/dashboard/analyst')) return roles.includes('analyst')
    if (pathname.startsWith('/dashboard/analytics')) return roles.includes('analyst') || roles.includes('program_director')
    if (pathname.startsWith('/dashboard/employer') || pathname.startsWith('/dashboard/marketplace')) return roles.includes('employer')
    if (pathname.startsWith('/dashboard/finance')) return roles.includes('finance') || roles.includes('finance_admin')
    // Student routes (catch-all for other dashboard paths)
    return roles.includes('student') || roles.includes('mentee')
  }
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const hasToken = !!accessToken;
  const rolesCookie = request.cookies.get('och_roles')?.value;
  const primaryRoleCookie = request.cookies.get('och_primary_role')?.value || null;
  const dashboardCookie = request.cookies.get('och_dashboard')?.value || null;
  const roles = parseRolesCookie(rolesCookie);
  let home = dashboardCookie || dashboardForRole(primaryRoleCookie);
  
  // CRITICAL: Ensure mentors always get mentor dashboard as home
  // This prevents redirects to student dashboard
  if (roles.includes('mentor') && (!home || home === '/dashboard/student')) {
    console.log('middleware: Mentor detected but home is not mentor dashboard, correcting:', home);
    home = '/dashboard/mentor';
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isOpenRoute = openRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const loginPath = getLoginRouteForPath(pathname);

  // Check if this is a specific login route (e.g., /login/mentor, /login/director, /login/finance)
  const isSpecificLoginRoute = pathname.match(/^\/login\/(mentor|director|admin|student|sponsor|analyst|employer|finance)$/);

  // Redirect to login if accessing protected route without token (but not open routes)
  if (isProtectedRoute && !isOpenRoute && !hasToken) {
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For auth routes (login pages):
  // - Allow ALL specific login routes to be accessed regardless of authentication status
  // - Users should be able to visit any login page (e.g., /login/mentor, /login/director)
  // - Client-side will handle role validation and redirect to appropriate dashboard after login
  // - If user is authenticated and visits generic /login, redirect to their dashboard
  if (isAuthRoute) {
    // Always allow specific login routes - never redirect them
    // This ensures users can access the login page they want, regardless of their current auth state
    if (isSpecificLoginRoute) {
      return NextResponse.next();
    }
    
    // For generic /login route with token, redirect to user's dashboard
    if (hasToken && home && (pathname === '/login' || pathname === '/login/')) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    
    // Allow all auth routes to be accessed (no token required for login pages)
    return NextResponse.next();
  }

  // Server-side RBAC for dashboard routes (best effort; falls back to client guard if roles cookie missing)
  // Skip RBAC check for student routes - they're open routes and should be accessible
  // Allow /dashboard/mfa-required and /dashboard/mfa-required/setup for any authenticated user
  if (hasToken && (pathname === '/dashboard/mfa-required' || pathname.startsWith('/dashboard/mfa-required/'))) {
    return NextResponse.next();
  }
  if (hasToken && pathname.startsWith('/dashboard') && roles.length > 0 && !pathname.startsWith('/dashboard/student')) {
    // Redirect /dashboard to role home
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      console.log('middleware: Redirecting /dashboard to role home:', home);
      return NextResponse.redirect(new URL(home, request.url));
    }

    if (!canAccess(pathname, roles)) {
      // CRITICAL: Before redirecting, ensure mentors don't get student dashboard
      let redirectHome = home;
      if (roles.includes('mentor') && (!redirectHome || redirectHome === '/dashboard/student')) {
        console.log('middleware: 🚨 CRITICAL - Mentor access denied but home is student dashboard, correcting');
        redirectHome = '/dashboard/mentor';
      }
      console.log('middleware: Access denied to', pathname, 'for roles:', roles, '- redirecting to home:', redirectHome);
      return NextResponse.redirect(new URL(redirectHome, request.url));
    }
  }

  // Additional validation: ensure role-specific dashboards exist
  // Skip this check for student routes - they're open routes
  if (hasToken && pathname.startsWith('/dashboard/') && roles.length > 0 && !pathname.startsWith('/dashboard/student')) {
    const roleFromPath = pathname.split('/')[2]; // Extract role from /dashboard/{role}/...
    if (roleFromPath) {
      // Map path role to actual roles
      const pathRoleMapping: Record<string, string[]> = {
        'director': ['program_director'],
        'admin': ['admin'],
        'mentor': ['mentor'],
        'sponsor': ['sponsor', 'sponsor_admin'],
        'analyst': ['analyst'],
        'analytics': ['analyst', 'program_director'],
        'employer': ['employer'],
        'marketplace': ['employer'],
        'finance': ['finance', 'finance_admin'],
        'student': ['student', 'mentee']
      };

      const allowedRoles = pathRoleMapping[roleFromPath];
      if (allowedRoles && !allowedRoles.some(role => roles.includes(role))) {
        // CRITICAL: Before redirecting, ensure mentors don't get student dashboard
        let redirectHome = home;
        if (roles.includes('mentor') && (!redirectHome || redirectHome === '/dashboard/student')) {
          console.log('middleware: 🚨 CRITICAL - Mentor role validation failed but home is student dashboard, correcting');
          redirectHome = '/dashboard/mentor';
        }
        console.log('middleware: User with roles', roles, 'trying to access', pathname, '- redirecting to their home dashboard:', redirectHome);
        return NextResponse.redirect(new URL(redirectHome, request.url));
      }
    }
  }

  // Allow auth routes to be accessed even with token (client handles redirect)
  // This prevents middleware from interfering with post-login redirects

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

