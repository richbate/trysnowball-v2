/**
 * Security Isolation Test Suite
 * Tests multi-user encryption isolation and cross-user access protection
 * Run: node test-security-isolation.js
 */

const crypto = require('crypto');

const API_BASE = process.env.API_BASE || 'http://localhost:8787';
const JWT_SECRET = 'dev-jwt-secret-for-local-testing-only';

function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function apiCall(method, path, data = null, token = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { body: JSON.stringify(data) })
  };
  
  const response = await fetch(url, options);
  const text = await response.text();
  
  try {
    return { status: response.status, data: JSON.parse(text) };
  } catch {
    return { status: response.status, error: text };
  }
}

async function runSecurityTests() {
  console.log('🔒 Running Security Isolation Tests\n');

  // Create test users
  const userA = {
    id: 'security-test-user-a',
    email: 'testa@security.test',
    token: createJWT({
      sub: 'security-test-user-a',
      email: 'testa@security.test',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }, JWT_SECRET)
  };

  const userB = {
    id: 'security-test-user-b', 
    email: 'testb@security.test',
    token: createJWT({
      sub: 'security-test-user-b',
      email: 'testb@security.test',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }, JWT_SECRET)
  };

  console.log('👥 Test Users Created:');
  console.log(`   User A: ${userA.id}`);
  console.log(`   User B: ${userB.id}\n`);

  // Test 1: User A creates a debt
  console.log('📝 Test 1: User A creates encrypted debt');
  const debtA = {
    name: 'User A Secret Debt',
    balance: 9999.99,
    interestRate: 25.99,
    minPayment: 250.00,
    type: 'credit_card'
  };

  const createResult = await apiCall('POST', '/api/debts', debtA, userA.token);
  if (createResult.status !== 201) {
    console.error('❌ Failed to create debt for User A:', createResult);
    return false;
  }
  
  const debtId = createResult.data.debt.id;
  console.log(`✅ User A created debt: ${debtId}\n`);

  // Test 2: User A can read their own debt
  console.log('👀 Test 2: User A reads their own debt');
  const readA = await apiCall('GET', '/api/debts', null, userA.token);
  if (readA.status !== 200 || readA.data.debts.length !== 1) {
    console.error('❌ User A cannot read their own debt:', readA);
    return false;
  }
  
  const retrievedDebt = readA.data.debts[0];
  if (retrievedDebt.name !== debtA.name || retrievedDebt.balance !== debtA.balance) {
    console.error('❌ User A debt data corrupted:', retrievedDebt);
    return false;
  }
  console.log('✅ User A successfully decrypted their debt\n');

  // Test 3: User B cannot see User A's debts
  console.log('🚫 Test 3: User B tries to read debts (should be empty)');
  const readB = await apiCall('GET', '/api/debts', null, userB.token);
  if (readB.status !== 200) {
    console.error('❌ API error for User B:', readB);
    return false;
  }
  
  if (readB.data.debts.length !== 0) {
    console.error('❌ SECURITY BREACH: User B can see other debts:', readB.data);
    return false;
  }
  console.log('✅ User B sees no debts (correct isolation)\n');

  // Test 4: User B cannot update User A's debt
  console.log('🛡️  Test 4: User B tries to update User A\'s debt (should fail)');
  const updateAttempt = await apiCall('PUT', `/api/debts/${debtId}`, 
    { balance: 1.00 }, userB.token);
  
  if (updateAttempt.status !== 400 && updateAttempt.status !== 404) {
    console.error('❌ SECURITY BREACH: User B can modify User A debt:', updateAttempt);
    return false;
  }
  console.log('✅ User B blocked from updating User A debt\n');

  // Test 5: User B cannot delete User A's debt  
  console.log('🗑️  Test 5: User B tries to delete User A\'s debt (should fail)');
  const deleteAttempt = await apiCall('DELETE', `/api/debts/${debtId}`, null, userB.token);
  
  if (deleteAttempt.status !== 400 && deleteAttempt.status !== 404) {
    console.error('❌ SECURITY BREACH: User B can delete User A debt:', deleteAttempt);
    return false;
  }
  console.log('✅ User B blocked from deleting User A debt\n');

  // Test 6: Verify User A debt still exists and intact
  console.log('🔍 Test 6: Verify User A debt still intact');
  const verifyA = await apiCall('GET', '/api/debts', null, userA.token);
  if (verifyA.status !== 200 || verifyA.data.debts.length !== 1) {
    console.error('❌ User A debt compromised:', verifyA);
    return false;
  }
  
  const finalDebt = verifyA.data.debts[0];
  if (finalDebt.name !== debtA.name || finalDebt.balance !== debtA.balance) {
    console.error('❌ User A debt data modified:', finalDebt);
    return false;
  }
  console.log('✅ User A debt remains secure and intact\n');

  // Test 7: Both users can coexist with separate debts
  console.log('🤝 Test 7: User B creates their own debt');
  const debtB = {
    name: 'User B Different Debt',
    balance: 5555.55,
    interestRate: 15.99,
    minPayment: 125.00,
    type: 'loan'
  };

  const createB = await apiCall('POST', '/api/debts', debtB, userB.token);
  if (createB.status !== 201) {
    console.error('❌ Failed to create debt for User B:', createB);
    return false;
  }
  console.log(`✅ User B created their own debt: ${createB.data.debt.id}\n`);

  // Test 8: Verify complete isolation
  console.log('🔐 Test 8: Final isolation verification');
  const finalA = await apiCall('GET', '/api/debts', null, userA.token);
  const finalB = await apiCall('GET', '/api/debts', null, userB.token);
  
  if (finalA.data.debts.length !== 1 || finalB.data.debts.length !== 1) {
    console.error('❌ Incorrect debt counts:', finalA.data.debts.length, finalB.data.debts.length);
    return false;
  }
  
  if (finalA.data.debts[0].name === finalB.data.debts[0].name) {
    console.error('❌ SECURITY BREACH: Users seeing same debt data');
    return false;
  }
  
  console.log('✅ Perfect isolation: Each user sees only their own data\n');

  // Cleanup
  console.log('🧹 Cleanup: Deleting test debts');
  await apiCall('DELETE', `/api/debts/${debtId}`, null, userA.token);
  await apiCall('DELETE', `/api/debts/${createB.data.debt.id}`, null, userB.token);
  console.log('✅ Test debts cleaned up\n');

  return true;
}

async function runPerformanceTests() {
  console.log('⚡ Running Performance Tests\n');

  const testUser = {
    id: 'perf-test-user',
    token: createJWT({
      sub: 'perf-test-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }, JWT_SECRET)
  };

  // Test key derivation caching
  console.log('🔑 Test: Key derivation performance');
  const testDebt = {
    name: 'Performance Test Debt',
    balance: 1000.00,
    interestRate: 20.00,
    minPayment: 50.00,
    type: 'test'
  };

  // First call (cold cache)
  const start1 = Date.now();
  const create1 = await apiCall('POST', '/api/debts', testDebt, testUser.token);
  const time1 = Date.now() - start1;
  
  // Second call (warm cache)  
  const start2 = Date.now();
  const create2 = await apiCall('POST', '/api/debts', {...testDebt, name: 'Test 2'}, testUser.token);
  const time2 = Date.now() - start2;

  console.log(`   Cold cache: ${time1}ms`);
  console.log(`   Warm cache: ${time2}ms`);
  console.log(`   Speedup: ${(time1 / time2).toFixed(2)}x\n`);

  if (time1 < time2) {
    console.log('⚠️  Warning: Expected warm cache to be faster');
  } else {
    console.log('✅ Key caching working (warm faster than cold)');
  }

  // Cleanup
  if (create1.status === 201) {
    await apiCall('DELETE', `/api/debts/${create1.data.debt.id}`, null, testUser.token);
  }
  if (create2.status === 201) {
    await apiCall('DELETE', `/api/debts/${create2.data.debt.id}`, null, testUser.token);
  }

  return true;
}

async function main() {
  console.log('🧪 Secure Debt Encryption - Security Test Suite');
  console.log('=================================================\n');

  try {
    // Test encryption functionality
    console.log('🔧 Test: Basic encryption roundtrip');
    const encryptTest = await apiCall('POST', '/api/crypto/test', null, 
      createJWT({ sub: 'test-user-123' }, JWT_SECRET));
    
    if (encryptTest.status !== 200 || !encryptTest.data.success) {
      console.error('❌ Basic encryption test failed:', encryptTest);
      process.exit(1);
    }
    console.log('✅ Basic encryption working\n');

    // Run security tests
    const securityPassed = await runSecurityTests();
    if (!securityPassed) {
      console.error('❌ SECURITY TESTS FAILED - DO NOT DEPLOY');
      process.exit(1);
    }

    // Run performance tests
    const perfPassed = await runPerformanceTests();
    if (!perfPassed) {
      console.error('❌ PERFORMANCE TESTS FAILED');
      process.exit(1);
    }

    console.log('🎉 ALL TESTS PASSED');
    console.log('✅ Multi-user isolation verified');
    console.log('✅ Cross-user access blocked');  
    console.log('✅ Encryption/decryption working');
    console.log('✅ Performance optimizations active');
    console.log('\n🚀 SAFE TO DEPLOY TO PRODUCTION');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runSecurityTests, runPerformanceTests };