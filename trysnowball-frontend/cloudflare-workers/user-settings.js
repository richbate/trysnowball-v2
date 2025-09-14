/**
 * User Settings API - Minimal Implementation
 * Handles snowball amount and other user preferences
 */

// Trusted client allowlist
const ALLOWED_CLIENT_IDS = [
  'web-v1',              // Production TrySnowball frontend
  'web-v1-staging',      // Staging TrySnowball frontend
  'mobile-v1',          // Future mobile app
  'dev-local'           // Development environment
];

// Rate limiting
const rateLimitMap = new Map();

function checkRateLimit(ip, maxRequests = 50, windowMs = 60000) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limiter = rateLimitMap.get(ip);
  if (now > limiter.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limiter.count >= maxRequests) {
    return false;
  }
  
  limiter.count++;
  return true;
}

// CORS headers
function getCorsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-id'
  };
}

// Simple JWT verification (copied from auth-magic.js)
async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    function base64urlDecode(str) {
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    
    const signatureBytes = new Uint8Array(
      base64urlDecode(signature).split('').map(char => char.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(data));
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(base64urlDecode(payload));
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch (err) {
    return null;
  }
}

async function getAuthenticatedUserId(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  if (!payload) {
    throw new Error('Invalid JWT token');
  }
  
  return payload.sub;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: getCorsHeaders(request) });
    }
    
    // Rate limiting
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      }), { 
        status: 429, 
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) }
      });
    }
    
    // Client ID validation
    const clientId = request.headers.get('x-client-id');
    if (!clientId || !ALLOWED_CLIENT_IDS.includes(clientId)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden - Invalid client',
        code: 'INVALID_CLIENT_ID'
      }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) }
      });
    }
    
    try {
      if (url.pathname === '/api/user_settings') {
        if (method === 'GET') {
          // Get user settings
          const userId = await getAuthenticatedUserId(request, env);
          
          // For now, return default settings
          // In a full implementation, you'd query D1
          return new Response(JSON.stringify({
            snowball_amount_pennies: 5000, // £50 default
            created_at: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) }
          });
          
        } else if (method === 'POST') {
          // Save user settings  
          const userId = await getAuthenticatedUserId(request, env);
          const settings = await request.json();
          
          console.log(`[SETTINGS] User ${userId} updating settings:`, settings);
          
          // For now, just return success
          // In a full implementation, you'd save to D1
          return new Response(JSON.stringify({
            success: true,
            message: 'Settings saved'
          }), {
            headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) }
          });
        }
      }
      
      return new Response('Not Found', { 
        status: 404,
        headers: getCorsHeaders(request)
      });
      
    } catch (error) {
      console.error('[SETTINGS] Error:', error);
      
      if (error.message.includes('authorization') || error.message.includes('JWT')) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized',
          code: 'AUTH_REQUIRED'
        }), { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(request) }
      });
    }
  }
};