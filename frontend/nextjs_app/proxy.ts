/**
 * Next.js Proxy (formerly middleware)
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
  if (pathname.startsWith('/dashboard/director')) return '/login/director'
  if (pathname.startsWith('/dashboard/admin')) return '/login/admin'
  if (pathname.startsWith('/dashboard/mentor')) return '/login/mentor'
  if (pathname.startsWith('/dashboard/sponsor')) return '/login/sponsor'
  if (pathname.startsWith('/dashboard/analyst') || pathname.startsWith('/dashboard/analytics')) return '/login/analyst'
  if (pathname.startsWith('/dashboard/employer') || pathname.startsWith('/dashboard/marketplace')) return '/login/employer'
  if (pathname.startsWith('/dashboard/finance')) return '/login/finance'
  if (pathname.startsWith('/support')) return '/login/support'
  if (pathname.startsWith('/students/')) return '/login/student'
  return '/login/student'
}

function parseRolesCookie(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((r: string) => {
        const normalized = String(r).toLowerCase().trim()
        if (normalized === 'finance_admin') return 'finance'
        return String(r)
      })
    }
  } catch {}
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

  if (pathname.startsWith('/students/')) {
    return roles.includes('student') || roles.includes('mentee')
  }

  if (pathname.startsWith('/sponsor/')) {
    return roles.includes('sponsor') || roles.includes('sponsor_admin')
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (pathname.startsWith('/dashboard/director')) return roles.includes('program_director')
    if (pathname.startsWith('/dashboard/admin')) return roles.includes('admin')
    if (pathname.startsWith('/dashboard/mentor')) return roles.includes('mentor')
    if (pathname.startsWith('/dashboard/sponsor')) return roles.includes('sponsor_admin')
    if (pathname.startsWith('/dashboard/analyst')) return roles.includes('analyst')
    if (pathname.startsWith('/dashboard/analytics')) return roles.includes('analyst') || roles.includes('program_director')
    if (pathname.startsWith('/dashboard/employer') || pathname.startsWith('/dashboard/marketplace')) return roles.includes('employer')
    if (pathname.startsWith('/dashboard/finance')) return roles.includes('finance') || roles.includes('finance_admin')
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
  
  if (roles.includes('mentor') && (!home || home === '/dashboard/student')) {
    home = '/dashboard/mentor';
  }

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isOpenRoute = openRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const loginPath = getLoginRouteForPath(pathname);
  const isSpecificLoginRoute = pathname.match(/^\/login\/(mentor|director|admin|student|sponsor|analyst|employer|finance)$/);

  if (isProtectedRoute && !isOpenRoute && !hasToken) {
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute) {
    if (isSpecificLoginRoute) {
      return NextResponse.next();
    }
    if (hasToken && home && (pathname === '/login' || pathname === '/login/')) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  if (hasToken && (pathname === '/dashboard/mfa-required' || pathname.startsWith('/dashboard/mfa-required/'))) {
    return NextResponse.next();
  }

  if (hasToken && pathname.startsWith('/dashboard') && roles.length > 0 && !pathname.startsWith('/dashboard/student')) {
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      return NextResponse.redirect(new URL(home, request.url));
    }

    if (!canAccess(pathname, roles)) {
      let redirectHome = home;
      if (roles.includes('mentor') && (!redirectHome || redirectHome === '/dashboard/student')) {
        redirectHome = '/dashboard/mentor';
      }
      return NextResponse.redirect(new URL(redirectHome, request.url));
    }
  }

  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
