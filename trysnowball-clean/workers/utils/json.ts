/**
 * CP-5 API Worker - JSON Response Helpers
 * Clean response utilities for consistent API responses
 */

export function json(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export function success(data: any): Response {
  return json({ status: 'ok', data });
}

export function error(status: number, message: string, details?: any): Response {
  return json({ 
    status: 'error', 
    message,
    ...(details && { details })
  }, status);
}

export function cors(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}