/**
 * Billing Data Verification Script
 * Validates database state and test user configurations
 */

console.log('🔍 Verifying billing system database state...');

const testQueries = [
  {
    name: 'Check beta_access column exists',
    sql: "PRAGMA table_info(users);"
  },
  {
    name: 'Check stripe_events table exists',
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='stripe_events';"
  },
  {
    name: 'Count users by billing status',
    sql: `SELECT 
      SUM(CASE WHEN beta_access = 1 THEN 1 ELSE 0 END) as beta_users,
      SUM(CASE WHEN is_pro = 1 AND beta_access = 0 THEN 1 ELSE 0 END) as stripe_users,
      SUM(CASE WHEN is_pro = 0 AND beta_access = 0 THEN 1 ELSE 0 END) as free_users,
      COUNT(*) as total_users
    FROM users;`
  },
  {
    name: 'Test users for manual verification',
    sql: `SELECT email, is_pro, beta_access,
      CASE 
        WHEN beta_access = 1 THEN 'beta'
        WHEN is_pro = 1 THEN 'stripe' 
        ELSE 'none' 
      END as expected_source,
      CASE 
        WHEN beta_access = 1 OR is_pro = 1 THEN 'true'
        ELSE 'false'
      END as expected_is_paid
    FROM users 
    WHERE email LIKE '%@trysnowball.local'
    ORDER BY email;`
  },
  {
    name: 'Recent Stripe events (should be empty for fresh install)',
    sql: "SELECT COUNT(*) as event_count FROM stripe_events;"
  }
];

// This would be run in the Cloudflare Workers CLI or testing environment
console.log('Run these queries with: npx wrangler d1 execute auth_db --remote --command="<query>"');
console.log('');

testQueries.forEach((query, index) => {
  console.log(`${index + 1}. ${query.name}`);
  console.log(`   ${query.sql}`);
  console.log('');
});

console.log('Expected results for test users:');
console.log('• demo@trysnowball.local → { is_paid: true, source: "stripe" }');
console.log('• test@trysnowball.local → { is_paid: true, source: "stripe" }');
console.log('• free@trysnowball.local → { is_paid: true, source: "beta" }');
console.log('');

console.log('Manual test commands:');
console.log('curl -i https://trysnowball.co.uk/auth/api/me/plan');
console.log('→ Should return 401 with cache-control: no-store');
console.log('');
console.log('// In browser console (while logged in):');
console.log('fetch("/auth/api/me/plan", { credentials: "include" })');
console.log('  .then(r => r.json()).then(console.log)');
console.log('→ Should return { is_paid: boolean, source: string }');

module.exports = { testQueries };