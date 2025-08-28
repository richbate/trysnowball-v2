# ADR-003: Data Layer Never Mutates UI State

## Status
Accepted

## Context
During the CP-1 data layer consolidation, we encountered issues where the data layer (debtsManager, localDebtStore) was attempting to trigger UI refreshes directly. This created tight coupling between layers and made the architecture fragile.

## Decision
**Data layer persists; UI layer decides when to repaint.**

### Principles
1. **Data Layer (Pure)**
   - Only persists and retrieves data
   - Never calls setState, setRefreshNonce, or any UI update functions
   - Returns data/promises, no side effects
   - Example: `debtsManager.loadDemoData()` only saves to IndexedDB and returns items

2. **UI Layer (Controls Updates)**
   - Decides when to refresh after data operations
   - Owns all state management and re-render logic
   - Calls data layer methods then triggers its own refresh
   - Example: `await loadDemoData(); refresh();` in components

3. **Hook Layer (Bridge)**
   - `useDebts()` provides both data operations AND refresh control
   - Components get `{ loadDemoData, refresh }` from the same hook
   - Refresh is explicit, never automatic

## Implementation
```javascript
// ✅ CORRECT: UI controls refresh
const { loadDemoData, refresh } = useDebts();
const handleDemo = async () => {
  await loadDemoData();  // Persist only
  refresh();             // UI decides to update
};

// ❌ WRONG: Data layer triggers UI
async loadDemoData() {
  await persist();
  setRefreshNonce(n => n+1);  // NO! Data layer mutating UI
}
```

## Consequences
### Positive
- Clean separation of concerns
- Predictable data flow
- Easier testing (data layer has no UI dependencies)
- UI can batch refreshes or debounce as needed

### Negative
- Developers must remember to call refresh() after mutations
- Two-step process for updates (persist then refresh)

## Enforcement
- CI checks via `scripts/check-no-legacy.sh`
- Unit tests verify no UI mutations in data layer
- Code review checklist includes this separation

## References
- CP-1 Data Layer Consolidation
- Phase 3 Architecture (useDebts → debtsManager → localDebtStore)