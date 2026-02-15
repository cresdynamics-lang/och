/**
 * Authentication hook
 * Manages login, logout, token refresh, and user session
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { djangoClient } from '../services/djangoClient';
import { setAuthTokens, clearAuthTokens, getAccessToken, isAuthenticated } from '../utils/auth';
import type { LoginRequest, User } from '../services/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  /**
   * Load current user from API
   */
  const loadUser = useCallback(async () => {
    // Set loading state first
    setState(prev => ({ ...prev, isLoading: true }));
    
    if (!isAuthenticated()) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await djangoClient.auth.getCurrentUser();
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch (error: any) {
      // Don't log connection errors (backend not running) as errors - this is expected
      const isConnectionError = 
        error?.status === 0 ||
        error?.message?.includes('Cannot connect') ||
        error?.message?.includes('Network Error') ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('ECONNREFUSED');
      
      if (!isConnectionError) {
        console.error('Failed to load user:', error);
      }
      
      // Token invalid or expired - only clear if it's an auth error
      if (error?.status === 401 || error?.response?.status === 401) {
        clearAuthTokens();
        setState({ user: null, isLoading: false, isAuthenticated: false });
      } else {
        // For other errors (including connection errors), keep the token but mark as not authenticated
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      // Call Next.js API route (sets HttpOnly cookies)
      let response: Response;
      try {
        response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      } catch (fetchError: any) {
        // Catch network/connection errors
        const errorMsg = fetchError.message || 'Unknown error';
        const isConnectionError = 
          errorMsg.includes('fetch failed') ||
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('NetworkError') ||
          errorMsg.includes('ECONNREFUSED');
        
        const error = new Error(
          isConnectionError 
            ? 'Cannot connect to backend server. Please ensure the Django API is running on port 8000.'
            : `Network error: ${errorMsg}`
        );
        (error as any).data = { detail: error.message };
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || errorData.error || 'Login failed';
        const error = new Error(message);
        (error as any).data = errorData;
        (error as any).status = response.status;
        (error as any).code = errorData.code; // e.g. 'BAD_GATEWAY' for backend 5xx
        throw error;
      }

      const responseData = await response.json();
      console.log('Login response data:', { 
        hasUser: !!responseData.user, 
        hasAccessToken: !!responseData.access_token,
        keys: Object.keys(responseData)
      });
      
      // Check if MFA is required — return structured result (do not throw)
      if (responseData.mfa_required) {
        setState(prev => ({ ...prev, isLoading: false }));
        return {
          mfaRequired: true as const,
          refresh_token: responseData.refresh_token,
          session_id: responseData.session_id,
          mfa_method: responseData.mfa_method || 'totp',
        };
      }
      
      const { user, access_token, refresh_token } = responseData;

      // Store access token in localStorage for client-side requests
      if (!access_token) {
        console.error('No access_token in login response:', responseData);
        throw new Error('No access token received from login response');
      }

      // Store tokens immediately
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('auth_token', access_token); // backwards-compat
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      // Fetch full user profile with roles from /auth/me
      // Retry logic to ensure we get the full user profile
      let fullUser = user;
      let profileRetries = 0;
      const maxRetries = 3;
      
      while (profileRetries < maxRetries) {
        try {
          // Small delay to ensure token is available
          if (profileRetries > 0) {
            await new Promise(resolve => setTimeout(resolve, 200 * profileRetries));
          }
          
          console.log(`Fetching full user profile from /auth/me... (attempt ${profileRetries + 1})`);
          fullUser = await djangoClient.auth.getCurrentUser();
          console.log('✅ Full user profile received:', fullUser);
          console.log('User roles:', fullUser?.roles);
          
          // If we got a user with roles, break out of retry loop
          if (fullUser && fullUser.roles && fullUser.roles.length > 0) {
            break;
          }
        } catch (err: any) {
          console.warn(`⚠️ Attempt ${profileRetries + 1} failed to fetch full user profile:`, err?.message || err);
          profileRetries++;
          
          // If this is the last retry, use the user from login response
          if (profileRetries >= maxRetries) {
            console.warn('Using user from login response (may not have full role details)');
            break;
          }
        }
      }
      
      // Update state with authenticated user immediately
      setState({
        user: fullUser,
        isLoading: false,
        isAuthenticated: true,
      });
      
      console.log('✅ Login successful, returning user:', fullUser);
      return { user: fullUser, access_token: access_token };
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Complete MFA after login (when mfa_required was returned).
   * Call with refresh_token, code, and method from the MFA step.
   */
  const completeMFA = useCallback(async (params: {
    refresh_token: string;
    code: string;
    method: 'totp' | 'sms' | 'email' | 'backup_codes';
  }) => {
    const { access_token, refresh_token: newRefreshToken, user: userData } = await djangoClient.auth.completeMFA(params);
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('auth_token', access_token);
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    }
    let fullUser = userData;
    try {
      fullUser = await djangoClient.auth.getCurrentUser();
    } catch {
      fullUser = userData;
    }
    setState({ user: fullUser, isLoading: false, isAuthenticated: true });
    return { user: fullUser, access_token };
  }, []);

  /**
   * Send MFA challenge (SMS or email code). Call when user's method is sms/email.
   */
  const sendMFAChallenge = useCallback(async (refresh_token: string, method?: 'email' | 'sms') => {
    return djangoClient.auth.sendMFAChallenge(refresh_token, method);
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Call Next.js API route (clears HttpOnly cookies)
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      clearAuthTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      router.push('/login');
    }
  }, [router]);

  /**
   * Refresh access token
   */
  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await djangoClient.auth.refreshToken({ refresh_token: refreshToken });
      setAuthTokens(response.access_token, response.refresh_token);
      return response;
    } catch (error) {
      clearAuthTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      throw error;
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    ...state,
    login,
    logout,
    refresh,
    reloadUser: loadUser,
    completeMFA,
    sendMFAChallenge,
  };
}

