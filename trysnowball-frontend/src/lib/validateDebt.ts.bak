/**
 * Runtime Debt Validation Contract
 * Purpose: Stop NaNs at the boundary (dev-only throw, prod-safe)
 */

export type Debt = {
 id: string;
 name: string;
 debt_type?: string;
 amount_pennies: number;
 apr: number;
 min_payment_pennies: number;
 isDemo?: boolean;
 created_at?: string;
 updated_at?: string;
};

const isFiniteNum = (n: unknown) => typeof n === 'number' && Number.isFinite(n);

export function validateDebt(d: any, where = 'unknown'): asserts d is Debt {
 if (!d || typeof d !== 'object') throw new Error(`[${where}] debt not an object`);
 if (!d.id || !d.name) throw new Error(`[${where}] id/name missing`);
 if (!isFiniteNum(d.amount_pennies)) throw new Error(`[${where}] amount_pennies invalid: ${d.amount_pennies}`);
 if (!Number.isInteger(d.amount_pennies)) throw new Error(`[${where}] amount_pennies not int`);
 if (!Number.isInteger(d.apr) || d.apr < 0) throw new Error(`[${where}] apr_bps invalid: ${d.apr}`);
 if (!Number.isInteger(d.min_payment_pennies) || d.min_payment_pennies < 0) throw new Error(`[${where}] min_payment_pennies invalid: ${d.min_payment_pennies}`);
}

export function validateDebts(arr: any[], where = 'unknown[]') {
 if (!Array.isArray(arr)) throw new Error(`[${where}] not array`);
 arr.forEach((d, i) => validateDebt(d, `${where}#${i}`));
}