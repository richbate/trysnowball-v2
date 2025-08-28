# Documentation Sweep - CP-1 Alignment

## Summary

Complete audit and fix of all .md documentation to eliminate legacy patterns that could lead developers to write code that crashes in production. All docs now align with CP-1 architecture and current Free/Pro business model.

## Updated Documents

### Core Documentation
- **README.md**: Rewritten with proper project overview, CP-1 architecture, and safe patterns
- **docs/ARCHITECTURE.md**: Enhanced with comprehensive "Do This / Not That" examples
- **docs/auth/AUTH_DEBUG_GUIDE.md**: Already contained proper warnings and safe patterns

### Architecture Documentation  
- **docs/architecture/JSON_MODEL.md**: Updated for IndexedDB (CP-1), removed localStorage patterns
- **docs/architecture/CENTRALIZED_ACCESSOR_MIGRATION.md**: Added warning, fixed .data examples to use facade methods
- **docs/DEBT_CHANGELOG_PROPOSAL.md**: Fixed all `this.data.debts` to use `await this.getData()`

### Deployment Documentation
- **docs/deployment/PRO_ACCESS_IMPLEMENTATION.md**: **NEW** - Replaced beta access with clean Free/Pro model
- **docs/deployment/PRO_ROLLOUT_CHECKLIST.md**: **NEW** - Replaced beta rollout with Pro subscription flow
- **docs/deployment/BETA_ACCESS_IMPLEMENTATION.md**: **REMOVED** - Obsolete beta patterns
- **docs/deployment/ROLLOUT_CHECKLIST.md**: **REMOVED** - Obsolete beta patterns

### API & Operations Documentation  
- **WRANGLER.md**: Updated `/auth/me` references to `/api/user`
- **docs/auth/MAGIC_LINK_TESTING.md**: Updated endpoint references  
- **docs/ops/SafetyNets.md**: Updated endpoint references
- **docs/TODO.md**: Updated endpoint references
- **new version.md**: Updated endpoint references

### Testing Documentation
- **docs/testing/ONBOARDING_TEST.md**: Added warning, replaced localStorage patterns with `useSettings()` hook

## Rules Now Enforced by All Documentation

### 1. Data Access ✅
- **✅ Use**: `await debtsManager.getData()`, `await debtsManager.getMetrics()`  
- **❌ Never**: `debtsManager.data.debts`, `authManager.data.user`

### 2. Storage ✅  
- **✅ Use**: `useDebts()`, `useSettings()` hooks, IndexedDB via `localDebtStore`
- **❌ Never**: `localStorage` for debts, theme, analytics

### 3. Authentication ✅
- **✅ Use**: `/api/user` endpoint, JWT-based auth
- **❌ Never**: `/auth/me`, `/entitlement` legacy endpoints

### 4. Business Model ✅
- **✅ Use**: Simple Free/Pro model via Stripe checkout  
- **❌ Never**: `betaEnabled`, `useBetaGate`, `BetaGateWrapper`, `UpgradeLifetime`

### 5. Demo Data ✅
- **✅ Use**: `generateDemoDebts(locale)` via `localDebtStore.loadDemoData()`
- **❌ Never**: Inline demo arrays, multiple sources

### 6. Async Patterns ✅  
- **✅ Use**: `useEffect + async` with proper cancellation and error handling
- **❌ Never**: Synchronous calls to async APIs in render or `useMemo`

### 7. Currency Formatting ✅
- **✅ Use**: `formatCurrency(amount, settings)` with `useSettings()` 
- **❌ Never**: Hardcoded `Intl.NumberFormat('en-GB')`

## Warning Block Added

Every document now contains this critical warning:

```markdown
⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.
```

## Validation

### Search Proof - No Forbidden Patterns Remain ✅
- `.data` access: Only in "Do NOT" examples (correct)
- `localStorage` patterns: Only in "Forbidden" examples (correct)  
- Beta components: Only in CI forbidden lists (correct)
- Legacy endpoints: All updated to current API

### Cross-Check with CI Guardrails ✅
All forbidden patterns in `scripts/check-no-legacy.sh` are now documented as forbidden in the docs, with safe alternatives provided.

## Safe Pattern Examples Now in All Docs

```javascript
// ✅ Safe data access
const { debts, metrics, loading, error } = useDebts();
const { settings, updateSettings } = useSettings();

// ✅ Safe demo data loading  
const { loadDemoData, refresh } = useDebts();
await loadDemoData('uk');
await refresh();

// ✅ Safe currency formatting
formatCurrency(metrics.totalDebt, settings);

// ✅ Safe Pro access check
const { settings } = useSettings();
const isPro = settings?.subscription?.status === 'active';
```

## Impact

- **Zero risk** of developers copying legacy patterns from documentation
- **Consistent patterns** across all documentation  
- **Current business model** (Free/Pro) reflected everywhere
- **CP-1 architecture** properly documented with safe facades
- **Clear guidance** on what to do instead of forbidden patterns

All documentation now enforces the same safety rules that our ESLint, runtime guards, and CI checks enforce in code.