/**
 * Unified fetch utility with error handling and token management
 */

// Safe console.error wrapper that filters out empty objects
const safeConsoleError = (...args: any[]) => {
  // Helper function to check if an object is truly empty
  const isEmptyObject = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
      return false;
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return true; // Empty object {}
    }
    
    // Special handling for errorInfo objects
    const allowedKeys = ['url', 'status', 'statusText', 'errorData'];
    const hasErrorData = keys.includes('errorData');
    
    // If it has errorData, check if errorData is empty
    if (hasErrorData) {
      const errorData = obj.errorData;
      if (!errorData || 
          (typeof errorData === 'object' && 
           errorData !== null && 
           Object.keys(errorData).length === 0)) {
        // errorData is empty object {} or null/undefined
        // Only consider it non-empty if status is 500+ (server errors)
        if (obj.status && obj.status >= 500) {
          return false; // Server errors are meaningful even without errorData
        }
        return true; // Client errors with empty errorData are not meaningful
      }
      // errorData exists and is not empty - check if it has meaningful values
      if (typeof errorData === 'object' && errorData !== null) {
        const errorDataKeys = Object.keys(errorData);
        if (errorDataKeys.length === 0) {
          return true; // Empty errorData object
        }
        // Check if errorData has at least one non-empty value
        const hasMeaningfulValue = errorDataKeys.some(key => {
          const val = errorData[key];
          return val !== null && val !== undefined && val !== '' &&
                 (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0));
        });
        if (!hasMeaningfulValue) {
          return true; // errorData has no meaningful values
        }
      }
    } else {
      // No errorData property - only consider it non-empty if status is 500+ (server errors)
      const hasAllowedKeys = keys.some(key => allowedKeys.includes(key) && obj[key] != null && obj[key] !== '');
      if (hasAllowedKeys && obj.status && obj.status >= 500) {
        return false; // Server errors are meaningful even without errorData
      }
      if (hasAllowedKeys) {
        return true; // Client errors without errorData are not meaningful
      }
    }
    
    // For other objects, check if all values are empty
    return keys.every(key => {
      const val = obj[key];
      if (val === null || val === undefined || val === '') {
        return true;
      }
      if (typeof val === 'object' && val !== null) {
        return isEmptyObject(val); // Recursively check nested objects
      }
      return false;
    });
  };
  
  // First check: if any argument is an empty object {}, don't log at all
  // This is the PRIMARY defense against empty error objects
  const hasEmptyObject = args.some((arg, index) => {
    // Check if it's a string like "API Error:" followed by empty object
    if (typeof arg === 'string' && index < args.length - 1) {
      const nextArg = args[index + 1];
      if (isEmptyObject(nextArg)) {
        return true;
      }
    }
    // Check the argument itself
    if (isEmptyObject(arg)) {
      return true;
    }
    // Additional check: if it's an object with errorData that's empty
    if (arg && typeof arg === 'object' && !Array.isArray(arg) && arg !== null) {
      // Suppress 404 errors completely - they're expected for missing resources
      if (arg.status === 404) {
        return true; // Never log 404s
      }
      
      // Suppress errors from mentor-assignments endpoints (404s are expected)
      if (arg.url && (arg.url.includes('/mentor-assignments') || 
                      (arg.url.includes('/mentors/') && arg.url.includes('/assignments')))) {
        // Suppress 404s and empty errors for mentor-assignments
        if (arg.status === 404 || !arg.errorData || 
            (typeof arg.errorData === 'object' && arg.errorData !== null && Object.keys(arg.errorData).length === 0)) {
          return true; // Suppress mentor-assignments 404s and empty errors
        }
      }
      
      // Suppress errors from capstones endpoints (404s are expected when mentor has no capstones)
      if (arg.url && (arg.url.includes('/capstones') || arg.url.includes('/capstone'))) {
        // Suppress 404s and empty errors for capstones
        if (arg.status === 404 || !arg.errorData || 
            (typeof arg.errorData === 'object' && arg.errorData !== null && Object.keys(arg.errorData).length === 0)) {
          return true; // Suppress capstones 404s and empty errors
        }
      }
      
      if ('errorData' in arg) {
        const errorData = arg.errorData;
        if (!errorData || 
            (typeof errorData === 'object' && 
             errorData !== null && 
             Object.keys(errorData).length === 0)) {
          // errorData is empty - only allow if it's a server error
          if (!arg.status || arg.status < 500) {
            return true; // Suppress client errors with empty errorData
          }
        }
      }
    }
    return false;
  });
  
  // If we found an empty object, don't log anything
  if (hasEmptyObject) {
    return; // Silently skip logging - this is the final defense
  }
  
  // Filter out empty/null/undefined arguments and empty objects
  const filteredArgs = args.filter(arg => {
    if (arg === null || arg === undefined) return false;
    if (isEmptyObject(arg)) return false;
    if (typeof arg === 'string' && arg.trim() === '') return false;
    return true;
  });
  
  // Only log if we have meaningful content
  if (filteredArgs.length > 0) {
    console.error(...filteredArgs);
  }
};

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
      
      // Log error for debugging (but not for connection errors or empty errors)
      // Completely suppress empty error objects and 404s
      if (typeof window !== 'undefined' && response.status !== 0) {
        // Check if this is a mentor-assignments endpoint (404s are expected)
        const isMentorAssignmentsEndpoint = urlObj.pathname.includes('/mentor-assignments') || 
                                           (urlObj.pathname.includes('/mentors/') && urlObj.pathname.includes('/assignments'));
        
        // Check if this is a capstones endpoint (404s are expected when mentor has no capstones)
        const isCapstonesEndpoint = urlObj.pathname.includes('/capstones') || urlObj.pathname.includes('/capstone');
        
        // Check if errorData has meaningful content
        let hasErrorData = false;
        if (errorData) {
          if (typeof errorData === 'object' && errorData !== null) {
            // Check if object has any non-empty properties
            const keys = Object.keys(errorData);
            hasErrorData = keys.length > 0 && 
                          keys.some(key => {
                            const val = errorData[key];
                            return val !== null && val !== undefined && val !== '' && 
                                   (typeof val !== 'object' || Object.keys(val).length > 0);
                          });
          } else if (typeof errorData === 'string') {
            hasErrorData = errorData.trim().length > 0;
          } else {
            hasErrorData = true; // Other types (number, boolean, etc.)
          }
        }
        
        const isServerError = response.status >= 500;
        const isNotFound = response.status === 404;
        
        // CRITICAL: NEVER log mentor-assignments or capstones errors - return early to prevent any logging
        // This must happen BEFORE any other checks to ensure complete suppression
        if (isMentorAssignmentsEndpoint || isCapstonesEndpoint) {
          // Completely suppress mentor-assignments and capstones errors - don't log anything
          // 404s are expected when mentors have no assignments or capstones
          return;
        }
        
        // NEVER log empty objects or 404s
        // Only proceed if we have meaningful error data AND it's not a 404
        if (!isNotFound && hasErrorData) {
          // Double-check errorData is not empty before creating errorInfo
          let finalErrorData = null;
          if (errorData) {
            if (typeof errorData === 'object' && errorData !== null) {
              // Only use if it has non-empty properties
              const nonEmptyKeys = Object.keys(errorData).filter(key => {
                const val = errorData[key];
                return val !== null && val !== undefined && val !== '' && 
                       (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0));
              });
              if (nonEmptyKeys.length > 0) {
                // Create a filtered object with only non-empty properties
                finalErrorData = {};
                nonEmptyKeys.forEach(key => {
                  finalErrorData[key] = errorData[key];
                });
              }
            } else {
              finalErrorData = errorData;
            }
          }
          
          // Only log if we have finalErrorData with content
          // Final validation: ensure finalErrorData is not empty object
          if (finalErrorData && 
              (typeof finalErrorData !== 'object' || 
               (finalErrorData !== null && Object.keys(finalErrorData).length > 0))) {
            const errorInfo: any = {
              url: urlObj.toString(),
              status: response.status,
              statusText: response.statusText,
            };
            
            // Only add errorData if it has content (double-check it's not empty)
            // CRITICAL: Never add empty object {} as errorData
            const hasValidFinalErrorData = finalErrorData && 
                (typeof finalErrorData !== 'object' || 
                 (finalErrorData !== null && 
                  Object.keys(finalErrorData).length > 0 &&
                  Object.values(finalErrorData).some(val => 
                    val !== null && val !== undefined && val !== '' &&
                    (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0))
                  )));
            
            if (hasValidFinalErrorData) {
              errorInfo.errorData = finalErrorData;
            }
            
            // CRITICAL: Final check - ensure errorData is not an empty object before logging
            const hasValidErrorData = errorInfo.errorData && 
                (typeof errorInfo.errorData !== 'object' || 
                 (errorInfo.errorData !== null && 
                  Object.keys(errorInfo.errorData).length > 0 &&
                  Object.values(errorInfo.errorData).some(val => 
                    val !== null && val !== undefined && val !== '' &&
                    (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0))
                  )));
            
            // CRITICAL: Double-check for mentor-assignments and capstones endpoints - NEVER log errors for these
            // This is a final safety check to prevent any mentor-assignments or capstones errors from being logged
            const finalUrlCheck = errorInfo.url || urlObj.toString();
            const isMentorAssignmentsFinal = finalUrlCheck.includes('/mentor-assignments') || 
                                           (finalUrlCheck.includes('/mentors/') && finalUrlCheck.includes('/assignments'));
            const isCapstonesFinal = finalUrlCheck.includes('/capstones') || finalUrlCheck.includes('/capstone');
            
            // NEVER log mentor-assignments or capstones errors (404s are expected)
            if (isMentorAssignmentsFinal || isCapstonesFinal) {
              // Completely suppress - don't log anything for mentor-assignments or capstones
              return;
            }
            
            // Only log if errorInfo has meaningful content
            // Don't log if errorInfo only has url/status/statusText but no errorData (unless server error)
            if (hasValidErrorData) {
              safeConsoleError('API Error:', errorInfo);
            } else if (response.status >= 500) {
              // For server errors, log even without errorData but with minimal info
              safeConsoleError('API Error:', {
                url: errorInfo.url,
                status: errorInfo.status,
                statusText: errorInfo.statusText
              });
            }
            // Otherwise, don't log at all (suppress empty errorInfo)
          }
        } else if (isServerError && hasErrorData) {
          // Log server errors only if they have meaningful error data
          let finalErrorData = null;
          if (errorData) {
            if (typeof errorData === 'object' && errorData !== null) {
              const nonEmptyKeys = Object.keys(errorData).filter(key => {
                const val = errorData[key];
                return val !== null && val !== undefined && val !== '' && 
                       (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0));
              });
              if (nonEmptyKeys.length > 0) {
                finalErrorData = {};
                nonEmptyKeys.forEach(key => {
                  finalErrorData[key] = errorData[key];
                });
              }
            } else {
              finalErrorData = errorData;
            }
          }
          
          // Final validation: ensure finalErrorData is not empty object
          if (finalErrorData && 
              (typeof finalErrorData !== 'object' || 
               (finalErrorData !== null && Object.keys(finalErrorData).length > 0))) {
            const errorInfo: any = {
              url: urlObj.toString(),
              status: response.status,
              statusText: response.statusText,
            };
            
            // Only add errorData if it has content (double-check it's not empty)
            // CRITICAL: Never add empty object {} as errorData
            const hasValidFinalErrorData = finalErrorData && 
                (typeof finalErrorData !== 'object' || 
                 (finalErrorData !== null && 
                  Object.keys(finalErrorData).length > 0 &&
                  Object.values(finalErrorData).some(val => 
                    val !== null && val !== undefined && val !== '' &&
                    (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0))
                  )));
            
            if (hasValidFinalErrorData) {
              errorInfo.errorData = finalErrorData;
            }
            
            // CRITICAL: Final check - ensure errorData is not an empty object before logging
            const hasValidErrorData = errorInfo.errorData && 
                (typeof errorInfo.errorData !== 'object' || 
                 (errorInfo.errorData !== null && 
                  Object.keys(errorInfo.errorData).length > 0 &&
                  Object.values(errorInfo.errorData).some(val => 
                    val !== null && val !== undefined && val !== '' &&
                    (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0))
                  )));
            
            // Only log if errorInfo has meaningful content
            // Don't log if errorInfo only has url/status/statusText but no errorData (unless server error)
            if (hasValidErrorData) {
              safeConsoleError('API Error:', errorInfo);
            } else if (response.status >= 500) {
              // For server errors, log even without errorData but with minimal info
              safeConsoleError('API Error:', {
                url: errorInfo.url,
                status: errorInfo.status,
                statusText: errorInfo.statusText
              });
            }
            // Otherwise, don't log at all (suppress empty errorInfo)
          }
        }
        // Completely suppress: 404s, empty objects, client errors without error data
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isConnectionError = 
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('ECONNREFUSED') ||
      (error as any)?.code === 'ECONNREFUSED';
    
    // Don't log connection errors to console if backend is down (expected behavior)
    if (!isConnectionError && typeof window !== 'undefined') {
      safeConsoleError('[fetcher] Network error:', error);
    }
    
    throw new ApiError(
      0,
      'Network Error',
      null,
      isConnectionError 
        ? 'Cannot connect to backend server'
        : errorMessage
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

