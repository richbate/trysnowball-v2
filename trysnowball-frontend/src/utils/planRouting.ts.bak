const TABS = new Set(['debts', 'snowball', 'strategy', 'plan', 'snowflakes', 'goals']);

export function getLastPlanTab(): string | null {
 const v = localStorage.getItem('ts:lastPlanTab');
 return v && TABS.has(v) ? v : null;
}

export function setLastPlanTab(tab: string): void {
 if (TABS.has(tab)) {
  localStorage.setItem('ts:lastPlanTab', tab);
 }
}

export function computePlanLandingPath(hasDebts: boolean): string {
 if (!hasDebts) return '/onboarding';
 const last = getLastPlanTab();
 return `/plan/${last ?? 'snowball'}`;
}