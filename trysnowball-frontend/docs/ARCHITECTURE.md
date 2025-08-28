# TrySnowball Architecture Guide

## 🚫 Critical Rule: No .data Access

**Never access `.data` on any manager - it causes production crashes.**

```javascript
// ✅ Do This - Use async facade methods
const { debts } = await debtsManager.getData();
const metrics = await debtsManager.getMetrics();
const { user } = useAuth();  // via safe hook

// ❌ Don't Do This - Direct .data access crashes
const debts = debtsManager.data.debts;         // undefined crashes
const total = debtsManager.data.metrics.total; // undefined crashes  
const user = authManager.data.user;            // undefined crashes
```

## Why This Matters

After CP-1 migration to IndexedDB, all `.data` properties were removed from managers. Code still referencing them gets `undefined.property` crashes in production.

## Guardrails in Place

1. **Development Proxy**: Throws clear errors when accessing `.data` in dev
2. **ESLint Rule**: Catches `.data` access during linting  
3. **CI Check**: Blocks deployment if `.data` access found
4. **Unit Tests**: Verify guardrails work correctly

## Data Layer Architecture

### Managers (Pure Facades)
- `debtsManager`: Delegates to `localDebtStore` 
- `authManager`: Delegates to Supabase auth (future)
- No internal state, only async facade methods

### Storage Layer  
- `localDebtStore`: IndexedDB via Dexie ORM
- `localStorage`: Only for non-critical user preferences
- No direct storage access from UI components

### UI Layer
- `useDebts()`: React hook for debt state management  
- `useAuth()`: React hook for auth state management
- Hooks call manager facade methods, never access `.data`

## Safe Patterns

```javascript
// ✅ Safe React Hook Pattern
const { debts, loading, error } = useDebts();

// ✅ Safe Direct Manager Usage  
useEffect(() => {
  let cancelled = false;
  
  const loadData = async () => {
    try {
      const { debts } = await debtsManager.getData();
      if (!cancelled) setDebts(debts);
    } catch (err) {
      if (!cancelled) setError(err);
    }
  };
  
  loadData();
  return () => { cancelled = true };
}, []);

// ✅ Safe Error Handling
try {
  await debtsManager.saveDebt(debt);
} catch (error) {
  console.error('Save failed:', error);
  // Handle error gracefully
}
```

## Dangerous Patterns

```javascript
// ❌ Direct State Access (Crashes)
const debts = debtsManager.data.debts;
const user = authManager.data.user;

// ❌ Synchronous Assumptions (Crashes) 
const debts = getDebts();  // not async
setDebts(debts);           // immediate update

// ❌ No Error Handling (Crashes)
debtsManager.getData();    // no await
const debts = response.debts; // no null check
```

## Testing

All data access must be tested for safety:

```javascript
// ✅ Test async patterns
test('loads debts safely', async () => {
  const { debts } = await debtsManager.getData();
  expect(Array.isArray(debts)).toBe(true);
});

// ✅ Test error handling
test('handles errors gracefully', async () => {
  mockStore.reject(new Error('DB error'));
  await expect(debtsManager.getData()).rejects.toThrow();
});
```

## Migration Guidelines

When adding new managers:

1. Create facade methods only (no `.data` property)
2. Wrap with `withNoDataGuard()` 
3. Add to ESLint rule pattern
4. Add to CI check script
5. Write tests verifying guardrails work

This architecture prevents the `.data` access crashes that caused recent production issues.