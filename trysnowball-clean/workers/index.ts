/**
 * CP-5 API Worker - Main Router
 * Clean, transparent routing without frameworks
 */

import { error, cors } from './utils/json';

// Route handlers
import * as goals from './goals';
// Import other route handlers here as needed
// import * as auth from './auth';
// import * as debts from './debts';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight for all routes
    if (request.method === 'OPTIONS') {
      return cors();
    }

    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // CP-5 Goals API Routes
      if (path.startsWith('/api/v2/goals')) {
        return handleGoalsRoute(request, env, path);
      }
      
      // Health check
      if (path === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 404 for unknown routes
      return error(404, 'Route not found', { path });
      
    } catch (err: any) {
      console.error('Router error:', err);
      return error(500, 'Internal server error');
    }
  }
};

/**
 * Handle /api/v2/goals/* routes
 */
async function handleGoalsRoute(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method;
  
  // Extract goal ID from path if present
  // /api/v2/goals -> list goals
  // /api/v2/goals/123 -> specific goal operations
  const goalIdMatch = path.match(/^\/api\/v2\/goals\/([^\/]+)$/);
  const params = goalIdMatch ? { id: goalIdMatch[1] } : {};
  
  const context = { request, env, params };
  
  // Route to appropriate handler
  if (path === '/api/v2/goals') {
    // Collection routes
    switch (method) {
      case 'GET':
        return goals.onRequestGet(context);
      case 'POST':
        return goals.onRequestPost(context);
      case 'OPTIONS':
        return goals.onRequestOptions();
      default:
        return error(405, 'Method not allowed');
    }
  } else if (goalIdMatch) {
    // Individual goal routes
    switch (method) {
      case 'PATCH':
        return goals.onRequestPatch(context);
      case 'DELETE':
        return goals.onRequestDelete(context);
      case 'OPTIONS':
        return goals.onRequestOptions();
      default:
        return error(405, 'Method not allowed');
    }
  }
  
  return error(404, 'Route not found');
}