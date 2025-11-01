import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

const ADMIN_EMAILS = ['chaimpeer11@gmail.com']

export const useAdminAccess = () => {
  const { user, isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
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

      const userEmail = user.email?.toLowerCase()
      const adminCheck = userEmail && ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail)

      if (!adminCheck) {
        setIsAdmin(false)
        setIsChecking(false)
        navigate('/404')
        return
      }

      setIsAdmin(true)
      setIsChecking(false)
    }

    checkAdminAccess()
  }, [isAuthenticated, isLoading, user, navigate])

  return {
    isAdmin,
    isChecking,
    user
  }
}

