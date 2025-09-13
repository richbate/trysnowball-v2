/**
 * CP-3 JWT Authentication Layer
 * Production-ready JWT verification for user isolation
 * Supports both HS256 (symmetric) and RS256 (asymmetric) algorithms
 */

/**
 * Minimal JWT implementation for Cloudflare Workers
 * Uses Web Crypto API for verification
 */
export class JWTAuth {
  constructor(secret, algorithm = 'HS256') {
    this.secret = secret;
    this.algorithm = algorithm;
  }

  /**
   * Decode JWT without verification (for payload inspection)
   */
  decode(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  }

  /**
   * Verify JWT signature using Web Crypto API
   */
  async verify(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [header64, payload64, signature64] = parts;
      
      // Decode header to check algorithm
      const header = JSON.parse(atob(header64.replace(/-/g, '+').replace(/_/g, '/')));
      if (header.alg !== this.algorithm) {
        console.error(`Algorithm mismatch: expected ${this.algorithm}, got ${header.alg}`);
        return false;
      }

      // Decode payload to check expiry
      const payload = JSON.parse(atob(payload64.replace(/-/g, '+').replace(/_/g, '/')));
      
      // Check expiry if present
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          console.error('Token expired');
          return false;
        }
      }

      // Prepare data for verification
      const data = `${header64}.${payload64}`;
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Decode signature from base64url
      const signature = Uint8Array.from(
        atob(signature64.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      );

      // Import key and verify based on algorithm
      if (this.algorithm === 'HS256') {
        // Symmetric key (HMAC)
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(this.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['verify']
        );

        return await crypto.subtle.verify(
          'HMAC',
          key,
          signature,
          dataBuffer
        );
      } else if (this.algorithm === 'RS256') {
        // Asymmetric key (RSA)
        // Note: For RS256, this.secret should be the public key in PEM format
        const publicKey = await this.importPublicKey(this.secret);
        
        return await crypto.subtle.verify(
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          publicKey,
          signature,
          dataBuffer
        );
      } else {
        throw new Error(`Unsupported algorithm: ${this.algorithm}`);
      }
    } catch (error) {
      console.error('JWT verification error:', error);
      return false;
    }
  }

  /**
   * Import RSA public key from PEM format
   */
  async importPublicKey(pem) {
    // Remove PEM headers and decode base64
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDer = atob(pemContents);
    const binaryDerArray = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      binaryDerArray[i] = binaryDer.charCodeAt(i);
    }

    return crypto.subtle.importKey(
      'spki',
      binaryDerArray,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  }

  /**
   * Extract user ID from JWT payload
   */
  extractUserId(payload) {
    // Standard claim: 'sub' (subject)
    // Also check common alternatives
    return payload.sub || payload.user_id || payload.userId || null;
  }
}

/**
 * Main authentication function for request handlers
 */
export async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.substring(7);
  
  // Get JWT secret from environment
  const jwtSecret = env.JWT_SECRET || env.JWT_PUBLIC_KEY;
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured in environment');
    return { valid: false, error: 'Authentication not configured' };
  }

  // Determine algorithm based on environment variable
  const algorithm = env.JWT_ALGORITHM || 'HS256';
  
  try {
    const auth = new JWTAuth(jwtSecret, algorithm);
    
    // Verify token
    const isValid = await auth.verify(token);
    if (!isValid) {
      return { valid: false, error: 'Invalid token' };
    }

    // Extract user ID
    const payload = auth.decode(token);
    const userId = auth.extractUserId(payload);
    
    if (!userId) {
      return { valid: false, error: 'Token missing user identifier' };
    }

    return {
      valid: true,
      userId,
      payload
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { valid: false, error: 'Authentication failed' };
  }
}

/**
 * Middleware helper for protected routes
 */
export function requireAuth(handler) {
  return async (request, env, ctx) => {
    const auth = await verifyAuth(request, env);
    
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add user ID to request for handler use
    request.userId = auth.userId;
    request.authPayload = auth.payload;
    
    return handler(request, env, ctx);
  };
}

export default { JWTAuth, verifyAuth, requireAuth };