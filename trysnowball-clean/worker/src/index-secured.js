/**
 * Clean UK Debt Management API - v2.2 SECURED
 * CP-3 Complete: Encryption + JWT Auth + Validation
 * Zero conversions, bulletproof and boring
 * Cloudflare Worker with D1 Database
 */

import { DebtEncryption } from './encryption.js';
import { verifyAuth } from './auth.js';
import { calculateAnalyticsMetadata } from './metadata.js';

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
    // Verify JWT authentication
    const auth = await verifyAuth(request, env);
    if (!auth.valid) {
      return errorResponse(auth.error, 401, corsHeaders);
    }
    
    const user_id = auth.userId;
    
    // Initialize encryption with secret from environment
    const encryptionKey = env.ENCRYPTION_SECRET;
    if (!encryptionKey) {
      console.error('ENCRYPTION_SECRET not configured');
      return errorResponse('Server configuration error', 500, corsHeaders);
    }
    
    const encryption = new DebtEncryption(encryptionKey);

    // Route handling
    if (url.pathname === '/api/v2/debts') {
      switch (method) {
        case 'GET':
          return await getDebts(env, user_id, encryption, corsHeaders);
        case 'POST':
          return await createDebt(request, env, user_id, encryption, corsHeaders);
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
          return await updateDebt(request, env, user_id, debtId, encryption, corsHeaders);
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

// GET /api/v2/debts - with decryption
async function getDebts(env, user_id, encryption, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM debts WHERE user_id = ? ORDER BY order_index ASC'
  ).bind(user_id).all();
  
  // Decrypt all debts
  const decryptedDebts = await Promise.all(
    results.map(async (encryptedDebt) => {
      const decrypted = await encryption.decryptDebtFromStorage(encryptedDebt);
      return {
        id: decrypted.id,
        user_id: decrypted.user_id,
        name: decrypted.name,
        amount: decrypted.amount,
        apr: decrypted.apr,
        min_payment: decrypted.min_payment,
        order_index: decrypted.order_index,
        limit: decrypted.limit,
        original_amount: decrypted.original_amount,
        debt_type: decrypted.debt_type,
        created_at: decrypted.created_at,
        updated_at: decrypted.updated_at
      };
    })
  );
  
  return new Response(JSON.stringify(decryptedDebts), {
    status: 200,
    headers: corsHeaders
  });
}

// POST /api/v2/debts - with validation and encryption
async function createDebt(request, env, user_id, encryption, corsHeaders) {
  const data = await request.json();
  
  // Validate required fields
  if (!data.name || data.amount === undefined || data.apr === undefined || data.min_payment === undefined) {
    return errorResponse('Missing required fields: name, amount, apr, min_payment', 400, corsHeaders);
  }
  
  // Validate field constraints (CP-3 requirements)
  if (data.apr < 0 || data.apr > 100) {
    return errorResponse('APR must be between 0 and 100', 400, corsHeaders);
  }
  
  if (data.min_payment <= 0) {
    return errorResponse('Minimum payment must be greater than 0', 400, corsHeaders);
  }
  
  if (data.amount < 0) {
    return errorResponse('Amount cannot be negative', 400, corsHeaders);
  }
  
  if (data.min_payment > data.amount) {
    return errorResponse('Minimum payment cannot exceed debt amount', 400, corsHeaders);
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
  
  // Calculate privacy-preserving analytics metadata BEFORE encryption
  const metadata = calculateAnalyticsMetadata(data);
  
  // Encrypt sensitive fields before storage
  const encryptedData = await encryption.encryptDebtForStorage({
    name: data.name,
    amount: data.amount,
    apr: data.apr,
    min_payment: data.min_payment,
    limit: data.limit,
    original_amount: data.original_amount || data.amount
  });
  
  await env.DB.prepare(`
    INSERT INTO debts (
      id, user_id, name, amount, apr, min_payment, order_index,
      limit_amount, original_amount, debt_type, created_at, updated_at,
      amount_range, apr_range, payment_burden, category, created_month, payoff_quarter
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    debt_id,
    user_id,
    encryptedData.name,
    encryptedData.amount,
    encryptedData.apr,
    encryptedData.min_payment,
    order_index,
    encryptedData.limit || null,
    encryptedData.original_amount,
    data.debt_type || 'credit_card',
    now,
    now,
    metadata.amount_range,
    metadata.apr_range,
    metadata.payment_burden,
    metadata.category,
    metadata.created_month,
    metadata.payoff_quarter
  ).run();
  
  // Return the created debt (unencrypted)
  const newDebt = {
    id: debt_id,
    user_id,
    name: data.name,
    amount: data.amount,
    apr: data.apr,
    min_payment: data.min_payment,
    order_index,
    limit: data.limit || null,
    original_amount: data.original_amount || data.amount,
    debt_type: data.debt_type || 'credit_card',
    created_at: now,
    updated_at: now
  };
  
  return new Response(JSON.stringify(newDebt), {
    status: 201,
    headers: corsHeaders
  });
}

// PATCH /api/v2/debts/:id - with validation and encryption
async function updateDebt(request, env, user_id, debt_id, encryption, corsHeaders) {
  const updates = await request.json();
  
  // Validate update fields if present
  if (updates.apr !== undefined && (updates.apr < 0 || updates.apr > 100)) {
    return errorResponse('APR must be between 0 and 100', 400, corsHeaders);
  }
  
  if (updates.min_payment !== undefined && updates.min_payment <= 0) {
    return errorResponse('Minimum payment must be greater than 0', 400, corsHeaders);
  }
  
  if (updates.amount !== undefined && updates.amount < 0) {
    return errorResponse('Amount cannot be negative', 400, corsHeaders);
  }
  
  // Check if debt exists and belongs to user
  const { results: existing } = await env.DB.prepare(
    'SELECT * FROM debts WHERE id = ? AND user_id = ?'
  ).bind(debt_id, user_id).all();
  
  if (existing.length === 0) {
    return errorResponse('Debt not found', 404, corsHeaders);
  }
  
  // Decrypt existing debt to check constraints
  const existingDebt = await encryption.decryptDebtFromStorage(existing[0]);
  
  // Check min_payment constraint against amount
  const newAmount = updates.amount !== undefined ? updates.amount : existingDebt.amount;
  const newMinPayment = updates.min_payment !== undefined ? updates.min_payment : existingDebt.min_payment;
  
  if (newMinPayment > newAmount) {
    return errorResponse('Minimum payment cannot exceed debt amount', 400, corsHeaders);
  }
  
  // Build dynamic update query
  const updateFields = [];
  const values = [];
  
  const allowedFields = ['name', 'amount', 'apr', 'min_payment', 'order_index', 'limit', 'original_amount', 'debt_type'];
  
  // Encrypt sensitive fields
  const encryptedUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (['name', 'amount', 'apr', 'min_payment', 'limit', 'original_amount'].includes(field)) {
        encryptedUpdates[field] = await encryption.encryptField(updates[field]);
      } else {
        encryptedUpdates[field] = updates[field];
      }
    }
  }
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      const dbField = field === 'limit' ? 'limit_amount' : field;
      updateFields.push(`${dbField} = ?`);
      values.push(encryptedUpdates[field] || updates[field]);
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
    return errorResponse('Update failed', 500, corsHeaders);
  }
  
  // Fetch and decrypt updated debt
  const { results: updated } = await env.DB.prepare(
    'SELECT * FROM debts WHERE id = ? AND user_id = ?'
  ).bind(debt_id, user_id).all();
  
  const decryptedDebt = await encryption.decryptDebtFromStorage(updated[0]);
  
  return new Response(JSON.stringify({
    id: decryptedDebt.id,
    user_id: decryptedDebt.user_id,
    name: decryptedDebt.name,
    amount: decryptedDebt.amount,
    apr: decryptedDebt.apr,
    min_payment: decryptedDebt.min_payment,
    order_index: decryptedDebt.order_index,
    limit: decryptedDebt.limit,
    original_amount: decryptedDebt.original_amount,
    debt_type: decryptedDebt.debt_type,
    created_at: decryptedDebt.created_at,
    updated_at: decryptedDebt.updated_at
  }), {
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

function errorResponse(message, status, corsHeaders) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: corsHeaders
  });
}