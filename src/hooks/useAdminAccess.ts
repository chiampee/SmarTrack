import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAdminApi } from '../services/adminApi'

// ✅ Global cache to prevent multiple concurrent admin checks across all hook instances
const adminCheckCache = {
  inProgress: false,
  lastCheck: 0,
  lastResult: null as boolean | null,
  cooldownMs: 5000, // 5 second cooldown between checks
  rateLimitCooldownMs: 60000, // 1 minute cooldown after rate limit error
  rateLimitUntil: 0,
}

export const useAdminAccess = () => {
  const { user, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const adminApi = useAdminApi()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Prevent concurrent checks
      if (adminCheckCache.inProgress) {
        console.log('[AdminAccess] Check already in progress, waiting...')
        return
      }

      // Check if we're in rate limit cooldown
      const now = Date.now()
      if (now < adminCheckCache.rateLimitUntil) {
        const remaining = Math.ceil((adminCheckCache.rateLimitUntil - now) / 1000)
        console.log(`[AdminAccess] Rate limit cooldown active, waiting ${remaining}s...`)
        // Use cached result if available
        if (adminCheckCache.lastResult !== null) {
          setIsAdmin(adminCheckCache.lastResult)
          setIsChecking(false)
          if (!adminCheckCache.lastResult) {
            navigate('/404')
          }
        }
        return
      }

      // Check cooldown period
      if (now - adminCheckCache.lastCheck < adminCheckCache.cooldownMs) {
        const remaining = Math.ceil((adminCheckCache.cooldownMs - (now - adminCheckCache.lastCheck)) / 1000)
        console.log(`[AdminAccess] Cooldown active, waiting ${remaining}s...`)
        // Use cached result if available
        if (adminCheckCache.lastResult !== null) {
          setIsAdmin(adminCheckCache.lastResult)
          setIsChecking(false)
          if (!adminCheckCache.lastResult) {
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
        navigate('/404')
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
          navigate('/404')
          return
        }

        setIsAdmin(true)
        setIsChecking(false)
      } catch (error: any) {
        // Handle rate limit errors specifically
        if (error?.status === 429) {
          console.warn('[AdminAccess] Rate limit hit, entering cooldown period')
          adminCheckCache.rateLimitUntil = now + adminCheckCache.rateLimitCooldownMs
          // Use cached result if available, otherwise assume not admin
          if (adminCheckCache.lastResult !== null) {
            setIsAdmin(adminCheckCache.lastResult)
            setIsChecking(false)
            if (!adminCheckCache.lastResult) {
              navigate('/404')
            }
          } else {
            // No cached result, assume not admin for security
            setIsAdmin(false)
            setIsChecking(false)
            navigate('/404')
          }
          return
        }

        // For other errors, assume not admin for security
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
        setIsChecking(false)
        navigate('/404')
      } finally {
        adminCheckCache.inProgress = false
        hasCheckedRef.current = true
      }
    }

    checkAdminAccess()
    // ✅ Remove adminApi from dependencies - it's stable from useAdminApi hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user, navigate])

  return {
    isAdmin,
    isChecking,
    user
  }
}

