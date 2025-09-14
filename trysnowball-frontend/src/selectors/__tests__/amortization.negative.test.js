/**
 * Negative Amortization Prevention Tests
 * Ensures interest is applied once and minimum payments prevent infinite growth
 */

import { calculateSnowballTimeline, calculateAvalancheTimeline } from '../amortization';

describe('Negative Amortization Prevention', () => {
 test('applies interest exactly once per month', () => {
  const debt = {
   id: 'test-1',
   name: 'Test Card',
   amount_pennies: 250000, // £2,500
   apr: 2000, // 20% APR
   min_payment_pennies: 1200 // £12 minimum
  };

  const result = calculateSnowballTimeline([debt], { extraPayment: 0, maxMonths: 3 });
  
  // Calculate expected interest for first month
  const monthlyRate = (2000 / 10000) / 12; // 0.0167
  const expectedInterest = Math.floor(250000 * monthlyRate); // ~4167 cents
  
  // First month interest should match expected
  expect(result.interestCentsByMonth[0]).toBeCloseTo(expectedInterest, -2);
  
  // Balance should decrease even with low minimum payment
  expect(result.balances[0]).toBeLessThan(250000 + expectedInterest);
 });

 test('prevents negative amortization when minimum < interest', () => {
  const debt = {
   id: 'bad-debt',
   name: 'High Interest Card',
   amount_pennies: 1000000, // £10,000
   apr: 3000, // 30% APR
   min_payment_pennies: 100 // £1 minimum (way too low!)
  };

  const result = calculateSnowballTimeline([debt], { extraPayment: 0, maxMonths: 12 });
  
  // Balance should never exceed a reasonable growth threshold
  const maxReasonableBalance = 1000000 * 2; // No more than 2x original
  
  result.balances.forEach((balance, month) => {
   expect(balance).toBeLessThanOrEqual(maxReasonableBalance);
   
   // After first few months, balance should be decreasing
   if (month > 3 && month < result.balances.length - 1) {
    expect(balance).toBeLessThanOrEqual(result.balances[month - 1]);
   }
  });
  
  // Should eventually pay off (not run forever)
  expect(result.months.length).toBeLessThan(600);
  expect(result.balances[result.balances.length - 1]).toBe(0);
 });

 test('correctly handles multiple debts with varying interest rates', () => {
  const debts = [
   {
    id: 'low-apr',
    name: 'Low APR Card',
    amount_pennies: 500000, // £5,000
    apr: 999, // 9.99% APR
    min_payment_pennies: 10000 // £100
   },
   {
    id: 'high-apr',
    name: 'High APR Card',
    amount_pennies: 200000, // £2,000
    apr: 2999, // 29.99% APR
    min_payment_pennies: 4000 // £40
   }
  ];

  const snowball = calculateSnowballTimeline(debts, { extraPayment: 100, maxMonths: 100 });
  const avalanche = calculateAvalancheTimeline(debts, { extraPayment: 100, maxMonths: 100 });
  
  // Both strategies should eventually pay off
  expect(snowball.balances[snowball.balances.length - 1]).toBe(0);
  expect(avalanche.balances[avalanche.balances.length - 1]).toBe(0);
  
  // Avalanche should pay less total interest (mathematically optimal)
  expect(avalanche.totalInterestCents).toBeLessThanOrEqual(snowball.totalInterestCents);
  
  // Neither should have unreasonable balance growth
  const totalStartBalance = 700000;
  snowball.balances.forEach(balance => {
   expect(balance).toBeLessThanOrEqual(totalStartBalance * 1.5);
  });
  avalanche.balances.forEach(balance => {
   expect(balance).toBeLessThanOrEqual(totalStartBalance * 1.5);
  });
 });

 test('minimum payment adjustment prevents infinite loops', () => {
  const debt = {
   id: 'edge-case',
   name: 'Edge Case Debt',
   amount_pennies: 100000, // £1,000
   apr: 10000, // 100% APR (extreme case)
   min_payment_pennies: 100 // £1 minimum
  };

  const result = calculateSnowballTimeline([debt], { extraPayment: 0, maxMonths: 600 });
  
  // Should complete within max months (not infinite)
  expect(result.months.length).toBeLessThanOrEqual(600);
  
  // Final balance should be 0
  if (result.balances.length > 0) {
   expect(result.balances[result.balances.length - 1]).toBe(0);
  }
 });

 test('handles zero balance debts gracefully', () => {
  const debts = [
   {
    id: 'paid-off',
    name: 'Paid Off Card',
    amount_pennies: 0,
    apr: 1999,
    min_payment_pennies: 0
   },
   {
    id: 'active',
    name: 'Active Card',
    amount_pennies: 100000,
    apr: 1999,
    min_payment_pennies: 2000
   }
  ];

  const result = calculateSnowballTimeline(debts, { extraPayment: 50 });
  
  // Should only process active debt
  expect(result.months.length).toBeGreaterThan(0);
  expect(result.balances[result.balances.length - 1]).toBe(0);
 });
});