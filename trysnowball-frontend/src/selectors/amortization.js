/**
 * Amortization Selectors
 * Minimal, dependency-free amortization to satisfy ForecastTab imports.
 */

const cents = (n) => Math.max(0, Math.round(n));
const pctFromBps = (bps) => (Number(bps || 0) / 100) / 100; // e.g. 1999 bps -> 0.1999

const getBalancePence = (d) =>
 typeof d.amount_pennies === 'number' ? d.amount_pennies : Math.round(Number(d.balance || 0) * 100);

const getMinPayPence = (d) =>
 typeof d.min_payment_pennies === 'number'
  ? d.min_payment_pennies
  : Math.round(Number(d.minPayment || 0) * 100);

const getAprMonthly = (d) => {
 let bps;
 if (typeof d.apr === 'number') bps = d.apr;
 else {
  const apr = Number(d.apr ?? d.interestRate ?? 0); // legacy %
  bps = Math.round(apr * 100);
 }
 const yearly = pctFromBps(bps);      // decimal, e.g. 0.1999
 return yearly / 12;            // naive monthly rate
};

function cloneDebts(raw) {
 return raw.map((d) => ({
  id: d.id ?? d.name ?? Math.random().toString(36).slice(2),
  balance: cents(getBalancePence(d)),
  min: cents(getMinPayPence(d)),
  r: getAprMonthly(d),
 }));
}

function orderIndices(debts, strategy) {
 const idx = debts.map((_, i) => i);
 if (strategy === 'snowball') {
  idx.sort((a, b) => debts[a].balance - debts[b].balance);
 } else {
  // avalanche
  idx.sort((a, b) => debts[b].r - debts[a].r);
 }
 return idx;
}

function monthStep(state, order, extraCents) {
 // 1) accrue interest
 let interestThisMonth = 0;
 const interestByDebt = new Map();
 
 for (const d of state) {
  if (d.balance <= 0) continue;
  const interest = Math.floor(d.balance * d.r);
  d.balance = cents(d.balance + interest);
  interestThisMonth += interest;
  interestByDebt.set(d.id, interest);
 }

 // 2) pay minimums (ensure we at least cover interest to prevent infinite growth)
 let remaining = extraCents;
 for (const d of state) {
  if (d.balance <= 0) continue;
  // Ensure minimum payment covers at least the interest that was just added
  const interestAdded = interestByDebt.get(d.id) || 0;
  const effectiveMin = Math.max(d.min, interestAdded + 1); // At least interest + $0.01
  const pay = Math.min(effectiveMin, d.balance);
  d.balance = cents(d.balance - pay);
 }

 // 3) apply snowball extra to target ordering
 for (const i of order) {
  const d = state[i];
  if (remaining <= 0) break;
  if (d.balance <= 0) continue;
  const pay = Math.min(remaining, d.balance);
  d.balance = cents(d.balance - pay);
  remaining -= pay;
 }

 const totalBalance = state.reduce((s, d) => s + d.balance, 0);
 return { interestThisMonth, totalBalance };
}

function simulate(rawDebts, { strategy, extraPaymentCents = 0, maxMonths = 600 } = {}) {
 const debts = cloneDebts(rawDebts).filter((d) => d.balance > 0);
 if (debts.length === 0) {
  return { months: [], balances: [], interestCentsByMonth: [], totalInterestCents: 0 };
 }
 const order = orderIndices(debts, strategy);
 const months = [];
 const balances = [];
 const interestCentsByMonth = [];

 let totalInterestCents = 0;
 let month = 0;

 while (month < maxMonths) {
  const { interestThisMonth, totalBalance } = monthStep(debts, order, extraPaymentCents);
  months.push(month + 1);
  balances.push(totalBalance);
  interestCentsByMonth.push(interestThisMonth);
  totalInterestCents += interestThisMonth;
  month += 1;
  if (totalBalance === 0) break;
 }

 return { months, balances, interestCentsByMonth, totalInterestCents };
}

export function calculateSnowballTimeline(debts, opts = {}) {
 const extraCents =
  typeof opts.extraPaymentCents === 'number'
   ? opts.extraPaymentCents
   : Math.round(Number(opts.extraPayment || 0) * 100);
 return simulate(debts, { strategy: 'snowball', extraPaymentCents: extraCents, maxMonths: opts.maxMonths });
}

export function calculateAvalancheTimeline(debts, opts = {}) {
 const extraCents =
  typeof opts.extraPaymentCents === 'number'
   ? opts.extraPaymentCents
   : Math.round(Number(opts.extraPayment || 0) * 100);
 return simulate(debts, { strategy: 'avalanche', extraPaymentCents: extraCents, maxMonths: opts.maxMonths });
}

export function calculateAmortizationSchedule(debt, extraPayment = 0) {
 const balance = (debt.amount_pennies || debt.balance || 0) / 100;
 const rate = ((debt.apr || debt.interestRate || 0) / 100) / 12; // Monthly rate
 const minPayment = (debt.min_payment_pennies || debt.minPayment || 0) / 100;
 const totalPayment = minPayment + extraPayment;

 if (balance <= 0 || totalPayment <= 0 || rate <= 0) {
  return [];
 }

 const schedule = [];
 let remainingBalance = balance;
 let month = 0;

 while (remainingBalance > 0.01 && month < 600) { // Cap at 50 years
  month++;
  const interestPayment = remainingBalance * rate;
  const principalPayment = Math.min(totalPayment - interestPayment, remainingBalance);
  
  remainingBalance -= principalPayment;
  
  schedule.push({
   month,
   payment: interestPayment + principalPayment,
   interest: interestPayment,
   principal: principalPayment,
   balance: remainingBalance
  });

  if (principalPayment <= 0) break; // Prevent infinite loop
 }

 return schedule;
}

export function calculatePayoffTime(debt, extraPayment = 0) {
 const schedule = calculateAmortizationSchedule(debt, extraPayment);
 return schedule.length;
}

export function calculateTotalInterest(debt, extraPayment = 0) {
 const schedule = calculateAmortizationSchedule(debt, extraPayment);
 return schedule.reduce((sum, payment) => sum + payment.interest, 0);
}

export function projectionSelectors(debts, strategy = 'snowball') {
 if (!debts || debts.length === 0) {
  return {
   totalTime: 0,
   totalInterest: 0,
   monthlySavings: 0
  };
 }

 // Simple projection - sum individual payoff times
 const totalTime = debts.reduce((max, debt) => {
  const payoffTime = calculatePayoffTime(debt);
  return Math.max(max, payoffTime);
 }, 0);

 const totalInterest = debts.reduce((sum, debt) => {
  return sum + calculateTotalInterest(debt);
 }, 0);

 return {
  totalTime,
  totalInterest,
  monthlySavings: 0 // Placeholder
 };
}

// Additional functions expected by tests
export function calculatePayoffSummary(timeline) {
 if (!timeline || timeline.length === 0) {
  return { months: -1, totalInterestPaid: 0 };
 }
 
 // Find when balance reaches below £1 threshold
 const payoffMonth = timeline.findIndex(entry => entry.totalBalance <= 1);
 return {
  months: payoffMonth >= 0 ? payoffMonth : timeline.length - 1,
  totalInterestPaid: 0 // Placeholder
 };
}

export function buildDebtBalanceSeries(timeline, focusedDebtName) {
 if (!focusedDebtName || !timeline) {
  return [];
 }
 
 return timeline.map(entry => ({
  month: entry.displayDate,
  balance: entry.debts ? 
   (entry.debts.find(d => d.name === focusedDebtName)?.amount_pennies || 0) / 100 : 0
 }));
}