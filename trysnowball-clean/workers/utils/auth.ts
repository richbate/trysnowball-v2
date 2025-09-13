/**
 * CP-5 API Worker - Auth Utilities
 * Clean JWT extraction for user authorization
 */

interface JWTPayload {
  sub?: string;
  user_id?: string;
  userId?: string;
  exp?: number;
}

/**
 * Extract user ID from JWT token in Authorization header
 * Returns null if no valid user found
 */
export async function getUserIdFromRequest(request: Request, env: any): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode JWT payload (without verification for now - reuse existing logic)
    const payload = decodeJWT(token);
    
    // Extract user ID using same logic as existing auth
    return payload.sub || payload.user_id || payload.userId || null;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Decode JWT payload without verification
 * For quick user ID extraction - verification can be added later
 */
function decodeJWT(token: string): JWTPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  // Decode base64url payload
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const decoded = JSON.parse(atob(payload));
  
  // Check if token is expired
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    throw new Error('Token expired');
  }
  
  return decoded;
}

/**
 * Require authentication for a request handler
 * Returns user ID or throws 401 error
 */
export async function requireAuth(request: Request, env: any): Promise<string> {
  const userId = await getUserIdFromRequest(request, env);
  
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  return userId;
}