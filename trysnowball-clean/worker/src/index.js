/**
 * Clean UK Debt Management API - v2.1
 * Zero conversions, bulletproof and boring
 * Cloudflare Worker with D1 Database
 */

export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  
  // CORS headers for all requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Extract auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401, corsHeaders);
    }
    
    const token = authHeader.replace('Bearer ', '');
    // For demo purposes, extract user_id from token (in production, validate JWT)
    const user_id = getUserIdFromToken(token);
    
    if (!user_id) {
      return errorResponse('Invalid token', 401, corsHeaders);
    }

    // Route handling
    if (url.pathname === '/api/v2/debts') {
      switch (method) {
        case 'GET':
          return await getDebts(env, user_id, corsHeaders);
        case 'POST':
          return await createDebt(request, env, user_id, corsHeaders);
        default:
          return errorResponse('Method not allowed', 405, corsHeaders);
      }
    }
    
    // Handle individual debt operations
    const debtMatch = url.pathname.match(/^\/api\/v2\/debts\/([^\/]+)$/);
    if (debtMatch) {
      const debtId = debtMatch[1];
      switch (method) {
        case 'PATCH':
          return await updateDebt(request, env, user_id, debtId, corsHeaders);
        case 'DELETE':
          return await deleteDebt(env, user_id, debtId, corsHeaders);
        default:
          return errorResponse('Method not allowed', 405, corsHeaders);
      }
    }
    
    return errorResponse('Not found', 404, corsHeaders);
    
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
}

// GET /api/v2/debts
async function getDebts(env, user_id, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM debts WHERE user_id = ? ORDER BY order_index ASC'
  ).bind(user_id).all();
  
  // Convert database results to UKDebt format
  const debts = results.map(formatDebtFromDB);
  
  return new Response(JSON.stringify(debts), {
    status: 200,
    headers: corsHeaders
  });
}

// POST /api/v2/debts
async function createDebt(request, env, user_id, corsHeaders) {
  const data = await request.json();
  
  // Validate required fields
  if (!data.name || !data.amount || !data.apr || !data.min_payment) {
    return errorResponse('Missing required fields: name, amount, apr, min_payment', 400, corsHeaders);
  }
  
  const debt_id = `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Set order_index to next available if not provided
  let order_index = data.order_index;
  if (!order_index) {
    const { results } = await env.DB.prepare(
      'SELECT MAX(order_index) as max_order FROM debts WHERE user_id = ?'
    ).bind(user_id).all();
    order_index = (results[0]?.max_order || 0) + 1;
  }
  
  await env.DB.prepare(`
    INSERT INTO debts (
      id, user_id, name, amount, apr, min_payment, order_index,
      limit_amount, original_amount, debt_type, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    debt_id,
    user_id,
    data.name,
    data.amount,
    data.apr,
    data.min_payment,
    order_index,
    data.limit || null,
    data.original_amount || data.amount, // Default to current amount
    data.debt_type || 'credit_card',
    now,
    now
  ).run();
  
  // Fetch the created debt
  const { results } = await env.DB.prepare(
    'SELECT * FROM debts WHERE id = ?'
  ).bind(debt_id).all();
  
  const newDebt = formatDebtFromDB(results[0]);
  
  return new Response(JSON.stringify(newDebt), {
    status: 201,
    headers: corsHeaders
  });
}

// PATCH /api/v2/debts/:id
async function updateDebt(request, env, user_id, debt_id, corsHeaders) {
  const updates = await request.json();
  
  // Build dynamic update query
  const updateFields = [];
  const values = [];
  
  const allowedFields = ['name', 'amount', 'apr', 'min_payment', 'order_index', 'limit', 'original_amount', 'debt_type'];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      const dbField = field === 'limit' ? 'limit_amount' : field;
      updateFields.push(`${dbField} = ?`);
      values.push(updates[field]);
    }
  }
  
  if (updateFields.length === 0) {
    return errorResponse('No valid fields to update', 400, corsHeaders);
  }
  
  // Add updated_at and WHERE conditions
  updateFields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(debt_id);
  values.push(user_id);
  
  const result = await env.DB.prepare(`
    UPDATE debts SET ${updateFields.join(', ')} 
    WHERE id = ? AND user_id = ?
  `).bind(...values).run();
  
  if (result.changes === 0) {
    return errorResponse('Debt not found', 404, corsHeaders);
  }
  
  // Fetch updated debt
  const { results } = await env.DB.prepare(
    'SELECT * FROM debts WHERE id = ? AND user_id = ?'
  ).bind(debt_id, user_id).all();
  
  const updatedDebt = formatDebtFromDB(results[0]);
  
  return new Response(JSON.stringify(updatedDebt), {
    status: 200,
    headers: corsHeaders
  });
}

// DELETE /api/v2/debts/:id
async function deleteDebt(env, user_id, debt_id, corsHeaders) {
  const result = await env.DB.prepare(
    'DELETE FROM debts WHERE id = ? AND user_id = ?'
  ).bind(debt_id, user_id).run();
  
  if (result.changes === 0) {
    return errorResponse('Debt not found', 404, corsHeaders);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: corsHeaders
  });
}

// Helper functions
function getUserIdFromToken(token) {
  // In production, this would validate JWT and extract user_id
  // For demo, accept any token and return a fixed user_id
  if (token === 'demo-token') {
    return 'demo_user_123';
  }
  
  // Simple token format: user_[id] for testing
  if (token.startsWith('user_')) {
    return token;
  }
  
  return null;
}

function formatDebtFromDB(dbRow) {
  if (!dbRow) return null;
  
  return {
    id: dbRow.id,
    user_id: dbRow.user_id,
    name: dbRow.name,
    amount: dbRow.amount,
    apr: dbRow.apr,
    min_payment: dbRow.min_payment,
    order_index: dbRow.order_index,
    limit: dbRow.limit_amount,
    original_amount: dbRow.original_amount,
    debt_type: dbRow.debt_type,
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at
  };
}

function errorResponse(message, status, corsHeaders) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: corsHeaders
  });
}