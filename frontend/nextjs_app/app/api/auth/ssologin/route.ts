/**
 * Next.js API Route: SSO Login
 * Sets auth cookies from OAuth tokens returned by backend (Django)
 */

import { NextRequest, NextResponse } from 'next/server';

function normalizeRoleName(roleName: string): string {
  const normalized = (roleName || '').toLowerCase().trim()
  if (normalized === 'program_director' || normalized === 'program director' || normalized === 'programdirector' || normalized === 'director') return 'program_director'
  if (normalized === 'mentee') return 'mentee'
  if (normalized === 'student') return 'student'
  if (normalized === 'mentor') return 'mentor'
  if (normalized === 'admin') return 'admin'
  if (normalized === 'sponsor_admin' || normalized === 'sponsor' || normalized === 'sponsor/employer admin' || normalized === 'sponsoremployer admin') return 'sponsor_admin'
  if (normalized === 'analyst') return 'analyst'
  if (normalized === 'employer') return 'employer'
  if (normalized === 'finance' || normalized === 'finance_admin') return 'finance'
  return normalized
}

function extractNormalizedRoles(user: any): string[] {
  const rolesRaw = user?.roles || []
  if (!Array.isArray(rolesRaw)) return []
  const roles = rolesRaw
    .map((ur: any) => {
      const roleValue = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      return normalizeRoleName(String(roleValue || ''))
    })
    .filter(Boolean)
  return Array.from(new Set(roles))
}

function getPrimaryRole(roles: string[]): string | null {
  if (roles.includes('admin')) return 'admin'
  const priority = ['program_director', 'finance', 'mentor', 'analyst', 'sponsor_admin', 'employer', 'mentee', 'student']
  for (const r of priority) if (roles.includes(r)) return r
  return roles[0] || null
}

function getDashboardForRole(role: string | null): string {
  switch (role) {
    case 'admin': return '/dashboard/admin'
    case 'program_director': return '/dashboard/director'
    case 'mentor': return '/dashboard/mentor'
    case 'analyst': return '/dashboard/analyst'
    case 'sponsor_admin': return '/dashboard/sponsor'
    case 'employer': return '/dashboard/employer'
    case 'finance': return '/dashboard/finance'
    case 'mentee':
    case 'student':
    default:
      return '/dashboard/student'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, user } = body || {};

    if (!access_token || !user) {
      return NextResponse.json({
        error: 'Invalid SSO payload',
        detail: 'Missing access_token or user in request body',
      }, { status: 400 });
    }

    const nextResponse = NextResponse.json({
      user,
      access_token,
    });

    // RBAC cookies for middleware
    const normalizedRoles = extractNormalizedRoles(user)
    const primaryRole = getPrimaryRole(normalizedRoles)
    nextResponse.cookies.set('och_roles', JSON.stringify(normalizedRoles), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    nextResponse.cookies.set('och_primary_role', primaryRole || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    nextResponse.cookies.set('och_dashboard', getDashboardForRole(primaryRole), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    // Access token (readable by client for Authorization header)
    nextResponse.cookies.set('access_token', access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    })

    // Refresh token (HttpOnly for server refresh flow), optional
    if (refresh_token) {
      nextResponse.cookies.set('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }

    return nextResponse;
  } catch (error: any) {
    console.error('SSO Login API route error:', error);
    return NextResponse.json({
      error: 'SSO login failed',
      detail: error?.message || 'Unknown error',
    }, { status: 500 })
  }
}
