// Health endpoint for Worker monitoring
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/health' && request.method === 'GET') {
      const response = {
        ok: true,
        timestamp: new Date().toISOString(),
        commit: env.COMMIT_SHA || 'unknown',
        service: 'trysnowball-auth-worker',
        uptime: Date.now(),
      };
      
      return new Response(JSON.stringify(response, null, 2), {
        headers: { 
          'content-type': 'application/json',
          'cache-control': 'no-cache',
          'access-control-allow-origin': '*',
        },
      });
    }
    
    // Fall back to main worker logic
    return new Response('Not found', { status: 404 });
  }
};