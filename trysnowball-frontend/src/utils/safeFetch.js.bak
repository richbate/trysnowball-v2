import { analytics } from '../lib/posthog';

/**
 * Safe fetch wrapper with error handling and PostHog tracking
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise<Response>} - The fetch response
 */
export async function safeFetch(url, options = {}, config = {}) {
 const {
  retries = 1,
  timeout = 30000,
  trackErrors = true,
  errorContext = {}
 } = config;

 // Create an AbortController for timeout
 const controller = new AbortController();
 const timeoutId = setTimeout(() => controller.abort(), timeout);

 // Add credentials by default for API calls
 const defaultOptions = {
  credentials: 'include',
  ...options,
  signal: controller.signal
 };

 let lastError;
 
 for (let attempt = 0; attempt <= retries; attempt++) {
  try {
   const response = await fetch(url, defaultOptions);
   clearTimeout(timeoutId);
   
   // Check for non-OK responses
   if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    
    // Try to parse error body
    try {
     const errorBody = await response.json();
     error.details = errorBody;
     error.message = errorBody.error || errorBody.message || error.message;
    } catch {
     // Ignore JSON parse errors
    }
    
    throw error;
   }
   
   return response;
   
  } catch (error) {
   lastError = error;
   clearTimeout(timeoutId);
   
   // Don't retry on client errors (4xx)
   if (error.status && error.status >= 400 && error.status < 500) {
    break;
   }
   
   // Don't retry on abort
   if (error.name === 'AbortError') {
    error.message = `Request timeout after ${timeout}ms`;
    break;
   }
   
   // Log retry attempts
   if (attempt < retries) {
    console.warn(`Fetch retry ${attempt + 1}/${retries} for ${url}:`, error.message);
    // Wait before retry (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
   }
  }
 }
 
 // Track error in PostHog
 if (trackErrors && analytics?.capture) {
  analytics.capture('fetch_error', {
   url,
   method: options.method || 'GET',
   error_message: lastError.message,
   error_status: lastError.status,
   error_type: lastError.name,
   attempts: retries + 1,
   ...errorContext
  });
 }
 
 throw lastError;
}

/**
 * Safe JSON fetch helper
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise<any>} - The parsed JSON response
 */
export async function safeFetchJSON(url, options = {}, config = {}) {
 try {
  const response = await safeFetch(url, options, config);
  
  // Handle empty responses
  const text = await response.text();
  if (!text) {
   return null;
  }
  
  // Parse JSON
  try {
   return JSON.parse(text);
  } catch (parseError) {
   console.error('JSON parse error for', url, ':', parseError);
   console.error('Response text:', text.substring(0, 200));
   
   // Track JSON parse errors
   if (analytics?.capture) {
    analytics.capture('json_parse_error', {
     url,
     error_message: parseError.message,
     response_preview: text.substring(0, 200)
    });
   }
   
   throw new Error(`Invalid JSON response from ${url}`);
  }
 } catch (error) {
  // Re-throw with context
  error.context = { url, method: options.method || 'GET' };
  throw error;
 }
}

/**
 * Create a fetch wrapper with default config
 */
export function createFetchClient(defaultConfig = {}) {
 return {
  get: (url, config) => safeFetchJSON(url, { method: 'GET' }, { ...defaultConfig, ...config }),
  post: (url, body, config) => safeFetchJSON(url, { 
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(body)
  }, { ...defaultConfig, ...config }),
  put: (url, body, config) => safeFetchJSON(url, {
   method: 'PUT',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(body)
  }, { ...defaultConfig, ...config }),
  delete: (url, config) => safeFetchJSON(url, { method: 'DELETE' }, { ...defaultConfig, ...config })
 };
}