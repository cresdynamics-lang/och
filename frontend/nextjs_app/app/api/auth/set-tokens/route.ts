/**
 * Set auth cookies after MFA complete (or when tokens are obtained outside login API).
 * Middleware reads access_token cookie; without it, post-MFA redirect would send user back to login.
 */
import { NextResponse } from 'next/server';

function normalizeRoleName(roleName: string): string {
  const normalized = (roleName || '').toLowerCase().trim()
  if (normalized === 'program_director' || normalized === 'director') return 'program_director'
  if (normalized === 'sponsor_admin' || normalized === 'sponsor') return 'sponsor_admin'
  if (normalized === 'finance' || normalized === 'finance_admin') return 'finance'
  return normalized
}

function extractNormalizedRoles(user: any): string[] {
  const rolesRaw = user?.roles || []
  if (!Array.isArray(rolesRaw)) {
    const singleRole = user?.role
    return singleRole ? [normalizeRoleName(String(singleRole))] : []
  }
  const roles = rolesRaw
    .map((ur: any) => normalizeRoleName(String(typeof ur === 'string' ? ur : (ur?.role || ur?.name || ''))))
    .filter(Boolean)
  return Array.from(new Set(roles))
}

function getPrimaryRole(roles: string[]): string | null {
  if (roles.includes('admin')) return 'admin'
  const priority = ['program_director', 'finance', 'mentor', 'analyst', 'sponsor_admin', 'employer', 'mentee', 'student']
  for (const r of priority) {
    if (roles.includes(r)) return r
  }
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
    case 'finance': return '/finance/dashboard'
    case 'mentee':
    case 'student': return '/dashboard/student'
    default: return '/dashboard/student'
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access_token = body?.access_token;
    const refresh_token = body?.refresh_token;
    const user = body?.user;

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json(
        { error: 'Missing access_token' },
        { status: 400 }
      );
    }

    const nextResponse = NextResponse.json({ ok: true }, { status: 200 });

    const cookieOptions = {
      secure: false, // Set to true only when using HTTPS
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    };

    nextResponse.cookies.set('access_token', access_token, {
      ...cookieOptions,
      httpOnly: false,
    });

    if (refresh_token && typeof refresh_token === 'string') {
      nextResponse.cookies.set('refresh_token', refresh_token, {
        ...cookieOptions,
        httpOnly: true,
      });
    }

    // Set role cookies if user data provided
    if (user) {
      const normalizedRoles = extractNormalizedRoles(user)
      const primaryRole = getPrimaryRole(normalizedRoles)
      
      nextResponse.cookies.set('och_roles', JSON.stringify(normalizedRoles), {
        ...cookieOptions,
        httpOnly: true,
      })
      nextResponse.cookies.set('och_primary_role', primaryRole || '', {
        ...cookieOptions,
        httpOnly: true,
      })
      nextResponse.cookies.set('och_dashboard', getDashboardForRole(primaryRole), {
        ...cookieOptions,
        httpOnly: true,
      })
      
      const trackKey = user?.track_key || '';
      nextResponse.cookies.set('user_track', trackKey, {
        ...cookieOptions,
        httpOnly: false,
      })
    }

    return nextResponse;
  } catch (e) {
    console.error('[set-tokens] Error:', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
