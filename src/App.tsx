import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LoginPage } from './pages/LoginPage'
import { FAQPage } from './pages/FAQPage'
import { LegalCenterPage } from './pages/LegalCenterPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { DocsPage } from './pages/DocsPage'
import { Dashboard } from './pages/Dashboard'
import { MainPage } from './pages/MainPage'
import { Settings } from './pages/Settings'
import { AdminAnalytics } from './pages/AdminAnalytics'
import { NotFoundPage } from './pages/NotFoundPage'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'
import { CategoriesProvider } from './context/CategoriesContext'
import { AdminProvider } from './context/AdminContext'
import { SidebarProvider } from './context/SidebarContext'
import { ResourceTypeCountsProvider } from './context/ResourceTypeCountsContext'

// Public routes accessible without authentication
const publicRoutes = ['/faq', '/privacy', '/terms', '/legal', '/docs']

function App() {
  const { isAuthenticated, isLoading } = useAuth0()
  const location = useLocation()

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route))

  // CRITICAL: Handle loading state first - wait for Auth0 to initialize
  // This prevents race conditions on mobile where session might not be restored yet
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Show public pages without authentication (only after loading completes)
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/legal" element={<LegalCenterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    )
  }

  // Only check authentication AFTER loading is complete
  // This ensures Auth0 has fully restored the session from localStorage
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AdminProvider>
      <CategoriesProvider>
        <SidebarProvider>
          <ResourceTypeCountsProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/analytics" element={<AdminAnalytics />} />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </ResourceTypeCountsProvider>
        </SidebarProvider>
      </CategoriesProvider>
    </AdminProvider>
  )
}

export default App
