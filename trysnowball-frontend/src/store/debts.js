import { createContext, useContext, useMemo, useState } from 'react';

const K = 'sb_debts_v1';
const Ctx = createContext(null);

export function DebtsProvider({ children }) {
  const [debts, setDebts] = useState(() => {
    try { const raw = localStorage.getItem(K); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  const api = useMemo(() => ({
    debts,
    addDebt: (d) => setDebts(s => {
      const next = [...s, { id: crypto.randomUUID?.() || Date.now() + '', ...d }];
      try { localStorage.setItem(K, JSON.stringify(next)); } catch {}
      return next;
    }),
    addMany: (arr) => setDebts(s => {
      const stamped = arr.map(d => ({ id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), ...d }));
      const next = [...s, ...stamped];
      try { localStorage.setItem(K, JSON.stringify(next)); } catch {}
      return next;
    }),
    clear: () => { try { localStorage.setItem(K, '[]'); } catch {}; setDebts([]); },
  }), [debts]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useDebts = () => {
  const v = useContext(Ctx); 
  if (!v) throw new Error('useDebts outside DebtsProvider'); 
  return v;
};