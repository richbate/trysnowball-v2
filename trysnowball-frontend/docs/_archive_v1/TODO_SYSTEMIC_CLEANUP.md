# 📋 TrySnowball Systemic Cleanup TODO

**Status**: CONFIRMED - Ready for Execution  
**Based on**: External Review + Systemic Failure Audit  
**Owner**: Richard Bate  
**Architect**: ChatGPT  
**Executor**: Claude (per WAYS_OF_WORKING.md)  
**Target**: trysnowball-frontend codebase  

---

## ✅ ACCEPTANCE CONFIRMED

I acknowledge and accept the systemic failures identified:
- 89 conversion functions causing data corruption
- 2,692 gateway/adapter files creating unmaintainable architecture  
- 3,145 lines of dead code obscuring real logic
- Multiple conflicting sources of truth
- Legacy field names still active throughout system

**Clean rewrite validated** as correct approach - zero conversions, single gateway, server-only state.

---

## 🔴 PHASE 1: IMMEDIATE PURGE (Day 1-2)
**Goal**: Stop the bleeding - remove all conversion logic

### TODO: Conversion Function Genocide
- [ ] Find all conversion functions: `grep -r "toCents\|fromCents\|toBPS\|fromBPS" src/`
- [ ] Delete `src/utils/moneyConversions.js`
- [ ] Delete `src/utils/currencyHelpers.js`  
- [ ] Delete `src/lib/money.ts`
- [ ] Remove all inline conversions (89 instances)
- [ ] Verify: `grep -r "Cents\|BPS\|bps" src/` returns 0

### TODO: Legacy Field Extermination
- [ ] Find all legacy fields: `grep -r "amount_cents\|min_payment_cents\|apr_bps" src/`
- [ ] Replace `amount_cents` → `amount` (all files)
- [ ] Replace `min_payment_cents` → `min_payment` (all files)
- [ ] Replace `apr_bps` → `apr` (all files)
- [ ] Update all TypeScript interfaces
- [ ] Verify: No `_cents` or `_bps` suffixes remain

### TODO: Fallback Chain Elimination  
- [ ] Find fallback patterns: `grep -r "|| debt.amount_cents" src/`
- [ ] Remove all fallback chains like `debt.amount || debt.amount_cents / 100 || 0`
- [ ] Replace with direct access: `debt.amount` (let it fail if undefined)
- [ ] Add explicit validation instead of silent fallbacks

### TODO: API Endpoint Cleanup
- [ ] Delete handler for `/api/debts`
- [ ] Delete handler for `/api/clean/debts`
- [ ] Update all references to use `/api/v2/debts`
- [ ] Remove route definitions for legacy endpoints
- [ ] Update RouteRegistry to point only to v2

---

## 🟡 PHASE 2: ARCHITECTURE SIMPLIFICATION (Day 3-4)
**Goal**: Reduce to single data flow path

### TODO: Gateway/Adapter Consolidation
- [ ] Delete `src/data/debtsGateway.ts` (legacy)
- [ ] Delete `src/data/cleanDebtsGateway.ts` (deprecated)
- [ ] Delete `src/data/unifiedDebtsGateway.ts` (overengineered)
- [ ] Delete `src/data/localDebtStoreShim.ts` (shim)
- [ ] Keep ONLY one gateway (create new if needed)
- [ ] Delete entire `src/managers/` directory
- [ ] Delete entire `src/adapters/` directory
- [ ] Delete entire `src/compat/` directory

### TODO: Simplify Data Flow
- [ ] Document new flow: UI → useDebts() → singleGateway → /api/v2/debts
- [ ] Remove all intermediate transformation layers
- [ ] Update all components to use single gateway
- [ ] Remove all adapter patterns

---

## 🟠 PHASE 3: STATE CONSOLIDATION (Day 5-6)
**Goal**: Single source of truth - server only

### TODO: localStorage Removal
- [ ] Find all localStorage usage: `grep -r "localStorage" src/`
- [ ] Remove all `localStorage.setItem('debts', ...)`
- [ ] Remove all `localStorage.getItem('debts')`
- [ ] Remove all `localStorage.removeItem('debts')`
- [ ] Remove localStorage migration logic
- [ ] Remove localStorage sync logic

### TODO: Implement Server-First State
- [ ] Install React Query or SWR
- [ ] Create single `useDebts()` hook using server state
- [ ] Remove Redux debt slice (if exists)
- [ ] Remove Context providers for debts
- [ ] Update all components to use new hook
- [ ] Implement proper loading/error states

### TODO: Remove State Sync Logic
- [ ] Delete all reconciliation code
- [ ] Delete all hydration logic
- [ ] Delete all state merging functions
- [ ] Server response is always truth

---

## 🧟 PHASE 4: DEAD CODE BURIAL (Day 7)
**Goal**: Remove all zombie code

### TODO: Comment Removal
- [ ] Remove 3,145 lines of commented code
- [ ] Find: `grep -r "^[[:space:]]*\/\/" src/ | wc -l`
- [ ] Remove all `// TODO remove` comments
- [ ] Remove all `// legacy` comments
- [ ] Remove all `// old` comments

### TODO: Unused Export Cleanup
- [ ] Run `npx ts-prune` to find unused exports
- [ ] Delete all 912 unused exports
- [ ] Remove empty files
- [ ] Update barrel exports

### TODO: Backup File Deletion
- [ ] Delete all `*.backup` files
- [ ] Delete all `*.bak` files
- [ ] Delete all `*.old` files
- [ ] Delete all `*_deprecated.*` files

### TODO: Feature Flag Cleanup
- [ ] Remove all 7 unused feature flags
- [ ] Delete feature flag checking code for removed features
- [ ] Hardcode enabled features
- [ ] Remove feature flag infrastructure if unused

---

## 🛡️ PHASE 5: REGRESSION PROTECTION (Day 8)
**Goal**: Never allow these patterns back

### TODO: CI/CD Rules
- [ ] Add pre-commit hook blocking `cents|bps` patterns
- [ ] Add GitHub Action blocking legacy fields
- [ ] Add ESLint rule against fallback chains
- [ ] Add build-time grep checks
- [ ] Fail builds containing conversion functions

### TODO: Integration Tests
- [ ] Write Cypress test: Create debt with UK format
- [ ] Write Cypress test: Edit debt preserves exact values
- [ ] Write Cypress test: Delete debt
- [ ] Write Cypress test: Page refresh maintains data
- [ ] Write unit tests for new single gateway

### TODO: Documentation
- [ ] Document new architecture in README
- [ ] Create migration guide from old to new
- [ ] Document forbidden patterns
- [ ] Update API_CONTRACT.md if needed

---

## 📊 SUCCESS METRICS

### Before Cleanup
| Metric | Count |
|--------|-------|
| Conversion functions | 89 |
| Gateway/adapter files | 5+ |
| Legacy field references | 13+ |
| localStorage uses | 80+ |
| Commented lines | 3,145 |
| Sources of truth | 4+ |

### After Cleanup (Target)
| Metric | Target |
|--------|--------|
| Conversion functions | **0** |
| Gateway/adapter files | **1** |
| Legacy field references | **0** |
| localStorage uses | **0** |
| Commented lines | **<100** |
| Sources of truth | **1** |

---

## 🚨 CRITICAL PATH

**Week 1 Priority**:
1. Phase 1 - Stop data corruption
2. Phase 2 - Simplify architecture
3. Phase 5 - Add CI protection

**Week 2**:
4. Phase 3 - Consolidate state
5. Phase 4 - Remove dead code

---

## ⚠️ RISK MITIGATION

### Before Starting
- [ ] Tag current state: `git tag pre-systemic-cleanup-2024`
- [ ] Create cleanup branch: `git checkout -b cleanup/systemic-purge`
- [ ] Full database backup
- [ ] Document rollback procedure

### After Each Phase
- [ ] Run full test suite
- [ ] Manual test: Create → Edit → Delete debt
- [ ] Verify amounts display correctly
- [ ] Check no data loss on refresh
- [ ] Deploy to staging first

### Rollback Plan
```bash
# If anything goes wrong:
git checkout main
git reset --hard pre-systemic-cleanup-2024
# Deploy clean app from /trysnowball-clean instead
```

---

## 📝 NOTES FOR CLAUDE

Per WAYS_OF_WORKING.md:
- **ONLY** modify files in your domain
- **REFERENCE** API_CONTRACT.md v2.1 for all changes
- **NO** new features during cleanup
- **NO** new abstractions or clever solutions
- **YES** to aggressive deletion
- **YES** to failing fast on errors

**Your Domain**:
- `src/data/*Gateway.ts` files
- API client code
- Route registry updates
- Analytics event updates

**NOT Your Domain**:
- UI components
- Styling
- Product decisions
- AI/GPT features

---

## 🎯 DEFINITION OF DONE

- [ ] Zero conversion functions in codebase
- [ ] Zero legacy field names
- [ ] Single gateway to API
- [ ] Single source of truth (server)
- [ ] CI blocks preventing regression
- [ ] All tests passing
- [ ] Data integrity verified in production

---

**Last Updated**: 2025-09-11  
**Review Date**: After Phase 1 completion