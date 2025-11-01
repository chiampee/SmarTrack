import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { AdminAnalytics } from './pages/AdminAnalytics'
import { NotFoundPage } from './pages/NotFoundPage'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'
import { CategoriesProvider } from './context/CategoriesContext'

function App() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <CategoriesProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
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
