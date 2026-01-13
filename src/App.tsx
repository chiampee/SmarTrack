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
import { LoadingSpinner } from './components/LoadingSpinner'
import { CategoriesProvider } from './context/CategoriesContext'
import { Navigate } from 'react-router-dom'

// Public routes accessible without authentication
const publicRoutes = ['/faq', '/privacy', '/terms', '/legal', '/docs']

function App() {
  const { isAuthenticated, isLoading } = useAuth0()
  const location = useLocation()

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route))

  if (isLoading) {
    return <LoadingSpinner />
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

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
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
  )
}

export default App
