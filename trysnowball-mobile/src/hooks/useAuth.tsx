import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, apiClient, getToken, removeToken } from '../lib/api';

interface User {
  id?: string;
  email?: string;
  name?: string;
  referralCode?: string;
  isPro?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Use the auth.getMe method which handles JWT properly
        const response = await auth.getMe();
        if (response?.user) {
          setUser(response.user);
        } else {
          // Token might be invalid, remove it
          await removeToken();
        }
      }
    } catch (error) {
      console.error('[Auth] Check failed:', error);
      // Token is probably expired or invalid
      await removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string) => {
    try {
      await auth.requestMagicLink(email);
    } catch (error) {
      console.error('[Auth] Magic link request failed:', error);
      throw error;
    }
  };

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await auth.verifyMagicLink(token);
      
      // The JWT is automatically stored by the auth.verifyMagicLink method
      // Now get the user data
      if (response.success) {
        const userResponse = await auth.getMe();
        if (userResponse?.user) {
          setUser(userResponse.user);
        }
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('[Auth] Magic link verification failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
      // Still clear local state even if server logout fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyMagicLink,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};