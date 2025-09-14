/**
 * Temporary script to insert test debt data
 * Run this in the browser console or import it
 */

import { localDebtStore } from './data/localDebtStore';

export async function insertTestDebts() {
 console.log('🏗️ Creating test debt portfolio...');
 
 const testDebts = [
  {
   id: crypto.randomUUID(),
   name: 'MBNA Credit Card',
   amount_pennies: 345000, // £3,450
   min_payment_pennies: 8500, // £85
   apr: 2199, // 21.99%
   limit_pennies: 500000, // £5,000 limit
   debt_type: 'credit_card',
   created_at: new Date(Date.now() - 90*24*3600*1000).toISOString(), // 3 months ago
  },
  {
   id: crypto.randomUUID(),
   name: 'Barclaycard',
   amount_pennies: 185000, // £1,850
   min_payment_pennies: 5500, // £55
   apr: 1899, // 18.99%
   limit_pennies: 300000, // £3,000 limit
   debt_type: 'credit_card',
   created_at: new Date(Date.now() - 60*24*3600*1000).toISOString(), // 2 months ago
  },
  {
   id: crypto.randomUUID(),
   name: 'Personal Loan',
   amount_pennies: 780000, // £7,800
   min_payment_pennies: 23500, // £235
   apr: 899, // 8.99%
   debt_type: 'loan',
   created_at: new Date(Date.now() - 180*24*3600*1000).toISOString(), // 6 months ago
  },
  {
   id: crypto.randomUUID(),
   name: 'Store Card',
   amount_pennies: 67500, // £675
   min_payment_pennies: 2500, // £25
   apr: 2799, // 27.99% (typical store card rate)
   limit_pennies: 100000, // £1,000 limit
   debt_type: 'credit_card',
   created_at: new Date(Date.now() - 30*24*3600*1000).toISOString(), // 1 month ago
  }
 ];
 
 for (const debt of testDebts) {
  await localDebtStore.upsertDebt(debt);
  console.log(`✅ Added ${debt.name}: £${debt.amount_pennies/100}`);
 }
 
 console.log('🎉 Test portfolio created! Total debt: £' + 
  (testDebts.reduce((sum, d) => sum + d.amount_pennies, 0) / 100).toLocaleString());
 console.log('📊 Credit utilisation will show properly with limits set');
 
 return testDebts;
}