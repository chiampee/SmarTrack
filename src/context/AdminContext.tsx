import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAdminApi } from '../services/adminApi'

interface AdminContextType {
  isAdmin: boolean | null
  isChecking: boolean
  user: any
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

// ✅ Module-level cache for request deduplication (shared across all instances)
const adminCheckCache = {
  inProgress: false,
  lastCheck: 0,
  lastResult: null as boolean | null,
  cooldownMs: 5000, // 5 second cooldown between checks
  rateLimitCooldownMs: 60000, // 1 minute cooldown after rate limit error
  rateLimitUntil: 0,
}

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const location = useLocation()
  const adminApi = useAdminApi()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const hasCheckedRef = useRef(false)
  
  // ✅ Only redirect to 404 if user is trying to access admin routes
  const isAdminRoute = location.pathname === '/analytics'

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Prevent concurrent checks
      if (adminCheckCache.inProgress) {
        console.log('[AdminContext] Check already in progress, waiting...')
        return
      }

      // Check if we're in rate limit cooldown
      const now = Date.now()
      if (now < adminCheckCache.rateLimitUntil) {
        const remaining = Math.ceil((adminCheckCache.rateLimitUntil - now) / 1000)
        console.log(`[AdminContext] Rate limit cooldown active, waiting ${remaining}s...`)
        // Use cached result if available
        if (adminCheckCache.lastResult !== null) {
          // ✅ Only update state if it's different to prevent unnecessary re-renders
          setIsAdmin(prev => prev !== adminCheckCache.lastResult ? adminCheckCache.lastResult : prev)
          setIsChecking(prev => prev !== false ? false : prev)
          // ✅ Only redirect if trying to access admin route
          if (!adminCheckCache.lastResult && isAdminRoute) {
            navigate('/404')
          }
        }
        return
      }

      // Check cooldown period
      if (now - adminCheckCache.lastCheck < adminCheckCache.cooldownMs) {
        const remaining = Math.ceil((adminCheckCache.cooldownMs - (now - adminCheckCache.lastCheck)) / 1000)
        console.log(`[AdminContext] Cooldown active, waiting ${remaining}s...`)
        // Use cached result if available
        if (adminCheckCache.lastResult !== null) {
          // ✅ Only update state if it's different to prevent unnecessary re-renders
          setIsAdmin(prev => prev !== adminCheckCache.lastResult ? adminCheckCache.lastResult : prev)
          setIsChecking(prev => prev !== false ? false : prev)
          // ✅ Only redirect if trying to access admin route
          if (!adminCheckCache.lastResult && isAdminRoute) {
            navigate('/404')
          }
        }
        return
      }

      if (isLoading) {
        setIsChecking(true)
        return
      }

      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setIsChecking(false)
        // ✅ Only redirect if trying to access admin route
        if (isAdminRoute) {
          navigate('/404')
        }
        return
      }

      // ✅ SECURE: Check admin status via backend API
      // Admin emails are never exposed in client code
      adminCheckCache.inProgress = true
      adminCheckCache.lastCheck = now
      
      try {
        const result = await adminApi.checkAdminStatus()
        const adminStatus = result.isAdmin

        // Cache the result
        adminCheckCache.lastResult = adminStatus
        adminCheckCache.rateLimitUntil = 0 // Clear rate limit cooldown on success

        if (!adminStatus) {
          setIsAdmin(false)
          setIsChecking(false)
          // ✅ Only redirect if trying to access admin route
          if (isAdminRoute) {
            navigate('/404')
          }
          return
        }

        setIsAdmin(true)
        setIsChecking(false)
      } catch (error: any) {
        // Handle rate limit errors specifically
        if (error?.status === 429) {
          console.warn('[AdminContext] Rate limit hit, entering cooldown period')
          adminCheckCache.rateLimitUntil = now + adminCheckCache.rateLimitCooldownMs
          // Use cached result if available, otherwise assume not admin
          if (adminCheckCache.lastResult !== null) {
            setIsAdmin(adminCheckCache.lastResult)
            setIsChecking(false)
            // ✅ Only redirect if trying to access admin route
            if (!adminCheckCache.lastResult && isAdminRoute) {
              navigate('/404')
            }
          } else {
            // No cached result, assume not admin for security
            setIsAdmin(false)
            setIsChecking(false)
            // ✅ Only redirect if trying to access admin route
            if (isAdminRoute) {
              navigate('/404')
            }
          }
          return
        }

        // Handle timeout errors gracefully (backend cold start)
        const isTimeoutError = error?.message?.includes('timeout') || 
                              error?.message?.includes('Request timeout') ||
                              error?.type === 'UNKNOWN_ERROR' && error?.message?.includes('timeout')
        
        if (isTimeoutError) {
          console.warn('[AdminContext] Admin check timed out (likely cold start), using cached result or defaulting to non-admin')
          // Use cached result if available
          if (adminCheckCache.lastResult !== null) {
            setIsAdmin(adminCheckCache.lastResult)
            setIsChecking(false)
            if (!adminCheckCache.lastResult && isAdminRoute) {
              navigate('/404')
            }
          } else {
            // No cached result, assume not admin for security
            setIsAdmin(false)
            setIsChecking(false)
            if (isAdminRoute) {
              navigate('/404')
            }
          }
          return
        }

        // For other errors, assume not admin for security
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
        setIsChecking(false)
        // ✅ Only redirect if trying to access admin route
        if (isAdminRoute) {
          navigate('/404')
        }
      } finally {
        adminCheckCache.inProgress = false
        hasCheckedRef.current = true
      }
    }

    checkAdminAccess()
    // ✅ adminApi is stable from useAdminApi hook, but we include it for completeness
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user, navigate, location.pathname])

  return (
    <AdminContext.Provider value={{ isAdmin, isChecking, user }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdminAccess = (): AdminContextType => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminAccess must be used within AdminProvider')
  }
  return context
}
