// Chart Components - Unified exports for debt visualization
export { default as TrendChart } from './TrendChart';
export { default as SnowballChart } from './SnowballChart';
export { default as TimelineChart } from './TimelineChart';

// Chart utilities and helpers
export const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '£0';
  return '£' + Math.round(value).toLocaleString();
};

export const simulateSnowball = (debts, totalPayment) => {
  const snowballDebts = JSON.parse(JSON.stringify(debts)).sort((a, b) => a.balance - b.balance);
  
  for (let month = 1; month <= 120; month++) {
    let available = totalPayment;
    
    // Pay minimums first
    for (let i = 0; i < snowballDebts.length; i++) {
      const debt = snowballDebts[i];
      if (debt.balance <= 0) continue;
      const interest = debt.balance * (debt.rate / 12 / 100);
      const minPrincipal = Math.max(debt.minPayment - interest, 0);
      debt.balance = Math.max(0, debt.balance - minPrincipal);
      available -= debt.minPayment;
    }
    
    // Apply extra to smallest debt
    if (available > 0) {
      for (let i = 0; i < snowballDebts.length; i++) {
        const debt = snowballDebts[i];
        if (debt.balance > 0) {
          const payment = Math.min(available, debt.balance);
          debt.balance -= payment;
          break;
        }
      }
    }
    
    // Check if all debts are paid
    const totalRemaining = snowballDebts.reduce((sum, debt) => sum + debt.balance, 0);
    if (totalRemaining <= 1) return month;
  }
  
  return -1; // Not paid off within 120 months
};