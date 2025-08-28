import * as React from 'react';
import { localDebtStore } from '../data/localDebtStore.ts';

type TotalsState = {
  total: number;
  min: number;
  count: number;
  debts: any[];
  loading: boolean;
};

export function usePlanTotals(): TotalsState {
  const [state, setState] = React.useState<TotalsState>({
    total: 0,
    min: 0,
    count: 0,
    debts: [],
    loading: true,
  });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await localDebtStore.listDebts();
        const norm = rows.map((d: any) => ({
          ...d,
          balance: d.balance ?? (d.balance_cents != null ? d.balance_cents / 100 : 0),
          minPayment: d.minPayment ?? (d.min_payment_cents != null ? d.min_payment_cents / 100 : 0),
        }));
        const total = norm.reduce((s, d) => s + (d.balance || 0), 0);
        const min = norm.reduce((s, d) => s + (d.minPayment || 0), 0);
        if (!alive) return;
        setState({ total, min, count: norm.length, debts: norm, loading: false });
      } catch (e) {
        console.warn('[usePlanTotals] Failed to load debts, using safe defaults:', e);
        if (!alive) return;
        setState({ total: 0, min: 0, count: 0, debts: [], loading: false });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}