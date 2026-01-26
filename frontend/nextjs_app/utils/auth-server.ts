/**
 * Server-side authentication utilities
 * For use in Next.js Server Components and API Routes
 */

import { cookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const OCH_ROLES_COOKIE = 'och_roles';
const OCH_PRIMARY_ROLE_COOKIE = 'och_primary_role';
const OCH_DASHBOARD_COOKIE = 'och_dashboard';

/**
 * Get access token from cookies (server-side)
 */
export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

/**
 * Get refresh token from cookies (server-side)
 */
export async function getServerRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null;
}

/**
 * Set auth tokens in cookies (server-side)
 * Should be called from API routes or Server Actions
 */
export async function setServerAuthTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: false, // Allow client-side access for Authorization header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes (access token lifetime)
    path: '/',
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days (refresh token lifetime)
    path: '/',
  });
}

/**
 * Clear auth tokens from cookies (server-side)
 */
export async function clearServerAuthTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(OCH_ROLES_COOKIE);
  cookieStore.delete(OCH_PRIMARY_ROLE_COOKIE);
  cookieStore.delete(OCH_DASHBOARD_COOKIE);
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const token = await getServerAccessToken();
  return !!token;
}

/**
 * Get auth headers for server-side fetch requests
 */
export async function getServerAuthHeaders(): Promise<HeadersInit> {
  const token = await getServerAccessToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

