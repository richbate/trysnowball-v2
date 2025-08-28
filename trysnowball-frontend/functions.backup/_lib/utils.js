// Helper utilities for Pages Functions

export const json = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getCookie = (request, name) => {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
};

export const sendWithSendgrid = async (env, email, loginUrl) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: 'Your TrySnowball login link',
      }],
      from: { email: env.SENDGRID_FROM || 'login@trysnowball.co.uk' },
      content: [{
        type: 'text/plain',
        value: `Your login link: ${loginUrl}\n\nThis link will expire in 7 days.`,
      }, {
        type: 'text/html',
        value: `<p>Your login link: <a href="${loginUrl}">Click here to log in</a></p><p>This link will expire in 7 days.</p>`,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`SendGrid error: ${response.status}`);
  }
};

// CORS headers for API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Standard error response helper
export const handleError = (message, status = 500) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};