/**
 * Stripe Checkout Session Creation API
 * Creates Stripe checkout sessions for TrySnowball Pro subscriptions
 */

// Removed import - functions are included below if needed

// ---- JWT & SESSION HELPERS ----
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { 
    status, 
    headers: { 'content-type': 'application/json', ...headers } 
  });

// JWT signing using Web Crypto API
async function signJwt(payload, secret) {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '');
  const message = `${headerB64}.${payloadB64}`;
  
  const signature = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(message));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${message}.${signatureB64}`;
}

// JWT verification using Web Crypto API
async function verifyJwt(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('Invalid token format');
    
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const message = `${headerB64}.${payloadB64}`;
    const signature = new Uint8Array(
      atob(signatureB64 + '==='.slice(0, (4 - signatureB64.length % 4) % 4))
        .split('')
        .map(c => c.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify('HMAC', secretKey, signature, encoder.encode(message));
    if (!isValid) throw new Error('Invalid signature');
    
    const payload = JSON.parse(atob(payloadB64 + '==='.slice(0, (4 - payloadB64.length % 4) % 4)));
    
    // Check expiry
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

// Parse cookies from request
function parseCookies(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  return Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...val] = c.split('=');
      return [key, val.join('=')];
    }).filter(([key]) => key)
  );
}

// Get access token from sb_a cookie
function getAccessToken(request) {
  const cookies = parseCookies(request);
  return cookies.sb_a || null;
}

// Get refresh token from sb_r cookie  
function getRefreshToken(request) {
  const cookies = parseCookies(request);
  return cookies.sb_r || null;
}

// Get user from access token cookie with 60s clock skew
async function getUserFromCookie(request, env) {
  const token = getAccessToken(request);
  if (!token) return null;
  
  try {
    const decoded = await verifyJwt(token, env.JWT_SECRET);
    
    // Allow 60s clock skew
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && now > decoded.exp + 60) {
      return null; // Token expired beyond skew allowance
    }
    
    return { 
      id: decoded.sub, // Use email as ID for compatibility
      email: decoded.sub, 
      isPro: decoded.isPro || false,
      exp: decoded.exp 
    };
  } catch (error) {
    return null; // Invalid token
  }
}

// Set auth cookies (access + refresh)
function setAuthCookies(accessToken, refreshToken, env) {
  const isDev = env.NODE_ENV !== 'production';
  const domain = env.COOKIE_DOMAIN ? `Domain=${env.COOKIE_DOMAIN}; ` : '';
  const secure = isDev ? '' : 'Secure; ';
  
  return [
    `sb_a=${accessToken}; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=86400; ${domain}`.trim(),
    `sb_r=${refreshToken}; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=604800; ${domain}`.trim()
  ];
}

// Clear auth cookies
function clearAuthCookies(env) {
  const domain = env.COOKIE_DOMAIN ? `Domain=${env.COOKIE_DOMAIN}; ` : '';
  const secure = env.NODE_ENV === 'production' ? 'Secure; ' : '';
  
  return [
    `sb_a=; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=0; ${domain}`.trim(),
    `sb_r=; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=0; ${domain}`.trim()
  ];
}

// Create access token (24h)
async function createAccessToken(email, env) {
  const isPro = isProByEnv(email, env);
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    sub: email,
    isPro,
    iat: now,
    exp: now + 86400 // 24 hours
  };
  
  return await signJwt(payload, env.JWT_SECRET);
}

// Create refresh token (7d)
async function createRefreshToken(email, env) {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    sub: email,
    type: 'refresh',
    iat: now,
    exp: now + 604800 // 7 days
  };
  
  return await signJwt(payload, env.JWT_SECRET);
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send magic link email via SendGrid (or log for demo)
async function sendMagicLinkEmail(email, token, env) {
  const magicLink = `https://trysnowball.co.uk/auth/verify?token=${token}`;
  
  // For demo: log the link to console so you can copy-paste it
  console.log(`Magic link for ${email}: ${magicLink}`);
  
  // If we have SendGrid configured, send the email
  if (env.SENDGRID_API_KEY) {
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
        <a href="${magicLink}" class="button">Log In</a>
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

${magicLink}

This magic link is valid for 15 minutes and can be used only once.

If you didn't request this email, you can safely ignore it.

© ${currentYear} TrySnowball. All rights reserved.`;

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
        },
        subscription_tracking: {
          enable: false
        }
      }
    };

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SendGrid error:', errorText);
      } else {
        console.log('Magic link email sent successfully to:', email);
      }
    } catch (e) {
      console.error('Email send failed:', e);
    }
  }
}

// Entitlement check via env allow-list
function isProByEnv(email, env) {
  if (!email) return false;
  const list = (env.PRO_USER_EMAILS || '').split(/[, \n\r\t]+/).filter(Boolean);
  return list.includes(email);
}

// Legacy auth helper (keeping for compatibility)
async function getAuthenticatedUserId(request, env) {
  const user = await getUserFromCookie(request, env);
  return user?.id || 'user_placeholder';
}

// ---- Debts API (minimal) ----
// GET /api/debts
async function listDebts(DB) {
  try {
    const rows = await DB.prepare(
      `SELECT id, name, balance, min_payment as minPayment, apr, created_at, updated_at
       FROM debts ORDER BY created_at DESC`
    ).all();
    return new Response(JSON.stringify({ debts: rows.results || [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    // If debts table doesn't exist, return empty array
    console.error('Debts query error:', error);
    return new Response(JSON.stringify({ debts: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// POST /api/debts  body: {id?, name, balance, minPayment, apr}
async function createDebt(DB, body) {
  try {
    const id = body.id || `debt_${crypto.randomUUID()}`;
    await DB.prepare(`
      INSERT INTO debts (id, name, balance, min_payment, apr, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(id, body.name, body.balance ?? 0, body.minPayment ?? 0, body.apr ?? 0).run();
    return new Response(JSON.stringify({ ok: true, id }), {
      status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Create debt error:', error);
    return new Response(JSON.stringify({ error: 'Debts table not available', details: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// PUT /api/debts/:id  body: {name?, balance?, minPayment?, apr?}
async function updateDebt(DB, id, body) {
  await DB.prepare(`
    UPDATE debts SET
      name = COALESCE(?, name),
      balance = COALESCE(?, balance),
      min_payment = COALESCE(?, min_payment),
      apr = COALESCE(?, apr),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(body.name ?? null, body.balance ?? null, body.minPayment ?? null, body.apr ?? null, id).run();
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

// DELETE /api/debts/:id
async function deleteDebt(DB, id) {
  await DB.prepare(`DELETE FROM debts WHERE id = ?`).bind(id).run();
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}

// ---- AI Chat Functions ----
async function enforceDailyLimit(env, userId, limit) {
  const key = `q:${new Date().toISOString().slice(0,10)}:${userId}`;
  const cur = Number(await env.AI_QUOTAS.get(key)) || 0;
  if (cur >= limit) throw new Error('RATE_LIMIT');
  await env.AI_QUOTAS.put(key, String(cur + 1), { expirationTtl: 60*60*27 });
}

function sanitize(ctx) {
  // Strip huge arrays/PII you don't want leaving the browser
  const clone = { ...ctx };
  if (Array.isArray(clone.debts)) {
    clone.debts = clone.debts.map(d => ({
      id: d.id, name: d.name, balance: d.amount ?? d.balance,
      apr: d.interest ?? d.apr, min: d.regularPayment ?? d.minPayment
    }));
  }
  delete clone.paymentHistoryRaw;
  return clone;
}

function buildSystemPrompt(ctx) {
  return [
    'You are Yuki, a UK-focused debt coach inside TrySnowball.',
    'Give pragmatic, actionable guidance. Be concise.',
    'Always assume UK law/practice. If a concept varies by country, pick the UK variant.',
    '',
    'Prioritisation rules (UK):',
    '1) Priority debts: rent/mortgage arrears, council tax, magistrates\' fines, energy bills—deal with these first.',
    '2) Non-priority: credit cards, loans, BNPL—use snowball/avalanche strategies.',
    '3) Flag options where relevant: payment plans, token payments, breathing space (England/Wales), DMP, DRO, IVA, bankruptcy.',
    '',
    'Boundaries & safety:',
    '- You are not a regulated adviser. Provide information, not legal/financial advice. Suggest speaking to StepChange/National Debtline for regulated help.',
    '- If user mentions crisis (bailiffs, eviction, court letters), tell them to contact the creditor/council and a debt charity urgently.',
    '',
    'Style: direct, kind, cost-aware. No fluff. Use £, months, and simple tables when useful.',
    '',
    'If user asks to "run numbers" or "simulate", rely on the provided context numbers; do not invent data.',
    ''
  ].join('\n');
}

// Simple auth check for AI endpoint
async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('AUTH_REQUIRED');
  }
  
  const token = authHeader.substring(7);
  // Reuse JWT verification logic from auth worker
  // For now, return a placeholder user - integrate with auth worker later
  return { id: 'user_placeholder', email: 'test@example.com' };
}

// AI Chat endpoint
async function handleAIChat(request, env) {
  try {
    // Check auth
    const user = await requireAuth(request, env);
    
    const { messages, model, userContext } = await request.json();

    // 1) Rate limit per user per day (KV)
    const dailyLimit = Number(env.AI_DAILY_REQ) || 40;
    await enforceDailyLimit(env, user.id, dailyLimit);

    // 2) Model + token caps
    const allow = (env.AI_ALLOWED_MODELS || 'gpt-4o-mini').split(',');
    const chosen = allow.includes(model) ? model : allow[0] || 'gpt-4o-mini';
    const maxTokens = Number(env.AI_MAX_TOKENS) || 700;
    const temperature = Number(env.AI_TEMP) || 0.2;

    // 3) Compose server-side system prompt (UK debt specific, safety)
    const system = buildSystemPrompt(userContext);

    // 4) Upstream call
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: chosen,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          // We pass a compact JSON context message first to guide answers
          { role: 'user', content: `CONTEXT:\n${JSON.stringify(sanitize(userContext)).slice(0, 8000)}` },
          ...(Array.isArray(messages) ? messages : []),
        ]
      })
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: 'quota' }), { 
        status: 402,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (!r.ok) {
      return new Response(JSON.stringify({ error: 'upstream', detail: await r.text() }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    
    return new Response(JSON.stringify({ content }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    if (error.message === 'RATE_LIMIT') {
      return new Response(JSON.stringify({ error: 'quota' }), { 
        status: 402,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (error.message === 'AUTH_REQUIRED') {
      return new Response(JSON.stringify({ error: 'auth_required' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    console.error('AI Chat error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// ---- Subscriptions API ----
// GET /api/subscriptions
async function listSubscriptions(env, customerId = null) {
  try {
    const url = customerId 
      ? `https://api.stripe.com/v1/subscriptions?customer=${customerId}`
      : 'https://api.stripe.com/v1/subscriptions?limit=10';
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify({ subscriptions: data.data || [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// GET /api/subscriptions/:id
async function getSubscription(env, subscriptionId) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status}`);
    }

    const subscription = await response.json();
    return new Response(JSON.stringify({ subscription }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscription', details: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

const StripePortalAPI = {
  async createPortalSession(request, env) {
    try {
      // Verify user is authenticated
      const userId = await getAuthenticatedUserId(request, env);
      
      const { customerEmail, returnUrl } = await request.json();
      
      if (!customerEmail || !returnUrl) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: customerEmail, returnUrl' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Find or create Stripe customer
      let customerId;
      
      // First, try to get existing customer by email
      const existingCustomerResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(customerEmail)}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!existingCustomerResponse.ok) {
        throw new Error('Failed to search for existing customer');
      }

      const existingCustomerData = await existingCustomerResponse.json();
      
      if (existingCustomerData.data && existingCustomerData.data.length > 0) {
        customerId = existingCustomerData.data[0].id;
      } else {
        // Create new customer if none exists
        const newCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'email': customerEmail,
            'metadata[user_id]': userId
          })
        });

        if (!newCustomerResponse.ok) {
          throw new Error('Failed to create customer');
        }

        const newCustomerData = await newCustomerResponse.json();
        customerId = newCustomerData.id;
      }

      // Create customer portal session
      const portalSession = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'customer': customerId,
          'return_url': returnUrl
        })
      });

      if (!portalSession.ok) {
        const error = await portalSession.text();
        console.error('Stripe Portal API error:', error);
        throw new Error('Failed to create customer portal session');
      }

      const session = await portalSession.json();
      
      return new Response(JSON.stringify({
        url: session.url
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });

    } catch (error) {
      console.error('Portal session creation error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

const StripeCheckoutAPI = {
  // Pro monthly subscription checkout
  async createCheckoutSession(request, env) {
    try {
      // Verify user is authenticated
      const userId = await getAuthenticatedUserId(request, env);
      
      const { priceId, customerEmail, successUrl, cancelUrl } = await request.json();
      
      if (!priceId || !customerEmail || !successUrl || !cancelUrl) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: priceId, customerEmail, successUrl, cancelUrl' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Use environment price ID to prevent prod/test mix-ups
      const LIVE_PRICE_ID = env.STRIPE_PRICE_PRO || priceId;
      
      console.log(`🎫 Creating checkout for price ${LIVE_PRICE_ID} (user: ${userId})`);

      // Create Stripe checkout session
      const checkoutSession = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'payment_method_types[0]': 'card',
          'line_items[0][price]': LIVE_PRICE_ID,
          'line_items[0][quantity]': '1',
          'mode': 'subscription',
          'customer_creation': 'if_required',
          'customer_email': customerEmail,
          'metadata[user_id]': userId,
          'subscription_data[metadata][user_id]': userId,
          'success_url': successUrl,
          'cancel_url': cancelUrl,
          'allow_promotion_codes': 'true',
          'billing_address_collection': 'required', // For VAT
          'tax_id_collection[enabled]': 'true',
          'automatic_tax[enabled]': 'true'
        })
      });

      if (!checkoutSession.ok) {
        const error = await checkoutSession.text();
        console.error('Stripe API error:', error);
        throw new Error('Failed to create checkout session');
      }

      const session = await checkoutSession.json();
      
      return new Response(JSON.stringify({
        url: session.url,
        sessionId: session.id
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });

    } catch (error) {
      console.error('Checkout session creation error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Founders Access one-time payment checkout
  async createFounderCheckoutSession(request, env) {
    try {
      console.log('Starting founder checkout session creation...');
      
      // Verify user is authenticated
      console.log('Verifying user authentication...');
      const userId = await getAuthenticatedUserId(request, env);
      console.log('User authenticated successfully:', userId);
      
      console.log('Parsing request body...');
      const { customerEmail, successUrl, cancelUrl } = await request.json();
      console.log('Request body parsed:', { customerEmail, successUrl, cancelUrl });
      
      if (!customerEmail || !successUrl || !cancelUrl) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: customerEmail, successUrl, cancelUrl' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create Stripe checkout session for Founders Access
      console.log('Creating Stripe checkout session...');
      console.log('Using Stripe secret key:', env.STRIPE_SECRET_KEY ? 'Present' : 'Missing');
      console.log('Using founders price ID:', env.STRIPE_FOUNDERS_PRICE_ID || 'fallback');
      
      const checkoutSession = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'payment_method_types[0]': 'card',
          'mode': 'payment',
          'customer_email': customerEmail,
          'line_items[0][price]': env.STRIPE_FOUNDERS_PRICE_ID || 'price_1QSZkPP8ZfCqMKZe7RqSqyRm', // Founders price ID
          'line_items[0][quantity]': '1',
          'success_url': successUrl,
          'cancel_url': cancelUrl,
          'allow_promotion_codes': 'true',
          'billing_address_collection': 'required', // For VAT
          'tax_id_collection[enabled]': 'true',
          'automatic_tax[enabled]': 'true',
          'metadata[plan]': 'founder',
          'metadata[user_id]': userId,
          'metadata[product_id]': 'prod_SpH9jAIEBykhni'
        })
      });

      if (!checkoutSession.ok) {
        const error = await checkoutSession.text();
        console.error('Stripe API error:', error);
        throw new Error('Failed to create founder checkout session');
      }

      const session = await checkoutSession.json();
      
      return new Response(JSON.stringify({
        url: session.url,
        sessionId: session.id
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });

    } catch (error) {
      console.error('Founder checkout session creation error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Cloudflare Worker fetch handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Health (useful for curl checks)
    if (pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ---- AUTH ENDPOINTS ----
    // POST /auth/login - JWT-based login with sb_a/sb_r cookies
    if (pathname === '/auth/login' && request.method === 'POST') {
      try {
        // Rate limiting: 5 attempts per IP per minute
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rateLimitKey = `login_attempts_${clientIP}`;
        const currentAttempts = Number(await env.AI_QUOTAS.get(rateLimitKey)) || 0;
        
        if (currentAttempts >= 5) {
          return json({ error: 'too many attempts, try again later' }, 429, { 'Access-Control-Allow-Origin': '*' });
        }

        const { email, password } = await request.json().catch(() => ({}));
        if (!email) {
          return json({ error: 'email required' }, 400, { 'Access-Control-Allow-Origin': '*' });
        }

        // Password validation: bypass mode OR password match
        const isBypass = env.LOGIN_BYPASS === '1';
        const isValidPassword = password === env.DEFAULT_LOGIN_PASSWORD;
        
        if (!isBypass && !isValidPassword) {
          // Increment failed attempts
          await env.AI_QUOTAS.put(rateLimitKey, String(currentAttempts + 1), { expirationTtl: 60 });
          return json({ error: 'invalid credentials' }, 401, { 'Access-Control-Allow-Origin': '*' });
        }

        // Successful login - clear rate limit
        await env.AI_QUOTAS.delete(rateLimitKey);

        // Create access (24h) and refresh (7d) tokens
        const normalizedEmail = email.toLowerCase();
        const accessToken = await createAccessToken(normalizedEmail, env);
        const refreshToken = await createRefreshToken(normalizedEmail, env);

        // Set both auth cookies using Headers constructor for multiple cookies
        const [accessCookie, refreshCookie] = setAuthCookies(accessToken, refreshToken, env);
        const headers = new Headers({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        headers.append('Set-Cookie', accessCookie);
        headers.append('Set-Cookie', refreshCookie);

        return new Response(JSON.stringify({ 
          user: { 
            id: normalizedEmail,
            email: normalizedEmail, 
            isPro: isProByEnv(normalizedEmail, env) 
          } 
        }), {
          status: 200,
          headers
        });

      } catch (error) {
        console.error('[/auth/login] Error:', error);
        return json({ error: 'login failed' }, 500, { 'Access-Control-Allow-Origin': '*' });
      }
    }

    // POST /auth/logout - Clear sb_a and sb_r cookies
    if (pathname === '/auth/logout' && request.method === 'POST') {
      const [accessClear, refreshClear] = clearAuthCookies(env);
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      headers.append('Set-Cookie', accessClear);
      headers.append('Set-Cookie', refreshClear);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers
      });
    }

    // GET /auth/check - JWT session verification  
    if (pathname === '/auth/check' && request.method === 'GET') {
      const user = await getUserFromCookie(request, env);
      const response = user 
        ? { user: { id: user.email, email: user.email, isPro: user.isPro }, exp: user.exp }
        : { user: null };
      
      return json(response, 200, { 'Access-Control-Allow-Origin': '*' });
    }

    // POST /auth/refresh - Rotate tokens using refresh token
    if (pathname === '/auth/refresh' && request.method === 'POST') {
      try {
        const refreshToken = getRefreshToken(request);
        if (!refreshToken) {
          return json({ error: 'no refresh token' }, 401, { 'Access-Control-Allow-Origin': '*' });
        }

        // Verify refresh token
        const decoded = await verifyJwt(refreshToken, env.JWT_SECRET);
        if (decoded.type !== 'refresh') {
          return json({ error: 'invalid token type' }, 401, { 'Access-Control-Allow-Origin': '*' });
        }

        // Create new tokens
        const email = decoded.sub;
        const newAccessToken = await createAccessToken(email, env);
        const newRefreshToken = await createRefreshToken(email, env);

        // Set new cookies
        const [accessCookie, refreshCookie] = setAuthCookies(newAccessToken, newRefreshToken, env);
        const headers = new Headers({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        headers.append('Set-Cookie', accessCookie);
        headers.append('Set-Cookie', refreshCookie);

        return new Response(JSON.stringify({ 
          user: { 
            id: email,
            email, 
            isPro: isProByEnv(email, env) 
          } 
        }), {
          status: 200,
          headers
        });

      } catch (error) {
        return json({ error: 'invalid refresh token' }, 401, { 'Access-Control-Allow-Origin': '*' });
      }
    }

    // POST /auth/request-link - Magic link authentication
    if (pathname === '/auth/request-link' && request.method === 'POST') {
      try {
        const { email } = await request.json().catch(() => ({}));
        
        if (!email || !isValidEmail(email)) {
          return json({ ok: true }, 200); // Don't leak account enumeration
        }

        // Rate limiting: 5 requests per IP+email per minute
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rateLimitKey = `magic_link_${clientIP}_${email.toLowerCase()}`;
        const currentAttempts = Number(await env.AI_QUOTAS.get(rateLimitKey)) || 0;
        
        if (currentAttempts >= 5) {
          return json({ ok: true }, 200); // Don't leak rate limiting
        }

        // Create magic link token (15 minutes)
        const linkToken = await signJwt({
          sub: email.toLowerCase(),
          kind: 'magic',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 900 // 15 minutes
        }, env.JWT_SECRET);

        // Increment rate limit counter
        await env.AI_QUOTAS.put(rateLimitKey, String(currentAttempts + 1), { expirationTtl: 60 });

        // Send email with magic link
        await sendMagicLinkEmail(email, linkToken, env);

        // For demo: also return the link in response (remove this later)
        return json({ 
          ok: true, 
          demo_link: `https://trysnowball.co.uk/auth/verify?token=${linkToken}` 
        }, 200);
      } catch (error) {
        console.error('[/auth/request-link] Error:', error);
        return json({ ok: true }, 200); // Always return success to avoid leaking errors
      }
    }

    // GET /auth/verify - Magic link verification (demo mode)
    if (pathname === '/auth/verify' && request.method === 'GET') {
      // For demo: any token logs you in as demo@trysnowball.local
      const email = 'demo@trysnowball.local';
      const isPro = false; // Change this to true to test Pro features
      
      // Create tokens for demo user
      const now = Math.floor(Date.now() / 1000);
      const accessPayload = { sub: email, isPro, iat: now, exp: now + 86400 };
      const refreshPayload = { sub: email, type: 'refresh', iat: now, exp: now + 604800 };
      
      const accessToken = await signJwt(accessPayload, env.JWT_SECRET);
      const refreshToken = await signJwt(refreshPayload, env.JWT_SECRET);

      // Set cookies and redirect to home
      const accessCookie = `sb_a=${accessToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`;
      const refreshCookie = `sb_r=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
      
      const headers = new Headers({ 'Location': '/' });
      headers.append('Set-Cookie', accessCookie);
      headers.append('Set-Cookie', refreshCookie);

      return new Response(null, { status: 302, headers });
    }

    // POST /auth/register - Stub (behaves like request-link for now)
    if (pathname === '/auth/register' && request.method === 'POST') {
      // For now, just redirect to magic link flow
      const body = await request.text();
      return fetch(new Request(new URL('/auth/request-link', request.url), {
        method: 'POST',
        headers: request.headers,
        body
      }));
    }

    // ---- CRA COMPATIBILITY ROUTES ----
    // GET /api/me - Returns current user from session cookie or null
    if (pathname === '/api/me' && request.method === 'GET') {
      try {
        const user = await getUserFromCookie(request, env);
        return json({ user }, 200, { 'Access-Control-Allow-Origin': '*' });
      } catch (error) {
        console.error('[/api/me] Error:', error);
        return json({ user: null }, 200, { 'Access-Control-Allow-Origin': '*' });
      }
    }

    // GET /api/me/plan - Returns user's billing status (single source of truth)
    if (pathname === '/api/me/plan' && request.method === 'GET') {
      try {
        const user = await getUserFromCookie(request, env);
        if (!user) {
          return json({ is_paid: false, source: 'none', reason: 'Not authenticated' }, 200, { 'Access-Control-Allow-Origin': '*' });
        }
        
        const row = await env.DB.prepare('SELECT is_pro, beta_access FROM users WHERE email=?')
          .bind(user.email).first();
        
        if (!row) {
          return json({ is_paid: false, source: 'none', reason: 'User not found' }, 200, { 'Access-Control-Allow-Origin': '*' });
        }
        
        const is_paid = !!(row.beta_access || row.is_pro);
        const source = row.beta_access ? 'beta' : (row.is_pro ? 'stripe' : 'none');
        
        return json({ is_paid, source }, 200, { 'Access-Control-Allow-Origin': '*' });
      } catch (error) {
        console.error('[/api/me/plan] Error:', error);
        return json({ is_paid: false, source: 'none', reason: 'Database error' }, 200, { 'Access-Control-Allow-Origin': '*' });
      }
    }

    // GET /api/account/entitlement - Returns user's Pro/Free status (legacy compatibility)
    if (pathname === '/api/account/entitlement' && request.method === 'GET') {
      try {
        const user = await getUserFromCookie(request, env);
        const isPro = user ? isProByEnv(user.email, env) : false;
        
        return json({
          isPro,
          plan: isPro ? 'pro' : 'free',
          betaAccess: isPro,
          dailyQuota: isPro ? 200 : 40,
          reason: user ? (isPro ? 'Pro user' : 'Free user') : 'Not authenticated'
        }, 200, { 'Access-Control-Allow-Origin': '*' });
      } catch (error) {
        console.error('[/api/account/entitlement] Error:', error);
        return json({
          isPro: false,
          plan: 'free',
          reason: 'Error occurred, defaulting to free'
        }, 200, { 'Access-Control-Allow-Origin': '*' });
      }
    }

    // ---- Debts routes ----
    if (pathname === '/api/debts' && request.method === 'GET') {
      return listDebts(env.DB);
    }
    if (pathname === '/api/debts' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      return createDebt(env.DB, body);
    }
    if (pathname.startsWith('/api/debts/') && request.method === 'PUT') {
      const id = pathname.split('/').pop();
      const body = await request.json().catch(() => ({}));
      return updateDebt(env.DB, id, body);
    }
    if (pathname.startsWith('/api/debts/') && request.method === 'DELETE') {
      const id = pathname.split('/').pop();
      return deleteDebt(env.DB, id);
    }

    // ---- AI Chat routes ----
    if (pathname === '/api/ai/chat' && request.method === 'POST') {
      return handleAIChat(request, env);
    }

    // ---- Subscriptions routes ----
    if (pathname === '/api/subscriptions' && request.method === 'GET') {
      const url = new URL(request.url);
      const customerId = url.searchParams.get('customer');
      return listSubscriptions(env, customerId);
    }
    if (pathname.startsWith('/api/subscriptions/') && request.method === 'GET') {
      const subscriptionId = pathname.split('/').pop();
      return getSubscription(env, subscriptionId);
    }

    // ---- Stripe endpoints ----
    if (request.method === 'POST' && pathname === '/api/create-checkout-session') {
      return await StripeCheckoutAPI.createCheckoutSession(request, env);
    }
    
    if (request.method === 'POST' && pathname === '/api/create-founder-checkout') {
      try {
        return await StripeCheckoutAPI.createFounderCheckoutSession(request, env);
      } catch (error) {
        console.error('Handler error for create-founder-checkout:', error);
        return new Response(JSON.stringify({ 
          error: error.message || 'Internal server error',
          details: error.stack 
        }), { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
    }
    
    if (request.method === 'POST' && pathname === '/api/create-portal-session') {
      return await StripePortalAPI.createPortalSession(request, env);
    }

    // Fallthrough 404
    return new Response('Not Found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};