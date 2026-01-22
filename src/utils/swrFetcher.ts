import { UserStats } from '../hooks/useBackendApi'
import { isTokenExpired } from '../hooks/useBackendApi'

/**
 * Authenticated fetcher for SWR
 * Fetches data from the backend API with authentication
 * 
 * SECURITY: Includes URL validation, token expiration checks, and error sanitization
 */
export const swrFetcher = async <T = any>(url: string): Promise<T> => {
  // SECURITY: Validate and sanitize URL input
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('Invalid URL parameter')
  }

  // SECURITY: Prevent external URL injection (SSRF protection)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    throw new Error('External URLs not allowed')
  }

  // SECURITY: Prevent path traversal attacks
  if (url.includes('..') || url.includes('//') || url.includes('\0')) {
    throw new Error('Invalid URL path')
  }

  // SECURITY: Ensure URL is a relative path starting with /
  const safeUrl = url.startsWith('/') ? url : `/${url}`

  // SECURITY: Get and validate token
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  // SECURITY: Validate token format (basic JWT structure check)
  if (!/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$/.test(token)) {
    console.error('[SECURITY] Invalid token format detected')
    localStorage.removeItem('authToken')
    throw new Error('Invalid authentication token')
  }

  // SECURITY: Check token expiration before making request
  if (isTokenExpired(token)) {
    localStorage.removeItem('authToken')
    throw new Error('Token expired')
  }

  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const fullUrl = `${apiBaseUrl}${safeUrl}`

  // SECURITY: Add request timeout to prevent resource exhaustion
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // SECURITY: Sanitize error messages to prevent information disclosure
      let errorMessage = 'Request failed'
      
      if (response.status === 401) {
        errorMessage = 'Authentication required'
        localStorage.removeItem('authToken') // Clear invalid token
      } else if (response.status === 403) {
        errorMessage = 'Access denied'
      } else if (response.status >= 500) {
        errorMessage = 'Server error' // Don't expose internal server errors
      } else {
        // Only show safe, user-facing error messages
        try {
          const error = await response.json()
          if (error?.message && typeof error.message === 'string') {
            // Whitelist approach: only show known safe error messages
            const safeMessages = ['Not found', 'Invalid request', 'Validation failed']
            if (safeMessages.some(msg => error.message.includes(msg))) {
              errorMessage = error.message
            }
          }
        } catch {
          errorMessage = `Request failed (${response.status})`
        }
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
    
    throw new Error('Network error')
  }
}

/**
 * Specialized fetcher for user stats
 * Transforms the backend response to match the UserStats interface
 */
export const statsFetcher = async (): Promise<UserStats> => {
  const data = await swrFetcher<{
    totalLinks: number
    linksThisMonth: number
    favoriteLinks: number
    archivedLinks: number
    storageUsed: number
    storageLimit: number
    linksLimit: number
    averagePerLink?: number
    linksRemaining?: number
    storageRemaining?: number
  }>('/api/users/stats')

  // Transform backend response to frontend format
  return {
    linksUsed: data.totalLinks || 0,
    linksLimit: data.linksLimit || 40,
    storageUsed: data.storageUsed || 0,
    storageLimit: data.storageLimit || 200 * 1024, // 200 KB
    averagePerLink: data.averagePerLink || 0,
    linksRemaining: data.linksRemaining || (data.linksLimit || 40) - (data.totalLinks || 0),
    storageRemaining: data.storageRemaining || (data.storageLimit || 200 * 1024) - (data.storageUsed || 0),
  }
}
