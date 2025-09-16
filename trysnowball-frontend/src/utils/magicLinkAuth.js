/**
 * Magic Link Authentication for TrySnowball
 * Replaces password-based auth with secure email links
 */

import { getToken, setToken, clearToken } from './tokenStorage';

// Configuration
const AUTH_API_BASE = process.env.REACT_APP_AUTH_API_URL || '/auth';

/**
 * Request a magic link via email
 */
export const requestMagicLink = async (email) => {
  try {
    const response = await fetch(`${AUTH_API_BASE}/request-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send magic link');
    }

    return {
      data: {
        message: data.message,
        email: data.email
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
 * Handle magic link callback (when user clicks link)
 */
export const handleMagicLinkCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (token) {
    // Store the JWT token
    setToken(token);
    
    // Clear the URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return { success: true, token };
  }
  
  return { success: false, token: null };
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
    // Enhanced user management fields
    referralId: payload.referralId,
    plan: payload.plan || 'free',
    isBeta: payload.isBeta !== false, // Default to true
    joinedAt: payload.joinedAt,
    // Legacy compatibility
    created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
    user_metadata: payload.user_metadata || { 
      isPro: payload.isPro || false,
      plan: payload.plan || 'free',
      isBeta: payload.isBeta !== false,
      referralId: payload.referralId
    }
  };
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

/**
 * Handle login success page (where magic link redirects)
 */
export const handleLoginSuccess = () => {
  const result = handleMagicLinkCallback();
  
  if (result.success) {
    // Trigger auth state change
    window.dispatchEvent(new CustomEvent('auth-success', { 
      detail: { token: result.token } 
    }));
    
    // Redirect to main app
    window.location.href = '/';
    
    return true;
  }
  
  return false;
};