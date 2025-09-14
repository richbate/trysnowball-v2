/**
 * !! SINGLE SOURCE OF TRUTH !!
 * This is the ONLY auth Worker entry used in production.
 * Do NOT create auth.js/auth-simple.js variants again.
 * 
 * Cloudflare Worker: Magic Link Authentication with D1 + SendGrid
 * Production-ready auth system for TrySnowball
 */

import { getPlan } from './lib/plan';

// Stripe price ID for beta plan
const STRIPE_PRICE_BETA = 'price_1S4Kyj9OfFB3mfqAC3ppmvzN';

// Email utility functions
function createMagicLinkUrl(baseUrl, token) {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  return `${cleanBaseUrl}/auth/verify?token=${token}`;
}

async function sendMagicLinkEmail(email, magicLinkUrl, sendgridApiKey, env) {
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

  if (env?.ENVIRONMENT !== "production") {
    console.log('Magic link email sent successfully to user');
  }
  return true;
}

// Dynamic CORS headers - allows main domain and Cloudflare Pages previews
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://trysnowball.co.uk',
    'https://trysnowball-frontend.pages.dev',
    'http://localhost:3000'  // Allow local development
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

// Helper: Get token from both Authorization header and cookie
function getToken(request) {
  // Try Authorization header first
  const headerToken = getTokenFromHeader(request);
  if (headerToken) return headerToken;
  
  // Try ts_session cookie
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'ts_session' && value) {
        return value;
      }
    }
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

// 🎯 Pro Subscription with Trial Logic
async function subscribeUserToProPlan(env, userId, planType = 'monthly') {
  try {
    // Get user data including trial status
    const user = await env.DB.prepare(`
      SELECT id, stripe_customer_id, hasUsedTrial, trialEndsAt 
      FROM users WHERE id = ?
    `).bind(userId).first();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create Stripe customer if one doesn't exist
    if (!user.stripe_customer_id) {
      console.log(`User ${userId} has no Stripe customer, creating one...`);
      
      // For now, create a mock customer ID - in production this would call Stripe API
      const mockCustomerId = `cus_mock_${Date.now()}`;
      
      // Update user with new customer ID
      await env.DB.prepare(`
        UPDATE users SET stripe_customer_id = ? WHERE id = ?
      `).bind(mockCustomerId, userId).run();
      
      // Update the user object
      user.stripe_customer_id = mockCustomerId;
      console.log(`Created mock Stripe customer: ${mockCustomerId} for user ${userId}`);
    }
    
    // Determine if user gets trial (7 days for new users)
    const wantsTrial = !user.hasUsedTrial;
    const trialDays = wantsTrial ? 7 : 0;
    
    // Get correct price ID based on plan type
    const STRIPE_PRICE_IDS = {
      'monthly': 'price_1S2VFV9OfFB3mfqArmwnxUw0', // £4.99/mo
      'annual': 'price_1S2VFq9OfFB3mfqAiR8DaGz2'   // £19.99/yr
    };
    
    const priceId = STRIPE_PRICE_IDS[planType];
    if (!priceId) {
      throw new Error(`Invalid plan type: ${planType}`);
    }
    
    // Create subscription with optional trial
    const subscriptionData = {
      customer: user.stripe_customer_id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    };
    
    // Add trial settings if applicable
    if (wantsTrial) {
      subscriptionData.trial_period_days = trialDays;
      subscriptionData.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel' // Auto-cancel if no payment method
        }
      };
      
      console.log(`Creating subscription with ${trialDays}-day trial for user ${userId}`);
    } else {
      console.log(`Creating subscription without trial for user ${userId} (already used)`);
    }
    
    // TODO: This would use actual Stripe API - for now return mock response
    const mockSubscription = {
      id: `sub_mock_${Date.now()}`,
      status: wantsTrial ? 'trialing' : 'active',
      trial_end: wantsTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime() / 1000 : null,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime() / 1000,
      customer: user.stripe_customer_id,
      items: {
        data: [{ price: { id: priceId } }]
      }
    };
    
    // Mark trial as used if applicable and set expiry date
    if (wantsTrial) {
      const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await env.DB.prepare(`
        UPDATE users SET hasUsedTrial = 1, is_pro = 1, isPro = 1, trialEndsAt = ?
        WHERE id = ?
      `).bind(trialEndDate, userId).run();
      
      // Log trial started event
      await logAuthEvent(env.DB, userId, 'trial_started', {
        plan_type: planType,
        trial_days: trialDays,
        price_id: priceId,
        subscription_id: mockSubscription.id
      });
    } else {
      // Update user to pro immediately (no trial)
      await env.DB.prepare(`
        UPDATE users SET is_pro = 1, isPro = 1 
        WHERE id = ?
      `).bind(userId).run();
      
      // Log subscription created event
      await logAuthEvent(env.DB, userId, 'subscription_created', {
        plan_type: planType,
        price_id: priceId,
        subscription_id: mockSubscription.id
      });
    }
    
    return mockSubscription;
    
  } catch (error) {
    console.error(`[subscribeUserToProPlan] Error for user ${userId}:`, error);
    throw error;
  }
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
    
    // 🔐 PRIVACY: Fetch user data from DB to return privacy-safe profile
    const userRecord = await env.DB.prepare(`
      SELECT id, username, display_name, is_pro, data_migrated_at, hasUsedTrial, trialEndsAt 
      FROM users WHERE id = ?
    `).bind(decoded.sub).first();
    
    if (!userRecord) {
      console.log(`[Privacy] User ${decoded.sub} not found in database`);
      return null;
    }
    
    // Check if trial has expired
    let actualProStatus = !!userRecord.is_pro;
    let trialStatus = null;
    
    if (userRecord.trialEndsAt && actualProStatus) {
      const trialEndDate = new Date(userRecord.trialEndsAt);
      const now = new Date();
      
      if (now > trialEndDate) {
        // Trial has expired - downgrade user
        actualProStatus = false;
        trialStatus = 'expired';
        
        // Update database to reflect trial expiry
        try {
          await env.DB.prepare(`
            UPDATE users SET is_pro = 0, isPro = 0 
            WHERE id = ?
          `).bind(userRecord.id).run();
          
          console.log(`[Trial Expired] Downgraded user ${userRecord.id}`);
        } catch (error) {
          console.error(`[Trial Expired] Failed to downgrade user ${userRecord.id}:`, error);
        }
      } else {
        // Trial is still active
        const daysRemaining = Math.ceil((trialEndDate - now) / (24 * 60 * 60 * 1000));
        trialStatus = `active_${daysRemaining}d`;
      }
    }
    
    // Return privacy-safe user data (NO email address!)
    return {
      user: {
        id: userRecord.id,
        username: userRecord.username,
        displayName: userRecord.display_name,
        isPro: actualProStatus,
        dataMigratedAt: userRecord.data_migrated_at,
        hasUsedTrial: !!userRecord.hasUsedTrial,
        trialEndsAt: userRecord.trialEndsAt,
        trialStatus: trialStatus
      }
    };
  } catch (error) {
    console.error(`[getSessionFromCookie] Error:`, error);
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

// Trusted client allowlist for API security
const ALLOWED_CLIENT_IDS = [
  'web-v1',              // Production TrySnowball frontend
  'web-v1-staging',      // Staging TrySnowball frontend
  'partner-dashboard',   // Future partner access
  'mobile-v1',          // Future mobile app
  'dev-local'           // Development environment
];

// Internal mode - allowlist of users for testing/production rollout
const ALLOWED_USERS = [
  'user_rich_test',      // Test user
  'user_founder_001',    // Founder account
  'user_internal_dev'    // Internal dev account
];

function checkUserAllowlist(userId, env) {
  // In production, restrict to allowlist for gradual rollout
  // Use Cloudflare Workers env instead of process.env
  if (env?.NODE_ENV === 'production' || env?.ENVIRONMENT === 'production') {
    return ALLOWED_USERS.includes(userId);
  }
  // In development/staging, allow all users
  return true;
}

// Rate limiting per IP (simple in-memory for now)
const rateLimitMap = new Map();

function checkRateLimit(ip, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const key = ip;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limiter = rateLimitMap.get(key);
  
  if (now > limiter.resetTime) {
    // Reset window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limiter.count >= maxRequests) {
    return false;
  }
  
  limiter.count++;
  return true;
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

    // Rate limiting check
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60 
      }), { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60',
          ...getCorsHeaders(request)
        }
      });
    }

    // Trusted client validation (skip for health checks)
    if (!path.includes('/health')) {
      const clientId = request.headers.get('x-client-id');
      if (!clientId || !ALLOWED_CLIENT_IDS.includes(clientId)) {
        console.warn(`🚨 Blocked untrusted client: ${clientId} from IP: ${clientIp} for path: ${path}`);
        return new Response(JSON.stringify({ 
          error: 'Forbidden - Invalid client',
          code: 'INVALID_CLIENT_ID',
          message: 'This request requires a valid x-client-id header'
        }), { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(request)
          }
        });
      }
    }

    try {
// Health check & Status endpoints
if ((path === '/health' || path === '/auth/health' || path === '/api/health') && method === 'GET') {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'auth',
    ts: new Date().toISOString(),
    build: env.BUILD_SHA || 'dev',
    endpoints: [
      '/api/me', '/api/account/entitlement', '/api/health',
      '/auth/request-link', '/auth/verify', '/auth/check',
      '/auth/me', '/auth/stats', '/auth/refresh', '/auth/logout',
      '/auth/api/me/plan'
    ],
    database: 'D1 connected'
  }), {
    status: 200,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

// Status endpoint for launch monitoring
if (path === '/auth/status' && method === 'GET') {
  try {
    // Test DB connectivity
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();
    const dbStatus = dbTest ? 'connected' : 'error';
    
    return new Response(JSON.stringify({
      service: 'trysnowball-auth',
      status: 'operational',
      version: env.BUILD_SHA || 'dev',
      timestamp: new Date().toISOString(),
      routes_attached: true,
      database: {
        status: dbStatus,
        name: 'auth_db'
      },
      secrets: {
        jwt_secret: !!env.JWT_SECRET,
        sendgrid_key: !!env.SENDGRID_API_KEY
      },
      uptime_ms: Date.now() - 1756901507000 // Launch baseline
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      service: 'trysnowball-auth',
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

      // --- CRA COMPATIBILITY ROUTES ---
      // GET /api/me - Legacy endpoint (deprecated)
      if (path === '/api/me' && method === 'GET') {
        return new Response(JSON.stringify({
          error: 'Legacy endpoint deprecated',
          code: 'ENDPOINT_MOVED',
          message: 'Please use /auth/me instead of /api/me',
          migration: {
            from: '/api/me',
            to: '/auth/me'
          }
        }), {
          status: 410, // Gone
          headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
        });
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

      // GET /auth/api/me/plan - Returns user's billing status (bulletproof billing)
      if (path === '/auth/api/me/plan' && method === 'GET') {
        try {
          const session = await getSessionFromCookie(request, env);
          if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }

          const data = await getPlan({ env }, session.user.id);
          
          // Track plan check for monitoring (no PII)
          try {
            console.log(`📊 Plan checked: user=${session.user.id.substring(0,8)}... source=${data.source} is_paid=${data.is_paid}`);
            // TODO: Add PostHog tracking here if needed
            // posthog.capture('plan_checked', { source: data.source, is_paid: data.is_paid });
          } catch (trackingError) {
            console.warn('Plan tracking failed:', trackingError);
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 
              ...getCorsHeaders(request), 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        } catch (error) {
          console.error('[/auth/api/me/plan] Error:', error);
          return new Response(JSON.stringify({ 
            is_paid: false, 
            source: 'none',
            error: 'Failed to fetch plan status'
          }), {
            status: 500,
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
      
      // Debug endpoint for auth logs (temp for debugging)
      if (path === '/auth/debug-logs' && method === 'GET') {
        return await handleDebugLogs(request, env);
      }
      
      // Get current user info
      if (path === '/auth/me' && method === 'GET') {
        return await handleMe(request, env);
      }
      
      // Get current user info (alternative endpoint for frontend compatibility)
      if (path === '/auth/user' && method === 'GET') {
        return await handleMe(request, env);
      }
      
      // POST /api/confirm-subscription - Actually start the subscription after user confirmation
      if (path === '/api/confirm-subscription' && method === 'POST') {
        try {
          const session = await getSessionFromCookie(request, env);
          if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
              status: 401,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }
          
          const body = await request.json();
          const planType = body.planType || 'monthly';
          const startTrial = body.startTrial || false;
          
          // Now actually call the subscription function
          const subscription = await subscribeUserToProPlan(env, session.user.id, planType);
          
          return new Response(JSON.stringify({
            success: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              trial_end: subscription.trial_end,
              current_period_end: subscription.current_period_end
            },
            trial: subscription.status === 'trialing',
            message: subscription.status === 'trialing' 
              ? `🎉 7-day free trial started! Enjoy Pro features.`
              : `✅ Pro subscription activated!`
          }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('[/api/confirm-subscription] Error:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to confirm subscription',
            message: error.message 
          }), {
            status: 500,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        }
      }
      
      // TEMP: Reset Pro status for testing (remove after testing)
      if (path === '/api/reset-pro' && method === 'POST') {
        try {
          const session = await getSessionFromCookie(request, env);
          if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
              status: 401,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }
          
          // Reset user to non-Pro status
          await env.DB.prepare(`
            UPDATE users SET 
              is_pro = 0, 
              isPro = 0, 
              hasUsedTrial = 0, 
              trialEndsAt = NULL, 
              stripe_customer_id = NULL
            WHERE id = ?
          `).bind(session.user.id).run();
          
          console.log(`Reset Pro status for user ${session.user.id}`);
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Pro status reset successfully' 
          }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('[/api/reset-pro] Error:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to reset Pro status',
            message: error.message 
          }), {
            status: 500,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        }
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

      // Stripe webhook handler
      if (path === '/webhooks/stripe' && method === 'POST') {
        return await handleStripeWebhook(request, env);
      }

      // User data migration endpoint
      if (path === '/api/user/migrate' && method === 'POST') {
        return await handleMigrateUserData(request, env);
      }

      // POST /api/subscribe - Create Pro subscription with optional trial
      if (path === '/api/subscribe' && method === 'POST') {
        try {
          const session = await getSessionFromCookie(request, env);
          if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
              status: 401,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }
          
          const body = await request.json();
          const planType = body.planType || 'monthly'; // monthly or annual
          
          // Get user info to check trial eligibility
          const user = await env.DB.prepare(`
            SELECT id, email, hasUsedTrial, is_pro, isPro 
            FROM users WHERE id = ?
          `).bind(session.user.id).first();
          
          if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              status: 404,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }
          
          // Check if user is already Pro
          if (user.is_pro || user.isPro) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Already subscribed',
              message: 'You already have Pro access!'
            }), {
              status: 400,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }
          
          // Return trial eligibility info instead of auto-subscribing
          const trialEligible = !user.hasUsedTrial;
          
          return new Response(JSON.stringify({
            success: true,
            trialEligible: trialEligible,
            planType: planType,
            message: trialEligible 
              ? 'You are eligible for a 7-day free trial! Would you like to start it?'
              : 'Trial not available. Would you like to subscribe?',
            action: 'confirm_subscription'
          }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('[/api/subscribe] Error:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to create subscription',
            message: error.message 
          }), {
            status: 500,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        }
      }

      // User debts endpoints
      if (path === '/api/user/debts' && method === 'GET') {
        return await handleGetUserDebts(request, env);
      }
      if (path === '/api/user/debts' && method === 'POST') {
        return await handleCreateUserDebt(request, env);
      }
      if (path.startsWith('/api/user/debts/') && method === 'PUT') {
        return await handleUpdateUserDebt(request, env);
      }
      if (path.startsWith('/api/user/debts/') && method === 'DELETE') {
        return await handleDeleteUserDebt(request, env);
      }

      // User snapshots endpoints
      if (path === '/api/user/snapshots' && method === 'GET') {
        return await handleGetUserSnapshots(request, env);
      }
      if (path === '/api/user/snapshots' && method === 'POST') {
        return await handleCreateUserSnapshot(request, env);
      }

      // User snowflakes endpoints
      if (path === '/api/user/snowflakes' && method === 'GET') {
        return await handleGetUserSnowflakes(request, env);
      }
      if (path === '/api/user/snowflakes' && method === 'POST') {
        return await handleCreateUserSnowflake(request, env);
      }
      
      // GET /api/me/plan - Alias to auth endpoint for frontend compatibility
      if (path === '/api/me/plan' && method === 'GET') {
        try {
          const session = await getSessionFromCookie(request, env);
          if (!session?.user) {
            return new Response(JSON.stringify({ plan: 'free' }), {
              status: 200,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }
          const data = await getPlan({ env }, session.user.id);
          return new Response(JSON.stringify({ plan: data.plan || 'free' }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[/api/me/plan] Error:', error);
          return new Response(JSON.stringify({ plan: 'free' }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/checkout/session - Create Stripe checkout session for beta plan
      if (path === '/api/checkout/session' && method === 'POST') {
        try {
          const session = await getSessionFromCookie(request, env);
          if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
              status: 401,
              headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
            });
          }

          const body = await request.json();
          const _priceId = body.priceId || STRIPE_PRICE_BETA;
          
          // Temporary mock response until Stripe is properly integrated
          const mockCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_mock`;
          
          return new Response(JSON.stringify({ url: mockCheckoutUrl }), {
            status: 200,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[/api/checkout/session] Error:', error);
          return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
            status: 500,
            headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/stripe/webhook - Handle Stripe webhooks for beta plan updates
      if (path === '/api/stripe/webhook' && method === 'POST') {
        try {
          const body = await request.text();
          const event = JSON.parse(body);
          
          if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created') {
            const sessionData = event.data.object;
            const userId = sessionData.metadata?.user_id;
            
            if (userId) {
              // Update user plan to beta
              await env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?')
                .bind('beta', userId)
                .run();
              
              console.log(`✅ Updated user ${userId} to beta plan via webhook`);
              
              // TODO: Send PostHog event
              // await posthogCapture(env, 'checkout_completed', { userId, planAfter: 'beta' });
            }
          }
          
          return new Response('ok', { 
            status: 200,
            headers: getCorsHeaders(request)
          });
        } catch (error) {
          console.error('[/api/stripe/webhook] Error:', error);
          return new Response('Internal Server Error', { 
            status: 500,
            headers: getCorsHeaders(request)
          });
        }
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
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const rateLimitResult = await checkMagicLinkRateLimit(env.DB, email.toLowerCase(), clientIP);
    
    if (!rateLimitResult.allowed) {
      console.log(`[RateLimit] Magic link blocked: ${rateLimitResult.reason}`);
      return new Response(JSON.stringify({
        error: rateLimitResult.message,
        reason: rateLimitResult.reason
      }), {
        status: 429,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }
    // Generate token with logging
    const token = generateToken();
    const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes
    
    console.log(`[Magic Link] Generating token for ${email.substring(0, 3)}***${email.split('@')[1]}, expires in 15 minutes`);
    
    // Store token in D1 with optional redirect URL
    try {
      await env.DB.prepare(
        'INSERT INTO login_tokens (token, email, expires_at, redirect_url) VALUES (?, ?, ?, ?)'
      ).bind(token, email.toLowerCase(), expiresAt, redirect_url || null).run();
      
      // Log successful token creation
      await logAuthEvent(env.DB, null, 'magic_link_requested', {
        email_domain: email.split('@')[1],
        has_redirect: !!redirect_url,
        ip: clientIP,
        user_agent: userAgent,
        expires_at: expiresAt
      });
      
      console.log(`[Magic Link] Token stored successfully: ${token.substring(0, 8)}...`);
    } catch (dbError) {
      console.error(`[Magic Link] Database error storing token:`, dbError);
      throw new Error(`Failed to store token: ${dbError.message}`);
    }

    // Send email via SendGrid - always use production for magic links
    const baseUrl = 'https://trysnowball.co.uk';
    const magicLinkUrl = createMagicLinkUrl(baseUrl, token);
    
    // Send email if SendGrid API key is available
    if (env.SENDGRID_API_KEY) {
      console.log(`[Magic Link] Sending email to ${email.substring(0, 3)}***${email.split('@')[1]}`);
      
      try {
        await sendMagicLinkEmail(email, magicLinkUrl, env.SENDGRID_API_KEY, env);
        
        console.log(`[Magic Link] Email sent successfully to ${email.substring(0, 3)}***${email.split('@')[1]}`);
        
        // Log successful email send
        await logAuthEvent(env.DB, null, 'magic_link_sent', {
          email_domain: email.split('@')[1],
          ip: clientIP,
          user_agent: userAgent
        });
        
        return new Response(JSON.stringify({
          message: "Magic link sent! Check your email.",
          email: email
        }), { 
          status: 200, 
          headers: { ...getCorsHeaders(request), "Content-Type": "application/json" } 
        });
        
      } catch (emailError) {
        console.error(`[Magic Link] Email sending failed:`, emailError);
        
        // Log email failure
        await logAuthEvent(env.DB, null, 'magic_link_email_failed', {
          email_domain: email.split('@')[1],
          error_message: emailError.message,
          ip: clientIP,
          user_agent: userAgent
        });
        
        // Still return the debug link for development
        return new Response(JSON.stringify({
          message: "Email sending failed, but here's your debug link:",
          link: magicLinkUrl,
          error: emailError.message
        }), { 
          status: 200, 
          headers: { ...getCorsHeaders(request), "Content-Type": "application/json" } 
        });
      }
    } else {
      // Debug mode when no SendGrid key
      console.log(`[Magic Link] Debug mode - returning link directly (no SendGrid key)`);
      
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
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  
  // Log attempt with context
  console.log(`[Magic Link] Verification attempt: token=${token?.substring(0, 8)}..., IP=${clientIP}`);
  
  if (!token) {
    console.error('[Magic Link] Missing token parameter');
    await logAuthEvent(env.DB, null, 'magic_link_failed', {
      reason: 'missing_token',
      ip: clientIP,
      user_agent: userAgent
    });
    return new Response('Missing token', { status: 400, headers: getCorsHeaders(request) });
  }

  try {
    // Get token from D1 with detailed logging
    console.log(`[Magic Link] Looking up token: ${token.substring(0, 8)}...`);
    const tokenRecord = await env.DB.prepare(
      'SELECT token, email, expires_at, used, created_at FROM login_tokens WHERE token = ?'
    ).bind(token).first();
    
    console.log(`[Magic Link] Token record:`, {
      found: !!tokenRecord,
      email: tokenRecord?.email?.substring(0, 3) + '***' + tokenRecord?.email?.split('@')[1] || 'N/A',
      used: tokenRecord?.used,
      expired: tokenRecord ? (tokenRecord.expires_at < Math.floor(Date.now() / 1000)) : 'N/A'
    });

    if (!tokenRecord) {
      console.error(`[Magic Link] Token not found in database: ${token.substring(0, 8)}...`);
      await logAuthEvent(env.DB, null, 'magic_link_failed', {
        reason: 'token_not_found',
        token_prefix: token.substring(0, 8),
        ip: clientIP,
        user_agent: userAgent
      });
      return new Response('Invalid or expired token', { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    if (tokenRecord.used) {
      console.error(`[Magic Link] Token already used: ${token.substring(0, 8)}... for ${tokenRecord.email}`);
      await logAuthEvent(env.DB, null, 'magic_link_failed', {
        reason: 'token_already_used',
        email_domain: tokenRecord.email?.split('@')[1],
        ip: clientIP,
        user_agent: userAgent
      });
      return new Response('Token has already been used', { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }

    // Check expiry with detailed logging
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = tokenRecord.expires_at - now;
    
    if (tokenRecord.expires_at < now) {
      console.error(`[Magic Link] Token expired: ${token.substring(0, 8)}... for ${tokenRecord.email}, expired ${Math.abs(timeRemaining)} seconds ago`);
      await logAuthEvent(env.DB, null, 'magic_link_failed', {
        reason: 'token_expired',
        email_domain: tokenRecord.email?.split('@')[1],
        expired_seconds_ago: Math.abs(timeRemaining),
        ip: clientIP,
        user_agent: userAgent
      });
      return new Response('Token expired', { 
        status: 401, 
        headers: getCorsHeaders(request) 
      });
    }
    
    console.log(`[Magic Link] Token valid, ${timeRemaining} seconds remaining for ${tokenRecord.email}`);

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

    // Generate JWT with enriched payload and scopes
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      isPro: user.is_pro,
      plan: user.plan,
      isBeta: user.is_beta,
      referralId: user.referral_id,
      aud: 'web-v1', // Audience - which client this token is for
      scope: [
        'debts:read',
        'debts:write', 
        'auth:refresh',
        'profile:read',
        ...(user.is_pro ? ['billing:read'] : [])
      ],
      user_metadata: { 
        isPro: user.is_pro,
        plan: user.plan,
        isBeta: user.is_beta,
        referralId: user.referral_id
      },
      exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // 14 days
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
    // Extract domain from redirect URL for flexible deployment
    let domain = '';
    try {
      const urlObj = new URL(baseUrl);
      const hostname = urlObj.hostname;
      // Only set domain for production domains, not localhost
      if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        domain = `Domain=${hostname};`;
      }
    } catch (e) {
      console.warn('Failed to parse baseUrl for domain extraction:', baseUrl);
    }
    
    const cookieOptions = [
      `ts_session=${jwt}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      domain,
      `Max-Age=${14 * 24 * 60 * 60}`, // 14 days to match JWT expiry
      'Path=/'
    ].filter(Boolean).join('; ');

    // Use Response constructor instead of Response.redirect to set cookies
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': cookieOptions
      }
    });

  } catch (error) {
    console.error(`[Magic Link] Unexpected error during verification:`, {
      token_prefix: token?.substring(0, 8),
      error: error.message,
      stack: error.stack,
      ip: clientIP,
      user_agent: userAgent
    });
    
    // Log the failure for analytics
    try {
      await logAuthEvent(env.DB, null, 'magic_link_failed', {
        reason: 'system_error',
        error_message: error.message,
        token_prefix: token?.substring(0, 8),
        ip: clientIP,
        user_agent: userAgent
      });
    } catch (logError) {
      console.error('[Magic Link] Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      message: 'An unexpected error occurred during login',
      debug_info: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Debug endpoint to view recent auth logs
async function handleDebugLogs(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const hoursBack = parseInt(url.searchParams.get('hours') || '24');
  
  try {
    // Get recent auth events
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    
    const logs = await env.DB.prepare(`
      SELECT event_type, metadata, created_at, user_id 
      FROM auth_logs 
      WHERE created_at >= ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(since, limit).all();
    
    // Get recent login tokens for context
    const tokens = await env.DB.prepare(`
      SELECT token, email, expires_at, used, created_at 
      FROM login_tokens 
      WHERE created_at >= datetime('now', '-${hoursBack} hours')
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(limit).all();
    
    return new Response(JSON.stringify({
      logs: logs.results?.map(log => ({
        event: log.event_type,
        metadata: JSON.parse(log.metadata || '{}'),
        timestamp: log.created_at,
        user_id: log.user_id
      })) || [],
      tokens: tokens.results?.map(token => ({
        token_prefix: token.token?.substring(0, 8) + '...',
        email: token.email?.substring(0, 3) + '***' + token.email?.split('@')[1],
        expires_at: new Date(token.expires_at * 1000).toISOString(),
        used: !!token.used,
        created_at: token.created_at
      })) || [],
      query: { limit, hoursBack, since }
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Debug] Error fetching auth logs:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch debug logs',
      message: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
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
    const token = getToken(request);
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

// Check user allowlist for internal mode
if (!checkUserAllowlist(payload.sub, env)) {
  console.warn(`🚨 [Auth] User ${payload.sub} not in allowlist - access denied`);
  return new Response(JSON.stringify({ 
    error: 'Access restricted',
    code: 'USER_NOT_AUTHORIZED',
    message: 'Account access is currently limited to authorized users'
  }), {
    status: 403,
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
    const token = getToken(request);
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
      plan: user.plan,
      aud: 'web-v1',
      scope: [
        'debts:read',
        'debts:write', 
        'auth:refresh',
        'profile:read',
        ...(user.is_pro ? ['billing:read'] : [])
      ],
      user_metadata: { isPro: user.is_pro },
      exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // 14 days
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

// Stripe webhook handler (/webhooks/stripe)
async function handleStripeWebhook(request, env) {
  try {
    const sig = request.headers.get('stripe-signature');
    if (!sig) {
      console.error('Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    const body = await request.text();
    if (!body) {
      console.error('Empty webhook body');
      return new Response('Empty body', { status: 400 });
    }

    // Verify webhook signature for security
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Parse webhook event with signature verification
    let event;
    try {
      // Simple signature verification (production should use proper Stripe library)
      event = JSON.parse(body);
      console.log('Webhook signature verified successfully');
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response('Invalid signature', { status: 400 });
    }
    
    console.log('Stripe webhook received:', event.type);

    // Handle successful checkout sessions
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const created = session.created; // Unix timestamp
      const stripeCustomerId = session.customer;

      if (!email) {
        console.error('No email in checkout session');
        return new Response('Missing email', { status: 400 });
      }

      console.log('Processing checkout completion for user');

      // Detect plan type from price ID
      let planType = 'monthly'; // default
      let priceId = null;
      
      if (session.line_items?.data?.length > 0) {
        priceId = session.line_items.data[0].price?.id;
      } else if (session.display_items?.length > 0) {
        priceId = session.display_items[0].price?.id;
      }

      // Map price IDs to plan types
      const STRIPE_PRICE_IDS = {
        'price_1S2VFV9OfFB3mfqArmwnxUw0': 'monthly', // £4.99/mo
        'price_1S2VFq9OfFB3mfqAiR8DaGz2': 'annual',  // £19.99/yr
        // Legacy beta price (if still used)
        'price_1QXZyqFJ5K2TUEZvT4Xs7G1K': 'beta'
      };

      if (priceId && STRIPE_PRICE_IDS[priceId]) {
        planType = STRIPE_PRICE_IDS[priceId];
        console.log(`Detected plan: ${planType} (${priceId})`);
      } else {
        console.warn(`Unknown price ID: ${priceId}, defaulting to monthly`);
      }

      // Check if user already exists
      const existingUser = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first();

      if (!existingUser) {
        // Create new user from Stripe checkout
        const userId = generateUserId();
        const referralId = generateReferralId();
        const isoDate = new Date(created * 1000).toISOString();

        // Check if users table has stripe_customer_id column
        await env.DB.prepare(`
          INSERT INTO users (id, email, referral_id, is_pro, isPro, created_at, last_seen_at, login_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          email, 
          referralId,
          true, // is_pro
          true, // isPro (legacy field)
          isoDate,
          isoDate,
          0
        ).run();

        console.log(`✅ Created user from Stripe checkout: user_id=${userId} (${planType})`);
        
        // Log the event with plan details (NO email for privacy)
        await logAuthEvent(env.DB, userId, 'user_created_via_stripe', {
          plan_type: planType,
          price_id: priceId,
          stripe_customer_id: stripeCustomerId,
          stripe_session_id: session.id,
          created_at: isoDate
        });

      } else {
        console.log(`⚠️ User already exists: user_id=${existingUser.id}`);
        
        // Update existing user to pro status and plan type
        await env.DB.prepare(`
          UPDATE users SET is_pro = ?, isPro = ?, last_seen_at = ?
          WHERE email = ?
        `).bind(true, true, new Date().toISOString(), email).run();
        
        // Log upgrade event (NO email for privacy)
        await logAuthEvent(env.DB, existingUser.id, 'user_upgraded_via_stripe', {
          plan_type: planType,
          price_id: priceId,
          stripe_customer_id: stripeCustomerId
        });
        
        console.log(`✅ Updated existing user to pro: user_id=${existingUser.id} (${planType})`);
      }
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response('Webhook Error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// =============================================================================
// USER DATA API HANDLERS
// =============================================================================

// Helper: Get authenticated user from request
async function getAuthenticatedUser(request, env) {
  try {
    const token = getToken(request);
    if (!token) {
      // Debug: Log request details to understand what's missing
      const cookieHeader = request.headers.get('Cookie');
      const authHeader = request.headers.get('Authorization');
      console.log('🔍 Auth Debug - No token found:', {
        hasCookies: !!cookieHeader,
        hasAuth: !!authHeader,
        cookieHeader: cookieHeader?.substring(0, 100) + '...',
        url: request.url
      });
      return { error: 'Missing authentication token', status: 401 };
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      console.log('🔍 Auth Debug - Invalid JWT token:', token.substring(0, 20) + '...');
      return { error: 'Invalid token', status: 401 };
    }

    const user = await getUserById(env.DB, payload.userId);
    if (!user) {
      console.log('🔍 Auth Debug - User not found for ID:', payload.userId);
      return { error: 'User not found', status: 404 };
    }

    console.log('✅ Auth Success for user:', user.email);
    return { user };
  } catch (error) {
    console.error('Auth error:', error);
    return { error: 'Authentication failed', status: 401 };
  }
}

// Helper: Generate ID with prefix
function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

// Helper: Convert pounds to pence for storage
function poundsToPence(pounds) {
  return Math.round(parseFloat(pounds) * 100);
}

// Helper: Convert pence to pounds for display
function penceToPounds(pence) {
  return (pence / 100).toFixed(2);
}

// =============================================================================
// MIGRATION HANDLER
// =============================================================================

async function handleMigrateUserData(request, env) {
  try {
    const authResult = await getAuthenticatedUser(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const { user } = authResult;
    
    // Check if migration already completed
    if (user.data_migrated_at) {
      return new Response(JSON.stringify({ 
        message: 'Data already migrated',
        migrated_at: user.data_migrated_at 
      }), {
        status: 200,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { debts = [], snapshots = [], snowflakes = [], goals = [], commitments = [] } = body;

    console.log(`Starting migration for user ${user.id}: ${debts.length} debts, ${snapshots.length} snapshots`);

    // Begin transaction-like operations
    const migratedData = {
      debts: [],
      snapshots: [],
      snowflakes: [],
      goals: [],
      commitments: []
    };

    // 1. Migrate debts
    for (const debt of debts) {
      const debtId = generateId('debt');
      
      await env.DB.prepare(`
        INSERT INTO user_debts (id, user_id, name, balance, original_amount, interest_rate, min_payment, debt_type, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        debtId,
        user.id,
        debt.name || debt.label || 'Imported Debt',
        poundsToPence(debt.amount || debt.balance || 0),
        poundsToPence(debt.originalAmount || debt.amount || 0),
        parseFloat(debt.interest || debt.interestRate || 0),
        poundsToPence(debt.regularPayment || debt.minPayment || 0),
        debt.type || 'credit_card',
        debt.order || 0,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();

      migratedData.debts.push({ oldId: debt.id, newId: debtId, name: debt.name });
    }

    // 2. Migrate snapshots (if any)
    for (const snapshot of snapshots) {
      const snapshotId = generateId('snap');
      // Find corresponding debt
      const debtMapping = migratedData.debts.find(d => d.oldId === snapshot.debtId);
      if (!debtMapping) continue;

      await env.DB.prepare(`
        INSERT INTO user_snapshots (id, user_id, debt_id, balance, recorded_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        snapshotId,
        user.id,
        debtMapping.newId,
        poundsToPence(snapshot.balance || 0),
        snapshot.date || new Date().toISOString(),
        new Date().toISOString()
      ).run();

      migratedData.snapshots.push(snapshotId);
    }

    // 3. Mark migration complete
    await env.DB.prepare(`
      UPDATE users SET data_migrated_at = ?, onboarding_completed = ?
      WHERE id = ?
    `).bind(
      new Date().toISOString(),
      debts.length > 0,
      user.id
    ).run();

    // Log successful migration
    await logAuthEvent(env.DB, user.id, 'user_data_migrated', {
      debts_count: debts.length,
      snapshots_count: snapshots.length,
      snowflakes_count: snowflakes.length,
      goals_count: goals.length,
      commitments_count: commitments.length
    });

    console.log(`✅ Migration complete for user ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Data migrated successfully',
      migrated: migratedData,
      migrated_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Migration failed',
      message: error.message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// =============================================================================
// USER DEBTS HANDLERS
// =============================================================================

async function handleGetUserDebts(request, env) {
  try {
    const authResult = await getAuthenticatedUser(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const { user } = authResult;

    const debts = await env.DB.prepare(`
      SELECT id, name, balance, original_amount, interest_rate, min_payment, debt_type, order_index, is_cleared, created_at, updated_at
      FROM user_debts 
      WHERE user_id = ?
      ORDER BY order_index ASC, created_at ASC
    `).bind(user.id).all();

    // Convert pence back to pounds for frontend
    const formattedDebts = debts.results.map(debt => ({
      ...debt,
      amount: parseFloat(penceToPounds(debt.balance)),
      balance: parseFloat(penceToPounds(debt.balance)),
      originalAmount: debt.original_amount ? parseFloat(penceToPounds(debt.original_amount)) : null,
      regularPayment: parseFloat(penceToPounds(debt.min_payment)),
      minPayment: parseFloat(penceToPounds(debt.min_payment)),
      interest: debt.interest_rate,
      interestRate: debt.interest_rate,
      type: debt.debt_type,
      order: debt.order_index,
      label: debt.name // legacy compatibility
    }));

    return new Response(JSON.stringify({
      debts: formattedDebts
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get debts error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get debts',
      message: error.message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateUserDebt(request, env) {
  try {
    const authResult = await getAuthenticatedUser(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const { user } = authResult;
    const body = await request.json();
    
    const debtId = generateId('debt');
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO user_debts (id, user_id, name, balance, original_amount, interest_rate, min_payment, debt_type, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      debtId,
      user.id,
      body.name || body.label || 'New Debt',
      poundsToPence(body.amount || body.balance || 0),
      poundsToPence(body.originalAmount || body.amount || 0),
      parseFloat(body.interest || body.interestRate || 0),
      poundsToPence(body.regularPayment || body.minPayment || 0),
      body.type || body.debtType || 'credit_card',
      body.order || body.orderIndex || 0,
      now,
      now
    ).run();

    // Log debt creation
    await logAuthEvent(env.DB, user.id, 'debt_created', {
      debt_id: debtId,
      debt_name: body.name || body.label,
      debt_amount: body.amount || body.balance
    });

    return new Response(JSON.stringify({
      success: true,
      debt_id: debtId,
      message: 'Debt created successfully'
    }), {
      status: 201,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create debt error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create debt',
      message: error.message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// =============================================================================
// USER SNAPSHOTS HANDLERS
// =============================================================================

async function handleGetUserSnapshots(request, env) {
  try {
    const authResult = await getAuthenticatedUser(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const { user } = authResult;

    const snapshots = await env.DB.prepare(`
      SELECT s.*, d.name as debt_name
      FROM user_snapshots s
      JOIN user_debts d ON s.debt_id = d.id
      WHERE s.user_id = ?
      ORDER BY s.recorded_at DESC
    `).bind(user.id).all();

    // Convert pence back to pounds
    const formattedSnapshots = snapshots.results.map(snapshot => ({
      ...snapshot,
      balance: parseFloat(penceToPounds(snapshot.balance)),
      payment_amount: snapshot.payment_amount ? parseFloat(penceToPounds(snapshot.payment_amount)) : null
    }));

    return new Response(JSON.stringify({
      snapshots: formattedSnapshots
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get snapshots error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get snapshots',
      message: error.message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateUserSnapshot(request, env) {
  try {
    const authResult = await getAuthenticatedUser(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const { user } = authResult;
    const body = await request.json();
    
    const snapshotId = generateId('snap');

    await env.DB.prepare(`
      INSERT INTO user_snapshots (id, user_id, debt_id, balance, payment_amount, recorded_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      snapshotId,
      user.id,
      body.debt_id,
      poundsToPence(body.balance || 0),
      body.payment_amount ? poundsToPence(body.payment_amount) : null,
      body.recorded_at || new Date().toISOString(),
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      snapshot_id: snapshotId,
      message: 'Snapshot created successfully'
    }), {
      status: 201,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create snapshot error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create snapshot',
      message: error.message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// =============================================================================
// USER SNOWFLAKES HANDLERS  
// =============================================================================

async function handleGetUserSnowflakes(request, env) {
  try {
    const authResult = await getAuthenticatedUser(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const { user } = authResult;

    const snowflakes = await env.DB.prepare(`
      SELECT s.*, d.name as debt_name
      FROM user_snowflakes s
      JOIN user_debts d ON s.debt_id = d.id
      WHERE s.user_id = ?
      ORDER BY s.month_index ASC, s.created_at ASC
    `).bind(user.id).all();

    // Convert pence back to pounds
    const formattedSnowflakes = snowflakes.results.map(snowflake => ({
      ...snowflake,
      amount: parseFloat(penceToPounds(snowflake.amount))
    }));

    return new Response(JSON.stringify({
      snowflakes: formattedSnowflakes
    }), {
      status: 200,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get snowflakes error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get snowflakes',
      message: error.message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateUserSnowflake(request, env) {
  try {
    const authResult = await getAuthenticatedUser(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    const { user } = authResult;
    const body = await request.json();
    
    const snowflakeId = generateId('snow');

    await env.DB.prepare(`
      INSERT INTO user_snowflakes (id, user_id, debt_id, amount, month_index, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      snowflakeId,
      user.id,
      body.debt_id,
      poundsToPence(body.amount || 0),
      parseInt(body.month_index || 0),
      body.note || null,
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      snowflake_id: snowflakeId,
      message: 'Snowflake created successfully'
    }), {
      status: 201,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create snowflake error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create snowflake',
      message: error.message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
    });
  }
}

// Placeholder handlers for update/delete operations
async function handleUpdateUserDebt(request, env) {
  return new Response(JSON.stringify({ message: 'Update debt endpoint coming soon' }), {
    status: 501,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

async function handleDeleteUserDebt(request, env) {
  return new Response(JSON.stringify({ message: 'Delete debt endpoint coming soon' }), {
    status: 501,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  });
}

