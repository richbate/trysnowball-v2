# Hydration-Aware Routing Pattern

## Problem Solved
Prevents onboarding race condition where routing decisions happen before debt data loads from IndexedDB/D1.

## Pattern Overview
```javascript
// ❌ WRONG - Race condition
const { debts } = useUserDebts();
if (debts.length === 0) navigate('/onboarding'); // Fires before data loads!

// ✅ CORRECT - Wait for hydration
const { hasDebts, hydrationStatus } = useUserDebts();
if (hydrationStatus !== 'ready') return; // Wait for data
const path = hasDebts ? '/plan/debts' : '/onboarding'; // Safe decision
```

## Hook API
```javascript
const {
  debts,           // Array<Debt> - actual debt records
  hasDebts,        // boolean | null - null until hydration complete
  hydrationStatus, // 'idle' | 'hydrating' | 'ready'  
  syncing,         // boolean - true during remote sync
  loading          // boolean - legacy, same as syncing
} = useUserDebts();
```

## Routing Components
- **RootRoute**: Waits for hydrationStatus === 'ready' before redirecting
- **PlanIndexRedirect**: Same pattern for /plan index redirects

## Analytics Captured
- `hydration_timing` - Performance monitoring
- `hydration_remote_error` - Fail-soft fallback tracking

## Usage Rules
1. **Never check `debts.length === 0` directly in routing logic**
2. **Always wait for `hydrationStatus === 'ready'`**
3. **Use `hasDebts` signal, not manual length checks**
4. **Show loading state during hydration**

## Fail-Soft Behavior
- Remote fails → Falls back to local data
- Local has data → Uses local, shows "sync failed" message  
- Both empty → Shows onboarding
- Never loses user data

## Testing
```javascript
// Cypress test pattern
cy.seedD1WithDebt(userId, debtData);
cy.clearIndexedDB();
cy.visit('/plan');
cy.get('[data-testid="hydration-loading"]').should('be.visible');
cy.url().should('not.include', '/onboarding'); // Should not redirect prematurely
cy.get('[data-testid="hydration-loading"]').should('not.exist');
cy.url().should('include', '/plan/debts'); // Final destination after hydration
```