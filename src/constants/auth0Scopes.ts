/**
 * Auth0 OIDC Scopes - Minimal permissions required
 * 
 * These scopes are requested from Auth0, which then requests
 * corresponding permissions from the identity provider (Google, etc.)
 * 
 * Breakdown:
 * - openid: Required OIDC scope, provides 'sub' (user ID)
 * - email: Provides 'email' and 'email_verified' (required for admin checks)
 * - profile: Provides 'name', 'nickname', 'picture', 'given_name', 'family_name'
 */
export const AUTH0_SCOPES = 'openid profile email' as const
