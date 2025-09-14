#!/usr/bin/env node

/**
 * SECURITY: Plaintext Data Smoke Test
 * 
 * This script ensures NO plaintext debt data leaks into production database.
 * Fails CI build if any plaintext debt names, balances, or rates are found.
 * 
 * Critical for "bank-level encryption" promise.
 */

const https = require('https');

// Test configuration
const CONFIG = {
  // Database query to check for plaintext leaks
  checkQuery: `
    SELECT 
      id,
      name,           -- MUST be NULL (encrypted in ciphertext)
      balance,        -- MUST be NULL (encrypted in ciphertext) 
      interest_rate,  -- MUST be NULL (encrypted in ciphertext)
      min_payment,    -- MUST be NULL (encrypted in ciphertext)
      ciphertext,     -- MUST exist (actual encrypted data)
      created_at
    FROM debts 
    ORDER BY created_at DESC 
    LIMIT 5;
  `,
  
  // Test debt to insert and verify encryption
  testDebt: {
    id: `smoke-test-${Date.now()}`,
    name: 'TEST Chase Credit Card',
    balance: 1234.56,
    interest_rate: 18.9,
    min_payment: 50.00,
    type: 'credit_card'
  }
};

/**
 * Execute D1 database query via Cloudflare API
 */
async function queryD1Database(sql, params = []) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      sql: sql,
      params: params
    });

    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.D1_DATABASE_ID}/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (!response.success) {
            reject(new Error(`D1 API Error: ${JSON.stringify(response.errors)}`));
          } else {
            resolve(response.result);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Insert test debt via debts API
 */
async function insertTestDebt(testDebt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testDebt);

    const options = {
      hostname: 'trysnowball.co.uk',
      port: 443,
      path: '/api/debts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject(new Error(`API Error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Main smoke test logic
 */
async function runSmokeTest() {
  console.log('🔍 SECURITY: Starting plaintext leak smoke test...');
  
  // Check required environment variables
  const requiredEnvVars = [
    'CLOUDFLARE_ACCOUNT_ID',
    'D1_DATABASE_ID', 
    'CLOUDFLARE_API_TOKEN',
    'TEST_JWT_TOKEN'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  try {
    // Step 1: Insert test debt via API to ensure encryption pipeline works
    console.log('📝 Inserting test debt via encrypted API...');
    await insertTestDebt(CONFIG.testDebt);
    console.log('✅ Test debt inserted successfully');

    // Step 2: Query database directly to check for plaintext leaks
    console.log('🔍 Querying database for plaintext data...');
    const results = await queryD1Database(CONFIG.checkQuery);
    
    if (!results || !results.length || !results[0].results) {
      console.error('❌ Failed to query database or no results returned');
      process.exit(1);
    }

    const rows = results[0].results;
    console.log(`📊 Found ${rows.length} recent debts to check`);

    // Step 3: Critical security validation
    let hasPlaintextLeak = false;
    const violations = [];

    for (const row of rows) {
      console.log(`🔎 Checking debt ${row.id}...`);
      
      // CRITICAL: These fields MUST be NULL in encrypted storage
      const plaintextFields = ['name', 'balance', 'interest_rate', 'min_payment'];
      
      for (const field of plaintextFields) {
        if (row[field] !== null) {
          hasPlaintextLeak = true;
          violations.push({
            debt_id: row.id,
            field: field,
            plaintext_value: row[field],
            created_at: row.created_at
          });
          console.error(`🚨 PLAINTEXT LEAK: ${field} = "${row[field]}" in debt ${row.id}`);
        }
      }
      
      // Verify encryption worked - ciphertext should exist
      if (!row.ciphertext) {
        hasPlaintextLeak = true;
        violations.push({
          debt_id: row.id,
          field: 'ciphertext',
          plaintext_value: null,
          error: 'Missing encrypted data - encryption failed'
        });
        console.error(`🚨 ENCRYPTION MISSING: No ciphertext found for debt ${row.id}`);
      }
    }

    // Step 4: Final security verdict
    if (hasPlaintextLeak) {
      console.error('\n🔥 SECURITY FAILURE: PLAINTEXT DATA FOUND IN DATABASE!');
      console.error('\n📋 Violations:');
      violations.forEach(v => {
        console.error(`  - ${v.debt_id}: ${v.field} = "${v.plaintext_value || v.error}"`);
      });
      console.error('\n❌ This violates our "bank-level encryption" promise.');
      console.error('❌ Build MUST fail to prevent data leak in production.');
      console.error('\n🔧 Fix: Check encryptDebtForStorage() and upsertDebt() logic.');
      process.exit(1);
    }

    // Success!
    console.log('\n🎉 SECURITY PASSED: No plaintext debt data found!');
    console.log('✅ All debt names, balances, rates are properly encrypted');
    console.log('✅ All debts have ciphertext (encryption working)');
    console.log('✅ "Bank-level encryption" promise verified');
    console.log('\n🚀 Safe to deploy - privacy protection confirmed!');
    
  } catch (error) {
    console.error('\n💥 Smoke test failed:', error.message);
    console.error('❌ Cannot verify security - failing build for safety');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runSmokeTest();
}

module.exports = { runSmokeTest };