/**
 * CP-5 API Worker - Goals Endpoints
 * Clean goal persistence for CP-5 Goals & Challenges
 */

import { success, error, cors } from './utils/json';
import { requireAuth } from './utils/auth';

interface Goal {
  id: string;
  user_id: string;
  type: 'debt_clear' | 'interest_saved' | 'time_saved';
  target_value: number;
  current_value?: number;
  forecast_debt_id?: string;
  created_at: string;
  completed_at?: string;
  dismissed: number;
}

interface CreateGoalRequest {
  type: 'debt_clear' | 'interest_saved' | 'time_saved';
  target_value: number;
  forecast_debt_id?: string;
}

interface UpdateGoalRequest {
  current_value?: number;
  completed_at?: string;
  dismissed?: boolean;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return cors();
}

// GET /api/v2/goals - List all active goals for user
export async function onRequestGet({ request, env }: { request: Request; env: any }): Promise<Response> {
  try {
    const userId = await requireAuth(request, env);
    
    const stmt = env.DB.prepare(`
      SELECT * FROM goals 
      WHERE user_id = ? AND dismissed = 0
      ORDER BY created_at DESC
    `);
    
    const { results } = await stmt.bind(userId).all();
    
    return success(results);
  } catch (err: any) {
    if (err.message === 'Authentication required') {
      return error(401, 'Authentication required');
    }
    console.error('GET /goals error:', err);
    return error(500, 'Internal server error');
  }
}

// POST /api/v2/goals - Create new goal
export async function onRequestPost({ request, env }: { request: Request; env: any }): Promise<Response> {
  try {
    const userId = await requireAuth(request, env);
    
    let body: CreateGoalRequest;
    try {
      body = await request.json();
    } catch {
      return error(400, 'Invalid JSON in request body');
    }
    
    // Validate required fields
    if (!body.type || !body.target_value) {
      return error(400, 'Missing required fields: type, target_value');
    }
    
    // Validate goal type
    if (!['debt_clear', 'interest_saved', 'time_saved'].includes(body.type)) {
      return error(400, 'Invalid goal type');
    }
    
    if (typeof body.target_value !== 'number' || body.target_value <= 0) {
      return error(400, 'target_value must be a positive number');
    }
    
    // Generate unique ID and timestamp
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    
    const stmt = env.DB.prepare(`
      INSERT INTO goals (id, user_id, type, target_value, forecast_debt_id, created_at, current_value, dismissed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      id,
      userId,
      body.type,
      body.target_value,
      body.forecast_debt_id || null,
      created_at,
      0, // current_value starts at 0
      0  // dismissed = false
    ).run();
    
    return success({ id, created_at });
  } catch (err: any) {
    if (err.message === 'Authentication required') {
      return error(401, 'Authentication required');
    }
    console.error('POST /goals error:', err);
    return error(500, 'Internal server error');
  }
}

// PATCH /api/v2/goals/:id - Update goal progress or completion
export async function onRequestPatch({ request, env, params }: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const userId = await requireAuth(request, env);
    const goalId = params.id;
    
    if (!goalId) {
      return error(400, 'Goal ID is required');
    }
    
    let body: UpdateGoalRequest;
    try {
      body = await request.json();
    } catch {
      return error(400, 'Invalid JSON in request body');
    }
    
    // Check if goal exists and belongs to user
    const checkStmt = env.DB.prepare(`
      SELECT id FROM goals WHERE id = ? AND user_id = ?
    `);
    const existing = await checkStmt.bind(goalId, userId).first();
    
    if (!existing) {
      return error(404, 'Goal not found');
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (body.current_value !== undefined) {
      if (typeof body.current_value !== 'number' || body.current_value < 0) {
        return error(400, 'current_value must be a non-negative number');
      }
      updates.push('current_value = ?');
      values.push(body.current_value);
    }
    
    if (body.completed_at !== undefined) {
      updates.push('completed_at = ?');
      values.push(body.completed_at);
    }
    
    if (body.dismissed !== undefined) {
      updates.push('dismissed = ?');
      values.push(body.dismissed ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return error(400, 'No fields to update');
    }
    
    // Add WHERE conditions
    values.push(goalId, userId);
    
    const stmt = env.DB.prepare(`
      UPDATE goals 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(...values).run();
    
    if (result.changes === 0) {
      return error(404, 'Goal not found');
    }
    
    return success({ updated: true });
  } catch (err: any) {
    if (err.message === 'Authentication required') {
      return error(401, 'Authentication required');
    }
    console.error('PATCH /goals error:', err);
    return error(500, 'Internal server error');
  }
}

// DELETE /api/v2/goals/:id - Soft delete (dismiss) goal
export async function onRequestDelete({ request, env, params }: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const userId = await requireAuth(request, env);
    const goalId = params.id;
    
    if (!goalId) {
      return error(400, 'Goal ID is required');
    }
    
    const stmt = env.DB.prepare(`
      UPDATE goals 
      SET dismissed = 1
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(goalId, userId).run();
    
    if (result.changes === 0) {
      return error(404, 'Goal not found');
    }
    
    return success({ deleted: true });
  } catch (err: any) {
    if (err.message === 'Authentication required') {
      return error(401, 'Authentication required');
    }
    console.error('DELETE /goals error:', err);
    return error(500, 'Internal server error');
  }
}