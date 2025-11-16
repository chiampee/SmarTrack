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
let apiDebugLogged = false

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
      console.log(`[AUTH] Token ${timeUntilExpiry > 0 ? 'expiring soon' : 'expired'} (${timeUntilExpiry}s remaining)`)
    }
    
    return isExpired
  } catch (error) {
    console.error('[AUTH] Failed to decode token:', error)
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
            console.log('[AUTH] Using existing valid token from localStorage')
            setToken(existingToken)
            return
          }
          
          // Always request email scope to ensure email is in token
          console.log('[AUTH] Fetching fresh token from Auth0')
          const accessToken = await getAccessTokenSilently({
            authorizationParams: {
              scope: 'openid profile email',
            },
            cacheMode: existingToken ? 'off' : 'on' // Force refresh if we had an expired token
          })
          setToken(accessToken)
          localStorage.setItem('authToken', accessToken) // Store for extension
          console.log('[AUTH] ✅ Fresh token obtained and stored')
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error('Error fetching access token:', errorMessage, error)
          setToken(null)
          localStorage.removeItem('authToken')
        }
      } else {
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
        console.log('[AUTH] Token already expired or expiring soon, should refresh immediately')
        return
      }
      
      console.log(`[AUTH] Scheduling token refresh in ${Math.floor(refreshIn / 1000)}s`)
      
      const timerId = setTimeout(async () => {
        try {
          console.log('[AUTH] Auto-refreshing token before expiration')
          const newToken = await getAccessTokenSilently({ 
            cacheMode: 'off',
            authorizationParams: {
              scope: 'openid profile email',
            }
          })
          setToken(newToken)
          localStorage.setItem('authToken', newToken)
          console.log('[AUTH] ✅ Token auto-refreshed successfully')
        } catch (error) {
          console.error('[AUTH] Token auto-refresh failed:', error)
        }
      }, refreshIn)
      
      return () => clearTimeout(timerId)
    } catch (error) {
      console.error('[AUTH] Failed to schedule token refresh:', error)
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
      console.log('[AUTH] Token expired or expiring soon, refreshing before request')
      try {
        requestToken = await getAccessTokenSilently({
          cacheMode: 'off',
          authorizationParams: {
            scope: 'openid profile email',
          }
        })
        setToken(requestToken)
        localStorage.setItem('authToken', requestToken)
        console.log('[AUTH] ✅ Token refreshed successfully before request')
      } catch (error) {
        console.error('[AUTH] Failed to refresh expired token:', error)
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
    
    // Always log backend URL on first request for debugging
    if (!apiDebugLogged) {
      console.log(`[API] Backend URL configured: ${API_BASE_URL}`)
      console.log(`[API] Environment VITE_BACKEND_URL: ${import.meta.env.VITE_BACKEND_URL || 'not set (using default)'}`)
      console.log(`[API] Making request to: ${url}`)
      apiDebugLogged = true
    }
    
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

      // Handle different HTTP status codes
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }))
        const error = parseError({
          status: response.status,
          message: errorData.detail || errorData.message || response.statusText,
        })
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