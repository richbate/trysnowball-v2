/**
 * GET /api/me
 * Returns current user from session cookie or null
 * Safe fallback: always returns 200 with user:null if no auth
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    // Extract session cookie
    const cookieString = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieString.split('; ').map(c => {
        const [key, ...val] = c.split('=');
        return [key, val.join('=')];
      })
    );
    
    const sessionToken = cookies['ts_session'];
    
    if (!sessionToken) {
      // No session = not logged in (this is OK, not an error)
      return Response.json({ user: null });
    }
    
    // In production, validate session token against D1
    // For now, decode JWT or lookup session in D1
    // This is a minimal implementation - expand as needed
    
    // Mock implementation - replace with real D1 lookup
    if (sessionToken === 'demo-token') {
      return Response.json({
        user: {
          id: 'demo-user',
          email: 'demo@trysnowball.local',
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // TODO: Real implementation would:
    // 1. Decode JWT or lookup session in D1
    // 2. Check expiry
    // 3. Return user data
    
    return Response.json({ user: null });
    
  } catch (error) {
    // On any error, safe fallback to unauthenticated
    console.error('[/api/me] Error:', error);
    return Response.json({ user: null });
  }
}

// OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}