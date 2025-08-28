/**
 * Individual Debt Operations
 * GET /api/debts/[id] - Get single debt
 * PUT /api/debts/[id] - Update single debt  
 * DELETE /api/debts/[id] - Delete single debt
 */

import jwt from '../../_lib/jwt.js';
import { corsHeaders, handleError } from '../../_lib/utils.js';

// GET /api/debts/[id] - Get single debt
export async function onRequestGet({ request, env, params }) {
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

    const debtId = params.id;
    
    // Query specific debt
    const stmt = env.DB.prepare(
      'SELECT * FROM debts WHERE id = ? AND user_id = ?'
    );
    const debt = await stmt.bind(debtId, user.id).first();

    if (!debt) {
      return handleError('Debt not found', 404);
    }

    // Transform to frontend format
    const debtData = {
      id: debt.id,
      name: debt.name,
      amount: parseFloat(debt.amount),
      balance: parseFloat(debt.balance || debt.amount),
      interest: parseFloat(debt.interest_rate),
      interestRate: parseFloat(debt.interest_rate),
      minPayment: parseFloat(debt.min_payment),
      regularPayment: parseFloat(debt.min_payment),
      order: debt.order,
      createdAt: debt.created_at,
      updatedAt: debt.updated_at
    };

    return new Response(JSON.stringify(debtData), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('GET single debt error:', error);
    return handleError('Failed to fetch debt', 500);
  }
}

// PUT /api/debts/[id] - Update single debt
export async function onRequestPut({ request, env, params }) {
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

    const debtId = params.id;
    const updates = await request.json();
    
    // Update debt
    const stmt = env.DB.prepare(`
      UPDATE debts 
      SET name = ?, amount = ?, balance = ?, interest_rate = ?, 
          min_payment = ?, "order" = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(
      updates.name,
      updates.amount || updates.balance,
      updates.balance || updates.amount,
      updates.interest || updates.interestRate,
      updates.minPayment || updates.regularPayment,
      updates.order || null,
      debtId,
      user.id
    ).run();

    if (result.changes === 0) {
      return handleError('Debt not found', 404);
    }

    // Return updated debt
    const updatedDebt = {
      id: debtId,
      name: updates.name,
      amount: updates.amount || updates.balance,
      balance: updates.balance || updates.amount,
      interest: updates.interest || updates.interestRate,
      interestRate: updates.interest || updates.interestRate,
      minPayment: updates.minPayment || updates.regularPayment,
      regularPayment: updates.minPayment || updates.regularPayment,
      order: updates.order,
      updatedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(updatedDebt), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('PUT single debt error:', error);
    return handleError('Failed to update debt', 500);
  }
}

// DELETE /api/debts/[id] - Delete single debt
export async function onRequestDelete({ request, env, params }) {
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

    const debtId = params.id;
    
    // Delete debt
    const stmt = env.DB.prepare(
      'DELETE FROM debts WHERE id = ? AND user_id = ?'
    );
    const result = await stmt.bind(debtId, user.id).run();

    if (result.changes === 0) {
      return handleError('Debt not found', 404);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      deleted: debtId 
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('DELETE debt error:', error);
    return handleError('Failed to delete debt', 500);
  }
}

// Handle preflight requests
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}