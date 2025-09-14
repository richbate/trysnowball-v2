# Data Integrity & Legacy Prevention System

TrySnowball enforces strict **data normalization** for debts.  
This doc explains the guardrails that protect against legacy code drift and how to work with them.

---

## Canonical Debt Shape

All debts must use normalized fields:

```ts
export interface NormalizedDebt {
  id: string
  name: string
  amount_cents: number      // integer, pennies
  apr_bps: number           // integer, basis points
  min_payment_cents: number // integer, pennies
  order_index: number
  updated_at?: number
}
```

❌ **Do not use legacy fields:** `balance`, `interestRate`, `minPayment`, `amount`, `apr_pct`.

---

## The 4 Guardrail Layers

### 1. **Compile-Time (TypeScript)**
- `StrictDebt` type bans legacy fields (`NoLegacyFields` utility).
- Any attempt to use `balance`, `interestRate`, or `minPayment` fails compilation.

### 2. **Development Runtime**
- `assertNormalized()` throws if legacy fields are present in debt objects.
- `isNormalized()` helper available for safe checks.
- Errors include offending field names for quick fixes.

### 3. **Lint-Time (ESLint)**
ESLint rules block:
- Imports of legacy `useDebts` hook.
- Field access of `balance`, `interestRate`, `minPayment`.
- Direct `posthog.capture` calls (must use `secureAnalytics`).

### 4. **CI-Time**
`check-legacy.sh` runs in CI:
- Greps for legacy fields/hooks in code.
- Hits `/api/debts` endpoints and fails if responses include legacy fields.
- Guarantees backend & frontend speak normalized shapes only.

---

## Controlled Compatibility

- **`/compat/` folder:** tests and migration utils may handle legacy fields here.
- ESLint rules are relaxed for this folder only.
- Use `toNormalized()` adapter when converting old fixtures to new shape.

---

## How to Add/Change Fields

1. Update the type in `src/types/debt.ts`.
2. Add normalization in `normalizeDebtPatch()` (API worker).
3. Update serializers to return normalized format.
4. Add tests to assert new field is included and legacy equivalents are rejected.
5. Update `MIGRATIONS.md` with old → new mapping if deprecating.

---

## Key Principles

- **Normalize at the edge:** Workers convert input to canonical format.
- **Preserve strictness in core:** Components, hooks, and state should never see legacy fields.
- **Fail fast:** It's better to break loudly in dev/CI than silently ship drift.

---

## TL;DR

- Use `amount_cents`, `apr_bps`, `min_payment_cents`.
- Never touch legacy fields.
- Analytics must go through `secureAnalytics`.
- If you see a CI failure about legacy fields, check your imports and normalize at the edge.

**The fortress ensures we never store plaintext, never regress into legacy fields, and always keep the debt model consistent across frontend, backend, and analytics.**