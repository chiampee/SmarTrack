import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LoginPage } from './pages/LoginPage'
import { FAQPage } from './pages/FAQPage'
import { LegalCenterPage } from './pages/LegalCenterPage'
import { DocsPage } from './pages/DocsPage'
import { Dashboard } from './pages/Dashboard'
import { MainPage } from './pages/MainPage'
import { Settings } from './pages/Settings'
import { AdminAnalytics } from './pages/AdminAnalytics'
import { NotFoundPage } from './pages/NotFoundPage'
import { Layout } from './components/Layout'
import { CategoriesProvider } from './context/CategoriesContext'
import { AdminProvider } from './context/AdminContext'
import { Navigate } from 'react-router-dom'

// Public routes accessible without authentication
const publicRoutes = ['/faq', '/privacy', '/terms', '/legal', '/docs']

function App() {
  const { isAuthenticated, isLoading } = useAuth0()
  const location = useLocation()

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route))

  // Show loading spinner while Auth0 is initializing
  // This prevents race conditions where isAuthenticated is false before token loads
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className="text-lg text-gray-700 font-medium">Loading SmarTrack...</p>
        </div>
      </div>
    )
  }

  // Show public pages without authentication
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/legal" element={<LegalCenterPage />} />
        <Route path="/privacy" element={<Navigate to="/legal" replace />} />
        <Route path="/terms" element={<Navigate to="/legal" replace />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    )
  }

  // Only check authentication status AFTER loading is complete
  // This prevents race conditions on page refresh
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AdminProvider>
      <CategoriesProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
            <Route path="/404" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </CategoriesProvider>
    </AdminProvider>
  )
}

export default App
