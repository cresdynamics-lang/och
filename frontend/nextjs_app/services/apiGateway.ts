/**
 * Unified API Gateway
 * Routes requests to Django or FastAPI based on path patterns
 * Handles authentication, error handling, and token refresh
 */

import { fetcher, ApiError, FetchOptions } from '../utils/fetcher';
import { getRefreshToken, setAuthTokens, clearAuthTokens } from '../utils/auth';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './types';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || '';
const FASTAPI_API_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || '';

/**
 * Determine if a path should go to Django or FastAPI
 */
function getBaseUrl(path: string): string {
  // FastAPI routes (AI, recommendations, embeddings, personality, profiling)
  const fastApiPaths = [
    '/recommendations',
    '/embeddings',
    '/personality',
    '/ai/',
    '/profiling',  // FastAPI profiling endpoints
  ];

  // Recipes routes - serve from local Next.js API
  if (path.startsWith('/recipes')) {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`;
    }
    // For SSR, get the port from environment or assume default
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}/api`;
  }

  // Check if path already includes /api/v1
  if (path.startsWith('/api/v1/')) {
    return DJANGO_API_URL;
  }

  const isFastApi = fastApiPaths.some(prefix => path.startsWith(prefix));

  if (isFastApi) {
    return `${FASTAPI_API_URL}/api/v1`;
  }

  // Default to Django
  return `${DJANGO_API_URL}/api/v1`;
}

/**
 * Check if error is a 401 Unauthorized (token expired)
 */
function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetcher<RefreshTokenResponse>(
      `${DJANGO_API_URL}/api/v1/auth/token/refresh`,
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
        skipAuth: true,
      }
    );

    if (response.access_token && response.refresh_token) {
      setAuthTokens(response.access_token, response.refresh_token);
      return response.access_token;
    }
  } catch (error) {
    // Refresh failed, clear tokens
    clearAuthTokens();
  }

  return null;
}

/**
 * API Gateway request handler with automatic token refresh
 */
async function apiGatewayRequest<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const baseUrl = getBaseUrl(path);
  const fullUrl = `${baseUrl}${path}`;

  console.log('[apiGateway] Making request to:', fullUrl);
  console.log('[apiGateway] Params:', options.params);

  try {
    const result = await fetcher<T>(fullUrl, options);
    console.log('[apiGateway] Response received:', result);
    return result;
  } catch (error) {
    // If unauthorized and we have a refresh token, try to refresh
    // Only attempt refresh client-side (not in SSR)
    if (
      typeof window !== 'undefined' &&
      isUnauthorizedError(error) &&
      getRefreshToken() &&
      !options.skipAuth
    ) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // Retry the original request with new token
        return await fetcher<T>(fullUrl, options);
      }
    }
    throw error;
  }
}

/**
 * API Gateway methods
 */
export const apiGateway = {
  /**
   * GET request
   */
  async get<T>(path: string, options?: FetchOptions): Promise<T> {
    return apiGatewayRequest<T>(path, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(path: string, data?: any, options?: FetchOptions): Promise<T> {
    // Handle FormData - don't stringify or set Content-Type
    const isFormData = data instanceof FormData;
    const headers = isFormData
      ? (() => {
          // Normalize HeadersInit to a plain object and remove Content-Type
          const raw = options?.headers as HeadersInit | undefined;
          let base: Record<string, string> = {};
          if (raw instanceof Headers) {
            base = Object.fromEntries(Array.from(raw.entries()));
          } else if (Array.isArray(raw)) {
            base = Object.fromEntries(raw as Array<[string, string]>);
          } else if (raw) {
            base = { ...(raw as Record<string, string>) };
          }
          delete base['Content-Type'];
          return base;
        })()
      : { 'Content-Type': 'application/json', ...(options?.headers as any) };
    
    return apiGatewayRequest<T>(path, {
      ...options,
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      headers,
    });
  },

  /**
   * PUT request
   */
  async put<T>(path: string, data?: any, options?: FetchOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return apiGatewayRequest<T>(path, {
      ...options,
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      headers: isFormData 
        ? (options?.headers as any)
        : { 'Content-Type': 'application/json', ...(options?.headers as any) },
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(path: string, data?: any, options?: FetchOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return apiGatewayRequest<T>(path, {
      ...options,
      method: 'PATCH',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      headers: isFormData 
        ? (options?.headers as any)
        : { 'Content-Type': 'application/json', ...(options?.headers as any) },
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: FetchOptions): Promise<T> {
    return apiGatewayRequest<T>(path, { ...options, method: 'DELETE' });
  },
};

export default apiGateway;

