/**
 * TrySnowball Production AI Worker
 * Hard caps, rate limiting, observability, rollback switches
 * Single source of truth for AI cost control
 */

// CORS headers - locked to production domain, no credentials
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://trysnowball.co.uk',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Cache-Control': 'no-store', // Prevent CDN/browser caching
};

// Hard limits and cost controls
const HARD_CAPS = {
  REQUEST_BODY_LIMIT: 32 * 1024,      // 32KB max request body
  MAX_TOKENS_PER_REQUEST: 1000,       // Token ceiling per request
  USER_QPS_LIMIT: 2,                  // 2 requests per second per user
  USER_QPS_BURST: 5,                  // Burst allowance
  TIMEOUT_MS: 30000,                  // 30s timeout
};

// Observability sampling rate (10%)
const LOG_SAMPLE_RATE = 0.1;

/**
 * Generate trace ID for request tracking
 */
function generateTraceId() {
  return crypto.randomUUID();
}

/**
 * Lightweight request logger with sampling
 */
function logRequest(route, status, elapsed_ms, email_hash, trace_id, extra = {}) {
  if (Math.random() > LOG_SAMPLE_RATE) return; // Sample at 10%
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route,
    status,
    elapsed_ms,
    email_hash: email_hash ? hashString(email_hash) : null,
    trace_id,
    ...extra
  }));
}

/**
 * Simple string hash for privacy-safe logging
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * JWT verification (simplified from auth worker)
 */
async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    
    const data = `${header}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const sigBuffer = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')), 
      c => c.charCodeAt(0)
    );
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, new TextEncoder().encode(data));
    
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiry
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch {
    return null;
  }
}

/**
 * Simple rate limiter using in-memory store (per-worker instance)
 * Production might want Durable Objects or external store
 */
class SimpleRateLimiter {
  constructor() {
    this.requests = new Map(); // userId -> { count, windowStart, burst }
    this.windowSize = 1000; // 1 second window
  }
  
  isAllowed(userId) {
    const now = Date.now();
    const userReqs = this.requests.get(userId) || { count: 0, windowStart: now, burst: 0 };
    
    // Reset window if expired
    if (now - userReqs.windowStart >= this.windowSize) {
      userReqs.count = 0;
      userReqs.windowStart = now;
      userReqs.burst = Math.max(0, userReqs.burst - 1); // Decay burst
    }
    
    // Check rate limits
    if (userReqs.count >= HARD_CAPS.USER_QPS_LIMIT) {
      if (userReqs.burst >= HARD_CAPS.USER_QPS_BURST) {
        return false; // Rate limited
      }
      userReqs.burst++;
    }
    
    userReqs.count++;
    this.requests.set(userId, userReqs);
    
    // Cleanup old entries periodically
    if (this.requests.size > 1000) {
      for (const [key, value] of this.requests.entries()) {
        if (now - value.windowStart > this.windowSize * 10) {
          this.requests.delete(key);
        }
      }
    }
    
    return true;
  }
}

const rateLimiter = new SimpleRateLimiter();

/**
 * Check user quota from D1 database
 */
async function checkQuota(db, userId, isPro, period, env) {
  const freeQuota = Number(env.FREE_COACH_MSGS) || 0;
  const proQuota = Number(env.PRO_COACH_MSGS) || 2000;
  const userLimit = isPro ? proQuota : freeQuota;

  try {
    const result = await db.prepare(`
      SELECT messages FROM ai_usage 
      WHERE user_id = ? AND period = ?
    `).bind(userId, period).first();

    const currentUsage = result?.messages || 0;

    if (currentUsage >= userLimit) {
      return {
        allowed: false,
        used: currentUsage,
        limit: userLimit,
        message: isPro 
          ? `Pro plan limit of ${userLimit} AI messages reached this month.`
          : 'AI Coach requires a Pro subscription. Upgrade for unlimited access!'
      };
    }

    return { allowed: true, used: currentUsage, limit: userLimit };

  } catch (error) {
    console.error('Quota check error:', error);
    return { allowed: false, message: 'Unable to verify usage quota' };
  }
}

/**
 * Increment usage counter
 */
async function incrementUsage(db, userId, period) {
  try {
    await db.prepare(`
      INSERT INTO ai_usage (user_id, period, messages, created_at)
      VALUES (?, ?, 1, datetime('now'))
      ON CONFLICT(user_id, period) 
      DO UPDATE SET messages = messages + 1
    `).bind(userId, period).run();
  } catch (error) {
    console.error('Failed to increment usage:', error);
  }
}

/**
 * Call OpenAI with timeout and token limits
 */
async function callOpenAI(messages, env) {
  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HARD_CAPS.TIMEOUT_MS);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.GPT_MODEL_CHAT || 'gpt-4o-mini',
        messages: messages,
        max_tokens: Math.min(Number(env.GPT_MAX_TOKENS) || 512, HARD_CAPS.MAX_TOKENS_PER_REQUEST),
        temperature: 0.2,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    return await response.json();
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const traceId = generateTraceId();
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    
    try {
      let response;
      let userEmail = null;
      
      if (path === '/health' || path === '/ai/health') {
        response = await handleHealth(env);
      } else if (path === '/coach' || path === '/ai/coach') {
        const result = await handleCoach(request, env, traceId);
        response = result.response;
        userEmail = result.userEmail;
      } else {
        response = new Response(JSON.stringify({ error: 'Endpoint not found' }), { 
          status: 404, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        });
      }
      
      // Add CORS and trace headers
      const finalResponse = new Response(response.body, {
        status: response.status,
        headers: { ...response.headers, ...CORS_HEADERS, 'x-trace-id': traceId },
      });
      
      // Log request
      const elapsed = Date.now() - startTime;
      logRequest(path, response.status, elapsed, userEmail, traceId);
      
      return finalResponse;
      
    } catch (error) {
      console.error('AI Worker error:', error);
      const elapsed = Date.now() - startTime;
      logRequest(path, 500, elapsed, null, traceId, { error: error.message });
      
      return new Response(JSON.stringify({ error: 'AI service error', trace_id: traceId }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'x-trace-id': traceId },
      });
    }
  },
};

/**
 * Health check endpoint
 */
async function handleHealth(env) {
  const aiEnabled = env.AI_ENABLED !== 'false';
  
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ai: aiEnabled ? 'ready' : 'disabled',
      openai: !!env.OPENAI_API_KEY,
      rateLimit: true,
      quotas: {
        free: env.FREE_COACH_MSGS || '0',
        pro: env.PRO_COACH_MSGS || '2000'
      }
    }
  }), { 
    status: 200, 
    headers: { 'Content-Type': 'application/json' } 
  });
}

/**
 * AI Coach endpoint with full protection
 */
async function handleCoach(request, env, traceId) {
  // Rollback switch - kill switch for AI
  if (env.AI_ENABLED === 'false') {
    return {
      response: new Response(JSON.stringify({ 
        error: 'AI Coach is temporarily disabled',
        trace_id: traceId 
      }), { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: null
    };
  }
  
  if (request.method !== 'POST') {
    return {
      response: new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: null
    };
  }

  // Request body size limit (413 Payload Too Large)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > HARD_CAPS.REQUEST_BODY_LIMIT) {
    return {
      response: new Response(JSON.stringify({ error: 'Request too large' }), { 
        status: 413, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: null
    };
  }

  // JWT Authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      response: new Response(JSON.stringify({ error: 'Authentication required' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: null
    };
  }

  const token = authHeader.substring(7);
  const user = await verifyJWT(token, env.JWT_SECRET);
  
  if (!user || !user.email) {
    return {
      response: new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: null
    };
  }

  const userId = user.email;
  const isPro = user.plan === 'pro' || user.isPro === true;

  // Rate limiting (429 Too Many Requests)
  if (!rateLimiter.isAllowed(userId)) {
    return {
      response: new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please slow down.',
        retry_after: 1 
      }), { 
        status: 429, 
        headers: { 'Content-Type': 'application/json', 'Retry-After': '1' } 
      }),
      userEmail: userId
    };
  }

  // Parse request body with size check
  let body;
  try {
    const text = await request.text();
    if (text.length > HARD_CAPS.REQUEST_BODY_LIMIT) {
      return {
        response: new Response(JSON.stringify({ error: 'Request too large' }), { 
          status: 413, 
          headers: { 'Content-Type': 'application/json' } 
        }),
        userEmail: userId
      };
    }
    body = JSON.parse(text);
  } catch {
    return {
      response: new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: userId
    };
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return {
      response: new Response(JSON.stringify({ error: 'Invalid request format' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: userId
    };
  }

  // Quota check (402 Payment Required)
  const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
  const quotaResult = await checkQuota(env.DB, userId, isPro, currentPeriod, env);
  
  if (!quotaResult.allowed) {
    return {
      response: new Response(JSON.stringify({
        error: quotaResult.message,
        isPro,
        used: quotaResult.used,
        limit: quotaResult.limit,
        trace_id: traceId
      }), { 
        status: 402, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: userId
    };
  }

  // Call OpenAI
  try {
    const openaiResponse = await callOpenAI(body.messages, env);
    
    // Increment usage (only after successful call)
    await incrementUsage(env.DB, userId, currentPeriod);

    return {
      response: new Response(JSON.stringify(openaiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }),
      userEmail: userId
    };

  } catch (error) {
    console.error('OpenAI call failed:', error);
    return {
      response: new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable',
        trace_id: traceId 
      }), { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }),
      userEmail: userId
    };
  }
}