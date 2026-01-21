import { useState, useEffect, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { parseError, logError, withErrorHandling, ErrorType } from '../utils/errorHandler'
import { validateApiResponse } from '../utils/validation'
import { Link } from '../types/Link'
import { jwtDecode } from 'jwt-decode'

interface JWTPayload {
  exp: number
  sub: string
  email?: string
  aud: string | string[]
}

// Backend URL - use environment variable or default to Render backend
// If running locally, set VITE_BACKEND_URL=http://localhost:8000 in .env
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://smartrack-back.onrender.com'

// Track if we've logged the backend URL (module-level, not window)
const apiDebugLogged = false

// Request deduplication: Track in-flight requests to prevent duplicate concurrent requests
const activeRequests = new Map<string, AbortController>()
// Track how many requests are using each controller (for proper cleanup)
const requestCounts = new Map<string, number>()

/**
 * Get or create an abort controller for a request endpoint
 * If a request is already in flight, check if it's aborted and create a new one if needed
 * Returns: { controller, isNew }
 */
const getRequestController = (endpoint: string): { controller: AbortController; isNew: boolean } => {
  const requestKey = endpoint
  const existing = activeRequests.get(requestKey)
  if (existing && !existing.signal.aborted) {
    // Request already in flight with active controller, increment counter and return existing
    const count = requestCounts.get(requestKey) || 0
    requestCounts.set(requestKey, count + 1)
    return { controller: existing, isNew: false }
  }
  // Create new controller (either no existing request, or existing was aborted)
  const controller = new AbortController()
  activeRequests.set(requestKey, controller)
  requestCounts.set(requestKey, 1)
  return { controller, isNew: true }
}

/**
 * Clean up request controller after request completes
 * Only removes controller when all requests using it are done
 */
const cleanupRequest = (endpoint: string) => {
  const count = requestCounts.get(endpoint) || 0
  if (count <= 1) {
    // Last request using this controller, clean up
    activeRequests.delete(endpoint)
    requestCounts.delete(endpoint)
  } else {
    // Other requests still using this controller, just decrement counter
    requestCounts.set(endpoint, count - 1)
  }
}

export interface UserStats {
  linksUsed: number
  linksLimit: number
  storageUsed: number
  storageLimit: number
  averagePerLink?: number
  linksRemaining?: number
  storageRemaining?: number
}

/**
 * Check if JWT token is expired or expiring soon
 * @param token - JWT token string
 * @param bufferSeconds - Number of seconds before expiration to consider token as expired (default: 300 = 5 minutes)
 * @returns true if token is expired or expiring soon
 */
const isTokenExpired = (token: string, bufferSeconds: number = 300): boolean => {
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    const currentTime = Math.floor(Date.now() / 1000)
    const expiresAt = decoded.exp
    
    // Check if token expires in less than bufferSeconds
    const isExpired = expiresAt < (currentTime + bufferSeconds)
    
    if (isExpired) {
      const timeUntilExpiry = expiresAt - currentTime
      console.warn(`[AUTH ERROR] Token ${timeUntilExpiry > 0 ? 'expiring soon' : 'expired'} (${timeUntilExpiry}s remaining)`)
      console.warn(`[AUTH ERROR] Token details:`, {
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        currentTime: new Date(currentTime * 1000).toISOString(),
        secondsRemaining: timeUntilExpiry,
        sub: decoded.sub,
        aud: decoded.aud
      })
    }
    
    return isExpired
  } catch (error) {
    console.error('[AUTH ERROR] Failed to decode token:', error)
    console.error('[AUTH ERROR] Token might be malformed or corrupted')
    console.error('[AUTH ERROR] Error details:', {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      tokenLength: token?.length || 0,
      tokenStart: token?.substring(0, 20) || 'N/A'
    })
    return true // Treat invalid tokens as expired
  }
}

export const useBackendApi = () => {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated) {
        try {
          // Check if existing token is still valid
          const existingToken = localStorage.getItem('authToken')
          if (existingToken && !isTokenExpired(existingToken)) {
            setToken(existingToken)
            return
          }
          
          // Always request email scope to ensure email is in token
          const accessToken = await getAccessTokenSilently({
            authorizationParams: {
              scope: 'openid profile email',
            },
            cacheMode: existingToken ? 'off' : 'on' // Force refresh if we had an expired token
          })
          
          setToken(accessToken)
          localStorage.setItem('authToken', accessToken) // Store for extension
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error('[AUTH ERROR] ❌ Failed to fetch access token')
          console.error('[AUTH ERROR] Error type:', error instanceof Error ? error.name : typeof error)
          console.error('[AUTH ERROR] Error message:', errorMessage)
          console.error('[AUTH ERROR] Full error:', error)
          console.error('[AUTH ERROR] Action: Clearing token and requiring re-authentication')
          setToken(null)
          localStorage.removeItem('authToken')
        }
      } else {
        if (token) {
          console.log('[AUTH] User not authenticated, clearing tokens')
        }
        setToken(null)
        localStorage.removeItem('authToken')
      }
    }
    fetchToken()
  }, [isAuthenticated, getAccessTokenSilently])
  
  // Auto-refresh token before expiration
  useEffect(() => {
    if (!token || !isAuthenticated) return
    
    try {
      const decoded = jwtDecode<JWTPayload>(token)
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
      // Refresh 5 minutes before expiration, or immediately if less than 5 minutes remaining
      const refreshIn = Math.max(0, (expiresIn - 300) * 1000) // 5 min before expiration
      
      if (refreshIn <= 0) {
        console.warn('[AUTH WARNING] Token already expired or expiring soon, should refresh immediately')
        console.warn('[AUTH WARNING] Seconds until expiry:', expiresIn)
        return
      }
      
      const timerId = setTimeout(async () => {
        try {
          console.log('[AUTH] 🔄 Auto-refreshing token before expiration...')
          const startTime = Date.now()
          
          const newToken = await getAccessTokenSilently({ 
            cacheMode: 'off',
            authorizationParams: {
              scope: 'openid profile email',
            }
          })
          
          const duration = Date.now() - startTime
          const newDecoded = jwtDecode<JWTPayload>(newToken)
          
          setToken(newToken)
          localStorage.setItem('authToken', newToken)
          
          console.log('[AUTH] ✅ Token auto-refreshed successfully')
          console.log('[AUTH] Refresh duration:', `${duration}ms`)
          console.log('[AUTH] New token expires:', new Date(newDecoded.exp * 1000).toISOString())
          console.log('[AUTH] New token valid for:', `${Math.floor((newDecoded.exp - Math.floor(Date.now() / 1000)) / 60)} minutes`)
        } catch (error) {
          console.error('[AUTH ERROR] ❌ Token auto-refresh failed')
          console.error('[AUTH ERROR] Error type:', error instanceof Error ? error.name : typeof error)
          console.error('[AUTH ERROR] Error message:', error instanceof Error ? error.message : String(error))
          console.error('[AUTH ERROR] Full error:', error)
          console.error('[AUTH ERROR] User may need to re-authenticate manually')
        }
      }, refreshIn)
      
      return () => {
        console.log('[AUTH] Clearing token refresh timer')
        clearTimeout(timerId)
      }
    } catch (error) {
      console.error('[AUTH ERROR] ❌ Failed to schedule token refresh')
      console.error('[AUTH ERROR] Error:', error)
      console.error('[AUTH ERROR] Token might be invalid')
    }
  }, [token, isAuthenticated, getAccessTokenSilently])

  const makeAuthenticatedRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // If authenticated but token not yet loaded, try to fetch it
    let requestToken = token
    if (!requestToken && isAuthenticated) {
      try {
        // Always request email scope to ensure email is in token
        requestToken = await getAccessTokenSilently({
          authorizationParams: {
            scope: 'openid profile email',
          }
        })
        setToken(requestToken)
        localStorage.setItem('authToken', requestToken)
      } catch (error) {
        // If we can't get token even though authenticated, this might be temporary
        // Don't log "Authentication required" errors - they're expected during initialization
        const authError = parseError(new Error('Authentication required'))
        authError.suppressLogging = true // Suppress logging for this expected error
        throw authError
      }
    }
    
    // Check if token is expired or expiring soon
    if (requestToken && isTokenExpired(requestToken)) {
      console.warn('[AUTH WARNING] Token expired or expiring soon, refreshing before request')
      console.warn('[AUTH WARNING] Endpoint:', endpoint)
      try {
        const startTime = Date.now()
        requestToken = await getAccessTokenSilently({
          cacheMode: 'off',
          authorizationParams: {
            scope: 'openid profile email',
          }
        })
        const duration = Date.now() - startTime
        setToken(requestToken)
        localStorage.setItem('authToken', requestToken)
        console.log('[AUTH] ✅ Token refreshed successfully before request')
        console.log('[AUTH] Refresh duration:', `${duration}ms`)
      } catch (error) {
        console.error('[AUTH ERROR] ❌ Failed to refresh expired token before request')
        console.error('[AUTH ERROR] Endpoint:', endpoint)
        console.error('[AUTH ERROR] Error:', error)
        console.error('[AUTH ERROR] Will attempt request with expired token (backend will reject)')
        // Continue with expired token - backend will reject it and we'll handle the error
      }
    }

    if (!requestToken) {
      // Don't log "Authentication required" errors - they're expected during initialization
      // or when user is not authenticated. Just throw so callers can handle gracefully.
      const error = parseError(new Error('Authentication required'))
      error.suppressLogging = true // Suppress logging for this expected error
      throw error
    }

    const url = `${API_BASE_URL}${endpoint}`
    
    // ✅ REQUEST DEDUPLICATION: Prevent duplicate concurrent requests
    const { controller: requestController, isNew: isNewRequest } = getRequestController(endpoint)
    
    // Apply a default timeout to avoid infinite loading UI
    // Admin endpoints need 90 seconds to handle cold starts + complex queries
    // Regular endpoints need 60 seconds to handle Render free tier cold starts (30-60s)
    const isAdminEndpoint = endpoint.startsWith('/api/admin')
    const timeoutDuration = isAdminEndpoint ? 90000 : 60000  // 90s for admin (cold start + queries), 60s for regular
    
    try {
      setIsLoading(true)
      // Only set timeout for new requests - don't reset timeout for deduplicated requests
      // This prevents aborting the original request prematurely when a duplicate comes in
      const timeoutId = isNewRequest 
        ? setTimeout(() => {
            // Double-check signal isn't already aborted before aborting
            if (!requestController.signal.aborted) {
              requestController.abort()
            }
          }, timeoutDuration)
        : null

      try {
        // Check if signal is already aborted before making the request
        if (requestController.signal.aborted) {
          throw new DOMException('Request was aborted before fetch started', 'AbortError')
        }
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${requestToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: requestController.signal,
        })
        if (timeoutId) clearTimeout(timeoutId)
        cleanupRequest(endpoint)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }))
        // Preserve the status code in the error object
        const error = parseError({
          status: response.status,
          message: errorData.detail || errorData.message || response.statusText,
        })
        // Attach status to the error object so downstream handlers can check it
        // @ts-expect-error - dynamically adding property to error
        error.status = response.status;
        
        // Enhanced error logging
        console.error(`[API ERROR] ❌ Request failed: ${endpoint}`)
        console.error(`[API ERROR] Status: ${response.status}`)
        console.error(`[API ERROR] Message: ${errorData.detail || errorData.message || response.statusText}`)
        
        // Log auth-specific errors with more details
        if (response.status === 401) {
          console.error('[API ERROR] 🔐 Authentication failed - token might be invalid or expired')
          console.error('[API ERROR] Token present:', !!requestToken)
          
          // Check if this is an inactivity reauthentication requirement
          const errorMessage = errorData.detail || errorData.message || response.statusText
          const requiresReauth = errorMessage.includes('Reauthentication required') || 
                                  errorMessage.includes('inactivity') ||
                                  errorMessage.includes('5 days')
          
          if (requiresReauth) {
            console.warn('[AUTH] ⏰ Reauthentication required due to inactivity (>5 days)')
            console.warn('[AUTH] Clearing token and redirecting to login...')
            
            // Clear stored token
            setToken(null)
            localStorage.removeItem('authToken')
            
            // Redirect to login with prompt to force reauthentication
            try {
              await loginWithRedirect({
                authorizationParams: {
                  redirect_uri: window.location.origin + '/dashboard',
                  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                  scope: 'openid profile email',
                  prompt: 'login', // Force login screen
                }
              })
            } catch (loginError) {
              console.error('[AUTH ERROR] Failed to redirect to login:', loginError)
              // Fall through to throw the original error
            }
          } else if (requestToken) {
            try {
              const decoded = jwtDecode<JWTPayload>(requestToken)
              const now = Math.floor(Date.now() / 1000)
              console.error('[API ERROR] Token expired:', decoded.exp < now)
              console.error('[API ERROR] Token expiry:', new Date(decoded.exp * 1000).toISOString())
            } catch (e) {
              console.error('[API ERROR] Could not decode token for error analysis')
            }
          }
        } else if (response.status === 403) {
          console.error('[API ERROR] 🚫 Forbidden - insufficient permissions')
          console.error('[API ERROR] Endpoint may require admin access')
        } else if (response.status === 429) {
          console.error('[API ERROR] ⏱️ Rate limit exceeded - too many requests')
          console.error('[API ERROR] Please wait before making more requests')
        } else if (response.status === 404) {
          console.error('[API ERROR] 📭 Not found - endpoint does not exist or resource not found')
        } else if (response.status >= 500) {
          console.error('[API ERROR] 💥 Server error - backend might be down or experiencing issues')
        }
        
        logError(error, `API ${endpoint}`)
        throw error
      }

        const data = await response.json()
        return data as T
      } catch (fetchError) {
        if (timeoutId) clearTimeout(timeoutId)
        cleanupRequest(endpoint)
        throw fetchError
      }
      
    } catch (error: unknown) {
      // Clean up request on error
      cleanupRequest(endpoint)
      
      // Handle network errors, timeouts, etc.
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = parseError(new Error('Request timeout. Please try again.'))
        logError(timeoutError, `API ${endpoint} timeout`)
        throw timeoutError
      }
      
      // Enhanced error logging for network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Check if it's a resource exhaustion error
        const isResourceError = error.message.includes('ERR_INSUFFICIENT_RESOURCES') || 
                                (error as any).code === 'ERR_INSUFFICIENT_RESOURCES'
        
        // Check if request was aborted
        const wasAborted = requestController.signal.aborted
        
        if (isResourceError) {
          console.error('[API ERROR] Browser resource exhaustion - too many concurrent requests')
        } else if (wasAborted) {
          console.error(`[API ERROR] Request timeout - backend may be cold starting`)
        } else {
          console.error(`[API ERROR] Network error - Failed to fetch ${endpoint}`)
        }
      }
      
      const appError = parseError(error)
      logError(appError, `API ${endpoint}`)
      throw appError
      
    } finally {
      setIsLoading(false)
    }
  }, [token, isAuthenticated, getAccessTokenSilently])

  // Health check
  const healthCheck = useCallback(async (): Promise<{ status: string; timestamp: string }> => {
    return makeAuthenticatedRequest('/api/health')
  }, [makeAuthenticatedRequest])

  // User stats
  const getUserStats = useCallback(async (): Promise<UserStats> => {
    if (!token) {
      // Return fallback stats if not authenticated yet
      return {
        linksUsed: 0,
        linksLimit: 40,
        storageUsed: 0,
        storageLimit: 40 * 1024, // 40 KB
        averagePerLink: 0,
        linksRemaining: 40,
        storageRemaining: 40 * 1024,
      }
    }

    try {
      const data = await makeAuthenticatedRequest<{ 
        totalLinks: number; 
        linksThisMonth: number; 
        favoriteLinks: number; 
        archivedLinks: number; 
        storageUsed: number; 
        storageLimit: number; 
        linksLimit: number;
        averagePerLink?: number;
        linksRemaining?: number;
        storageRemaining?: number;
      }>('/api/users/stats')
      
      // Transform backend response to frontend format
      const result = {
        linksUsed: data.totalLinks || 0,
        linksLimit: data.linksLimit || 40,
        storageUsed: data.storageUsed || 0,
        storageLimit: data.storageLimit || 200 * 1024, // 200 KB
        averagePerLink: data.averagePerLink || 0,
        linksRemaining: data.linksRemaining || (data.linksLimit || 40) - (data.totalLinks || 0),
        storageRemaining: data.storageRemaining || (data.storageLimit || 200 * 1024) - (data.storageUsed || 0),
      }
      return result
    } catch (error) {
      // Better error logging - avoid [object Object] in console
      if (error && typeof error === 'object' && 'type' in error) {
        const err = error as { type: string; message: string; originalError?: unknown }
        console.error('Error fetching user stats:', err.type, '-', err.message)
        if (err.originalError) {
          console.error('Original error:', err.originalError instanceof Error ? err.originalError.message : String(err.originalError))
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Error fetching user stats:', errorMessage)
        if (error instanceof Error && error.stack) {
          console.error('Error stack:', error.stack)
        }
      }
      // Return fallback on error
      return {
        linksUsed: 0,
        linksLimit: 40,
        storageUsed: 0,
        storageLimit: 40 * 1024, // 40 KB
        averagePerLink: 0,
        linksRemaining: 40,
        storageRemaining: 40 * 1024,
      }
    }
  }, [makeAuthenticatedRequest, token])

  // Get links
  const getLinks = useCallback(async (): Promise<Link[]> => {
    if (!token) {
      // Return empty array if not authenticated yet
      return []
    }

    try {
      const data = await makeAuthenticatedRequest<{ links: Link[] } | Link[]>('/api/links')
      
      // Handle both array and object with links property
      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === 'object' && 'links' in data) {
        return (data as { links: Link[] }).links
      }
      
      return []
    } catch (error) {
      // Better error logging - avoid [object Object] in console
      if (error && typeof error === 'object' && 'type' in error) {
        const err = error as { type: string; message: string; originalError?: unknown }
        console.error('Error fetching links:', err.type, '-', err.message)
        if (err.originalError) {
          console.error('Original error:', err.originalError instanceof Error ? err.originalError.message : String(err.originalError))
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Error fetching links:', errorMessage)
        if (error instanceof Error) {
          console.error('Error stack:', error.stack)
        }
      }
      // Return empty array on error instead of throwing
      return []
    }
  }, [makeAuthenticatedRequest, token])

  // Get user ID from token
  const getUserId = useCallback((): string | null => {
    if (!token) return null
    try {
      const decoded = jwtDecode<JWTPayload>(token)
      return decoded.sub
    } catch {
      return null
    }
  }, [token])

  return {
    healthCheck,
    getUserStats,
    getLinks,
    getUserId,
    isAuthenticated: !!token,
    isLoading,
    makeRequest: makeAuthenticatedRequest, // Expose for advanced usage
  }
}