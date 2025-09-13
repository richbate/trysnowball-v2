const { simulateCompositeSnowballPlan } = require('./src/utils/compositeSimulatorV2.ts');

const debts = [{
  id: 'd1',
  user_id: 'test_user',
  name: 'Card A',
  amount: 3000,
  apr: 22.9,
  min_payment: 100,
  order_index: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  buckets: [
    { id: 'b1', name: 'Cash Advances', balance: 500, apr: 27.9, payment_priority: 1, created_at: new Date().toISOString() },
    { id: 'b2', name: 'Purchases', balance: 1000, apr: 22.9, payment_priority: 2, created_at: new Date().toISOString() },
    { id: 'b3', name: 'Balance Transfer', balance: 1500, apr: 0.0, payment_priority: 3, created_at: new Date().toISOString() }
  ]
}];

const result = simulateCompositeSnowballPlan(debts, 100);
const month1 = result.monthlySnapshots[0];

console.log('Month 1 buckets:');
console.log('b1:', month1.buckets.b1);
console.log('b2:', month1.buckets.b2);
console.log('b3:', month1.buckets.b3);

console.log('\nExpected:');
console.log('b1: interest: 11.63, payment: 111.63, principal: 100.00, balance: 400.00');
console.log('b2: interest: 19.08, payment: 69.08, principal: 50.00, balance: 950.00');
console.log('b3: interest: 0.00, payment: 19.29, principal: 19.29, balance: 1480.71');