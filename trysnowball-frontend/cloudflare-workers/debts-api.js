/**
 * Clean UK Debts API - No American cents/bps nonsense
 * Uses real British pounds and percentages
 * 
 * Zero field transformations, zero normalization layers
 * What goes in is what comes out
 */

import { encryptDebtForStorage, decryptDebtFromStorage } from './crypto-utils.js';

// Simple debt validation - clean UK format
function validateUKDebt(debt) {
  const errors = [];
  
  if (!debt.name || typeof debt.name !== 'string') {
    errors.push('name is required');
  }
  if (typeof debt.amount !== 'number' || debt.amount < 0) {
    errors.push('amount must be a positive number');
  }
  if (typeof debt.apr !== 'number' || debt.apr < 0) {
    errors.push('apr must be a positive number');
  }
  if (typeof debt.min_payment !== 'number' || debt.min_payment < 0) {
    errors.push('min_payment must be a positive number');
  }
  
  return errors;
}

// JWT verification (copied from auth-magic.js)
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
    
    const signatureBytes = new Uint8Array(atob(signature.replace(/-/g, '+').replace(/_/g, '/')).split('').map(char => char.charCodeAt(0)));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(data));
    
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Get authenticated user ID from JWT
// Scope validation function
function validateScope(payload, requiredScope) {
  if (!payload.scope || !Array.isArray(payload.scope)) {
    return false;
  }
  return payload.scope.includes(requiredScope);
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
  
  return payload.sub; // Return the user ID from JWT subject
}

// Internal mode - allowlist of users for testing/internal use
const ALLOWED_USERS = [
  'user_rich_test',      // Test user
  'user_founder_001',    // Founder account
  'user_internal_dev'    // Internal dev account
];

function checkUserAllowlist(userId, env) {
  // In production, you might check user plan, feature flags, or other criteria
  // Use Cloudflare Workers env instead of process.env
  if (env?.NODE_ENV === 'production' || env?.ENVIRONMENT === 'production') {
    return ALLOWED_USERS.includes(userId);
  }
  // In development, allow all users
  return true;
}

async function getAuthenticatedUserWithScope(request, env, requiredScope) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  if (!payload) {
    throw new Error('Invalid JWT token');
  }

  if (!validateScope(payload, requiredScope)) {
    throw new Error(`Insufficient permissions: missing scope '${requiredScope}'`);
  }

  // Check user allowlist for internal mode
  if (!checkUserAllowlist(payload.sub, env)) {
    throw new Error('Access restricted - user not in allowlist');
  }
  
  return payload.sub; // Return the user ID from JWT subject
}

// Main API handler
// Trusted client allowlist for API security
const ALLOWED_CLIENT_IDS = [
  'web-v1',              // Production TrySnowball frontend
  'web-v1-staging',      // Staging TrySnowball frontend
  'partner-dashboard',   // Future partner access
  'mobile-v1',          // Future mobile app
  'dev-local'           // Development environment
];

// Rate limiting per IP (simple in-memory for now)
const rateLimitMap = new Map();

function checkRateLimit(ip, maxRequests = 150, windowMs = 60000) {
  const now = Date.now();
  const key = ip;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limiter = rateLimitMap.get(key);
  
  if (now > limiter.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limiter.count >= maxRequests) {
    return false;
  }
  
  limiter.count++;
  return true;
}

const cleanDebtsAPI = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-id'
    };
    
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
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
          ...corsHeaders
        }
      });
    }

    // Trusted client validation
    const clientId = request.headers.get('x-client-id');
    if (!clientId || !ALLOWED_CLIENT_IDS.includes(clientId)) {
      console.warn(`🚨 [DEBTS_API] Blocked untrusted client: ${clientId} from IP: ${clientIp} for path: ${url.pathname}`);
      return new Response(JSON.stringify({ 
        error: 'Forbidden - Invalid client',
        code: 'INVALID_CLIENT_ID',
        message: 'This request requires a valid x-client-id header'
      }), { 
        status: 403, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    try {
      let response;
      
      if (method === 'GET' && url.pathname === '/api/clean/debts') {
        response = await this.getAllDebts(request, env);
      } else if (method === 'POST' && url.pathname === '/api/clean/debts') {
        response = await this.createDebt(request, env);
      } else if (method === 'PUT' && url.pathname.startsWith('/api/clean/debts/')) {
        const debtId = url.pathname.split('/').pop();
        response = await this.updateDebt(request, env, debtId);
      } else if (method === 'DELETE' && url.pathname.startsWith('/api/clean/debts/')) {
        const debtId = url.pathname.split('/').pop();
        response = await this.deleteDebt(request, env, debtId);
      } else if (url.pathname.startsWith('/api/debts')) {
        // Legacy API endpoint - return migration notice
        response = new Response(JSON.stringify({
          error: 'Legacy endpoint deprecated',
          code: 'ENDPOINT_MOVED',
          message: 'Please use /api/clean/debts instead of /api/debts',
          migration: {
            from: url.pathname,
            to: url.pathname.replace('/api/debts', '/api/clean/debts')
          }
        }), {
          status: 410, // Gone
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        response = new Response('Not Found', { status: 404 });
      }
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
      
    } catch (error) {
      console.error('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] Error:', error);
      
      const errorResponse = new Response(JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), {
        status: error.message === 'No valid authorization header' ? 401 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
      return errorResponse;
    }
  },

  // GET /api/debts - Get all debts for user
  async getAllDebts(request, env) {
    const userId = await getAuthenticatedUserWithScope(request, env, 'debts:read');
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] GET /api/debts for user:', userId);
    
    const stmt = env.DB.prepare(`
      SELECT * FROM debts 
      WHERE user_id = ? 
      ORDER BY order_index ASC, created_at ASC
    `);
    
    const { results } = await stmt.bind(userId).all();
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] Found', results.length, 'debts');
    
    // Decrypt each debt using proper encryption
    const debts = [];
    for (const row of results) {
      try {
        const decryptedDebt = await decryptDebtFromStorage(row, env.MASTER_KEY_V1, userId);
        debts.push({
          id: decryptedDebt.id,
          name: decryptedDebt.name,
          amount: decryptedDebt.balance || decryptedDebt.amount,
          apr: decryptedDebt.interestRate || decryptedDebt.apr,
          min_payment: decryptedDebt.minPayment || decryptedDebt.min_payment,
          limit: decryptedDebt.limit,
          debt_type: decryptedDebt.type || decryptedDebt.debt_type,
          order_index: decryptedDebt.order || decryptedDebt.order_index,
          created_at: decryptedDebt.createdAt || decryptedDebt.created_at,
          updated_at: decryptedDebt.updatedAt || decryptedDebt.updated_at
        });
      } catch (error) {
        console.error('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] Failed to decrypt debt:', row.id, error);
      }
    }
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] Returning', debts.length, 'clean UK debts');
    
    return new Response(JSON.stringify({ debts }), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // POST /api/debts - Create new debt
  async createDebt(request, env) {
    const userId = await getAuthenticatedUserWithScope(request, env, 'debts:write');
    const debtData = await request.json();
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] POST /api/debts:', JSON.stringify(debtData, null, 2));
    
    // Validate debt data
    const errors = validateUKDebt(debtData);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate ID if not provided
    const debtId = debtData.id || `debt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const now = new Date().toISOString();
    
    const cleanDebt = {
      id: debtId,
      user_id: userId,
      name: debtData.name,
      amount: debtData.amount,
      apr: debtData.apr,
      min_payment: debtData.min_payment,
      limit: debtData.limit || null,
      debt_type: debtData.debt_type || 'other',
      order_index: debtData.order_index || 0,
      created_at: debtData.created_at || now,
      updated_at: now
    };
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] Clean debt to encrypt and store:', JSON.stringify(cleanDebt, null, 2));
    
    // Encrypt debt data before storage
    const encryptedDebt = await encryptDebtForStorage(
      {
        name: cleanDebt.name,
        balance: cleanDebt.amount,
        interestRate: cleanDebt.apr,
        minPayment: cleanDebt.min_payment,
        limit: cleanDebt.limit
      },
      env.MASTER_KEY_V1,
      userId
    );
    
    // Store encrypted data in D1
    const stmt = env.DB.prepare(`
      INSERT INTO debts (
        id, user_id, debt_type, order_index, created_at, updated_at,
        iv, ciphertext, dek_version, amount_band, issuer_hash, encrypted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      cleanDebt.id,
      cleanDebt.user_id,
      cleanDebt.debt_type,
      cleanDebt.order_index,
      cleanDebt.created_at,
      cleanDebt.updated_at,
      encryptedDebt.iv,
      encryptedDebt.ciphertext,
      encryptedDebt.dek_version,
      encryptedDebt.amount_band,
      encryptedDebt.issuer_hash,
      encryptedDebt.encrypted_at
    ).run();
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] ✅ Debt created successfully:', debtId);
    
    return new Response(JSON.stringify({ 
      success: true,
      debt: {
        id: cleanDebt.id,
        name: cleanDebt.name,
        amount: cleanDebt.amount,
        apr: cleanDebt.apr,
        min_payment: cleanDebt.min_payment,
        limit: cleanDebt.limit,
        debt_type: cleanDebt.debt_type,
        order_index: cleanDebt.order_index,
        created_at: cleanDebt.created_at,
        updated_at: cleanDebt.updated_at
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // PUT /api/debts/:id - Update existing debt
  async updateDebt(request, env, debtId) {
    const userId = await getAuthenticatedUserWithScope(request, env, 'debts:write');
    const updates = await request.json();
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] PUT /api/debts/' + debtId + ':', JSON.stringify(updates, null, 2));
    
    // Validate updates
    const errors = validateUKDebt({
      name: updates.name || 'placeholder',
      amount: updates.amount || 0,
      apr: updates.apr || 0,
      min_payment: updates.min_payment || 0,
      limit: updates.limit,
      debt_type: updates.debt_type || 'other'
    });
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const now = new Date().toISOString();
    
    // Update in D1
    const stmt = env.DB.prepare(`
      UPDATE debts 
      SET name = ?, amount = ?, original_amount = ?, apr = ?, min_payment = ?, debt_limit = ?,
          debt_type = ?, order_index = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(
      updates.name,
      updates.amount,
      updates.original_amount || null,
      updates.apr,
      updates.min_payment,
      updates.limit || null,
      updates.debt_type,
      updates.order_index || 0,
      now,
      debtId,
      userId
    ).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Debt not found or access denied' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] ✅ Debt updated successfully:', debtId);
    
    return new Response(JSON.stringify({ 
      success: true,
      updated_at: now
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // DELETE /api/debts/:id - Delete debt
  async deleteDebt(request, env, debtId) {
    const userId = await getAuthenticatedUserWithScope(request, env, 'debts:write');
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] DELETE /api/debts/' + debtId);
    
    const stmt = env.DB.prepare(`
      DELETE FROM debts 
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(debtId, userId).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Debt not found or access denied' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_API] ✅ Debt deleted successfully:', debtId);
    
    return new Response(JSON.stringify({ 
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export default cleanDebtsAPI;