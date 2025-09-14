import { renderHook } from "@testing-library/react";
import { usePlanTotals } from "../usePlanTotals";

describe('usePlanTotals', () => {
 test('sums amount_pennies and exposes GBP', () => {
  const debts = [
   { amount_pennies: 260000, min_payment_pennies: 5000, apr: 1999 },
   { amount_pennies: 850000, min_payment_pennies: 10000, apr: 2499 }
  ];
  const { result } = renderHook(() => usePlanTotals(debts));
  
  expect(result.current.totalCents).toBe(1110000);
  expect(result.current.totalGBP).toBe(11100);
  expect(result.current.minPaymentCents).toBe(15000);
  expect(result.current.minPaymentGBP).toBe(150);
  expect(result.current.count).toBe(2);
  expect(result.current.loading).toBe(false);
 });

 test('handles legacy GBP format', () => {
  const debts = [
   { balance: 2600, minPayment: 50, interestRate: 19.99 },
   { balance: 8500, minPayment: 100, interestRate: 24.99 }
  ];
  const { result } = renderHook(() => usePlanTotals(debts));
  
  expect(result.current.totalCents).toBe(1110000);
  expect(result.current.totalGBP).toBe(11100);
  expect(result.current.minPaymentGBP).toBe(150);
 });

 test('handles aggregate input', () => {
  const aggregate = {
   total_cents: 1500000,
   min_payment_pennies: 20000,
   weighted_apr: 2250
  };
  const { result } = renderHook(() => usePlanTotals(aggregate));
  
  expect(result.current.totalCents).toBe(1500000);
  expect(result.current.totalGBP).toBe(15000);
  expect(result.current.minPaymentGBP).toBe(200);
  expect(result.current.weightedAprBps).toBe(2250);
 });

 test('handles empty debts array', () => {
  const { result } = renderHook(() => usePlanTotals([]));
  
  expect(result.current.totalGBP).toBe(0);
  expect(result.current.minPaymentGBP).toBe(0);
  expect(result.current.count).toBe(0);
  expect(result.current.loading).toBe(false);
 });

 test('calculates weighted APR correctly', () => {
  const debts = [
   { amount_pennies: 100000, apr: 2000 }, // £1000 at 20%
   { amount_pennies: 200000, apr: 1500 } // £2000 at 15%
  ];
  const { result } = renderHook(() => usePlanTotals(debts));
  
  // Weighted APR = (20% * £1000 + 15% * £2000) / £3000 = 16.67%
  expect(result.current.weightedAprBps).toBe(1667);
 });
});