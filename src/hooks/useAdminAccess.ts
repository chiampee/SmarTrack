import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAdminApi } from '../services/adminApi'

export const useAdminAccess = () => {
  const { user, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const adminApi = useAdminApi()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
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
      try {
        const result = await adminApi.checkAdminStatus()
        const adminStatus = result.isAdmin

        if (!adminStatus) {
          setIsAdmin(false)
          setIsChecking(false)
          navigate('/404')
          return
        }

        setIsAdmin(true)
        setIsChecking(false)
      } catch (error) {
        // If API call fails, assume not admin for security
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
        setIsChecking(false)
        navigate('/404')
      }
    }

    checkAdminAccess()
  }, [isAuthenticated, isLoading, user, navigate, adminApi])

  return {
    isAdmin,
    isChecking,
    user
  }
}

