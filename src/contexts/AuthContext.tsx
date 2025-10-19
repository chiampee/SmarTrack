import React, { createContext, useContext, ReactNode } from 'react';
import { Auth0Provider, useAuth0 as useAuth0Hook, User } from '@auth0/auth0-react';
import { AUTH0_CONFIG, AUTH_ENABLED } from '../config/auth0';

interface AuthContextType {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithRedirect: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Auth Provider for local development
const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mockUser: User = {
    sub: 'local-dev-user',
    name: 'Local Developer',
    email: 'dev@localhost',
    picture: undefined,
  };

  const value: AuthContextType = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    loginWithRedirect: async () => {
      console.log('[Dev Mode] Login skipped - using mock user');
    },
    logout: () => {
      console.log('[Dev Mode] Logout skipped');
    },
    getAccessToken: async () => {
      console.log('[Dev Mode] Using mock token');
      return 'mock-token-for-development';
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use mock auth for local development, real Auth0 for production
  if (!AUTH_ENABLED) {
    console.log('🔓 [Dev Mode] Authentication disabled - using mock user');
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  console.log('🔐 [Production] Authentication enabled - using Auth0');
  return (
    <Auth0Provider {...AUTH0_CONFIG}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0Provider>
  );
};

const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0Hook();

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const getAccessToken = async (): Promise<string> => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

