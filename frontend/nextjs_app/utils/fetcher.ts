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
        // Check if errorData has at least one meaningful value (including boolean false)
        const hasMeaningfulValue = errorDataKeys.some(key => {
          const val = errorData[key];
          return val !== null && val !== undefined &&
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
      // Also check if nextArg only has basic fields (url, status, statusText) with no meaningful data
      if (nextArg && typeof nextArg === 'object' && !Array.isArray(nextArg)) {
        const keys = Object.keys(nextArg);
        const basicFields = ['url', 'status', 'statusText'];
        const hasOnlyBasicFields = keys.length <= 3 && 
          keys.every(k => basicFields.includes(k));
        
        // Also check if all non-basic fields are empty
        const nonBasicFields = keys.filter(k => !basicFields.includes(k));
        const allNonBasicEmpty = nonBasicFields.length === 0 || nonBasicFields.every(k => {
          const val = nextArg[k];
          if (val === null || val === undefined || val === '') return true;
          if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return true;
          return false;
        });
        
        if (hasOnlyBasicFields || allNonBasicEmpty) {
          return true; // Suppress - only has basic fields or all non-basic fields are empty
        }
      }
    }
    // Check the argument itself
    if (isEmptyObject(arg)) {
      return true;
    }
    // Additional check: if errorInfo has only url/status/statusText but no errorData, suppress it
    if (arg && typeof arg === 'object' && !Array.isArray(arg) && arg !== null) {
      const keys = Object.keys(arg);
      const hasOnlyBasicFields = keys.length <= 3 && 
        keys.every(k => ['url', 'status', 'statusText'].includes(k));
      
      // Check if there are any meaningful non-basic fields
      const hasMeaningfulFields = keys.some(k => {
        if (['url', 'status', 'statusText'].includes(k)) return false;
        const value = arg[k];
        if (value === null || value === undefined || value === '') return false;
        if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
        return true;
      });
      
      // Suppress if it only has basic fields and no meaningful other fields
      if (hasOnlyBasicFields && !hasMeaningfulFields) {
        return true; // Suppress errors with only basic fields and no meaningful data
      }
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
      } else {
        // No errorData property - check if it's a client error with only basic fields
        const keys = Object.keys(arg);
        const hasOnlyBasicFields = keys.length <= 3 && 
          keys.every(k => ['url', 'status', 'statusText'].includes(k));
        const isClientError = arg.status && arg.status >= 400 && arg.status < 500;
        if (hasOnlyBasicFields && isClientError) {
          return true; // Suppress client errors with only basic fields and no errorData
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
    
    // Additional check: if it's an object with only basic fields (url, status, statusText), suppress it
    if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
      const keys = Object.keys(arg);
      const hasOnlyBasicFields = keys.length <= 3 && 
        keys.every(k => ['url', 'status', 'statusText'].includes(k));
      
      if (hasOnlyBasicFields) {
        // Suppress ALL objects with only basic fields - they don't contain meaningful error info
        return false;
      }
      
      // Also check: if object has errorData but errorData is empty/null, and only has basic fields otherwise
      if ('errorData' in arg) {
        const errorData = arg.errorData;
        const hasEmptyErrorData = !errorData || 
          (typeof errorData === 'object' && errorData !== null && Object.keys(errorData).length === 0);
        const nonBasicKeys = keys.filter(k => !['url', 'status', 'statusText', 'errorData'].includes(k));
        
        if (hasEmptyErrorData && nonBasicKeys.length === 0) {
          // Only has basic fields + empty errorData - suppress it
          return false;
        }
      }
    }
    
    return true;
  });
  
  // Final check: if after filtering we only have the string "API Error:" and no actual error object, suppress it
  // Also check if we have the string prefix but the object was filtered out (meaning it was empty)
  const hasOnlyStringPrefix = filteredArgs.length === 1 && 
    typeof filteredArgs[0] === 'string' && 
    (filteredArgs[0].includes('API Error') || filteredArgs[0].includes('Error'));
  
  if (hasOnlyStringPrefix) {
    return; // Suppress - only have the prefix string, no actual error data
  }
  
  // Additional check: if we have both string and object, but object only has basic fields, suppress
  if (filteredArgs.length === 2) {
    const [first, second] = filteredArgs;
    if (typeof first === 'string' && typeof second === 'object' && second !== null) {
      const keys = Object.keys(second);
      const hasOnlyBasicFields = keys.length <= 3 && 
        keys.every(k => ['url', 'status', 'statusText'].includes(k));
      if (hasOnlyBasicFields) {
        return; // Suppress - object only has basic fields
      }
    }
  }
  
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
        // FastAPI returns errors in {detail: "message"} format
        // If errorData is an object with only 'detail', preserve it
        if (errorData && typeof errorData === 'object' && errorData !== null) {
          // Check if it's a FastAPI error format
          if ('detail' in errorData && Object.keys(errorData).length === 1) {
            // This is a valid FastAPI error, keep it
          } else if (Object.keys(errorData).length === 0) {
            // Empty object, set to null to trigger suppression
            errorData = null;
          }
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
            // Check if object has any properties (including boolean false, 0, empty string for debugging)
            const keys = Object.keys(errorData);
            hasErrorData = keys.length > 0 && 
                          keys.some(key => {
                            const val = errorData[key];
                            // Accept any value that is not null/undefined (including false, 0, empty string)
                            // This helps debug authorization errors where false values are meaningful
                            return val !== null && val !== undefined && 
                                   (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0));
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
          // For 403 errors, always use the original errorData (don't filter)
          // This ensures authorization errors are properly logged
          let finalErrorData = null;
          if (errorData) {
            if (typeof errorData === 'object' && errorData !== null) {
              if (response.status === 403) {
                // For 403 errors, include all properties (including boolean false)
                finalErrorData = errorData;
              } else {
                // For other errors, filter out empty values
                const nonEmptyKeys = Object.keys(errorData).filter(key => {
                  const val = errorData[key];
                  return val !== null && val !== undefined && 
                         (typeof val !== 'object' || (val !== null && Object.keys(val).length > 0));
                });
                if (nonEmptyKeys.length > 0) {
                  finalErrorData = {};
                  nonEmptyKeys.forEach(key => {
                    finalErrorData[key] = errorData[key];
                  });
                }
              }
            } else {
              finalErrorData = errorData;
            }
          }
          
          // CRITICAL: Double-check for mentor-assignments and capstones endpoints - NEVER log errors for these
          // This is a final safety check to prevent any mentor-assignments or capstones errors from being logged
          const finalUrlCheck = urlObj.toString();
          const isMentorAssignmentsFinal = finalUrlCheck.includes('/mentor-assignments') || 
                                         (finalUrlCheck.includes('/mentors/') && finalUrlCheck.includes('/assignments'));
          const isCapstonesFinal = finalUrlCheck.includes('/capstones') || finalUrlCheck.includes('/capstone');
          
          // NEVER log mentor-assignments or capstones errors (404s are expected)
          if (isMentorAssignmentsFinal || isCapstonesFinal) {
            // Completely suppress - don't log anything for mentor-assignments or capstones
            return;
          }
          
          // Only log if we have finalErrorData with content OR if it's a server error
          // Final validation: ensure finalErrorData is not empty object
          const hasErrorDataToLog = (response.status === 403 && errorData) || 
            (finalErrorData && 
             (typeof finalErrorData !== 'object' || 
              (finalErrorData !== null && Object.keys(finalErrorData).length > 0)));
          
            // Only log if we have meaningful error data OR if it's a server error (500+)
            // For client errors (400-499), only log if we have meaningful error data
            if (response.status >= 500 || hasErrorDataToLog) {
              const errorInfo: any = {
                url: urlObj.toString(),
                status: response.status,
                statusText: response.statusText,
              };
              
              // Add errorData if available
              if (response.status === 403 && errorData) {
                errorInfo.errorData = errorData; // Use original, unfiltered errorData
              } else if (finalErrorData) {
                errorInfo.errorData = finalErrorData;
              }
              
              // Helper to check if errorData is truly empty (empty object {})
              const isErrorDataEmpty = (obj: any): boolean => {
                return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length === 0;
              };
              
              // If errorData is an empty object, remove it from errorInfo before any checks
              if (errorInfo.errorData && isErrorDataEmpty(errorInfo.errorData)) {
                delete errorInfo.errorData;
              }
              
              // Final check: ensure errorInfo has meaningful content before logging
              const hasMeaningfulErrorData = errorInfo.errorData !== undefined && 
                errorInfo.errorData !== null &&
                !isErrorDataEmpty(errorInfo.errorData) &&
                (typeof errorInfo.errorData !== 'object' || 
                 (errorInfo.errorData !== null && Object.keys(errorInfo.errorData).length > 0));
              
              // Additional check: ensure errorInfo itself has more than just url/status/statusText
              // For client errors (400-499), only log if we have meaningful errorData
              // For server errors (500+), log even without errorData
              const isClientError = response.status >= 400 && response.status < 500;
              const errorInfoKeys = Object.keys(errorInfo);
              const hasOnlyBasicFields = errorInfoKeys.length <= 3 && 
                errorInfoKeys.every(k => ['url', 'status', 'statusText'].includes(k));
              
              // Suppress client errors that only have basic fields (url, status, statusText) without meaningful errorData
              if (isClientError && hasOnlyBasicFields && !hasMeaningfulErrorData) {
                // Don't log - this is an empty error (only has url, status, statusText, no meaningful errorData)
                return;
              }
              
              // Only log if it's a server error OR if we have meaningful error data
              // Also ensure errorInfo doesn't contain empty errorData when logging
              if (response.status >= 500 || hasMeaningfulErrorData) {
                // Create a clean errorInfo without empty errorData
                const cleanErrorInfo = { ...errorInfo };
                if (cleanErrorInfo.errorData && isErrorDataEmpty(cleanErrorInfo.errorData)) {
                  delete cleanErrorInfo.errorData;
                }
                
                // Final check: Don't log if cleanErrorInfo only has basic fields (url, status, statusText) without errorData
                // This prevents logging empty error objects - even for server errors
                const cleanErrorInfoKeys = Object.keys(cleanErrorInfo);
                const hasOnlyBasicFields = cleanErrorInfoKeys.length <= 3 && 
                  cleanErrorInfoKeys.every(k => ['url', 'status', 'statusText'].includes(k));
                
                // Check if cleanErrorInfo has any meaningful non-basic fields
                // A field is meaningful if it has a non-empty, non-null value
                const nonBasicFields = cleanErrorInfoKeys.filter(k => !['url', 'status', 'statusText'].includes(k));
                const hasNonBasicFields = nonBasicFields.length > 0 && nonBasicFields.some(k => {
                  const value = cleanErrorInfo[k];
                  // Consider it meaningful if it's not null, undefined, empty string, or empty object
                  if (value === null || value === undefined || value === '') return false;
                  if (typeof value === 'object' && !Array.isArray(value)) {
                    // Check if object has any non-empty properties
                    const objKeys = Object.keys(value);
                    if (objKeys.length === 0) return false;
                    // Check if at least one property has a meaningful value
                    return objKeys.some(objKey => {
                      const objVal = value[objKey];
                      return objVal !== null && objVal !== undefined && objVal !== '' &&
                             (typeof objVal !== 'object' || (objVal !== null && Object.keys(objVal).length > 0));
                    });
                  }
                  return true;
                });
                
                // Only log if we have meaningful error data OR if cleanErrorInfo has meaningful non-basic fields
                // This ensures we never log empty error objects, regardless of status code
                if (hasMeaningfulErrorData || hasNonBasicFields) {
                  // Double-check: ensure cleanErrorInfo has meaningful content before logging
                  // Check if ALL non-basic fields are empty (if so, suppress even if hasNonBasicFields was true)
                  const nonBasicKeys = cleanErrorInfoKeys.filter(k => !['url', 'status', 'statusText'].includes(k));
                  const allNonBasicEmpty = nonBasicKeys.length === 0 || nonBasicKeys.every(k => {
                    const val = cleanErrorInfo[k];
                    if (val === null || val === undefined || val === '') return true;
                    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return true;
                    return false;
                  });
                  
                  // Final check: if cleanErrorInfo only has basic fields (url, status, statusText), suppress it
                  const finalKeys = Object.keys(cleanErrorInfo);
                  const finalHasOnlyBasicFields = finalKeys.length <= 3 && 
                    finalKeys.every(k => ['url', 'status', 'statusText'].includes(k));
                  
                  if (finalHasOnlyBasicFields) {
                    // Suppress - only has basic fields, no meaningful error data
                    return;
                  }
                  
                  // Only log if we have meaningful errorData OR if there are meaningful non-basic fields
                  if (hasMeaningfulErrorData || !allNonBasicEmpty) {
                    safeConsoleError('API Error:', cleanErrorInfo);
                  } else {
                    // Suppress - all non-basic fields are empty, only has basic fields
                    return;
                  }
                } else {
                  // Suppress - don't log empty error objects (even for server errors)
                  // This prevents "API Error: {}" from appearing
                  return;
                }
              }
              // Otherwise, completely suppress - don't log empty errors
            }
            // Otherwise, don't log at all (suppress empty errorInfo)
        } else if (isServerError && hasErrorData) {
          // Log server errors only if they have meaningful error data
          let finalErrorData = null;
          if (errorData) {
            if (typeof errorData === 'object' && errorData !== null) {
              // Include all properties (including boolean false, 0, empty string for debugging)
              const nonEmptyKeys = Object.keys(errorData).filter(key => {
                const val = errorData[key];
                return val !== null && val !== undefined && 
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
                    val !== null && val !== undefined &&
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
              // For server errors, only log if we have meaningful error data
              // Don't log server errors with only basic fields - they're still empty
              if (hasValidErrorData) {
                safeConsoleError('API Error:', errorInfo);
              }
              // Otherwise suppress - even server errors shouldn't log empty objects
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
      errorMessage.includes('CORS') ||
      errorMessage.includes('cors') ||
      (error as any)?.code === 'ECONNREFUSED';
    
    // Detect CORS errors specifically
    const isCorsError = errorMessage.includes('CORS') || 
                        errorMessage.includes('cors') ||
                        (errorMessage.includes('Failed to fetch') && typeof window !== 'undefined');
    
    // Don't log connection errors to console if backend is down (expected behavior)
    if (!isConnectionError && typeof window !== 'undefined') {
      safeConsoleError('[fetcher] Network error:', error);
    }
    
    // Provide more specific error message
    let finalErrorMessage = 'Cannot connect to backend server'
    if (isCorsError) {
      finalErrorMessage = 'CORS error: Backend may not be allowing requests from this origin. Check CORS configuration.'
    } else if (isConnectionError) {
      finalErrorMessage = 'Cannot connect to backend server. Please ensure the service is running and accessible.'
    } else {
      finalErrorMessage = errorMessage
    }
    
    throw new ApiError(
      0,
      'Network Error',
      null,
      finalErrorMessage
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

