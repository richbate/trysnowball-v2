/**
 * Unified API client for TrySnowball
 * 
 * Standardizes authentication headers across all API calls to prevent 401 errors.
 * Always sends Authorization Bearer token when available.
 * 
 * Usage:
 *  import { apiFetch } from '../utils/api';
 *  const data = await apiFetch('/api/debts');
 */

import { getToken } from './tokenStorage.js';

interface ApiFetchOptions extends RequestInit {
 skipAuth?: boolean;
}

/**
 * Get stored JWT token from localStorage (via centralized token storage)
 */
function getAuthToken(): string | null {
 return getToken();
}

/**
 * Unified fetch wrapper with consistent Authorization headers
 */
export async function apiFetch(
 url: string, 
 options: ApiFetchOptions = {}
): Promise<Response> {
 const { skipAuth = false, headers = {}, ...fetchOptions } = options;
 
 // Build headers with Authorization if token available
 const requestHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...headers as Record<string, string>
 };
 
 // Add Authorization header unless explicitly skipped
 if (!skipAuth) {
  const token = getAuthToken();
  if (token) {
   requestHeaders['Authorization'] = `Bearer ${token}`;
  }
 }
 
 // Always include credentials for cookie-based fallback
 const finalOptions: RequestInit = {
  credentials: 'include',
  ...fetchOptions,
  headers: requestHeaders
 };
 
 return fetch(url, finalOptions);
}

/**
 * GET request wrapper
 */
export async function apiGet(url: string, options: ApiFetchOptions = {}) {
 return apiFetch(url, { ...options, method: 'GET' });
}

/**
 * POST request wrapper
 */
export async function apiPost(url: string, data?: any, options: ApiFetchOptions = {}) {
 return apiFetch(url, {
  ...options,
  method: 'POST',
  body: data ? JSON.stringify(data) : undefined
 });
}

/**
 * PUT request wrapper
 */
export async function apiPut(url: string, data?: any, options: ApiFetchOptions = {}) {
 return apiFetch(url, {
  ...options,
  method: 'PUT', 
  body: data ? JSON.stringify(data) : undefined
 });
}

/**
 * DELETE request wrapper
 */
export async function apiDelete(url: string, options: ApiFetchOptions = {}) {
 return apiFetch(url, { ...options, method: 'DELETE' });
}

/**
 * Helper to handle API responses with consistent error handling
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
 if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`API Error ${response.status}: ${errorText}`);
 }
 
 const contentType = response.headers.get('content-type');
 if (contentType && contentType.includes('application/json')) {
  return response.json();
 } else {
  throw new Error(`Expected JSON response but got: ${contentType}`);
 }
}