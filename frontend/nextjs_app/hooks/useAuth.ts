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
      console.error('Failed to load user:', error);
      // Token invalid or expired - only clear if it's an auth error
      if (error?.status === 401 || error?.response?.status === 401) {
        clearAuthTokens();
        setState({ user: null, isLoading: false, isAuthenticated: false });
      } else {
        // For other errors, keep the token but mark as not authenticated
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
        const error = new Error(errorData.detail || errorData.error || 'Login failed');
        (error as any).data = errorData;
        throw error;
      }

      const responseData = await response.json();
      console.log('Login response data:', { 
        hasUser: !!responseData.user, 
        hasAccessToken: !!responseData.access_token,
        keys: Object.keys(responseData)
      });
      
      // Check if MFA is required
      if (responseData.mfa_required) {
        const error = new Error('MFA required');
        (error as any).mfa_required = true;
        (error as any).session_id = responseData.session_id;
        (error as any).data = responseData;
        throw error;
      }
      
      const { user, access_token } = responseData;
      
      // Store access token in localStorage for client-side requests
      // Refresh token is already in HttpOnly cookie
      if (!access_token) {
        console.error('No access_token in login response:', responseData);
        throw new Error('No access token received from login response');
      }
      
      // Store token immediately and verify it's stored
      localStorage.setItem('access_token', access_token);
      // Backwards-compat for older clients in this repo still using `auth_token`
      localStorage.setItem('auth_token', access_token);
      
      // Verify token is stored (with retry)
      let storedToken = localStorage.getItem('access_token');
      let retries = 0;
      while (!storedToken && retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 50));
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('auth_token', access_token);
        storedToken = localStorage.getItem('access_token');
        retries++;
      }
      
      if (!storedToken || storedToken !== access_token) {
        console.error('Failed to store access token in localStorage');
        throw new Error('Failed to store authentication token');
      }
      
      console.log('✅ Access token stored successfully in localStorage');
      
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
  };
}

