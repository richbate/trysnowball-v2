/**
 * Debts CRUD API
 * GET /api/debts - Get all user debts
 * PUT /api/debts - Bulk update/create debts
 * POST /api/debts - Create single debt
 */

import jwt from '../../_lib/jwt.js';
import { corsHeaders, handleError } from '../../_lib/utils.js';

// GET /api/debts - Fetch all debts for authenticated user
export async function onRequestGet({ request, env }) {
  try {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Authenticate user
    const user = await jwt.getUserFromRequest(request, env);
    if (!user) {
      return handleError('Authentication required', 401);
    }

    // Query debts from D1
    const stmt = env.DB.prepare(
      'SELECT * FROM debts WHERE user_id = ? ORDER BY "order" ASC, created_at ASC'
    );
    const { results } = await stmt.bind(user.id).all();

    // Transform database results to frontend format
    const debts = results.map(row => ({
      id: row.id,
      name: row.name,
      amount: parseFloat(row.amount),
      balance: parseFloat(row.balance || row.amount),
      interest: parseFloat(row.interest_rate),
      interestRate: parseFloat(row.interest_rate),
      minPayment: parseFloat(row.min_payment),
      regularPayment: parseFloat(row.min_payment),
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return new Response(JSON.stringify(debts), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('GET debts error:', error);
    return handleError('Failed to fetch debts', 500);
  }
}

// PUT /api/debts - Bulk update/create debts (DebtSync)
export async function onRequestPut({ request, env }) {
  try {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Authenticate user
    const user = await jwt.getUserFromRequest(request, env);
    if (!user) {
      return handleError('Authentication required', 401);
    }

    const { debts } = await request.json();
    if (!Array.isArray(debts)) {
      return handleError('Debts must be an array', 400);
    }

    // Begin transaction for bulk update
    const results = [];
    
    for (const debt of debts) {
      // Upsert each debt
      const stmt = env.DB.prepare(`
        INSERT INTO debts (
          id, user_id, name, amount, balance, interest_rate, min_payment, "order", 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          amount = excluded.amount,
          balance = excluded.balance,
          interest_rate = excluded.interest_rate,
          min_payment = excluded.min_payment,
          "order" = excluded."order",
          updated_at = datetime('now')
      `);
      
      const result = await stmt.bind(
        debt.id,
        user.id,
        debt.name,
        debt.amount || debt.balance,
        debt.balance || debt.amount,
        debt.interest || debt.interestRate,
        debt.minPayment || debt.regularPayment,
        debt.order || null
      ).run();

      results.push(result);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      updated: results.length 
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('PUT debts error:', error);
    return handleError('Failed to update debts', 500);
  }
}

// POST /api/debts - Create single debt
export async function onRequestPost({ request, env }) {
  try {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Authenticate user
    const user = await jwt.getUserFromRequest(request, env);
    if (!user) {
      return handleError('Authentication required', 401);
    }

    const debt = await request.json();
    
    // Generate ID if not provided
    const debtId = debt.id || crypto.randomUUID();
    
    // Insert new debt
    const stmt = env.DB.prepare(`
      INSERT INTO debts (
        id, user_id, name, amount, balance, interest_rate, min_payment, "order",
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    await stmt.bind(
      debtId,
      user.id,
      debt.name,
      debt.amount || debt.balance,
      debt.balance || debt.amount,
      debt.interest || debt.interestRate,
      debt.minPayment || debt.regularPayment,
      debt.order || null
    ).run();

    // Return created debt
    const createdDebt = {
      id: debtId,
      name: debt.name,
      amount: debt.amount || debt.balance,
      balance: debt.balance || debt.amount,
      interest: debt.interest || debt.interestRate,
      interestRate: debt.interest || debt.interestRate,
      minPayment: debt.minPayment || debt.regularPayment,
      regularPayment: debt.minPayment || debt.regularPayment,
      order: debt.order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(createdDebt), {
      status: 201,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('POST debt error:', error);
    return handleError('Failed to create debt', 500);
  }
}

// Handle preflight requests
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}