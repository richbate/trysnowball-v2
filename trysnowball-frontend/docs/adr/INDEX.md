# Architecture Decision Records (ADR) Index

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## 📋 Current Decisions

| ADR | Title | Status | Date | Summary |
|-----|-------|--------|------|---------|
| [ADR-003](../architecture/ADR-003-data-ui-separation.md) | Data/UI Separation | ✅ **Current** | 2025-08 | Clean separation between data persistence and UI refresh timing |
| [ADR-002](#) | CP-1 IndexedDB Migration | ✅ **Current** | 2025-08 | Migration from localStorage to IndexedDB via localDebtStore |
| [ADR-001](#) | Debt Snowball Implementation | ✅ **Current** | 2025-07 | Core debt elimination algorithm and calculation patterns |

## 🎯 Key Architectural Principles

### **1. Data Layer Safety (Critical)**
- **Never access `.data` directly** - Always use async facade methods
- **All managers are facades** - They delegate to storage layers, never hold state
- **IndexedDB only** - No localStorage for app data (debts, analytics, theme)

### **2. Clean Data/UI Separation**
- **Data layer**: Only persists data, never triggers UI updates
- **UI layer**: Controls refresh timing and loading states
- **Hooks**: Bridge between data persistence and UI state (`useDebts`, `useSettings`)

### **3. Async-First Architecture**
- **All data operations** use `await` with proper error handling
- **Loading states** handled by UI hooks, not data layer
- **Error boundaries** catch and handle data operation failures

### **4. Simple Business Model**
- **Free/Pro tiers** - No complex beta flags or access levels
- **Stripe integration** - Clean subscription model without legacy patterns
- **Environment overrides** - Development bypass for testing

## 📚 Implementation Guidelines

### **Adding New Features**
1. **Data operations** go through manager facade methods
2. **UI state** managed by React hooks (`useDebts`, `useSettings`)
3. **All storage** via IndexedDB (localDebtStore), never localStorage
4. **Follow patterns** established in ADR-003 for data/UI separation

### **Modifying Data Layer**
1. **Update facade methods** in managers (debtsManager, etc.)
2. **Never expose internal state** - all access via async methods
3. **Add tests** for new data operations and facade methods
4. **Update documentation** to reflect new patterns

### **Testing Approach**
1. **Unit tests** for all facade methods and calculations
2. **Integration tests** for React hooks and data flow
3. **Guardrail tests** to ensure `.data` access throws errors in development
4. **E2E tests** for critical user flows

## 🚨 Deprecated Patterns

### **Retired with ADR-003**
- ❌ Direct state access (`debtsManager.data.debts`)
- ❌ localStorage for app data (`localStorage.getItem('debt-data')`)
- ❌ Beta access flags (`useBetaGate`, `betaEnabled`)
- ❌ Synchronous data operations in React components

### **Migration Path**
- **Old**: `const debts = debtsManager.data.debts`
- **New**: `const { debts } = useDebts()` or `const data = await debtsManager.getData()`

## 🔄 Decision Review Process

### **When to Create New ADRs**
- Major architectural changes affecting multiple components
- Breaking changes to data layer or API contracts
- New technology adoption (databases, frameworks, etc.)
- Business model or access pattern changes

### **ADR Template**
```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Superseded | Deprecated]

## Context
[What is the issue that we're seeing that is motivating this decision?]

## Decision
[What is the change that we're proposing or have agreed to implement?]

## Consequences
[What becomes easier or more difficult to do and any risks introduced?]

## Implementation
[How will this be implemented and what changes are required?]
```

## 🎯 Future Considerations

### **Potential ADRs in Development**
- **ADR-004**: Authentication & session management architecture
- **ADR-005**: AI integration patterns and safety boundaries  
- **ADR-006**: Mobile app data sync strategy
- **ADR-007**: Advanced analytics and reporting architecture

### **Monitoring Decision Health**
- **Code reviews** check adherence to current ADRs
- **CI checks** enforce patterns established in ADRs
- **Documentation** reflects current architectural decisions
- **Refactoring efforts** align with established patterns

---

**This index is the single source of truth for architectural decisions.** All new development should align with current ADRs, and any architectural changes should be documented through the ADR process.