// Minimal in-memory store shim so UI can run. Replace with your real IndexedDB store later.
import type { NormalizedDebt } from '../adapters/debts';

let _debts: NormalizedDebt[] = [];

export async function getDebts(): Promise<NormalizedDebt[]> {
 return [..._debts];
}

export async function setDebts(next: NormalizedDebt[]): Promise<void> {
 _debts = [...next];
}

export async function upsertDebt(input: NormalizedDebt): Promise<NormalizedDebt> {
 const id = input.id ?? String(Date.now());
 const ix = _debts.findIndex(d => d.id === id);
 const merged: NormalizedDebt = { ..._debts[ix], ...input, id };
 if (ix >= 0) _debts[ix] = merged; else _debts.push(merged);
 return merged;
}

export const localDebtStore = { getDebts, setDebts, upsertDebt };
export default localDebtStore;