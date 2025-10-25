// Auth0 Configuration
// Get these values from your Auth0 dashboard: https://manage.auth0.com

// Check if we're in production (Vercel)
export const isProduction = import.meta.env.PROD && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('smartracker.vercel.app') ||
   !window.location.hostname.includes('localhost'));

// Disable Auth0 for local development
export const AUTH_ENABLED = isProduction;

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'your-domain.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-client-id',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  scope: 'openid profile email',
};

export const AUTH0_CONFIG = {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  authorizationParams: {
    redirect_uri: auth0Config.redirectUri,
    audience: auth0Config.audience,
    scope: auth0Config.scope,
  },
  cacheLocation: 'localstorage' as const,
  useRefreshTokens: true,
};

