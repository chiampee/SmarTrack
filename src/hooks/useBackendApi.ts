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
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
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
    
    try {
      setIsLoading(true)
      // Apply a default timeout to avoid infinite loading UI
      // Admin endpoints need more time for complex analytics queries (30 seconds)
      const isAdminEndpoint = endpoint.startsWith('/api/admin')
      const timeoutDuration = isAdminEndpoint ? 30000 : 10000
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${requestToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

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
          if (requestToken) {
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
      
    } catch (error: unknown) {
      // Handle network errors, timeouts, etc.
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = parseError(new Error('Request timeout. Please try again.'))
        logError(timeoutError, `API ${endpoint} timeout`)
        throw timeoutError
      }
      
      // Enhanced error logging for network errors - ALWAYS show in production
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('🚨 [API ERROR] Network error - Failed to fetch')
        console.error(`[API ERROR] Full URL: ${url}`)
        console.error(`[API ERROR] Backend base URL: ${API_BASE_URL}`)
        console.error(`[API ERROR] Environment variable VITE_BACKEND_URL: ${import.meta.env.VITE_BACKEND_URL || '❌ NOT SET (using default)'}`)
        console.error(`[API ERROR] Test backend health: ${API_BASE_URL}/api/health`)
        console.error(`[API ERROR] This usually means:`)
        console.error(`  1. Backend URL is wrong`)
        console.error(`  2. Backend is down`)
        console.error(`  3. CORS is blocking the request`)
        console.error(`  4. VITE_BACKEND_URL not set in Vercel environment variables`)
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching user stats:', errorMessage, error)
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching links:', errorMessage, error)
      // Return empty array on error instead of throwing
      return []
    }
  }, [makeAuthenticatedRequest, token])

  return {
    healthCheck,
    getUserStats,
    getLinks,
    isAuthenticated: !!token,
    isLoading,
    makeRequest: makeAuthenticatedRequest, // Expose for advanced usage
  }
}