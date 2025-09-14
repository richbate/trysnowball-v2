# TrySnowball TODO List

## High Priority Bugs
- [ ] Verify all debt display components show correct values
- [ ] Fix any remaining Add/Edit debt issues
- [ ] Test debt calculations (totals, minimums, utilization)

## Technical Debt

### UK Localization - Rename "cents" to "pence"
**Priority: Low** (internal only, users don't see this)

The entire codebase uses US-centric naming (`amount_cents`, `min_payment_cents`, `limit_cents`) when this is a UK-focused app. Should be using `amount_pence`, `min_payment_pence`, `limit_pence`.

**Files that need updating:**
- Database schema (migrations required)
- API endpoints (`/cloudflare-workers/debts-api.js`)
- API utilities (`/cloudflare-workers/crypto-utils.js`)
- Frontend components (`/src/components/debt/*`)
- Conversion utilities (`/src/lib/money.ts`)
- Data stores (`/src/data/localDebtStore.ts`)
- All hooks using debt data

**Estimated effort:** 2-3 days (high risk of breaking changes)

## Features
- [ ] Add debt payment history tracking
- [ ] Implement debt projections
- [ ] Add export to CSV functionality

## Code Quality
- [ ] Reduce ESLint errors (currently 297 errors, 409 warnings)
- [ ] Remove legacy field usage completely
- [ ] Add comprehensive test coverage for debt operations

## Performance
- [ ] Optimize debt calculations (currently recalculating on every render)
- [ ] Add caching for API responses
- [ ] Implement optimistic updates for better UX

## Documentation
- [ ] Document the normalized field format
- [ ] Add API documentation
- [ ] Create user guide for debt management features

---
Last updated: 2024-01-09