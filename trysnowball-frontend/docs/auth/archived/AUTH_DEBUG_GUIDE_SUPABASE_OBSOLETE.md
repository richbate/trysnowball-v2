# 🔐 TrySnowball Authentication Debug Guide

## 🚨 **CRITICAL: Universal Data Layer Safety Rules**

**These rules apply to ALL data managers (authManager, debtsManager, etc.) - violating them causes production crashes.**

## 🚫 **The #1 Rule: NEVER Access .data Directly**

```javascript
// 🚫 THESE PATTERNS CAUSED YOUR RECENT CRASHES:
const userData = authManager.data.user        // ❌ undefined crashes
const debts = debtsManager.data.debts        // ❌ THIS caused table crashes
const session = supabase.internal.session   // ❌ breaking changes

// ✅ ALWAYS USE ASYNC FACADE METHODS:
const userData = await authManager.getUser()     // ✅ Safe
const data = await debtsManager.getData()        // ✅ Safe  
const session = await authManager.getSession()   // ✅ Safe
```

**Why This Matters:** After CP-1 migration, `.data` properties were removed but old code still referenced them, causing `undefined.property` crashes in production.

---

## **🛡️ Data Safety First - Avoid Common Pitfalls**

### **❌ Never Access Internal State Directly (Expanded Examples)**
```javascript
// 🚫 ALL THESE PATTERNS ARE FORBIDDEN AND CAUSE CRASHES:
const userData = authManager.data.user        // undefined crashes
const debts = debtsManager.data.debts        // undefined crashes (recent fix)
const metrics = debtsManager.data.metrics    // undefined crashes  
const session = supabase.internal.session   // breaking changes
const user = useAuth().data.currentUser     // undefined crashes

// ✅ ALWAYS USE THESE SAFE ASYNC PATTERNS:
const userData = await authManager.getUser()
const {debts} = await debtsManager.getData()  
const metrics = await debtsManager.getMetrics()
const session = await authManager.getSession()
const {user} = useAuth()  // via safe context hook
```

### **❌ Never Assume Data Shapes**
```javascript
// 🚫 NEVER DO THIS - Assumes shape exists
const email = user.profile.email.toLowerCase()  // crashes if null
const isPro = session.metadata.isPro === true  // undefined errors

// ✅ ALWAYS DO THIS - Defensive access
const email = user?.profile?.email?.toLowerCase() || 'unknown'
const isPro = Boolean(session?.metadata?.isPro)
```

### **❌ Never Mix Sync/Async Patterns**
```javascript
// 🚫 NEVER DO THIS - Mixing patterns
const [user, setUser] = useState(authManager.currentUser)  // sync state
useEffect(() => { /* async calls */ }, [])  // async effect

// ✅ ALWAYS DO THIS - Consistent async pattern
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)
useEffect(() => {
  const loadUser = async () => {
    const userData = await authManager.getUser()
    setUser(userData)
    setLoading(false)
  }
  loadUser()
}, [])
```

---

## **1. 🛠️ Visual Debug Panel**

**Access**: Click the red `🐛 Auth Debug` button in the top-left corner (development only)

**What it shows**:
- ✅ **AuthContext State**: Loading status, user data, auth ready state
- ✅ **Supabase Session**: Current session, expiration, provider, user metadata  
- ✅ **Premium Gate Status**: Access permissions, blocking reasons, dev overrides
- ✅ **Real-time Auth Events**: Live auth state changes as they happen
- ✅ **Environment Config**: Node env, Supabase URLs, feature flags
- ✅ **Data Layer Health**: IndexedDB status, facade integrity, async state

**Quick Actions**:
- `Log Session` - Dumps session data to console (safe)
- `Log AuthContext` - Shows full context state (normalized)
- `🆕 Verify Pro` - Deep Pro status analysis (async safe)
- `🆕 Test Refresh` - Token refresh mechanism test (proper cancellation)
- `🆕 Smart Clear` - Enhanced cleanup with monitoring (atomic)
- `Sign Out` - Clean logout and redirect (state cleanup)

---

## **2. 🔍 Console Diagnostics (Safe Commands)**

**Access**: Open browser console, run these commands:

### **Full System Check (Async Safe)**
```javascript
await authDiagnostics.runFullDiagnostic()
```
**Checks**: Environment vars, Supabase connection, session validity, IndexedDB health, facade integrity

### **Quick Session Status (Non-blocking)**
```javascript
await authDiagnostics.quickSessionCheck()
```
**Shows**: Active session, user email, Pro status, any errors (all via safe facades)

### **🆕 Pro Status Deep Check (Defensive)**
```javascript
await authDiagnostics.verifyProStatus()
```
**Shows**: Detailed Pro status, environment overrides, effective access, safe metadata access

### **🆕 Token Refresh Testing (Cancellable)**
```javascript
await authDiagnostics.testTokenRefresh()
```
**Tests**: Token expiry, refresh mechanism, timing, proper async cancellation

### **Test Login Flow (Atomic)**
```javascript
await authDiagnostics.testLoginFlow('test@example.com', 'password123')
```
**Tests**: Sign up → Sign in → Session creation (all operations atomic)

### **🆕 Enhanced Smart Clear (Safe Reset)**
```javascript
await authDiagnostics.clearAuthAndReload()
```
**Clears**: All auth tokens, IndexedDB, localStorage → monitored reload with proper cleanup

---

## **3. 🎯 Common Issues & Safe Fixes**

### **Issue**: Pages showing "Sign In Required" even after login
**Likely Cause**: AuthContext not syncing with Supabase session
**Safe Check**: 
- Debug panel shows AuthContext `user: null` but Supabase has active session
- Auth events not firing in debug panel
- **Never check**: Direct internal state access

**Safe Fix**: 
```javascript
// ✅ Check AuthContext useEffect dependencies
useEffect(() => {
  let cancelled = false
  const loadAuth = async () => {
    const session = await supabase.auth.getSession()
    if (cancelled) return  // Prevent race conditions
    if (session?.user) {
      setUser(session.user)
    }
  }
  loadAuth()
  return () => { cancelled = true }  // Cleanup
}, [])  // Proper dependencies
```

### **Issue**: "Pro Feature" blocking despite Pro account  
**Likely Cause**: `isPro` metadata not loading safely
**Safe Check**:
- Debug panel shows `isPro: false` in AuthContext (via safe getter)
- Supabase session metadata access throws errors

**Safe Fix**:
```javascript
// ✅ Defensive metadata access
const isPro = Boolean(session?.user?.user_metadata?.isPro ?? false)
// ✅ Never assume metadata exists
const metadata = session?.user?.user_metadata || {}
```

### **Issue**: Session expires immediately or causes crashes
**Likely Cause**: Unsafe token access or state mutation
**Safe Check**:
- Debug panel shows session errors (caught safely)
- Console shows async operation warnings

**Safe Fix**:
```javascript
// ✅ Safe session refresh with cancellation
useEffect(() => {
  let refreshTimer
  let cancelled = false
  
  const scheduleRefresh = async () => {
    try {
      const session = await supabase.auth.getSession()
      if (cancelled || !session?.expires_at) return
      
      const expiresAt = new Date(session.expires_at * 1000)
      const refreshAt = new Date(expiresAt.getTime() - 60000) // 1min early
      
      refreshTimer = setTimeout(async () => {
        if (!cancelled) {
          await supabase.auth.refreshSession()
        }
      }, refreshAt.getTime() - Date.now())
      
    } catch (error) {
      if (!cancelled) {
        console.error('[Auth] Refresh error:', error)
      }
    }
  }
  
  scheduleRefresh()
  return () => {
    cancelled = true
    if (refreshTimer) clearTimeout(refreshTimer)
  }
}, [])
```

### **Issue**: Development bypass not working
**Likely Cause**: Unsafe environment detection
**Safe Fix**:
```javascript
// ✅ Safe environment check
const isDev = process.env.NODE_ENV === 'development' && 
              typeof window !== 'undefined' && 
              (window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1')
```

---

## **4. 🔧 Environment Variables Checklist**

Required for authentication:
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

**Safe Validation**:
```javascript
// ✅ Safe env validation
const validateEnv = () => {
  const required = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY']
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
}
```

---

## **5. 📋 Safe Step-by-Step Triage Process**

1. **Open Debug Panel** → Check AuthContext state (never internal state)
2. **Run Async Diagnostics** → `await authDiagnostics.runFullDiagnostic()`
3. **Check Auth Events** → Verify proper async event handling
4. **Test Environment** → Confirm safe dev mode detection
5. **Atomic Reset** → Use safe cleanup: `await authDiagnostics.clearAuthAndReload()`

---

## **6. 🚀 Production vs Development (Safe Patterns)**

### **Development (localhost)**
- Safe dev user simulation (no direct state mutation)
- Shows Auth Debug Panel (read-only state inspection)
- Console diagnostics available (all async-safe)
- Safe environment bypass patterns

### **Production**  
- Real Supabase authentication (proper error boundaries)
- No debug tools visible (security)
- Stricter validation (defensive programming)
- Pro gating enforced (fail-safe defaults)

---

## **7. 🛡️ Anti-Patterns That Caused Recent Production Crashes**

### **❌ Direct State Access (The Root Cause)**
```javascript
// 🚫 THESE EXACT PATTERNS CAUSED YOUR CRASHES:
const user = authContext._internalUser
const debts = debtsManager.data.debts     // ❌ Recent table crashes
const session = supabase._session
const token = localStorage.getItem('supabase.auth.token')

// Why they fail: After CP-1, .data was removed but code still referenced it
```

### **❌ Synchronous Assumptions (Also Dangerous)**  
```javascript
// 🚫 NEVER ASSUME DATA IS IMMEDIATELY AVAILABLE:
const user = getCurrentUser()           // sync call crashes
const debts = getDebts()               // sync call crashes  
setUser(user)                          // immediate state update crashes
setDebts(debts)                        // immediate state update crashes
```

### **❌ Unprotected Operations (Recipe for Crashes)**
```javascript
// 🚫 NEVER SKIP ERROR HANDLING:
useEffect(() => {
  debtsManager.getData()                 // no await = crash
  const debts = debtsManager.data.debts  // direct access = crash
  setDebts(debts)                        // no null checks = crash
}, [])
```

### **✅ Safe Patterns Always**
```javascript
// ✅ ALWAYS
useEffect(() => {
  let cancelled = false
  
  const loadAuth = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (cancelled) return
      
      if (error) {
        console.error('[Auth] Session error:', error)
        return
      }
      
      setUser(data?.session?.user ?? null)
      setLoading(false)
      
    } catch (error) {
      if (!cancelled) {
        console.error('[Auth] Load error:', error)
        setUser(null)
        setLoading(false)
      }
    }
  }
  
  loadAuth()
  return () => { cancelled = true }
}, [])
```

---

## **Example Safe Debug Session**

```bash
# 1. Safe visual check
[Click Debug Panel] → See AuthContext shows "loading: true, user: null"

# 2. Safe console check  
await authDiagnostics.quickSessionCheck()
# → Shows async session load status, no direct state access

# 3. Safe diagnosis
# AuthContext loading stuck → check useEffect cancellation

# 4. Safe fix
# Add proper cleanup and error handling to auth hooks

# 5. Safe verify
[Debug Panel] → AuthContext now shows correct loaded state
await authDiagnostics.verifyProStatus()  # Double-check with async call
```

The debug tools provide **safe, real-time visibility** into authentication state without risking data layer corruption or undefined access crashes. All operations use defensive programming and proper async patterns.

## **🎯 Key Principles**

1. **Never access internal state directly** - Always use facade methods
2. **Always handle async operations properly** - With cancellation and error handling  
3. **Use defensive programming** - Check for null/undefined before access
4. **Maintain data layer separation** - Auth facade → Supabase, never mix
5. **Clean up resources** - Cancel timers, requests, and subscriptions
6. **Fail safe** - Default to secure/logged-out state on errors