# Data Structure Migrations

This file tracks all changes to core data structures and provides before/after mappings for contributors.

---

## Format

```markdown
### [YYYY-MM-DD] Migration Name

**Context:** Brief explanation of why the change was needed.

**Changes:**
- `old_field` → `new_field` (transformation notes)
- Removed `deprecated_field` (reason)
- Added `new_required_field` (default behavior)

**Migration Code:**
```js
// Example transformation
const migrate = (old) => ({
  ...old,
  new_field: transformOldField(old.old_field),
  // old_field removed
});
```

**Affected Areas:**
- [ ] Types (`src/types/*.ts`)
- [ ] API endpoints (`cloudflare-workers/`)
- [ ] Database schema (`migrations/*.sql`) 
- [ ] Components (`src/components/`)
- [ ] Tests (`src/__tests__/`)

---
```

---

## Migration History

### [2025-01-03] Debt Field Normalization

**Context:** Eliminate floating-point precision issues and standardize currency/percentage handling across the application.

**Changes:**
- `balance` → `amount_cents` (multiply by 100, round to integer)
- `interestRate` → `apr_bps` (multiply by 10000, round to integer)  
- `minPayment` → `min_payment_cents` (multiply by 100, round to integer)
- `amount` → `amount_cents` (multiply by 100, round to integer)
- `apr_pct` → `apr_bps` (multiply by 100, round to integer)
- `originalAmount` → `original_amount_cents` (multiply by 100, round to integer)
- `createdAt` → `created_at` (snake_case consistency)
- `updatedAt` → `updated_at` (snake_case consistency)
- `order` → `order_index` (clarity and SQL keyword avoidance)
- `isDemo` → `is_demo` (snake_case consistency)
- `creditLimit` → `credit_limit_cents` (multiply by 100, round to integer)

**Migration Code:**
```js
const toNormalized = (legacy) => ({
  ...legacy,
  amount_cents: Math.round((legacy.balance ?? legacy.amount ?? 0) * 100),
  apr_bps: Math.round((legacy.interestRate ?? legacy.apr_pct ?? 0) * 10000),
  min_payment_cents: Math.round((legacy.minPayment ?? 0) * 100),
  original_amount_cents: Math.round((legacy.originalAmount ?? 0) * 100),
  created_at: legacy.createdAt,
  updated_at: legacy.updatedAt,
  order_index: legacy.order ?? 0,
  is_demo: legacy.isDemo,
  credit_limit_cents: legacy.creditLimit ? Math.round(legacy.creditLimit * 100) : undefined,
  // Remove legacy fields
  balance: undefined,
  interestRate: undefined,
  minPayment: undefined,
  amount: undefined,
  apr_pct: undefined,
  originalAmount: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  order: undefined,
  isDemo: undefined,
  creditLimit: undefined,
});
```

**Affected Areas:**
- [x] Types (`src/types/debt.ts` - added `NormalizedDebt` and `StrictDebt`)
- [ ] API endpoints (Cloudflare Workers need normalization)
- [ ] Database schema (migration pending)
- [x] Components (migration via `useUserDebts` hook)
- [x] Tests (contract tests added, legacy tests need updating)

**Guardrails Added:**
- TypeScript `StrictDebt` type prevents legacy field usage
- ESLint rules ban legacy field access patterns
- Runtime `assertNormalized()` throws in development
- CI contract tests prevent backend regressions

---

## Template for Future Migrations

Copy this template when making structural changes:

```markdown
### [YYYY-MM-DD] Migration Name

**Context:** Why this change was needed.

**Changes:**
- `old_field` → `new_field` (transformation)
- Removed `field` (reason)
- Added `field` (default behavior)

**Migration Code:**
```js
const migrate = (old) => ({
  // transformation logic
});
```

**Affected Areas:**
- [ ] Types
- [ ] API endpoints  
- [ ] Database schema
- [ ] Components
- [ ] Tests

**Rollback Plan:**
- How to reverse this migration if needed

---
```

---

## Migration Guidelines

1. **Always provide transformation code** - Make it copy-pasteable
2. **Update all affected areas** - Use the checklist to ensure completeness  
3. **Add guardrails** - TypeScript, ESLint, runtime checks to prevent regression
4. **Test both directions** - Forward migration and any rollback scenarios
5. **Document the context** - Future developers need to understand the "why"

**Remember:** Breaking changes should be rare. Prefer additive changes with deprecation periods when possible.