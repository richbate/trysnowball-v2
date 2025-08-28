# Centralized Debt Accessor Migration Plan

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## 🎯 **Objective: Bulletproof Data Layer**

Implement a single, centralized method for reading debt data to eliminate the class of bugs caused by multiple data sources and field naming inconsistencies.

---

## ✅ **Phase 1: Core Implementation (COMPLETED)**

### **A. Enhanced debtsManager.getDebts() - The Single Source of Truth**
- **🔧 Created**: Centralized `getDebts({ includeDemo, sorted })` method in `debtsManager.js`
- **✨ Features**:
  - **Field Normalization**: Ensures `balance`, `amount`, `interest`, `minPayment` are consistent
  - **Demo Data Handling**: Smart demo data loading when no user debts exist
  - **Sorting Control**: User-defined debt order with fallback to balance order
  - **Backward Compatibility**: Deprecated old methods with warnings

### **B. Updated Core Hooks**
- **🔧 Updated**: `useDebts.js` to use centralized accessor exclusively
- **🔧 Updated**: `debtsManager.getMetrics()` and `calculateProjections()` 
- **✨ Benefits**:
  - No more field name guessing (`debt.balance || debt.amount || 0`)
  - Consistent demo/real data transitions
  - Single point of truth for all debt reads

---

## 🔄 **Phase 2: Hook & Component Migration (IN PROGRESS)**

### **Migration Priority:**

**🚨 HIGH PRIORITY - Complete First:**
1. ✅ `useDebts.js` - COMPLETED
2. ✅ `debtsManager.js` internal methods - COMPLETED  
3. ⏳ `useDataManager.js` - Update to use centralized accessor
4. ⏳ `AIReport.jsx` - Already fixed field issues, verify using right accessor

**🟡 MEDIUM PRIORITY - Components:**
5. ⏳ `MyDebtsPage.js` - Verify using useDataManager (should inherit fixes)
6. ⏳ `MyPlan.jsx` - Verify using useDataManager (should inherit fixes)
7. ⏳ `DebtTable` and related components - Verify no direct data access

**🟢 LOW PRIORITY - Cleanup:**
8. ⏳ Remove or deprecate unused hooks: `useSmartDebts`, `useDemoDebts` if they exist
9. ⏳ Add ESLint rule to prevent direct localStorage debt access

---

## 🔧 **Migration Pattern for Hooks**

**Before:**
```javascript
// Multiple inconsistent ways to get debts
const debts = useSmartDebts(); 
const { debts } = await debtsManager.getData(); // ✅ Use facade method
const debts = data.debts || [];
// Inconsistent field checking
const balance = debt.amount || debt.balance || 0;
```

**After:**
```javascript  
// Single way to get debts
const debts = debtsManager.getDebts(); 
// Fields are normalized - just use them directly
const balance = debt.balance;
const minPayment = debt.minPayment;
const interest = debt.interest;
```

---

## 🔧 **Migration Pattern for Components**

**Before:**
```javascript
// Component directly accessing multiple data sources
const MyComponent = () => {
  const { debts: localDebts } = await debtsManager.getData(); // ✅ Use facade method
  const { debts: cloudDebts } = useCloudDebts();
  const { debts: smartDebts } = useSmartDebts();
  
  // Inconsistent field access
  const total = debts.reduce((sum, d) => sum + (d.balance || d.amount || 0), 0);
};
```

**After:**
```javascript
// Component using single hook that uses centralized accessor  
const MyComponent = () => {
  const { debts } = useDataManager(); // This internally uses debtsManager.getDebts()
  
  // Clean, reliable field access
  const total = debts.reduce((sum, d) => sum + d.balance, 0);
};
```

---

## 🛡️ **Protection Against Future Regressions**

### **A. Code Review Checklist**
- [ ] No direct localStorage access for debt data
- [ ] No hooks bypassing debtsManager.getDebts()
- [ ] No field fallback logic (`debt.balance || debt.amount`)

### **B. ESLint Rules (Future)**
```javascript
// .eslintrc.js - Prevent direct debt data access
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.object.name='localStorage'][callee.property.name='getItem'][arguments.0.value=/debt/i]",
      message: 'Use debtsManager.getDebts() instead of direct localStorage access'
    }
  ]
}
```

### **C. TypeScript Interface (Future)**
```typescript
interface DebtRecord {
  id: string;
  name: string;
  balance: number;    // Always present, normalized
  interest: number;   // Always present, normalized  
  minPayment: number; // Always present, normalized
  // Deprecated fields marked as such
  /** @deprecated Use balance instead */ 
  amount?: number;
}
```

---

## 📊 **Success Metrics**

- ✅ **Field Consistency**: No more `(debt.balance || debt.amount || 0)` patterns
- ✅ **Demo Data Reliability**: Same demo data across all pages  
- ⏳ **Single Data Source**: All components use debtsManager.getDebts() path
- ⏳ **Test Coverage**: Mock debtsManager.getDebts() once, test all UI

---

## 🚀 **Next Steps**

1. **Complete useDataManager migration** - Ensure it uses centralized accessor
2. **Audit remaining components** - Search for any direct debt data access
3. **Add integration test** - Verify data consistency across all pages
4. **Document the pattern** - Update coding standards for new developers

**Expected Timeline**: 1-2 hours to complete remaining migrations

**Risk Level**: LOW - Backward compatibility maintained, incremental changes