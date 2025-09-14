const jwt = require('jsonwebtoken');

// SECURITY: Load from environment - NEVER hard-code secrets!
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ SECURITY ERROR: JWT_SECRET environment variable is required');
  console.error('Set it with: export JWT_SECRET="your-secret-here"');
  process.exit(1);
}
const now = Math.floor(Date.now() / 1000);

const token = jwt.sign({
  sub: 'dev-user-smoke-test',
  iss: 'trysnowball-auth',
  aud: 'trysnowball-debts', 
  iat: now,
  exp: now + 1800  // 30 minutes
}, JWT_SECRET);

console.log('Test JWT Token:');
console.log(token);
console.log('');
console.log('Use in curl:');
console.log(`curl -H "Authorization: Bearer ${token}" https://trysnowball.co.uk/api/debts`);
console.log('');
console.log('Expires in 5 minutes at:', new Date((now + 300) * 1000).toISOString());