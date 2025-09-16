/**
 * JWT Authentication Utilities
 * Replaces Supabase auth in TrySnowball
 */

import { getToken, setToken, clearToken } from './tokenStorage';

// Configuration
const AUTH_API_BASE = process.env.REACT_APP_AUTH_API_URL || '/auth';

/**
 * Decode JWT payload without verification (client-side only)
 */
export const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (err) {
    console.warn('Failed to decode JWT:', err);
    return null;
  }
};

/**
 * Check if JWT is expired
 */
export const isJWTExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  return payload.exp < (Date.now() / 1000);
};

/**
 * Get current JWT from localStorage
 */
export const getStoredJWT = () => {
  try {
    return getToken();
  } catch (err) {
    return null;
  }
};

/**
 * Store JWT in localStorage
 */
export const storeJWT = (token) => {
  try {
    setToken(token);
    return true;
  } catch (err) {
    console.warn('Failed to store JWT:', err);
    return false;
  }
};

/**
 * Remove JWT from localStorage
 */
export const clearJWT = () => {
  try {
    clearToken();
    return true;
  } catch (err) {
    console.warn('Failed to clear JWT:', err);
    return false;
  }
};

/**
 * Get current user from stored JWT
 */
export const getCurrentUser = () => {
  const token = getStoredJWT();
  if (!token || isJWTExpired(token)) {
    return null;
  }
  
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  return {
    id: payload.sub,
    email: payload.email,
    created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
    user_metadata: payload.user_metadata || { isPro: payload.isPro || false }
  };
};

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${AUTH_API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store the JWT
    if (data.access_token) {
      storeJWT(data.access_token);
    }

    return {
      data: {
        user: data.user,
        session: {
          access_token: data.access_token,
          token_type: data.token_type,
          expires_in: data.expires_in
        }
      },
      error: null
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err.message }
    };
  }
};

/**
 * Register new user
 */
export const register = async (email, password) => {
  try {
    const response = await fetch(`${AUTH_API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return {
      data: { user: data.user },
      error: null
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err.message }
    };
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    // Call logout endpoint (optional)
    await fetch(`${AUTH_API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredJWT()}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    // Ignore logout API errors
  }

  // Always clear local storage
  clearJWT();
  
  return { error: null };
};

/**
 * Check current session
 */
export const getSession = async () => {
  const token = getStoredJWT();
  
  if (!token) {
    return {
      data: { session: null },
      error: null
    };
  }

  if (isJWTExpired(token)) {
    clearJWT();
    return {
      data: { session: null },
      error: null
    };
  }

  const user = getCurrentUser();
  
  return {
    data: {
      session: {
        access_token: token,
        user: user
      }
    },
    error: null
  };
};

/**
 * Refresh session/token
 */
export const refreshSession = async () => {
  const token = getStoredJWT();
  
  if (!token) {
    return {
      data: { session: null },
      error: { message: 'No session to refresh' }
    };
  }

  try {
    const response = await fetch(`${AUTH_API_BASE}/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Token refresh failed');
    }

    // Store new token
    if (data.access_token) {
      storeJWT(data.access_token);
    }

    const user = getCurrentUser();

    return {
      data: {
        session: {
          access_token: data.access_token,
          user: user
        }
      },
      error: null
    };
  } catch (err) {
    clearJWT();
    return {
      data: { session: null },
      error: { message: err.message }
    };
  }
};

/**
 * Verify token with server
 */
export const verifyToken = async (token = null) => {
  const authToken = token || getStoredJWT();
  
  if (!authToken) {
    return { valid: false, error: 'No token provided' };
  }

  try {
    const response = await fetch(`${AUTH_API_BASE}/check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { valid: false, error: data.error };
    }

    return { valid: true, user: data.user };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

/**
 * Auth state change simulation
 * Since we don't have real-time updates, we'll use polling or manual triggers
 */
export const createAuthStateListener = (callback) => {
  let currentToken = getStoredJWT();
  let currentUser = getCurrentUser();

  // Check for changes periodically
  const interval = setInterval(() => {
    const newToken = getStoredJWT();
    const newUser = getCurrentUser();
    
    // If token changed or user changed
    if (newToken !== currentToken) {
      currentToken = newToken;
      currentUser = newUser;
      
      if (newToken && newUser) {
        callback('SIGNED_IN', { access_token: newToken, user: newUser });
      } else {
        callback('SIGNED_OUT', null);
      }
    }
  }, 1000); // Check every second

  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Development bypass (similar to current Supabase bypass)
 */
export const getDevUser = () => {
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    return {
      id: 'dev-user-123',
      email: 'dev@trysnowball.local',
      created_at: '2024-01-01T00:00:00.000Z',
      user_metadata: { isPro: true }
    };
  }
  return null;
};