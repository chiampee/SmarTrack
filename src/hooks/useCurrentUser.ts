/**
 * useCurrentUser Hook
 * 
 * Security-critical hook that provides the authenticated user's ID.
 * 
 * SECURITY BEST PRACTICES:
 * - ALWAYS get userId from authenticated Auth0 session
 * - NEVER trust client-side input for userId
 * - All database operations MUST use this hook to ensure data isolation
 * - Returns null if not authenticated (forces login)
 */

import { useAuth } from '../contexts/AuthContext';

export interface CurrentUser {
  id: string;
  email: string | undefined;
  name: string | undefined;
  picture: string | undefined;
}

/**
 * Get the current authenticated user
 * @returns CurrentUser object or null if not authenticated
 * @throws Never - returns null instead to allow conditional rendering
 */
export function useCurrentUser(): CurrentUser | null {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Still loading auth state
  if (isLoading) {
    return null;
  }

  // Not authenticated - should redirect to login
  if (!isAuthenticated || !user || !user.sub) {
    return null;
  }

  // Return sanitized user object with verified Auth0 user ID
  return {
    id: user.sub, // Auth0 user ID (e.g., "auth0|12345")
    email: user.email,
    name: user.name,
    picture: user.picture,
  };
}

/**
 * Get ONLY the user ID (for database queries)
 * @returns User ID string or null if not authenticated
 */
export function useUserId(): string | null {
  const user = useCurrentUser();
  return user?.id ?? null;
}

