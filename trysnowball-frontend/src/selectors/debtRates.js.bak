/**
 * Debt Rates Selectors
 * Functions for analyzing debt interest rates
 */

export function getHighAprDebts(debts = [], threshold = 15) {
 return debts.filter(debt => {
  const aprPercent = (debt.apr || debt.interestRate || 0) / 100;
  return aprPercent >= threshold;
 });
}

export function getLowestRateDebt(debts = []) {
 if (debts.length === 0) return null;
 
 return debts.reduce((lowest, debt) => {
  const debtRate = (debt.apr || debt.interestRate || 0) / 100;
  const lowestRate = (lowest.apr || lowest.interestRate || 0) / 100;
  return debtRate < lowestRate ? debt : lowest;
 });
}

export function getHighestRateDebt(debts = []) {
 if (debts.length === 0) return null;
 
 return debts.reduce((highest, debt) => {
  const debtRate = (debt.apr || debt.interestRate || 0) / 100;
  const highestRate = (highest.apr || highest.interestRate || 0) / 100;
  return debtRate > highestRate ? debt : highest;
 });
}