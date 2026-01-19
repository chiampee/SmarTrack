import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE

if (!auth0Domain || !auth0ClientId || !auth0Audience) {
  console.error('Auth0 environment variables are not set.')
  // Fallback or error handling for missing Auth0 configs
  // For now, we'll just render a simple error message
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <div>Error: Auth0 configuration missing. Please check your .env file.</div>
    </React.StrictMode>
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <Auth0Provider
            domain={auth0Domain}
            clientId={auth0ClientId}
            cacheLocation="localstorage"
            authorizationParams={{
              redirect_uri: window.location.origin + '/dashboard', // Redirect to dashboard after login
              audience: auth0Audience,
              scope: 'openid profile email'
            }}
          >
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <App />
            </BrowserRouter>
          </Auth0Provider>
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
// Force fresh build - $(date)
// Trigger build after reconnect 1768863878
