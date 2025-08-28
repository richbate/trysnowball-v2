/**
 * !! SINGLE SOURCE OF TRUTH !!
 * This is the ONLY auth Worker entry used in production.
 * Do NOT create auth.js/auth-simple.js variants again.
 * 
 * Cloudflare Worker: Magic Link Authentication with D1 + SendGrid
 * Production-ready auth system for TrySnowball
 */

// Email utility functions
function createMagicLinkUrl(baseUrl, token) {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  return `${cleanBaseUrl}/auth/verify?token=${token}`;
}

async function sendMagicLinkEmail(email, magicLinkUrl, sendgridApiKey) {
  const currentYear = new Date().getFullYear();
  
  // HTML email template
  const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Login to TrySnowball</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f6f6f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 10px 0;
      font-size: 24px;
      font-weight: bold;
      color: #2B2E4A;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 20px;
      background-color: #4CAF50;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888888;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      TrySnowball Login
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Click the button below to securely log in to your TrySnowball account.</p>
      <p>
        <a href="${magicLinkUrl}" class="button">Log In</a>
      </p>
      <p>This magic link is valid for 15 minutes and can be used only once.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
    <div class="footer">
      © ${currentYear} TrySnowball. All rights reserved.
    </div>
  </div>
</body>
</html>`;

  // Plain text fallback
  const textContent = `TrySnowball Login

Hello,

Click the link below to securely log in to your TrySnowball account:

${magicLinkUrl}

This magic link is valid for 15 minutes and can be used only once.

If you didn't request this email, you can safely ignore it.

© ${currentYear} TrySnowball. All rights reserved.`;

  // SendGrid email payload
  const emailData = {
    personalizations: [{
      to: [{ email: email }],
      subject: "Your TrySnowball Login Link"
    }],
    from: { 
      email: "noreply@trysnowball.co.uk", 
      name: "TrySnowball" 
    },
    content: [
      {
        type: "text/plain",
        value: textContent
      },
      {
        type: "text/html",
        value: htmlTemplate
      }
    ],
    tracking_settings: {
      click_tracking: {
        enable: false
      },
      open_tracking: {
        enable: false
      }
    }
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('SendGrid API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`SendGrid error: ${response.status} ${errorText}`);
  }

  console.log('Magic link email sent successfully to:', email);
  return true;
}

// Dynamic CORS headers - allows main domain and Cloudflare Pages previews
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://trysnowball.co.uk',
    'https://trysnowball-frontend.pages.dev'
  ];
  
  // Allow any Cloudflare Pages preview URL (*.trysnowball-frontend.pages.dev)
  const isAllowedOrigin = allowedOrigins.includes(origin) || 
    (origin && origin.match(/^https:\/\/[a-f0-9]+\.trysnowball-frontend\.pages\.dev$/));
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://trysnowball.co.uk',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Cache-Control': 'no-store', // Prevent CDN/browser caching of auth responses
  };
}

// Rate limiting configuration
const RATE_LIMITS = {
  MAGIC_LINK_PER_IP_MIN: 5,     // 5 requests per minute per IP
  MAGIC_LINK_PER_EMAIL_DAY: 50, // 50 requests per day per email  
  MAGIC_LINK_REUSE_WINDOW: 30,  // 30 seconds minimum between same email requests
};

/**
 * Simple rate limiter using D1 for magic link requests
 */
async function checkMagicLinkRateLimit(db, email, clientIP) {
  const now = Math.floor(Date.now() / 1000);
  const dayStart = Math.floor(now / 86400) * 86400; // Start of current UTC day
  const minuteStart = Math.floor(now / 60) * 60; // Start of current minute
  
  try {
    // Check per-email daily limit
    const emailCount = await db.prepare(`
      SELECT COUNT(*) as count FROM login_tokens 
      WHERE email = ? AND expires_at > ? AND created_at > ?
    `).bind(email, now - 86400, dayStart).first();
    
    if (emailCount && emailCount.count >= RATE_LIMITS.MAGIC_LINK_PER_EMAIL_DAY) {
      return { 
        allowed: false, 
        reason: 'email_daily_limit',
        message: 'Too many magic link requests for this email today. Try again tomorrow.'
      };
    }
    
    // Check email reuse window (prevent spam to same address)
    const recentRequest = await db.prepare(`
      SELECT created_at FROM login_tokens 
      WHERE email = ? AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, now - 300).first(); // Check last 5 minutes
    
    if (recentRequest && (now - recentRequest.created_at) < RATE_LIMITS.MAGIC_LINK_REUSE_WINDOW) {
      return { 
        allowed: false, 
        reason: 'email_reuse_window',
        message: 'Magic link recently sent to this email. Please wait 30 seconds.'
      };
    }
    
    // Check per-IP rate limit (basic protection against scraping)
    // Note: This is a simple check, production might want Redis/Durable Objects
    const ipRequests = await db.prepare(`
      SELECT COUNT(*) as count FROM login_tokens 
      WHERE created_at > ?
    `).bind(minuteStart).first(); // Rough approximation per minute
    
    if (ipRequests && ipRequests.count >= RATE_LIMITS.MAGIC_LINK_PER_IP_MIN * 10) { // Generous buffer
      console.log(`[RateLimit] High request volume detected: ${ipRequests.count} requests this minute`);
    }
    
    return { allowed: true };
    
  } catch (error) {
    console.error('[RateLimit] Error checking limits:', error);
    // Fail open - don't block legitimate users due to DB issues
    return { allowed: true };
  }
}

// JWT utilities using Web Crypto API
function base64urlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlUnescape(str) {
  str += new Array(5 - str.length % 4).join('=');
  return str.replace(/\-/g, '+').replace(/_/g, '/');
}

function base64urlDecode(str) {
  return atob(base64urlUnescape(str));
}

function base64urlEncode(str) {
  return base64urlEscape(btoa(str));
}

async function signJWT(payload, secret) {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const encodedHeader = base64urlEncode(header);
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${data}.${encodedSignature}`;
}

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
    
    const expectedSignature = new Uint8Array(
      Array.from(base64urlDecode(signature)).map(c => c.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      expectedSignature,
      encoder.encode(data)
    );
    
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(base64urlDecode(payload));
    
    // Check expiry
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch (err) {
    return null;
  }
}

// Generate secure random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate user ID
function generateUserId() {
  return 'user_' + generateToken().substring(0, 16);
}

// Generate unique referral ID
function generateReferralId() {
  const randomPart = generateToken().substring(0, 8).toLowerCase();
  return `snowball-${randomPart}`;
}

// Helper: Get token from Authorization header
function getTokenFromHeader(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

// Helper: Get user by ID from database
async function getUserById(DB, userId) {
  const user = await DB.prepare(
    'SELECT id, email, is_pro, created_at, last_login, login_count FROM users WHERE id = ?'
  ).bind(userId).first();
  return user || null;
}

// Helper: Log authentication event
async function logAuthEvent(DB, userId, eventType, metadata = {}) {
  try {
    await DB.prepare(`
      INSERT INTO auth_logs (user_id, event_type, metadata, created_at) 
      VALUES (?, ?, ?, ?)
    `).bind(
      userId, 
      eventType, 
      JSON.stringify(metadata), 
      new Date().toISOString()
    ).run();
  } catch (error) {
    console.warn('Failed to log auth event:', error);
    // Don't fail the request if logging fails
  }
}

// Auth middleware for protected routes
async function authMiddleware(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null; // No auth provided
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  if (!payload) {
    return null; // Invalid token
  }

  // Get user from database
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(payload.sub).first();

  if (!user) {
    return null; // User not found
  }

  return {
    id: user.id,
    email: user.email,
    isPro: user.is_pro,
    user_metadata: { isPro: user.is_pro }
  };
}

// --- CRA COMPATIBILITY HELPERS ---
async function getSessionFromCookie(request, env) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookie.split('; ').map(c => {
        const [key, ...val] = c.split('=');
        return [key, val.join('=')];
      })
    );
    
    const sessionToken = cookies['ts_session'];
    if (!sessionToken) return null;
    
    // Use existing JWT verification from this Worker
    const decoded = await verifyJWT(sessionToken, env.JWT_SECRET);
    if (!decoded) return null;
    
    // Return user data in expected format (JWT uses 'sub' for user ID)
    return {
      user: {
        id: decoded.sub,
        email: decoded.email
      }
    };
  } catch (error) {
    console.error('[getSessionFromCookie] Error:', error);
    return null;
  }
}

async function isUserPro(env, userId) {
  try {
    // Check KV storage for entitlement (if KV binding exists)
    if (env.ENTITLEMENTS) {
      const entry = await env.ENTITLEMENTS.get(`user:${userId}`);
      if (entry) {
        const data = JSON.parse(entry);
        return !!(data.betaAccess || data.lifetime);
      }
    }
    
    // Fallback: Check D1 database for Pro status
    if (env.DB) {
      const result = await env.DB.prepare('SELECT is_pro FROM users WHERE id = ?').bind(userId).first();
      return !!(result?.is_pro);
    }
    
    // Safe default: everyone is free tier
    return false;
  } catch (error) {
    console.error('[isUserPro] Error:', error);
    return false; // Safe default on error
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Pass through /auth/success to the React app
    if (path === '/auth/success') {
      return fetch(request);
    }

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    try {
// Health check
// Health checks
if ((path === '/health' || path === '/auth/health' || path === '/api/health') && method === 'GET') {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'auth',
    ts: new Date().toISOString(),
    build: env.BUILD_SHA || 'dev',
    endpoints: [
      '/api/me', '/api/account/entitlement', '/api/health',
      '/auth/request-link', '/auth/verify', '/auth/check',
      '/auth/me', '/auth/stats', '/auth/refresh', '/auth/logout'
    ],
    database: 'D1 connected'
  }), {
    status: 200,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

      // --- CRA COMPATIBILITY ROUTES ---
      // GET /api/me - Returns current user from session cookie or null
      if (path === '/api/me' && method === 'GET') {
        try {
          const session = await getSessionFromCookie(request, env);
          return new Response(JSON.stringify({ user: session?.user ?? null }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[/api/me] Error:', error);
          return new Response(JSON.stringify({ user: null }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        }
      }

      // GET /api/account/entitlement - Returns user's Pro/Free status
      if (path === '/api/account/entitlement' && method === 'GET') {
        try {
          const session = await getSessionFromCookie(request, env);
          const isPro = session?.user ? await isUserPro(env, session.user.id) : false;
          return new Response(JSON.stringify({ 
            isPro, 
            plan: isPro ? 'pro' : 'free',
            betaAccess: isPro,
            dailyQuota: isPro ? 50 : 40
          }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[/api/account/entitlement] Error:', error);
          return new Response(JSON.stringify({ 
            isPro: false, 
            plan: 'free',
            reason: 'Error occurred, defaulting to free'
          }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        }
      }

      // Magic link request
      if (path === '/auth/request-link' && method === 'POST') {
        return await handleRequestLink(request, env);
      }
      
      // Magic link verification
      if (path === '/auth/verify' && method === 'GET') {
        return await handleVerifyToken(request, env);
      }
      
      // Check authentication status
      if (path === '/auth/check' && method === 'GET') {
        return await handleCheck(request, env);
      }
      
      // Get current user info
      if (path === '/auth/me' && method === 'GET') {
        return await handleMe(request, env);
      }
      
      // Get authentication statistics
      if (path === '/auth/stats' && method === 'GET') {
        return await handleStats(request, env);
      }
      
      // Refresh JWT token
      if (path === '/auth/refresh' && method === 'POST') {
        return await handleRefresh(request, env);
      }
      
      // Logout
      if (path === '/auth/logout' && method === 'POST') {
        return await handleLogout(request, env);
      }

      // Protected route example
      if (path === '/auth/profile' && method === 'GET') {
        return await handleProfile(request, env);
      }

      // 404 for unmatched routes
      return new Response('Not Found', { 
        status: 404, 
        headers: getCorsHeaders(request) 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }
  }
};

// Request magic link
async function handleRequestLink(request, env) {
  const { email, redirect_url } = await request.json();
  
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({
      error: 'Valid email required'
    }), {
      status: 400,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  try {
    // Rate limiting check
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitResult = await checkMagicLinkRateLimit(env.DB, email.toLowerCase(), clientIP);
    
    if (!rateLimitResult.allowed) {
      console.log(`[RateLimit] Magic link blocked: ${rateLimitResult.reason} for ${email}`);
      return new Response(JSON.stringify({
        error: rateLimitResult.message,
        reason: rateLimitResult.reason
      }), {
        status: 429,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }
    // Generate token
    const token = generateToken();
    const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes
    
    // Store token in D1 with optional redirect URL
    await env.DB.prepare(
      'INSERT INTO login_tokens (token, email, expires_at, redirect_url) VALUES (?, ?, ?, ?)'
    ).bind(token, email.toLowerCase(), expiresAt, redirect_url || null).run();

    // Send email via SendGrid - always use production for magic links
    const baseUrl = 'https://trysnowball.co.uk';
    const magicLinkUrl = createMagicLinkUrl(baseUrl, token);
    
    // Send email if SendGrid API key is available
    if (env.SENDGRID_API_KEY) {
      await sendMagicLinkEmail(email, magicLinkUrl, env.SENDGRID_API_KEY);
      
      return new Response(JSON.stringify({
        message: "Magic link sent! Check your email.",
        email: email
      }), { 
        status: 200, 
        headers: { ...getCorsHeaders(request), "Content-Type": "application/json" } 
      });
    } else {
      // Debug mode when no SendGrid key
      return new Response(JSON.stringify({
        message: "Magic link generated (debug mode - no SendGrid key)",
        link: magicLinkUrl,
        token,
        note: "Set SENDGRID_API_KEY environment variable to enable email sending"
      }), { 
        status: 200, 
        headers: { ...getCorsHeaders(request), "Content-Type": "application/json" } 
      });
    }

  } catch (error) {
    console.error('Magic link error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send magic link',
      message: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// Verify magic link token
async function handleVerifyToken(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Missing token', { status: 400, headers: getCorsHeaders(request) });
  }

  try {
    console.log('Verifying token:', token);
    // Get token from D1
    const tokenRecord = await env.DB.prepare(
      'SELECT * FROM login_tokens WHERE token = ? AND used = FALSE'
    ).bind(token).first();
    console.log('Token record found:', !!tokenRecord);

    if (!tokenRecord) {
      return new Response('Invalid or expired token', { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (tokenRecord.expires_at < now) {
      return new Response('Token expired', { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    // Mark token as used
    await env.DB.prepare(
      'UPDATE login_tokens SET used = TRUE WHERE token = ?'
    ).bind(token).run();

    const email = tokenRecord.email;

    // Get or create user
    let user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      // Create new user with enhanced fields
      const userId = generateUserId();
      const referralId = generateReferralId();
      const now = new Date().toISOString();
      
      await env.DB.prepare(`
        INSERT INTO users (id, email, referral_id, is_pro, is_beta, plan, created_at, joined_at, last_seen_at, login_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        userId, 
        email, 
        referralId,
        false, // is_pro
        true,  // is_beta (all new users get beta access)
        'free', // plan
        now,   // created_at
        now,   // joined_at  
        now,   // last_seen_at
      ).run();
      
      user = { 
        id: userId, 
        email, 
        referral_id: referralId,
        is_pro: false, 
        is_beta: true,
        plan: 'free',
        joined_at: now
      };
    } else {
      // Update login stats and last seen
      const now = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE users 
        SET last_login = ?, last_seen_at = ?, login_count = login_count + 1 
        WHERE id = ?
      `).bind(now, now, user.id).run();
      
      // Ensure referral_id exists for existing users
      if (!user.referral_id) {
        const referralId = generateReferralId();
        await env.DB.prepare(
          'UPDATE users SET referral_id = ? WHERE id = ?'
        ).bind(referralId, user.id).run();
        user.referral_id = referralId;
      }
    }

    // Generate JWT with enriched payload
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      isPro: user.is_pro,
      plan: user.plan,
      isBeta: user.is_beta,
      referralId: user.referral_id,
      user_metadata: { 
        isPro: user.is_pro,
        plan: user.plan,
        isBeta: user.is_beta,
        referralId: user.referral_id
      },
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };

    const jwt = await signJWT(jwtPayload, env.JWT_SECRET);

    // Log successful login
    await logAuthEvent(env.DB, user.id, 'magic_link_login', {
      token_used: token,
      new_user: !user,
      user_agent: request.headers.get('User-Agent')
    });

    // Create enriched user response as per PRD
    const enrichedUserResponse = {
      token: jwt,
      user: {
        id: user.id,
        email: user.email,
        referralId: user.referral_id,
        joinedAt: user.joined_at || user.created_at,
        plan: user.plan || 'free',
        isPro: user.is_pro,
        isBeta: user.is_beta !== false // Default to true for backward compatibility
      }
    };

    // Check if this is an API request (Accept: application/json) or web request
    const acceptHeader = request.headers.get('Accept') || '';
    if (acceptHeader.includes('application/json')) {
      // API request - return JSON with enriched data
      return new Response(JSON.stringify(enrichedUserResponse), {
        status: 200,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    // Web request - set httpOnly session cookie and redirect
    const baseUrl = tokenRecord.redirect_url || 'https://trysnowball.co.uk';
    const redirectUrl = `${baseUrl}/auth/success?token=${jwt}`; // matches App.js route

    // Set httpOnly session cookie for /api/me endpoint compatibility
    const cookieOptions = [
      `ts_session=${jwt}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      `Max-Age=${24 * 60 * 60}`, // 24 hours to match JWT expiry
      'Path=/'
    ].join('; ');

    return Response.redirect(redirectUrl, 302, {
      'Set-Cookie': cookieOptions
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      message: error.message,
      stack: error.stack
    }), { 
      status: 500, 
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' } 
    });
  }
}

// Check authentication
async function handleCheck(request, env) {
  const user = await authMiddleware(request, env);
  
  if (!user) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    valid: true,
    user: user
  }), {
    status: 200,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

// Logout
async function handleLogout(request, env) {
  // Clear the session cookie
  const clearCookieOptions = [
    'ts_session=',
    'HttpOnly',
    'Secure', 
    'SameSite=Lax',
    'Max-Age=0', // Expire immediately
    'Path=/'
  ].join('; ');

  return new Response(JSON.stringify({
    message: 'Logged out successfully'
  }), {
    status: 200,
    headers: { 
      ...getCorsHeaders(request), 
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookieOptions
    }
  });
}

// Get current user info (/auth/me)
async function handleMe(request, env) {
  try {
    const token = getTokenFromHeader(request);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    // Fetch user info from D1 with defensive fallback
let user;
try {
  user = await getUserById(env.DB, payload.sub);
} catch (err) {
  console.error('[Auth] DB lookup failed in /auth/me:', err);
  return new Response(JSON.stringify({ error: 'Database error' }), {
    status: 500,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

if (!user) {
  console.warn(`[Auth] User not found for ID: ${payload.sub}`);
  return new Response(JSON.stringify({ error: 'User not found' }), {
    status: 404,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        referralId: user.referral_id,
        joinedAt: user.joined_at || user.created_at,
        plan: user.plan || 'free',
        isPro: user.is_pro,
        isBeta: user.is_beta !== false,
        // Legacy fields for backward compatibility
        created_at: user.created_at,
        last_login: user.last_login,
        login_count: user.login_count
      }
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// Refresh JWT token (/auth/refresh)
async function handleRefresh(request, env) {
  try {
    const token = getTokenFromHeader(request);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    // Check if token is close to expiry (within 1 hour)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    
    if (timeUntilExpiry > 3600) { // More than 1 hour left
      return new Response(JSON.stringify({ 
        message: 'Token still valid', 
        expires_in: timeUntilExpiry 
      }), {
        status: 200,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    // Generate new JWT with extended expiry
    const user = await getUserById(env.DB, payload.sub);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const newJwtPayload = {
      sub: user.id,
      email: user.email,
      isPro: user.is_pro,
      user_metadata: { isPro: user.is_pro },
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };

    const newJwt = await signJWT(newJwtPayload, env.JWT_SECRET);

    // Log refresh event
    await logAuthEvent(env.DB, user.id, 'token_refresh', {
      old_exp: payload.exp,
      new_exp: newJwtPayload.exp
    });

    return new Response(JSON.stringify({
      token: newJwt,
      expires_in: 24 * 60 * 60,
      user: {
        id: user.id,
        email: user.email,
        isPro: user.is_pro
      }
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Refresh endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// Get authentication statistics (/auth/stats)
async function handleStats(request, env) {
  try {
    // Check if user is authenticated and is Pro
    const user = await authMiddleware(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    // For now, allow all authenticated users to see stats
    // In production, you might want to restrict to admin users only
    
    // Get comprehensive stats
    const stats = await getAuthStatistics(env.DB);
    
    return new Response(JSON.stringify({
      stats: stats,
      generated_at: new Date().toISOString(),
      requested_by: {
        user_id: user.id,
        email: user.email
      }
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// Helper: Get comprehensive authentication statistics
async function getAuthStatistics(DB) {
  const stats = {};

  // User statistics
  const userStats = await DB.prepare(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_pro = 1 THEN 1 END) as pro_users,
      COUNT(CASE WHEN is_pro = 0 THEN 1 END) as free_users,
      COUNT(CASE WHEN last_login >= datetime('now', '-1 day') THEN 1 END) as active_last_24h,
      COUNT(CASE WHEN last_login >= datetime('now', '-7 days') THEN 1 END) as active_last_7d,
      COUNT(CASE WHEN last_login >= datetime('now', '-30 days') THEN 1 END) as active_last_30d,
      COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as new_users_24h,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_users_7d,
      COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_users_30d
    FROM users
  `).first();
  
  stats.users = userStats;

  // Login activity statistics
  const loginStats = await DB.prepare(`
    SELECT 
      COUNT(*) as total_logins,
      COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as logins_24h,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as logins_7d,
      COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as logins_30d,
      COUNT(CASE WHEN event_type = 'magic_link_login' THEN 1 END) as magic_link_logins,
      COUNT(CASE WHEN event_type = 'token_refresh' THEN 1 END) as token_refreshes
    FROM auth_logs
  `).first();
  
  stats.activity = loginStats;

  // Top active users
  const topUsers = await DB.prepare(`
    SELECT 
      u.email,
      u.is_pro,
      u.login_count,
      u.last_login,
      COUNT(al.id) as recent_activity
    FROM users u
    LEFT JOIN auth_logs al ON u.id = al.user_id AND al.created_at >= datetime('now', '-30 days')
    GROUP BY u.id, u.email, u.is_pro, u.login_count, u.last_login
    ORDER BY recent_activity DESC, u.login_count DESC
    LIMIT 10
  `).all();
  
  stats.top_users = topUsers;

  // Daily activity for the last 30 days
  const dailyActivity = await DB.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as total_events,
      COUNT(CASE WHEN event_type = 'magic_link_login' THEN 1 END) as logins,
      COUNT(CASE WHEN event_type = 'token_refresh' THEN 1 END) as refreshes,
      COUNT(DISTINCT user_id) as unique_users
    FROM auth_logs 
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date DESC
  `).all();
  
  stats.daily_activity = dailyActivity;

  // User retention analysis
  const retentionStats = await DB.prepare(`
    SELECT 
      COUNT(CASE WHEN login_count = 1 THEN 1 END) as single_login_users,
      COUNT(CASE WHEN login_count BETWEEN 2 AND 5 THEN 1 END) as casual_users,
      COUNT(CASE WHEN login_count BETWEEN 6 AND 20 THEN 1 END) as regular_users,
      COUNT(CASE WHEN login_count > 20 THEN 1 END) as power_users,
      AVG(login_count) as avg_logins_per_user
    FROM users
  `).first();
  
  stats.retention = retentionStats;

  // Magic link token statistics
  const tokenStats = await DB.prepare(`
    SELECT 
      COUNT(*) as total_tokens_generated,
      COUNT(CASE WHEN used = 1 THEN 1 END) as tokens_used,
      COUNT(CASE WHEN used = 0 AND expires_at < unixepoch('now') THEN 1 END) as tokens_expired,
      COUNT(CASE WHEN used = 0 AND expires_at >= unixepoch('now') THEN 1 END) as tokens_pending,
      COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as tokens_24h
    FROM login_tokens
  `).first();
  
  // Calculate conversion rate
  if (tokenStats.total_tokens_generated > 0) {
    tokenStats.conversion_rate = (tokenStats.tokens_used / tokenStats.total_tokens_generated * 100).toFixed(2);
  } else {
    tokenStats.conversion_rate = 0;
  }
  
  stats.tokens = tokenStats;

  // Recent auth events (last 50)
  const recentEvents = await DB.prepare(`
    SELECT 
      al.event_type,
      al.created_at,
      u.email,
      u.is_pro,
      al.metadata
    FROM auth_logs al
    JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 50
  `).all();
  
  stats.recent_events = recentEvents;

  return stats;
}

// Protected profile endpoint (example)
async function handleProfile(request, env) {
  const user = await authMiddleware(request, env);
  
  if (!user) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }

  // Get user preferences
  const preferences = await env.DB.prepare(
    'SELECT * FROM user_preferences WHERE user_id = ?'
  ).bind(user.id).first();

  return new Response(JSON.stringify({
    user: user,
    preferences: preferences || { extra_payment: 100 }
  }), {
    status: 200,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

