// Extra payment plan builder for scenario selections

export function buildExtraPlan(selections, months, baseExtra = 0) {
  const extraMonthly = baseExtra + selections
    .filter(s => s.active && s.type === "monthly")
    .reduce((sum, s) => sum + Math.max(0, s.amount || 0), 0);

  const lumpSumsByMonth = new Map();
  selections
    .filter(s => s.active && s.type === "one_off")
    .forEach(s => {
      const m = Math.max(1, Math.min(months, s.month || 1));
      lumpSumsByMonth.set(m, (lumpSumsByMonth.get(m) || 0) + Math.max(0, s.amount || 0));
    });

  return { extraMonthly, lumpSumsByMonth };
}

// Turn the plan into a per-month array for engines that only accept a single extra value
export function expandExtraPerMonth(plan, months) {
  const arr = Array.from({ length: months }, () => plan.extraMonthly);
  for (const [m, amt] of plan.lumpSumsByMonth.entries()) {
    const idx = m - 1;
    if (idx >= 0 && idx < months) arr[idx] += amt;
  }
  return arr;
}