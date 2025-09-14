/**
 * Debt Totals Selectors
 * Minimal, robust totals with new-and-legacy field support.
 */

const asCents = (v) => Math.round((Number(v || 0)) * 100);

const getBalanceCents = (d) =>
 typeof d.amount_pennies === 'number' ? d.amount_pennies : asCents(d.balance);

const getMinPayCents = (d) =>
 typeof d.min_payment_pennies === 'number' ? d.min_payment_pennies : asCents(d.minPayment);

const getAprBps = (d) => {
 if (typeof d.apr === 'number') return d.apr;
 const apr = Number(d.apr ?? d.interestRate ?? 0); // legacy
 return Math.round(apr * 100);
};

export function computeDebtTotals(debts = []) {
 let totalBalanceCents = 0;
 let totalMinPaymentCents = 0;
 let weightedAprNumerator = 0;

 for (const d of debts) {
  const bal = getBalanceCents(d);
  const min = getMinPayCents(d);
  const aprBps = getAprBps(d);
  totalBalanceCents += bal;
  totalMinPaymentCents += min;
  weightedAprNumerator += aprBps * bal;
 }

 const weightedAprBps =
  totalBalanceCents > 0 ? Math.round(weightedAprNumerator / totalBalanceCents) : 0;

 return {
  totalBalanceCents,
  totalMinPaymentCents,
  weightedAprBps,
 };
}

export function calculateDebtTotals(debts) {
 if (!debts || debts.length === 0) {
  return {
   totalBalance: 0,
   totalMinPayment: 0,
   averageInterestRate: 0,
   highestRate: 0,
   lowestRate: 0,
   debtCount: 0
  };
 }

 const totalBalance = debts.reduce((sum, debt) => {
  return sum + ((debt.amount_pennies || debt.balance || 0) / 100);
 }, 0);

 const totalMinPayment = debts.reduce((sum, debt) => {
  return sum + ((debt.min_payment_pennies || debt.minPayment || 0) / 100);
 }, 0);

 const rates = debts.map(debt => (debt.apr || debt.interestRate || 0) / 100);
 const averageInterestRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
 const highestRate = Math.max(...rates);
 const lowestRate = Math.min(...rates);

 return {
  totalBalance,
  totalMinPayment,
  averageInterestRate,
  highestRate,
  lowestRate,
  debtCount: debts.length
 };
}

export function calculateNetWorth(debts, assets = []) {
 const totalDebt = calculateDebtTotals(debts).totalBalance;
 const totalAssets = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
 
 return {
  totalAssets,
  totalDebt,
  netWorth: totalAssets - totalDebt
 };
}

export function debtToIncomeRatio(debts, monthlyIncome) {
 if (!monthlyIncome || monthlyIncome <= 0) return null;
 
 const totals = calculateDebtTotals(debts);
 return (totals.totalMinPayment / monthlyIncome) * 100;
}

export function getDebtBreakdown(debts) {
 if (!debts || debts.length === 0) return [];
 
 const totals = calculateDebtTotals(debts);
 
 return debts.map(debt => {
  const balance = (debt.amount_pennies || debt.balance || 0) / 100;
  const percentage = totals.totalBalance > 0 ? (balance / totals.totalBalance) * 100 : 0;
  
  return {
   id: debt.id,
   name: debt.name || 'Unknown',
   balance,
   percentage: percentage.toFixed(1),
   rate: (debt.apr || debt.interestRate || 0) / 100
  };
 });
}