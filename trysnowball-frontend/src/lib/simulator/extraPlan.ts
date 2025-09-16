import { ScenarioSelection } from "../../types/scenarios";

export type ExtraPlan = {
  extraMonthly: number;      // recurring £ per month (sum of monthly selections)
  lumpSumsByMonth: Map<number, number>; // 1-based month -> one-off £
};

export function buildExtraPlan(selections: ScenarioSelection[], months: number, baseExtra = 0): ExtraPlan {
  const extraMonthly = baseExtra + selections
    .filter(s => s.active && s.type === "monthly")
    .reduce((sum, s) => sum + Math.max(0, s.amount || 0), 0);

  const lumpSumsByMonth = new Map<number, number>();
  selections
    .filter(s => s.active && s.type === "one_off")
    .forEach(s => {
      const m = Math.max(1, Math.min(months, s.month || 1));
      lumpSumsByMonth.set(m, (lumpSumsByMonth.get(m) || 0) + Math.max(0, s.amount || 0));
    });

  return { extraMonthly, lumpSumsByMonth };
}

// Turn the plan into a per-month array for engines that only accept a single extra value
export function expandExtraPerMonth(plan: ExtraPlan, months: number): number[] {
  const arr = Array.from({ length: months }, () => plan.extraMonthly);
  for (const [m, amt] of plan.lumpSumsByMonth.entries()) {
    const idx = m - 1;
    if (idx >= 0 && idx < months) arr[idx] += amt;
  }
  return arr;
}