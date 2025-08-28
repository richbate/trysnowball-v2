import { localDebtStore } from '../data/localDebtStore.ts';

export async function capturePlanView() {
  const debts = await localDebtStore.listDebts();
  const total = debts.reduce((s,d)=> s + (d.balance ?? (d.balance_cents??0)/100), 0);
  
  // Dev logging to verify IndexedDB source
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics] plan totals sent from IDB:', { total, count: debts.length });
  }
  
  window.posthog?.capture?.('page_view', {
    page: 'my-plan',
    debtCount: debts.length,
    totalDebt: Math.round(total),
  });
}