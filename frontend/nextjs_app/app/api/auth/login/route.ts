/**
 * Next.js API Route: Login
 * Handles login and sets HttpOnly cookies for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LoginRequest, LoginResponse } from '@/services/types';

function normalizeRoleName(roleName: string): string {
  const normalized = (roleName || '').toLowerCase().trim()
  console.log('[Role Normalization] Input:', roleName, 'Normalized:', normalized)

  if (normalized === 'program_director' || normalized === 'program director' || normalized === 'programdirector' || normalized === 'director') return 'program_director'
  if (normalized === 'mentee') return 'mentee'
  if (normalized === 'student') return 'student'
  if (normalized === 'mentor') return 'mentor'
  if (normalized === 'admin') return 'admin'
  if (normalized === 'sponsor_admin' || normalized === 'sponsor' || normalized === 'sponsor/employer admin' || normalized === 'sponsoremployer admin') {
    console.log('[Role Normalization] Converting sponsor to sponsor_admin')
    return 'sponsor_admin'
  }
  if (normalized === 'analyst') return 'analyst'
  if (normalized === 'employer') return 'employer'
  if (normalized === 'finance' || normalized === 'finance_admin') return 'finance'
  return normalized
}

function extractNormalizedRoles(user: any): string[] {
  console.log('[Role Extraction] Full user object:', JSON.stringify(user, null, 2))
  const rolesRaw = user?.roles || []
  console.log('[Role Extraction] Raw roles from user.roles:', rolesRaw, 'Type:', typeof rolesRaw, 'Is Array:', Array.isArray(rolesRaw))

  if (!Array.isArray(rolesRaw)) {
    console.log('[Role Extraction] rolesRaw is not an array, trying user.role:', user?.role)
    // Fallback: if roles is not an array, try to use the single role field
    const singleRole = user?.role
    if (singleRole) {
      const normalized = normalizeRoleName(String(singleRole))
      console.log('[Role Extraction] Using single role:', singleRole, '->', normalized)
      return [normalized]
    }
    return []
  }

  const roles = rolesRaw
    .map((ur: any) => {
      const roleValue = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      const normalized = normalizeRoleName(String(roleValue || ''))
      console.log('[Role Extraction] Processing:', roleValue, '->', normalized)
      return normalized
    })
    .filter(Boolean)
  // de-dupe
  const uniqueRoles = Array.from(new Set(roles))
  console.log('[Role Extraction] Final unique roles:', uniqueRoles)
  return uniqueRoles
}

function getPrimaryRole(roles: string[]): string | null {
  console.log('[Primary Role] Available roles:', roles)
  if (roles.includes('admin')) {
    console.log('[Primary Role] Selected: admin')
    return 'admin'
  }
  const priority = ['program_director', 'finance', 'mentor', 'analyst', 'sponsor_admin', 'employer', 'mentee', 'student']
  for (const r of priority) {
    if (roles.includes(r)) {
      console.log('[Primary Role] Selected:', r)
      return r
    }
  }
  const fallback = roles[0] || null
  console.log('[Primary Role] Fallback to:', fallback)
  return fallback
}

function getDashboardForRole(role: string | null): string {
  console.log('[Dashboard Routing] Input role:', role)
  let dashboard: string
  switch (role) {
    case 'admin': dashboard = '/dashboard/admin'; break
    case 'program_director': dashboard = '/dashboard/director'; break
    case 'mentor': dashboard = '/mentor/dashboard'; break
    case 'analyst': dashboard = '/dashboard/analyst'; break
    case 'sponsor_admin': dashboard = '/dashboard/sponsor'; break
    case 'employer': dashboard = '/dashboard/employer'; break
    case 'finance': dashboard = '/dashboard/finance'; break
    case 'mentee':
    case 'student': dashboard = '/dashboard/student'; break
    default:
      dashboard = '/dashboard/student'
  }
  console.log('[Dashboard Routing] Selected dashboard:', dashboard)
  return dashboard
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log('[Login API] Received login attempt:', { email, passwordLength: password?.length });

    // Forward authentication to Django backend
    // Use NEXT_PUBLIC_DJANGO_API_URL for client-side, but for server-side API routes,
    // we can use DJANGO_API_URL or fallback to localhost
    const djangoUrl = process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
    const apiUrl = `${djangoUrl}/api/v1/auth/login`;
    console.log('[Login API] Forwarding to API URL:', apiUrl);
    console.log('[Login API] DJANGO_API_URL env:', process.env.DJANGO_API_URL);
    console.log('[Login API] NEXT_PUBLIC_DJANGO_API_URL env:', process.env.NEXT_PUBLIC_DJANGO_API_URL);

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('[Login API] API response status:', apiResponse.status);

    if (!apiResponse.ok) {
      console.log('[Login API] API auth failed with status:', apiResponse.status);
      const errorText = await apiResponse.text();
      console.log('[Login API] API error response:', errorText);
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: 'Invalid credentials'
        },
        { status: 401 }
      );
    }

    const apiData = await apiResponse.json();
    console.log('[Login API] API response status:', apiResponse.status);
    console.log('[Login API] API response keys:', Object.keys(apiData));
    console.log('[Login API] Has access_token:', !!apiData.access_token);
    console.log('[Login API] Has refresh_token:', !!apiData.refresh_token);
    console.log('[Login API] Has mfa_required:', !!apiData.mfa_required);

    // Check if MFA is required
    if (apiData.mfa_required) {
      console.log('[Login API] MFA required for user');
      return NextResponse.json({
        mfa_required: true,
        session_id: apiData.session_id,
        detail: apiData.detail || 'MFA required',
      }, { status: 200 });
    }

    // Use the API response data
    const loginResponse = apiData;
    console.log('[Login API] API auth successful for user:', loginResponse.user?.email);
    console.log('[Login API] Full login response:', JSON.stringify(loginResponse, null, 2));

    // Ensure access_token exists
    if (!loginResponse.access_token) {
      console.error('[Login API] ERROR: No access_token in Django response!');
      console.error('[Login API] Response structure:', JSON.stringify(loginResponse, null, 2));
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: 'No access token received from backend. Please check backend logs.',
        },
        { status: 500 }
      );
    }

    // Create the response (include refresh_token so client can store it for auto-refresh)
    const nextResponse = NextResponse.json({
      user: loginResponse.user,
      access_token: loginResponse.access_token,
      refresh_token: loginResponse.refresh_token,
    });
    
    console.log('[Login API] Next.js response includes access_token:', !!nextResponse.body);

    // Set RBAC cookies for middleware enforcement (HttpOnly so client can't tamper)
    const normalizedRoles = extractNormalizedRoles(loginResponse.user)
    const primaryRole = getPrimaryRole(normalizedRoles)
    console.log('[Login API] Final results - Normalized roles:', normalizedRoles, 'Primary role:', primaryRole);
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
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);

    // Check if it's a connection error
    const isConnectionError = 
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.code === 'ECONNREFUSED' ||
      error?.cause?.code === 'ECONNREFUSED';

    if (isConnectionError) {
      return NextResponse.json(
        {
          error: 'Connection failed',
          detail: 'Cannot connect to backend server. Please ensure the Django API is running on port 8000.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Login failed',
        detail: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

