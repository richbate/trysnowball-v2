// Email capture worker for maintenance page signups
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers for cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/waitlist - Add email to waitlist
    if (request.method === 'POST' && url.pathname === '/api/waitlist') {
      try {
        const body = await request.json();
        const email = body.email?.toLowerCase().trim();
        const source = body.source || 'maintenance_page';
        const headlineId = body.headline_id || null;
        const headlineText = body.headline_text || null;
        const buttonTextId = body.button_text_id || null;
        const buttonText = body.button_text || null;

        // Basic email validation
        if (!email || !email.includes('@') || email.length < 5) {
          return new Response(
            JSON.stringify({ error: 'Invalid email address' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Try to insert email (will fail silently if duplicate due to UNIQUE constraint)
        try {
          await env.DB.prepare(
            'INSERT INTO waitlist (email, created_at, source, headline_id, headline_text, button_text_id, button_text) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            email,
            new Date().toISOString(),
            source,
            headlineId,
            headlineText,
            buttonTextId,
            buttonText
          ).run();

          // Log to console for monitoring
          console.log(`New waitlist signup: ${email.split('@')[1]} domain`);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Thanks! We\'ll notify you when we launch.'
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } catch (dbError) {
          // Check if it's a duplicate email error
          if (dbError.message?.includes('UNIQUE')) {
            return new Response(
              JSON.stringify({
                success: true,
                message: 'You\'re already on the list!'
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
          throw dbError;
        }

      } catch (error) {
        console.error('Email capture error:', error);
        return new Response(
          JSON.stringify({ error: 'Server error. Please try again.' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // GET /api/waitlist/count - Get signup count (admin endpoint)
    if (request.method === 'GET' && url.pathname === '/api/waitlist/count') {
      try {
        const result = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM waitlist'
        ).first();

        return new Response(
          JSON.stringify({ count: result.count || 0 }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('Count error:', error);
        return new Response(
          JSON.stringify({ error: 'Could not get count' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // GET /api/waitlist/export - Export emails as CSV (admin endpoint)
    if (request.method === 'GET' && url.pathname === '/api/waitlist/export') {
      try {
        // Simple auth check - you should add proper authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.includes('Bearer')) {
          return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        const results = await env.DB.prepare(
          'SELECT email, created_at FROM waitlist ORDER BY created_at DESC'
        ).all();

        const csv = [
          'email,signup_date',
          ...results.results.map(row =>
            `${row.email},${row.created_at}`
          )
        ].join('\n');

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="waitlist-export.csv"'
          }
        });
      } catch (error) {
        console.error('Export error:', error);
        return new Response(
          JSON.stringify({ error: 'Export failed' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Default response for unmatched routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};