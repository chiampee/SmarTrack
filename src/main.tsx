import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Only log if missing
if (!googleClientId) {
  console.error('[ENV] ❌ Google Client ID is MISSING')
}

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
          {/* We provide a default empty string if env var is missing to prevent crash, 
              but the feature will need to check this before invoking login */}
          <GoogleOAuthProvider clientId={googleClientId || "MISSING_GOOGLE_CLIENT_ID"}>
            <Auth0Provider
              domain={auth0Domain}
              clientId={auth0ClientId}
              authorizationParams={{
                redirect_uri: window.location.origin + '/dashboard', // Redirect to dashboard after login
                audience: auth0Audience,
                scope: 'openid profile email',
                // Request Google Drive scope from the identity provider (Google)
                connection_scope: 'https://www.googleapis.com/auth/drive.file'
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
          </GoogleOAuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
