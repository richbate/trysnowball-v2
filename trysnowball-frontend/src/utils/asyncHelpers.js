import { analytics } from '../lib/posthog';

/**
 * Wrapper for async operations in useEffect with error handling
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 */
export async function safeAsync(asyncFn, options = {}) {
 const {
  onError = console.error,
  errorContext = {},
  trackError = true,
  errorMessage = 'Async operation failed'
 } = options;

 try {
  return await asyncFn();
 } catch (error) {
  // Log to console
  onError(errorMessage, error);
  
  // Track in PostHog
  if (trackError && analytics?.capture) {
   analytics.capture('async_operation_error', {
    error_message: error.message || String(error),
    error_stack: error.stack,
    error_type: error.name,
    custom_message: errorMessage,
    ...errorContext
   });
  }
  
  // Re-throw if specified
  if (options.rethrow) {
   throw error;
  }
  
  return options.defaultValue;
 }
}

/**
 * Create a safe async effect for useEffect
 * Usage:
 * useEffect(() => {
 *  asyncEffect(async () => {
 *   const data = await fetchData();
 *   setData(data);
 *  }, { errorContext: { component: 'MyComponent' } });
 * }, []);
 */
export function asyncEffect(asyncFn, options = {}) {
 safeAsync(asyncFn, {
  errorMessage: 'useEffect async operation failed',
  ...options
 });
}

/**
 * Create a cleanup-aware async effect
 * Returns a cleanup function that can cancel the operation
 */
export function createAsyncEffect(asyncFn, options = {}) {
 let cancelled = false;
 
 const wrappedFn = async () => {
  try {
   const result = await asyncFn();
   if (!cancelled) {
    return result;
   }
  } catch (error) {
   if (!cancelled) {
    throw error;
   }
  }
 };
 
 safeAsync(wrappedFn, options);
 
 // Return cleanup function
 return () => {
  cancelled = true;
 };
}

/**
 * Debounced async function with error handling
 */
export function debounceAsync(asyncFn, delay = 300) {
 let timeoutId;
 let lastPromise;
 
 return async (...args) => {
  clearTimeout(timeoutId);
  
  return new Promise((resolve, reject) => {
   timeoutId = setTimeout(async () => {
    try {
     lastPromise = asyncFn(...args);
     const result = await lastPromise;
     resolve(result);
    } catch (error) {
     reject(error);
    }
   }, delay);
  });
 };
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryAsync(asyncFn, options = {}) {
 const {
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000,
  shouldRetry = (error) => true,
  onRetry = () => {}
 } = options;
 
 let lastError;
 
 for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
   return await asyncFn();
  } catch (error) {
   lastError = error;
   
   if (attempt === maxRetries || !shouldRetry(error)) {
    throw error;
   }
   
   const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
   onRetry(attempt + 1, delay, error);
   
   await new Promise(resolve => setTimeout(resolve, delay));
  }
 }
 
 throw lastError;
}