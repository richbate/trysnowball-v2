/**
 * AI Coach Worker - Server-side cost control & quota enforcement
 * Model A: Pure paywall (FREE_COACH_MSGS=0)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// JWT verification utility
async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    
    // Verify signature
    const data = `${header}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, new TextEncoder().encode(data));
    
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiry
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

// Get user from JWT token
async function getUserFromJWT(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  if (!payload) return null;
  
  return {
    id: payload.sub,
    email: payload.email,
    isPro: payload.isPro || false
  };
}

// Get current usage period (YYYY-MM format)
function getCurrentPeriod() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Check quota and enforce limits
async function checkQuota(user, env) {
  const period = getCurrentPeriod();
  
  // Config (env vars you can flip per environment)
  const FREE_QUOTA = Number(env.FREE_COACH_MSGS) || 0;      // 0 for pure paywall
  const PRO_QUOTA = Number(env.PRO_COACH_MSGS) || 2000;     // safety cap
  const isPro = !!user.isPro;
  
  // Read current usage
  const row = await env.DB.prepare(
    'SELECT messages FROM ai_usage WHERE user_id = ? AND period = ?'
  ).bind(user.id, period).first();
  
  const used = row?.messages || 0;
  const limit = isPro ? PRO_QUOTA : FREE_QUOTA;
  const remaining = Math.max(0, limit - used);
  
  return {
    used,
    limit,
    remaining,
    isPro,
    period,
    canUse: remaining > 0
  };
}

// Increment usage counter
async function incrementUsage(user, period, env, ctx) {
  ctx.waitUntil(
    env.DB.prepare(`
      INSERT INTO ai_usage(user_id, period, messages)
      VALUES(?, ?, 1)
      ON CONFLICT(user_id, period) DO UPDATE SET messages = messages + 1
    `).bind(user.id, period).run()
  );
}

// Call OpenAI API
async function callOpenAI(messages, env) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.GPT_MODEL_CHAT || 'gpt-4o-mini',
      messages: messages,
      max_tokens: parseInt(env.GPT_MAX_TOKENS) || 512,
      temperature: 0.7,
    }),
  });
  
  return response;
}

// Main handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'ai-coach' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
    
    // Usage stats endpoint
    if (url.pathname === '/usage' && request.method === 'GET') {
      const user = await getUserFromJWT(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      
      const quota = await checkQuota(user, env);
      return new Response(JSON.stringify(quota), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
    
    // AI Chat endpoint
    if (url.pathname === '/chat' && request.method === 'POST') {
      // Check for emergency disable
      if (env.COACH_DISABLED === 'true') {
        return new Response(JSON.stringify({ 
          error: 'AI Coach is temporarily unavailable. Please try again later.' 
        }), {
          status: 503,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      
      // Authenticate user
      const user = await getUserFromJWT(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Please log in to use AI Coach' }), {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      
      // Check quota
      const quota = await checkQuota(user, env);
      if (!quota.canUse) {
        return new Response(JSON.stringify({ 
          error: 'quota_exceeded', 
          isPro: quota.isPro,
          used: quota.used,
          limit: quota.limit
        }), {
          status: 402, // Payment Required
          headers: { 
            ...CORS_HEADERS, 
            'Content-Type': 'application/json',
            'X-Usage-Remaining': '0',
            'X-Usage-Limit': String(quota.limit),
            'X-User-Pro': String(quota.isPro)
          }
        });
      }
      
      try {
        // Get request body
        const { messages } = await request.json();
        if (!messages || !Array.isArray(messages)) {
          return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
        
        // Call OpenAI
        const openaiResp = await callOpenAI(messages, env);
        
        if (!openaiResp.ok) {
          const error = await openaiResp.text();
          return new Response(JSON.stringify({ error: 'AI service error', details: error }), {
            status: openaiResp.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
        
        // Increment usage counter
        await incrementUsage(user, quota.period, env, ctx);
        
        // Return response with usage headers
        const responseData = await openaiResp.json();
        const remaining = quota.remaining - 1;
        
        return new Response(JSON.stringify(responseData), {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'X-Usage-Remaining': String(remaining),
            'X-Usage-Limit': String(quota.limit),
            'X-User-Pro': String(quota.isPro)
          }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Internal server error',
          message: error.message 
        }), {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 404 for other routes
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
};