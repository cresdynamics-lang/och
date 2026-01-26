/**
 * Unified fetch utility with error handling and token management
 */

export interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Get auth token from localStorage (for CSR) or cookies (for SSR)
 * Note: HttpOnly cookies cannot be read by JavaScript, so we prioritize localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    // SSR: Token should be passed via headers from server
    return null;
  }
  // CSR: Get from localStorage first (since HttpOnly cookies can't be read)
  const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  if (token) {
    return token;
  }
  // Fallback to cookie (non-HttpOnly cookies only)
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('access_token='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  return null;
}

/**
 * Unified fetch wrapper with error handling
 */
export async function fetcher<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, skipAuth = false, ...fetchOptions } = options;

  // Build URL with query params
  const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
  }

  console.log('[fetcher] Final URL with params:', urlObj.toString());

  // Set headers - don't set Content-Type for FormData (browser will set it with boundary)
  const isFormData = fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      console.log('[fetcher] Adding Authorization header with token (length:', token.length, ')');
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('[fetcher] ⚠️ NO TOKEN FOUND - Request will be unauthenticated!');
    }
  }

  try {
    const response = await fetch(urlObj.toString(), {
      ...fetchOptions,
      headers,
      credentials: 'include', // Send cookies cross-origin for OAuth session
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData = null;
      try {
        const text = await response.text();
        if (text) {
          errorData = isJson ? JSON.parse(text) : text;
        }
      } catch (e) {
        // If parsing fails, errorData remains null
      }
      
      // Log error for debugging
      if (typeof window !== 'undefined') {
        console.error('API Error:', {
          url: urlObj.toString(),
          status: response.status,
          statusText: response.statusText,
          errorData
        });
      }
      
      throw new ApiError(
        response.status,
        response.statusText,
        errorData,
        errorData?.error || errorData?.detail || errorData?.message || `HTTP ${response.status}`
      );
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as T;
    }

    // Get the raw response text first for debugging
    const responseText = await response.text();
    console.log('[fetcher] Raw response text:', responseText.substring(0, 500));
    
    const result = isJson ? (JSON.parse(responseText) as T) : (responseText as T);
    console.log('[fetcher] Parsed response:', result);
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new ApiError(
      0,
      'Network Error',
      null,
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

/**
 * GET request helper
 */
export function get<T>(url: string, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export function post<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export function put<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export function patch<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function del<T>(url: string, options?: FetchOptions): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'DELETE' });
}

