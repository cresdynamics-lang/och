/**
 * Authentication utilities for token management
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
// Legacy key used by older axios clients in this repo
const LEGACY_AUTH_TOKEN_KEY = 'auth_token';
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Set auth tokens in cookies (HttpOnly for security) and localStorage (fallback)
 */
export function setAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;

  // Set in localStorage as fallback
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Set in cookies (should be HttpOnly in production via API route)
  // For now, we'll set them here, but ideally this should be done server-side
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

/**
 * Get access token from cookies or localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try cookies first
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }

  // Fallback to localStorage
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
}

/**
 * Get refresh token from cookies or localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try cookies first
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith(`${REFRESH_TOKEN_COOKIE}=`));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }

  // Fallback to localStorage
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear auth tokens
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  // Clear cookies
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; max-age=0`;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Decode JWT token (client-side only, for display purposes)
 * Note: This does NOT verify the token signature - that's done server-side
 */
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired (client-side check only)
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}



