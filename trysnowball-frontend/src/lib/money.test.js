/**
 * Money utilities unit tests
 * Ensures round-trip conversion accuracy and prevents 10x bugs
 */

import { fromPence, toPence, fromCents, toCents, fromBps, toBps } from './money';

describe('Money utilities', () => {
 describe('fromPence/toPence round-trip', () => {
  test('converts common debt amounts correctly', () => {
   const testCases = [
    { pounds: 0, pence: 0 },
    { pounds: 12.34, pence: 1234 },
    { pounds: 1000, pence: 100000 },
    { pounds: 12000, pence: 1200000 }, // Typical credit card balance
    { pounds: 0.01, pence: 1 }, // Minimum penny
    { pounds: 999999.99, pence: 99999999 }, // Max safe value
   ];

   testCases.forEach(({ pounds, pence }) => {
    // Test fromPence
    expect(fromPence(pence)).toBeCloseTo(pounds, 2);
    
    // Test toPence
    expect(toPence(pounds)).toBe(pence);
    
    // Test round-trip: pounds -> pence -> pounds
    expect(fromPence(toPence(pounds))).toBeCloseTo(pounds, 2);
    
    // Test round-trip: pence -> pounds -> pence
    expect(toPence(fromPence(pence))).toBe(pence);
   });
  });

  test('handles edge cases safely', () => {
   // Null/undefined should return 0
   expect(fromPence(null)).toBe(0);
   expect(fromPence(undefined)).toBe(0);
   expect(toPence(null)).toBe(0);
   expect(toPence(undefined)).toBe(0);
   
   // NaN should return 0
   expect(fromPence(NaN)).toBe(0);
   expect(toPence(NaN)).toBe(0);
   
   // Negative values should work
   expect(fromPence(-1234)).toBe(-12.34);
   expect(toPence(-12.34)).toBe(-1234);
   
   // String numbers should work
   expect(fromPence('1234')).toBe(12.34);
   expect(toPence('12.34')).toBe(1234);
  });

  test('prevents 10x display bugs', () => {
   const debtBalance = 1200000; // £12,000 in pence
   
   // Common mistake: showing pence as pounds
   expect(debtBalance).toBe(1200000); // This would show as £1,200,000 - WRONG!
   
   // Correct: convert to pounds first
   expect(fromPence(debtBalance)).toBe(12000); // Shows as £12,000 - CORRECT!
   
   // Verify the bug doesn't happen
   expect(fromPence(debtBalance)).not.toBe(debtBalance);
   expect(fromPence(debtBalance)).toBe(debtBalance / 100);
  });
 });

 describe('fromBps/toBps round-trip', () => {
  test('converts common APR rates correctly', () => {
   const testCases = [
    { percent: 0, bps: 0 },
    { percent: 5.5, bps: 550 },
    { percent: 19.99, bps: 1999 },
    { percent: 23.45, bps: 2345 },
    { percent: 100, bps: 10000 },
   ];

   testCases.forEach(({ percent, bps }) => {
    // Test fromBps
    expect(fromBps(bps)).toBeCloseTo(percent, 2);
    
    // Test toBps
    expect(toBps(percent)).toBe(bps);
    
    // Test round-trip accuracy
    expect(fromBps(toBps(percent))).toBeCloseTo(percent, 2);
    expect(toBps(fromBps(bps))).toBe(bps);
   });
  });

  test('handles APR edge cases safely', () => {
   // Null/undefined should return 0
   expect(fromBps(null)).toBe(0);
   expect(toBps(undefined)).toBe(0);
   
   // Very high APR (payday loans)
   expect(fromBps(40000)).toBe(400); // 400% APR
   expect(toBps(400)).toBe(40000);
   
   // Precision handling
   expect(fromBps(1999)).toBe(19.99);
   expect(toBps(19.99)).toBe(1999);
  });
 });

 describe('Real-world debt scenarios', () => {
  test('typical credit card debt conversion', () => {
   const debt = {
    name: 'Barclaycard',
    amount_pennies: 1200000, // £12,000
    apr: 2199, // 21.99%
    min_payment_pennies: 24000 // £240
   };

   // Convert for display
   expect(fromCents(debt.amount_pennies)).toBe(12000);
   expect(fromBps(debt.apr)).toBeCloseTo(21.99, 2);
   expect(fromCents(debt.min_payment_pennies)).toBe(240);

   // Verify we're not showing 10x amounts
   expect(fromCents(debt.amount_pennies)).not.toBe(120000); // Would be 10x bug
   expect(fromCents(debt.amount_pennies)).not.toBe(debt.amount_pennies); // Raw pence
  });

  test('payment calculations maintain precision', () => {
   const payment = 25050; // £250.50 in pence
   const balance = 1200000; // £12,000 in pence
   
   const newBalance = balance - payment;
   expect(newBalance).toBe(1174950); // £11,749.50 in pence
   
   // Display values should be correct
   expect(fromCents(payment)).toBe(250.50);
   expect(fromCents(balance)).toBe(12000);
   expect(fromCents(newBalance)).toBe(11749.50);
  });

  test('percentage calculations are safe', () => {
   const total = 50000; // £500 in pence
   const paid = 15000; // £150 in pence
   
   // Calculate percentage on cents (safe)
   const progressPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
   expect(progressPercent).toBe(30);
   
   // Alternative: calculate on pounds (also safe)
   const progressPercent2 = Math.round((fromCents(paid) / fromCents(total)) * 100);
   expect(progressPercent2).toBe(30);
   
   // Both methods should give same result
   expect(progressPercent).toBe(progressPercent2);
  });
 });
});