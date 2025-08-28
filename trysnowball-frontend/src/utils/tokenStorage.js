/**
 * Centralized Token Storage Utility
 * Single source of truth for JWT token storage key and operations
 * Prevents key mismatches and provides consistent error handling
 */

const NEW_JWT_STORAGE_KEY = 'ts_jwt';
const OLD_JWT_STORAGE_KEY = 'token'; // Backward compatibility

/**
 * Get the token from localStorage with backward compatibility
 * @returns {string|null} The stored token or null if not found/error
 */
export const getToken = () => {
  try {
    // Try new key first
    let token = localStorage.getItem(NEW_JWT_STORAGE_KEY);
    if (token) {
      console.log('[TokenStorage] Token found with new key');
      return token;
    }
    
    // Fallback to old key for backward compatibility
    token = localStorage.getItem(OLD_JWT_STORAGE_KEY);
    if (token) {
      console.log('[TokenStorage] Token found with old key, migrating');
      // Migrate to new key
      localStorage.setItem(NEW_JWT_STORAGE_KEY, token);
      localStorage.removeItem(OLD_JWT_STORAGE_KEY);
      return token;
    }
    
    console.log('[TokenStorage] No token found in localStorage');
    return null;
  } catch (err) {
    console.error('[TokenStorage] Error reading token:', err);
    return null;
  }
};

/**
 * Save the token to localStorage using new key
 * @param {string|null} token - The token to store, or null/undefined to remove
 */
export const setToken = (token) => {
  try {
    if (token) {
      console.log('[TokenStorage] Storing token in localStorage');
      localStorage.setItem(NEW_JWT_STORAGE_KEY, token);
      // Clean up old key during migration
      localStorage.removeItem(OLD_JWT_STORAGE_KEY);
      console.log('[TokenStorage] Token stored successfully');
    } else {
      console.log('[TokenStorage] Clearing token from localStorage');
      localStorage.removeItem(NEW_JWT_STORAGE_KEY);
      localStorage.removeItem(OLD_JWT_STORAGE_KEY); // Clean both
    }
  } catch (err) {
    console.error('[TokenStorage] Error writing token:', err);
  }
};

/**
 * Remove the token from localStorage
 * Alias for setToken(null) for clearer intent
 */
export const clearToken = () => {
  try {
    localStorage.removeItem(NEW_JWT_STORAGE_KEY);
    localStorage.removeItem(OLD_JWT_STORAGE_KEY); // Clean both for migration
  } catch (err) {
    console.error('Error clearing token:', err);
  }
};

/**
 * Check if a token exists in storage
 * @returns {boolean} True if token exists, false otherwise
 */
export const hasToken = () => {
  return !!getToken();
};