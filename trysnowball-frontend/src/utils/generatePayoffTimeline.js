/**
 * Generate a detailed month-by-month payoff timeline.
 * Each entry includes:
 * - month: Month number
 * - totalDebt: Remaining total debt after payments
 * - interestPaid: Interest paid that month
 * - principalPaid: Principal paid that month
 * - remainingDebts: Snapshot of all debts with balances
 *
 * @param {Array<{name: string, balance: number, rate: number, minPayment: number}>} debts
 * @param {number} totalPayment - Total monthly payment (minimum + extra)
 * @returns {Array} Timeline entries (up to 120 months)
 */
export const generatePayoffTimeline = (debts, totalPayment) => {
  // Sort by user-defined order first, then by balance as fallback
  const snowballDebts = JSON.parse(JSON.stringify(debts)).sort((a, b) => {
    const orderA = a.order || 999;
    const orderB = b.order || 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.balance - b.balance; // Fallback to balance if orders are equal
  });
  const totalDebt = snowballDebts.reduce((sum, d) => sum + d.balance, 0);
  const timeline = [];

  if (totalPayment >= totalDebt) {
    // Immediate payoff
    timeline.push({
      month: 1,
      totalDebt: 0,
      interestPaid: 0,
      principalPaid: totalDebt,
      remainingDebts: snowballDebts.map(d => ({ name: d.name, balance: 0 })),
    });
    return timeline;
  }

  for (let month = 1; month <= 120; month++) {
    let available = totalPayment;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    // Step 1: Apply interest + minimum payments
    for (let i = 0; i < snowballDebts.length; i++) {
      const debt = snowballDebts[i];
      if (debt.balance <= 0) continue;

      const interest = Math.round(debt.balance * (debt.rate / 12 / 100) * 100) / 100;
      debt.balance += interest;
      totalInterestPaid += interest;

      const minPayment = Math.min(debt.balance, debt.minPayment);
      debt.balance = Math.max(0, debt.balance - minPayment);
      totalPrincipalPaid += Math.max(minPayment - interest, 0);

      available -= minPayment;
    }

    available = Math.max(0, available);

    // Step 2: Apply extra to smallest debt
    if (available > 0) {
      for (let i = 0; i < snowballDebts.length; i++) {
        if (snowballDebts[i].balance > 0) {
          const extraPayment = Math.min(available, snowballDebts[i].balance);
          snowballDebts[i].balance = Math.max(0, snowballDebts[i].balance - extraPayment);
          totalPrincipalPaid += extraPayment;
          break;
        }
      }
    }

    const totalRemaining = snowballDebts.reduce((sum, d) => sum + d.balance, 0);

    timeline.push({
      month,
      totalDebt: Math.round(totalRemaining * 100) / 100,
      interestPaid: Math.round(totalInterestPaid * 100) / 100,
      principalPaid: Math.round(totalPrincipalPaid * 100) / 100,
      remainingDebts: snowballDebts.map(d => ({ name: d.name, balance: Math.round(d.balance * 100) / 100 })),
    });

    if (totalRemaining <= 1) break; // All debts cleared
  }

  return timeline;
};