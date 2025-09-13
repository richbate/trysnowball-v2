/**
 * Test the actual simulator to see if it produces correct progression
 */
const fs = require('fs');

// Create test data
const testInput = {
  debts: [{
    id: 'test_debt',
    user_id: 'test_user',
    name: 'Test Credit Card',
    amount: 5000,
    apr: 22.9,
    min_payment: 150,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    buckets: [
      {
        id: 'test_bucket',
        name: 'Purchases',
        balance: 5000,
        apr: 22.9,
        payment_priority: 1,
        created_at: new Date().toISOString()
      }
    ]
  }],
  extra_per_month: 200
};

// Write test fixture
fs.writeFileSync('test-simulator.json', JSON.stringify(testInput, null, 2));
console.log('Created test fixture: test-simulator.json');
console.log('');
console.log('Run this test with:');
console.log('npm test -- --testNamePattern="manual simulator test"');