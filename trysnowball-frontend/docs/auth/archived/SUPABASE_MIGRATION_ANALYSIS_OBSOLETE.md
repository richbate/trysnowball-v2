# 🔄 Supabase → Cloudflare Migration Analysis

## **📊 Current Supabase Usage Overview**

### **Files with Supabase Dependencies:**
1. `src/Supabase.js` - Main client configuration
2. `src/contexts/UserContext.js` - Authentication & data management
3. `src/utils/authDiagnostics.js` - Authentication debugging tools
4. `src/components/AuthDebugPanel.jsx` - Debug UI component
5. `src/pages/Login.jsx` - Login functionality
6. `src/pages/Profile.jsx` - User profile/logout
7. `package.json` - Dependencies
8. `public/index.html` & `public/_headers` - CSP policies

---

## **🔐 Authentication Calls to Replace**

### **Core Auth Functions:**
| Current Supabase Call | Usage | Files | Cloudflare Replacement |
|----------------------|-------|-------|----------------------|
| `supabase.auth.getSession()` | Get current session | UserContext, authDiagnostics, AuthDebugPanel | `checkJWT()` function |
| `supabase.auth.onAuthStateChange()` | Listen for auth changes | UserContext, AuthDebugPanel | Local JWT validation |
| `supabase.auth.signInWithOtp()` | Magic link login | Login.jsx | Worker `/auth/login` |
| `supabase.auth.signInWithPassword()` | Email/password login | authDiagnostics | Worker `/auth/login` |
| `supabase.auth.signUp()` | User registration | authDiagnostics | Worker `/auth/register` |
| `supabase.auth.signOut()` | Logout | Profile.jsx, authDiagnostics | Clear localStorage |
| `supabase.auth.getUser()` | Get user details | authDiagnostics | JWT payload |
| `supabase.auth.refreshSession()` | Refresh tokens | authDiagnostics | Worker `/auth/refresh` |

---

## **🗄️ Database Calls to Replace**

### **Data Storage Functions:**
| Current Supabase Call | Usage | Files | Cloudflare Replacement |
|----------------------|-------|-------|----------------------|
| `supabase.from('debts').select('*')` | Load user debts | UserContext.js | Cloudflare D1 or KV |
| `supabase.from('debts').insert()` | Save debts | UserContext.js | Cloudflare D1 or KV |
| `supabase.from('debts').delete()` | Delete debts | UserContext.js | Cloudflare D1 or KV |
| `supabase.from('payment_history').select()` | Load payments | UserContext.js | Cloudflare D1 or KV |

---

## **🛠️ Required Cloudflare Workers**

### **1. Authentication Worker (`auth.js`)**
```javascript
// /auth/login - POST
// /auth/register - POST  
// /auth/logout - POST
// /auth/check - GET
// /auth/refresh - POST
```

### **2. Data API Worker (`api.js`)**
```javascript
// /api/debts - GET, POST, DELETE
// /api/payments - GET, POST
```

---

## **🔧 Environment Variables to Migrate**

### **Remove:**
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_KEY`

### **Add to Cloudflare:**
- `JWT_SECRET` - For signing/verifying tokens
- `PRO_USER_EMAILS` - Comma-separated list for Pro access
- `ENCRYPTION_KEY` - For data encryption (optional)

---

## **📋 Migration Steps Priority**

### **Phase 1: Auth Infrastructure**
1. ✅ Create Cloudflare Worker auth API
2. ✅ Implement JWT-based authentication
3. ✅ Update UserContext.js
4. ✅ Update authDiagnostics.js

### **Phase 2: Data Migration**
1. ⏳ Choose storage solution (D1 vs KV vs localStorage-only)
2. ⏳ Implement data API
3. ⏳ Update UserContext data methods

### **Phase 3: Cleanup**
1. ⏳ Remove Supabase dependencies
2. ⏳ Update CSP headers
3. ⏳ Update tests
4. ⏳ Clean up documentation

---

## **🎯 Quick Win Strategy**

Since your app primarily uses **localStorage** for debt data, we can:

1. **Start with auth-only migration** - Replace Supabase auth with Cloudflare Workers
2. **Keep localStorage** for debt data initially
3. **Add D1/KV later** if cloud sync becomes important

This minimizes risk and allows you to test the auth system independently.

---

## **🚀 Next Actions**

1. Create Cloudflare Worker auth stub
2. Implement JWT utilities
3. Refactor UserContext.js
4. Update debug tools
5. Test & deploy

**Estimated Time:** 2-3 hours for auth migration, 1-2 hours for cleanup.