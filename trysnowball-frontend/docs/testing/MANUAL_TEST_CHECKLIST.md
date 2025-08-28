# 🧪 TrySnowball 5-Minute Test Checklist

## **Quick Login → My Plan → AI Coach Flow Test**

---

## **🔑 1. Login Flow** *(2 minutes)*

### **Step 1**: Open `/` and click **Sign In**
### **Step 2**: Log in with test accounts

**Test Account Setup**:
- **Pro User**: `pro@trysnowball.test` / `testpass123`
- **Free User**: `free@trysnowball.test` / `testpass123`

### **✅ Checks**:
- [ ] **Debug Panel**: Click `🐛 Auth Debug` → UserContext shows correct `email` and `isPro`
- [ ] **Console**: Run `authDiagnostics.quickSessionCheck()` → Session active ✅
- [ ] **Navigation**: User menu shows correct account status

**❌ Red Flags**: UserContext `user: null`, console session errors, blank profile

---

## **📄 2. My Plan Page** *(1 minute)*

### **Step 3**: Navigate to `/my-plan`

### **✅ Checks**:
- [ ] **Debt Data**: Debts loaded (from Supabase/localStorage) - shows debt cards or demo data
- [ ] **Payment Slider**: Move slider → Charts & metrics update instantly (no console errors)
- [ ] **Console Test**: Run `simulateSnowball([{balance:1000,rate:12,minPayment:50}], 100)` → Returns valid months

**❌ Red Flags**: Missing debts, slider doesn't update charts, console calculation errors

---

## **🤖 3. AI Coach Gating** *(1 minute)*

### **Step 4**: Navigate to `/coach`

### **✅ Pro User Checks**:
- [ ] **GPT Iframe**: Loads from `REACT_APP_CHATGPT_EMBED_URL` (not 404/blank)
- [ ] **AI Report**: Auto-preloaded, copy-to-clipboard works
- [ ] **No Blocking**: No "Upgrade" prompts

### **✅ Free User Checks**:
- [ ] **Upgrade Gate**: Shows "Upgrade to access AI Coach" (not blank screen)
- [ ] **Console**: Run `authDiagnostics.verifyProStatus()` → Confirms `isPro: false`
- [ ] **CTA**: Upgrade button present and functional

**❌ Red Flags**: Blank screen, console errors, wrong user type access

---

## **📊 4. AI Report** *(30 seconds)*

### **Step 5**: Visit `/ai-report`

### **✅ Checks**:
- [ ] **Debt Summary**: Active + cleared debts render with real data
- [ ] **Copy Functions**: Both JSON/Text copy buttons work (test in console)
- [ ] **Timestamp**: Report shows current generation time (prevents stale data)

**❌ Red Flags**: Empty report, broken copy buttons, old timestamps

---

## **🧪 5. Quick Edge Tests** *(30 seconds)*

### **Test A**: Storage Reset
```javascript
localStorage.clear(); // Clear data
// Login again → My Plan loads cleanly ✅
```

### **Test B**: Direct Access  
```
// Logout → Visit /coach directly
// Should show upgrade prompt or redirect ✅
```

### **Test C**: Environment Override
```bash
# Set REACT_APP_REQUIRE_PRO=false
# /coach should work for free users ✅
```

---

## **🚨 Common Failure Patterns**

### **Login Issues**:
- UserContext not syncing with Supabase session
- Token expiry causing silent failures
- Missing environment variables

### **My Plan Issues**:
- Debt data not loading from storage
- Chart updates breaking on slider change
- Calculation engine errors

### **AI Coach Issues**:
- Premium gating logic incorrect
- Environment variables missing
- GPT iframe not loading

### **Quick Debug Commands**:
```javascript
// Full system check
authDiagnostics.runFullDiagnostic()

// Pro status issue?
authDiagnostics.verifyProStatus()

// Token problems?
authDiagnostics.testTokenRefresh()

// Nuclear reset
authDiagnostics.clearAuthAndReload()
```

---

## **✅ Success Criteria**

**All Green**: Login → My Plan → AI Coach flows work for both Pro/Free users  
**Charts Update**: Payment slider changes trigger real-time updates  
**Gating Works**: Pro features properly protected  
**No Console Errors**: Clean execution throughout flow  

**Total Test Time**: ~5 minutes for complete flow validation