# 🧪 Data Synchronization Stress Test Plan

## Overview
Testing the bulletproof data layer after consolidating all pages to use `useDataManager → useDebts → debtsManager`.

## Test Environment
- **Server**: http://localhost:3000
- **Browser**: Chrome DevTools open
- **Required**: Clear all localStorage before starting

---

## ✅ Test 1: LocalStorage Wipe & Reload

**Objective**: Verify clean user start with consistent demo data across all pages.

### Steps:
1. **Clear localStorage** (run in browser console):
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Visit each page** and verify they show **identical demo data**:
   - `/debts` → Check debt names, balances, order
   - `/ai/report` → Check executive summary matches  
   - `/my-plan` → Check debt list matches debts page
   - `/ai/coach` → Check AI sees same debt data

3. **Expected**: All pages show same 4 demo debts:
   - PayPal Credit: £1,400
   - Barclaycard: £2,461  
   - Halifax Credit Card: £5,931
   - MBNA Card: £8,720

### ✅ PASS/FAIL: ___

---

## ✅ Test 2: Real-time Sync Test

**Objective**: Verify updates in `/debts` immediately reflect in other pages without reload.

### Steps:
1. **Setup monitoring** (browser console):
   ```javascript
   // Load debug script
   const script = document.createElement('script');
   script.src = '/debug-data-sync.js';
   document.head.appendChild(script);
   // Then run: debugDataSync.testRealtimeSync();
   ```

2. **Update debt balance**:
   - Go to `/debts`
   - Click "Update Balances" 
   - Change PayPal Credit from £1,400 to £1,200
   - Save changes

3. **Check immediate sync** (without refreshing):
   - Navigate to `/ai/report`
   - Verify PayPal shows £1,200 in executive summary
   - Navigate to `/my-plan`  
   - Verify debt table shows £1,200
   - Navigate to `/ai/coach`
   - Verify AI sees updated £1,200 balance

### ✅ PASS/FAIL: ___

---

## ✅ Test 3: Demo ↔ Real Data Switch

**Objective**: Verify clean transitions between demo and real user data.

### Steps:
1. **Start with demo data**:
   - Clear localStorage, reload
   - Verify demo data loads on all pages

2. **Add real debt**:
   - Go to `/debts`
   - Click "Add Debt" 
   - Add: "My Real Credit Card", £3,000 balance
   - Save

3. **Verify real data replaces demo**:
   - Check `/debts` shows only real debt (no demo data)
   - Check `/ai/report` shows only real debt
   - Check `/my-plan` shows only real debt

4. **Clear to demo again**:
   - Delete real debt or clear localStorage
   - Verify returns to clean demo state

### ✅ PASS/FAIL: ___

---

## ✅ Test 4: AI Flow Consistency  

**Objective**: Verify AI coach sees identical debt data as visual interfaces.

### Steps:
1. **Setup debt data**:
   - Use demo data or add 2-3 real debts
   - Note exact names, balances, order from `/debts`

2. **Test AI consistency**:
   - Go to `/ai/coach`
   - Start conversation: "What are my current debts?"
   - Verify AI response lists same debts with same balances
   - Check order matches `/debts` page

3. **Cross-reference data sources** (console):
   ```javascript
   debugDataSync.checkAllDataSources();
   debugDataSync.testAIConsistency();
   ```

### ✅ PASS/FAIL: ___

---

## ✅ Test 5: History Tracking Integration

**Objective**: Verify debt updates append to history consistently across pages.

### Steps:
1. **Initial state**:
   - Have some debt data loaded
   - Note current balance of first debt

2. **Update with history**:
   - Go to `/debts`
   - Update first debt balance (e.g., £2,461 → £2,300)
   - Save with note: "July payment made"

3. **Check history integration**:
   - On `/debts`: Click "📜 View History" for that debt
   - Verify history shows: £2,461 → £2,300, with note
   - Navigate to other pages that might show history
   - Verify same history appears everywhere

4. **Test CSV export**:
   - Export debt history to CSV
   - Verify shows proper timeline with changes

### ✅ PASS/FAIL: ___

---

## 🎯 Success Criteria

All 5 tests must PASS for bulletproof data layer:

- [ ] **Test 1**: Same demo data across all pages  
- [ ] **Test 2**: Real-time sync without refresh
- [ ] **Test 3**: Clean demo ↔ real data transitions
- [ ] **Test 4**: AI sees exact same debt data  
- [ ] **Test 5**: History tracking works everywhere

## 🔧 Debug Commands

```javascript
// Monitor all data sources
debugDataSync.checkAllDataSources();

// Watch localStorage changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key.includes('debt')) {
    console.log('🔄 STORAGE UPDATE:', key, value.slice(0, 100));
  }
  return originalSetItem.call(this, key, value);
};

// Check what AI would see
debugDataSync.testAIConsistency();
```

---

**Final Status**: ✅ BULLETPROOF / ❌ NEEDS WORK

**Notes**: ___________________________________