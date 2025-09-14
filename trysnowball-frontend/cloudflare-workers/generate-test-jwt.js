// Generate a test JWT token for local development
// Run: node generate-test-jwt.js

const crypto = require('crypto');

const JWT_SECRET = 'dev-jwt-secret-for-local-testing-only';  // Same as .dev.vars

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Create test token
const payload = {
  sub: 'test-user-123',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
};

const token = createJWT(payload, JWT_SECRET);

console.log('Test JWT Token:');
console.log(token);
console.log('');
console.log('Use in curl commands:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8787/api/debts`);
console.log('');
console.log('Test user ID:', payload.sub);