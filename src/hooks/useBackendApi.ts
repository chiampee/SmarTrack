import { useState, useEffect, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { parseError, logError, withErrorHandling, ErrorType } from '../utils/errorHandler'
import { validateApiResponse } from '../utils/validation'
import { Link } from '../types/Link'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export interface UserStats {
  linksUsed: number
  linksLimit: number
  storageUsed: number
  storageLimit: number
  averagePerLink?: number
  linksRemaining?: number
  storageRemaining?: number
}

export const useBackendApi = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated) {
        try {
          const accessToken = await getAccessTokenSilently()
          setToken(accessToken)
          localStorage.setItem('authToken', accessToken) // Store for extension
        } catch (error) {
          console.error('Error fetching access token:', error)
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

  const makeAuthenticatedRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    if (!token) {
      const error = parseError(new Error('Authentication required'))
      logError(error, 'useBackendApi.makeAuthenticatedRequest')
      throw error
    }

    const url = `${API_BASE_URL}${endpoint}`
    
    try {
      setIsLoading(true)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

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
      
    } catch (error) {
      // Handle network errors, timeouts, etc.
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = parseError(new Error('Request timeout. Please try again.'))
        logError(timeoutError, `API ${endpoint} timeout`)
        throw timeoutError
      }
      
      const appError = parseError(error)
      logError(appError, `API ${endpoint}`)
      throw appError
      
    } finally {
      setIsLoading(false)
    }
  }, [token])

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
        linksLimit: 100,
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024,
        averagePerLink: 0,
        linksRemaining: 100,
        storageRemaining: 5 * 1024 * 1024,
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
        linksLimit: data.linksLimit || 100,
        storageUsed: data.storageUsed || 0,
        storageLimit: data.storageLimit || 5 * 1024 * 1024,
        averagePerLink: data.averagePerLink || 0,
        linksRemaining: data.linksRemaining || (data.linksLimit || 100) - (data.totalLinks || 0),
        storageRemaining: data.storageRemaining || (data.storageLimit || 5 * 1024 * 1024) - (data.storageUsed || 0),
      }
      return result
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Return fallback on error
      return {
        linksUsed: 0,
        linksLimit: 100,
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024,
        averagePerLink: 0,
        linksRemaining: 100,
        storageRemaining: 5 * 1024 * 1024,
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
      console.error('Error fetching links:', error)
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