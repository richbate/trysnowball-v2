/**
 * Cloudflare Worker API for Debt Management
 * Provides CRUD operations for authenticated users' debt data
 */

// JWT verification (reuse from existing auth worker)
async function verifyJWT(token, jwtSecret) {
  try {
    console.log('Verifying JWT token length:', token.length);
    const parts = token.split('.');
    console.log('JWT parts count:', parts.length);
    
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const [header, payload, signature] = parts;
    console.log('JWT header/payload/signature lengths:', header.length, payload.length, signature.length);
    
    // Verify signature (simplified - use proper JWT library in production)
    const expectedSignature = await crypto.subtle
      .importKey('raw', new TextEncoder().encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(key => crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`)))
      .then(signature => btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, ''));
    
    console.log('Expected signature:', expectedSignature);
    console.log('Provided signature:', signature);
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    // Decode payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      throw new Error('Token expired');
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    throw new Error(`Invalid token: ${error.message}`);
  }
}

// Get authenticated user ID from request
export async function getAuthenticatedUserId(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  if (!payload.sub) {
    throw new Error('Invalid token payload');
  }
  
  return payload.sub;
}

// Generate unique debt ID
function generateDebtId() {
  return `debt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debt API handlers
const DebtAPI = {
  // GET /api/debts - Get all debts for authenticated user
  async getDebts(request, env) {
    try {
      const userId = await getAuthenticatedUserId(request, env);
      
      const stmt = env.DB.prepare(`
        SELECT id, name, balance, rate, min_payment, credit_limit, order_index, created_at, updated_at
        FROM debts 
        WHERE user_id = ? 
        ORDER BY order_index ASC, created_at ASC
      `);
      
      const { results } = await stmt.bind(userId).all();
      
      // Transform to match frontend format
      const debts = results.map(debt => ({
        id: debt.id,
        name: debt.name,
        balance: debt.balance,
        interestRate: debt.rate,
        minPayment: debt.min_payment,
        limit: debt.credit_limit,
        order: debt.order_index,
        createdAt: debt.created_at,
        updatedAt: debt.updated_at
      }));
      
      return new Response(JSON.stringify({ debts }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // POST /api/debts - Create new debt
  async createDebt(request, env) {
    try {
      const userId = await getAuthenticatedUserId(request, env);
      const debtData = await request.json();
      
      // Validate required fields
      const { name, balance, interestRate, minPayment } = debtData;
      if (!name || balance === undefined || interestRate === undefined || minPayment === undefined) {
        throw new Error('Missing required fields: name, balance, interestRate, minPayment');
      }
      
      const debtId = generateDebtId();
      const now = new Date().toISOString();
      
      // Get max order index for user
      const maxOrderStmt = env.DB.prepare('SELECT MAX(order_index) as max_order FROM debts WHERE user_id = ?');
      const { results: orderResults } = await maxOrderStmt.bind(userId).all();
      const nextOrder = (orderResults[0]?.max_order || 0) + 1;
      
      const stmt = env.DB.prepare(`
        INSERT INTO debts (id, user_id, name, balance, rate, min_payment, credit_limit, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        debtId,
        userId,
        name,
        balance,
        interestRate,
        minPayment,
        debtData.limit || null,
        nextOrder,
        now,
        now
      ).run();
      
      // Return created debt in frontend format
      const newDebt = {
        id: debtId,
        name,
        balance,
        interestRate,
        minPayment,
        limit: debtData.limit,
        order: nextOrder,
        createdAt: now,
        updatedAt: now
      };
      
      return new Response(JSON.stringify({ debt: newDebt }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // PUT /api/debts/:id - Update existing debt
  async updateDebt(request, env, debtId) {
    try {
      const userId = await getAuthenticatedUserId(request, env);
      const updates = await request.json();
      
      // Verify debt belongs to user
      const checkStmt = env.DB.prepare('SELECT id FROM debts WHERE id = ? AND user_id = ?');
      const { results } = await checkStmt.bind(debtId, userId).all();
      
      if (results.length === 0) {
        throw new Error('Debt not found or access denied');
      }
      
      // Build dynamic update query
      const allowedFields = ['name', 'balance', 'rate', 'min_payment', 'credit_limit', 'order_index'];
      const updateFields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        const dbField = key === 'interestRate' ? 'rate' : 
                       key === 'minPayment' ? 'min_payment' :
                       key === 'limit' ? 'credit_limit' :
                       key === 'order' ? 'order_index' : key;
        
        if (allowedFields.includes(dbField)) {
          updateFields.push(`${dbField} = ?`);
          values.push(updates[key]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      const now = new Date().toISOString();
      updateFields.push('updated_at = ?');
      values.push(now);
      
      const stmt = env.DB.prepare(`
        UPDATE debts 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND user_id = ?
      `);
      
      await stmt.bind(...values, debtId, userId).run();
      
      return new Response(JSON.stringify({ success: true, updated_at: now }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // DELETE /api/debts/:id - Delete debt
  async deleteDebt(request, env, debtId) {
    try {
      const userId = await getAuthenticatedUserId(request, env);
      
      const stmt = env.DB.prepare('DELETE FROM debts WHERE id = ? AND user_id = ?');
      const result = await stmt.bind(debtId, userId).run();
      
      if (result.changes === 0) {
        throw new Error('Debt not found or access denied');
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // PUT /api/debts - Full replace all debts for user (authoritative)
  async putAllDebts(request, env) {
    try {
      const userId = await getAuthenticatedUserId(request, env);
      const { debts } = await request.json();
      
      // Validate payload
      if (!Array.isArray(debts)) {
        throw new Error('debts must be an array');
      }
      
      // Policy: cap at 200 debts per user
      if (debts.length > 200) {
        throw new Error('Too many debts (max 200)');
      }
      
      const now = Date.now();
      
      // Validate each debt object
      debts.forEach((debt, index) => {
        const required = ['id', 'name', 'balance', 'interestRate', 'minPayment'];
        for (const field of required) {
          if (debt[field] === undefined || debt[field] === null) {
            throw new Error(`Debt ${index}: missing required field "${field}"`);
          }
        }
      });
      
      // Begin transaction - full replace operation
      await env.DB.batch([
        // 1. Delete all existing debts for this user
        env.DB.prepare('DELETE FROM debts WHERE user_id = ?').bind(userId),
        
        // 2. Insert all new debts
        ...debts.map((debt, index) => 
          env.DB.prepare(`
            INSERT INTO debts (id, user_id, name, balance, rate, min_payment, credit_limit, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            debt.id,
            userId,
            debt.name,
            debt.balance,
            debt.interestRate,
            debt.minPayment,
            debt.limit || null,
            debt.order || (index + 1),
            debt.createdAt || new Date(now).toISOString(),
            debt.updatedAt || new Date(now).toISOString()
          )
        )
      ]);
      
      return new Response(JSON.stringify({ 
        success: true, 
        count: debts.length,
        updated_at: new Date(now).toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Main worker handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Route API endpoints
    if (url.pathname === '/api/debts') {
      let response;
      if (method === 'GET') {
        response = await DebtAPI.getDebts(request, env);
      } else if (method === 'POST') {
        response = await DebtAPI.createDebt(request, env);
      } else if (method === 'PUT') {
        response = await DebtAPI.putAllDebts(request, env);
      } else {
        response = new Response('Method not allowed', { status: 405 });
      }
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    // Handle /api/debts/:id routes
    const debtIdMatch = url.pathname.match(/^\/api\/debts\/([^\/]+)$/);
    if (debtIdMatch) {
      const debtId = debtIdMatch[1];
      let response;
      
      if (method === 'PUT') {
        response = await DebtAPI.updateDebt(request, env, debtId);
      } else if (method === 'DELETE') {
        response = await DebtAPI.deleteDebt(request, env, debtId);
      } else {
        response = new Response('Method not allowed', { status: 405 });
      }
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    return new Response('Not found', { status: 404 });
  }
};