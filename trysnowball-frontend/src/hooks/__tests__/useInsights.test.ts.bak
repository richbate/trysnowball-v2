/**
 * Unit tests for useInsights hook
 */

import { renderHook } from '@testing-library/react';
import { useInsights } from '../useInsights';

describe('useInsights', () => {
 const mockDebts = [
  {
   id: '1',
   name: 'Credit Card',
   balance: 5000,
   minimumPayment: 150,
   rate: 18.9,
   type: 'credit_card'
  },
  {
   id: '2', 
   name: 'Personal Loan',
   balance: 10000,
   minimumPayment: 300,
   rate: 7.5,
   type: 'loan'
  },
  {
   id: '3',
   name: 'Store Card',
   balance: 450,
   minimumPayment: 25,
   rate: 24.9,
   type: 'credit_card'
  }
 ];

 it('returns empty array when no debts', () => {
  const { result } = renderHook(() => useInsights([], 0));
  expect(result.current).toEqual([]);
 });

 it('generates high interest warning when monthly interest > £50', () => {
  const { result } = renderHook(() => useInsights(mockDebts, 0));
  
  const interestWarning = result.current.find(i => i.type === 'interest_warning');
  expect(interestWarning).toBeDefined();
  expect(interestWarning?.title).toBe('High Interest Alert');
  expect(interestWarning?.priority).toBe(1);
 });

 it('generates payment boost achievement when extra payment > 0', () => {
  const { result } = renderHook(() => useInsights(mockDebts, 100));
  
  const boostInsight = result.current.find(i => i.id === 'payment_boost');
  expect(boostInsight).toBeDefined();
  expect(boostInsight?.type).toBe('achievement');
  expect(boostInsight?.body).toContain('£100/month');
 });

 it('suggests payment opportunity when no extra payment', () => {
  const { result } = renderHook(() => useInsights(mockDebts, 0));
  
  const opportunity = result.current.find(i => i.id === 'payment_opportunity');
  expect(opportunity).toBeDefined();
  expect(opportunity?.type).toBe('opportunity');
  expect(opportunity?.cta?.label).toBe('Add Boost');
 });

 it('identifies quick win for small debts under £500', () => {
  const { result } = renderHook(() => useInsights(mockDebts, 0));
  
  const quickWin = result.current.find(i => i.id === 'quick_win');
  expect(quickWin).toBeDefined();
  expect(quickWin?.body).toContain('Store Card');
  expect(quickWin?.body).toContain('£450');
 });

 it('detects credit card spending when balance increases', () => {
  const debtsWithHistory = [
   {
    ...mockDebts[0],
    history: [
     { date: '2024-02-01', balance: 5200, payment: 150 },
     { date: '2024-01-01', balance: 5000 }
    ]
   }
  ];
  
  const { result } = renderHook(() => useInsights(debtsWithHistory, 0));
  
  const spendingAlert = result.current.find(i => i.type === 'spending_alert');
  expect(spendingAlert).toBeDefined();
  expect(spendingAlert?.title).toContain('New spending');
 });

 it('celebrates payment streak with consistent payments', () => {
  const debtsWithStreak = mockDebts.map(debt => ({
   ...debt,
   history: [
    { date: '2024-03-01', balance: debt.amount_pennies - 100, payment: debt.minimumPayment },
    { date: '2024-02-01', balance: debt.amount_pennies - 50, payment: debt.minimumPayment },
    { date: '2024-01-01', balance: debt.amount_pennies, payment: debt.minimumPayment }
   ]
  }));
  
  const { result } = renderHook(() => useInsights(debtsWithStreak, 0));
  
  const streakInsight = result.current.find(i => i.id === 'payment_streak');
  expect(streakInsight).toBeDefined();
  expect(streakInsight?.type).toBe('achievement');
  expect(streakInsight?.body).toContain('3-Month Payment Streak');
 });

 it('sorts insights by priority', () => {
  const { result } = renderHook(() => useInsights(mockDebts, 50));
  
  // Check that insights are sorted by priority
  for (let i = 1; i < result.current.length; i++) {
   expect(result.current[i].priority).toBeGreaterThanOrEqual(
    result.current[i - 1].priority
   );
  }
 });

 it('includes CTA actions for actionable insights', () => {
  const { result } = renderHook(() => useInsights(mockDebts, 0));
  
  const actionableInsights = result.current.filter(i => i.cta);
  actionableInsights.forEach(insight => {
   expect(insight.cta?.label).toBeTruthy();
   expect(insight.cta?.action).toBeTruthy();
   expect(insight.cta?.action).toMatch(/^navigate:/);
  });
 });

 it('calculates percentage above minimum correctly', () => {
  const totalMinimums = mockDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const extraPayment = 100;
  
  const { result } = renderHook(() => useInsights(mockDebts, extraPayment));
  
  const boostInsight = result.current.find(i => i.id === 'payment_boost');
  const expectedPercentage = Math.round((extraPayment / totalMinimums) * 100);
  
  expect(boostInsight?.data?.percentageAboveMinimum).toBe(expectedPercentage);
  expect(boostInsight?.body).toContain(`${expectedPercentage}%`);
 });
});