import { expandExtraPerMonth, ExtraPlan } from "./extraPlan";
import { DebtEngine } from "../../utils/DebtEngine.js";

export function runSimulationWithPlan(inputDebts: any[], plan: ExtraPlan, monthsCap = 120) {
  const extraSeries = expandExtraPerMonth(plan, monthsCap);
  
  // Create engine instance
  const engine = new DebtEngine(inputDebts);
  
  // For now, we'll use a month-by-month simulation approach
  // This could be optimized later to modify the engine directly
  return generateTimelineWithVariableExtra(engine, extraSeries, monthsCap);
}

function generateTimelineWithVariableExtra(engine: any, extraSeries: number[], monthsCap: number) {
  const debts = JSON.parse(JSON.stringify(engine.debts));
  const totalMinPayments = debts.reduce((sum: number, debt: any) => sum + (debt.minPayment || 0), 0);
  const timeline = [];

  if (debts.length === 0) return timeline;

  for (let month = 1; month <= monthsCap; month++) {
    const extraThisMonth = extraSeries[month - 1] || 0;
    const totalPayment = totalMinPayments + extraThisMonth;
    let available = totalPayment;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let principalMin = 0;
    let principalExtra = 0;

    // Step 1: Apply interest + minimum payments
    for (let debt of debts) {
      if (debt.balance <= 0) {
        debt._startingBalance = 0;
        debt._interestThisMonth = 0;
        debt._minPaidThisMonth = 0;
        debt._extraPaidThisMonth = 0;
        continue;
      }

      debt._startingBalance = debt.balance;
      debt._interestThisMonth = 0;
      debt._minPaidThisMonth = 0;
      debt._extraPaidThisMonth = 0;

      const monthlyRate = (debt.rate || debt.interest || 0) / 12 / 100;
      const interest = Math.round((debt.balance * monthlyRate) * 100) / 100;
      debt.balance = Math.round((debt.balance + interest) * 100) / 100;
      totalInterestPaid += interest;
      debt._interestThisMonth = interest;

      const minPayment = Math.min(debt.balance, debt.minPayment || 0);
      debt.balance = Math.round(Math.max(0, debt.balance - minPayment) * 100) / 100;
      const minPrincipal = Math.round(Math.max(minPayment - interest, 0) * 100) / 100;
      totalPrincipalPaid += minPrincipal;
      principalMin += minPrincipal;
      available = Math.round((available - minPayment) * 100) / 100;
      debt._minPaidThisMonth = minPayment;
    }

    available = Math.max(0, available);

    // Step 2: Apply extra to priority debts
    while (available > 0) {
      const next = debts.find((d: any) => d.balance > 0);
      if (!next) break;
      const extra = Math.min(available, next.balance);
      next.balance = Math.round((next.balance - extra) * 100) / 100;
      totalPrincipalPaid += extra;
      principalExtra += extra;
      available = Math.round((available - extra) * 100) / 100;
      next._extraPaidThisMonth = Math.round(((next._extraPaidThisMonth || 0) + extra) * 100) / 100;
    }

    const totalRemaining = debts.reduce((sum: number, d: any) => sum + d.balance, 0);
    const focusDebt = debts.find((d: any) => d.balance > 0);

    timeline.push({
      month,
      totalDebt: Math.round(totalRemaining * 100) / 100,
      interestPaid: Math.round(totalInterestPaid * 100) / 100,
      principalPaid: Math.round(totalPrincipalPaid * 100) / 100,
      principalMin: Math.round(principalMin * 100) / 100,
      principalExtra: Math.round(principalExtra * 100) / 100,
      focus: focusDebt?.name || null,
      totals: {
        payment: Math.round((totalInterestPaid + totalPrincipalPaid) * 100) / 100,
        interest: Math.round(totalInterestPaid * 100) / 100,
        principal: Math.round(totalPrincipalPaid * 100) / 100,
        balanceEnd: Math.round(totalRemaining * 100) / 100
      },
      items: debts.map((d: any) => ({
        id: d.id || d.name,
        name: d.name,
        open: Math.round((d._startingBalance || d.balance) * 100) / 100,
        interest: Math.round((d._interestThisMonth || 0) * 100) / 100,
        minPaid: Math.round((d._minPaidThisMonth || 0) * 100) / 100,
        extraPaid: Math.round((d._extraPaidThisMonth || 0) * 100) / 100,
        close: Math.round(d.balance * 100) / 100
      })),
      remainingDebts: debts.map((d: any) => ({ 
        name: d.name, 
        balance: Math.round(d.balance * 100) / 100
      })),
    });

    if (Math.round(totalRemaining * 100) / 100 <= 0.01) break; // All debts cleared
  }

  return timeline;
}