/**
 * Next.js API Route: Login
 * Handles login and sets HttpOnly cookies for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LoginRequest, LoginResponse } from '@/services/types';

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
  // de-dupe
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
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log('[Login API] Received login attempt:', { email, passwordLength: password?.length });

    // Forward authentication to Django backend
    const djangoUrl = `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8002'}/api/v1/auth/login`;
    console.log('[Login API] Forwarding to Django URL:', djangoUrl);

    const djangoResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('[Login API] Django response status:', djangoResponse.status);

    if (!djangoResponse.ok) {
      console.log('[Login API] Django auth failed with status:', djangoResponse.status);
      const errorText = await djangoResponse.text();
      console.log('[Login API] Django error response:', errorText);
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: 'Invalid credentials'
        },
        { status: 401 }
      );
    }

    const djangoData = await djangoResponse.json();
    console.log('[Login API] Django auth successful for user:', djangoData.user?.email);

    // Use the Django response data
    const loginResponse = djangoData;

    // Create the response (include refresh_token so client can store it for auto-refresh)
    const nextResponse = NextResponse.json({
      user: loginResponse.user,
      access_token: loginResponse.access_token,
      refresh_token: loginResponse.refresh_token,
    });

    // Set RBAC cookies for middleware enforcement (HttpOnly so client can't tamper)
    const normalizedRoles = extractNormalizedRoles(loginResponse.user)
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
    // Try to get track info from user data
    const trackKey = loginResponse.user?.track_key || '';

    nextResponse.cookies.set('user_track', trackKey, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    // Set cookies directly on the response object
    if (loginResponse.access_token) {
      nextResponse.cookies.set('access_token', loginResponse.access_token, {
        httpOnly: false, // Allow client-side access for Authorization header
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days (matches refresh token)
        path: '/',
      });
    }

    if (loginResponse.refresh_token) {
      nextResponse.cookies.set('refresh_token', loginResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Login API route error:', error);

    return NextResponse.json(
      {
        error: 'Login failed',
        detail: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

