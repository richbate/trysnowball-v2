# 🔐 TrySnowball Authentication Debug Guide (CP-1)

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## 🚨 **Quick Diagnosis for Auth Issues**

**Current Architecture**: TrySnowball uses **local-only authentication** with demo mode for development. No Supabase, no server-side sessions.

---

## **🛡️ Current Auth Architecture (CP-1)**

### **Demo Mode (Development)**
- **No real authentication** - All features available for testing
- **Demo data** - Realistic examples for development and screenshots  
- **No user accounts** - Stateless, client-side only

### **Production Deployment**
- **Static hosting** - Cloudflare Pages, no server-side auth
- **Local storage only** - All data stays on user's device via IndexedDB
- **No user registration** - Direct access to debt tracking features

---

## **🔍 Auth Flow Debugging**

### **Issue**: "Login Required" or Auth Errors
**Likely Cause**: Legacy auth code still trying to connect to removed Supabase

**✅ Safe Check:**
```javascript
// Check if any legacy auth code exists
grep -r "supabase\|getSession\|getUser" src/
```

**✅ Safe Fix:**  
```javascript
// Remove any legacy auth imports
// import { supabase } from './supabase';  ❌ Remove this

// Use demo mode instead
const isDemoMode = true; // Always true in current architecture
```

### **Issue**: User Context Errors
**Likely Cause**: Components expecting user authentication state

**✅ Safe Check:**
```javascript
// Look for useAuth or UserContext usage
grep -r "useAuth\|UserContext" src/
```

**✅ Safe Fix:**
```javascript
// Replace auth context with demo user
const mockUser = {
  id: 'demo-user',
  email: 'demo@example.com', 
  isAuthenticated: true
};
```

---

## **🧹 Cleanup Legacy Auth References**

### **Removed Components** (Safe to Delete)
- ❌ `LoginMagic.jsx` - Magic link authentication 
- ❌ `LoginSuccess.jsx` - Post-login redirect handling
- ❌ `AuthContext.tsx` - Supabase session management
- ❌ `useAuth.ts` - Authentication hook
- ❌ `magicLinkAuth.js` - Magic link utilities

### **Removed Configuration**
- ❌ `REACT_APP_SUPABASE_URL` - Supabase project URL
- ❌ `REACT_APP_SUPABASE_ANON_KEY` - Supabase API key
- ❌ `/auth/me` endpoints - Server-side user data
- ❌ JWT token storage - No authentication tokens needed

### **Safe Removal Commands**
```bash
# Remove auth environment variables
unset REACT_APP_SUPABASE_URL
unset REACT_APP_SUPABASE_ANON_KEY

# Remove auth-related packages (if any)
npm uninstall @supabase/supabase-js

# Clean up auth routes
# Remove any /auth/* routes from your routing
```

---

## **✅ Current Safe Patterns**

### **Demo Data Access**
```javascript
// ✅ Safe demo user simulation
const useAuth = () => ({
  user: { id: 'demo', email: 'demo@example.com' },
  isAuthenticated: true,
  loading: false
});

// ✅ Safe data access (no auth required)
const { debts, metrics } = useDebts();
const data = await debtsManager.getData();
```

### **Development Environment Check**
```javascript
// ✅ Safe environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const allowDemoData = isDevelopment || window.location.hostname === 'localhost';
```

### **Pro Feature Access (Future)**
```javascript
// ✅ Safe Pro status (when implemented)
const { settings } = useSettings();
const isPro = settings?.subscription?.status === 'active';
```

---

## **🚫 Dangerous Legacy Patterns to Avoid**

### **❌ Supabase References**
```javascript
// ❌ All of these will cause errors:
import { supabase } from './supabase';
const session = await supabase.auth.getSession();
const user = await supabase.auth.getUser();
await supabase.auth.signInWithOtp({ email });
```

### **❌ Server-Side Auth Calls**
```javascript
// ❌ These endpoints don't exist:
fetch('/auth/me');
fetch('/auth/verify');
fetch('/api/user');
```

### **❌ Auth State Management**
```javascript
// ❌ Complex auth state (removed):
const [user, setUser] = useState(null);
const [session, setSession] = useState(null);
const [loading, setLoading] = useState(true);
```

---

## **🎯 Troubleshooting Common Issues**

### **1. "Supabase is not defined" Errors**
**Fix**: Remove all Supabase imports and calls
```javascript
// ❌ Remove these
import { supabase } from './lib/supabase';
const { data } = await supabase.from('users').select();

// ✅ Replace with demo data
const { debts } = useDebts(); // Uses IndexedDB via debtsManager
```

### **2. "useAuth is not defined" Errors**  
**Fix**: Replace with demo auth or remove auth dependency
```javascript
// ❌ Remove auth dependency
const { user } = useAuth();

// ✅ Replace with demo user or remove check
const user = { id: 'demo', isAuthenticated: true };
```

### **3. JWT Token Storage Errors**
**Fix**: Remove token storage completely
```javascript
// ❌ Remove token operations
localStorage.getItem('supabase.auth.token');
localStorage.setItem('auth-token', token);

// ✅ No tokens needed in current architecture
// Just use demo mode
```

---

## **📋 Auth Cleanup Checklist**

When removing legacy auth code:

- [ ] **Remove Supabase imports** - No more `import { supabase }`
- [ ] **Delete auth components** - LoginMagic, LoginSuccess, AuthContext
- [ ] **Clean environment vars** - Remove SUPABASE_URL and ANON_KEY
- [ ] **Remove auth routes** - Delete /auth/* route handlers
- [ ] **Update tests** - Remove auth-related test mocks
- [ ] **Clean up docs** - Remove Supabase references from documentation
- [ ] **Verify build** - Ensure `npm run build` succeeds without auth deps

---

## **🔄 Migration from Legacy Auth**

### **If You Have Legacy Auth Code:**

1. **Identify Dependencies**
```bash
grep -r "supabase\|useAuth\|AuthContext" src/
```

2. **Replace with Demo Patterns**  
```javascript
// Before: Auth-gated features
const { user, isAuthenticated } = useAuth();
if (!isAuthenticated) return <LoginPrompt />;

// After: Open access with demo data
const user = { id: 'demo-user' }; // Always authenticated
```

3. **Clean Up Gradually**
   - Start with components that break without auth
   - Replace auth checks with demo mode
   - Remove auth imports last

---

## **🚀 Current Production Architecture**

**TrySnowball CP-1** is designed for **maximum simplicity**:

- **No user accounts** - Direct access to debt tracking
- **No server dependency** - Pure client-side React app
- **Local data only** - IndexedDB via debtsManager facade
- **Demo-friendly** - Easy screenshots and testing
- **Privacy-focused** - No data leaves user's device

This eliminates entire classes of auth bugs, reduces complexity, and ensures the app works reliably without server dependencies.

---

**Remember**: If you see any Supabase references in the codebase, they should be removed. The current architecture is auth-free and works better for the debt tracking use case.