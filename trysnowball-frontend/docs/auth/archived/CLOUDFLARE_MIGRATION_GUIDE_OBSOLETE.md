# 🚀 Supabase → Cloudflare Migration Guide

## **✅ What's Been Created**

### **1. Cloudflare Worker Auth API**
- `cloudflare-workers/auth.js` - Complete JWT-based auth API
- `cloudflare-workers/wrangler.toml` - Deployment configuration
- `cloudflare-workers/package.json` - Dependencies

**Endpoints Created:**
- `POST /auth/login` - Email/password authentication
- `POST /auth/register` - User registration  
- `GET /auth/check` - Token verification
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Logout

### **2. JWT Authentication System**
- `src/utils/jwtAuth.js` - JWT utilities and API calls
- `src/contexts/UserContextJWT.js` - JWT-based UserContext
- `src/utils/authDiagnosticsJWT.js` - JWT debugging tools

### **3. Analysis & Documentation**
- `SUPABASE_MIGRATION_ANALYSIS.md` - Complete dependency analysis
- `CLOUDFLARE_MIGRATION_GUIDE.md` - This migration guide

---

## **🚀 Deployment Steps**

### **Phase 1: Deploy Cloudflare Worker**

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Setup Worker:**
   ```bash
   cd cloudflare-workers
   npm install
   wrangler login
   ```

3. **Set Environment Variables:**
   ```bash
   wrangler secret put JWT_SECRET
   # Enter a strong secret key when prompted
   
   wrangler secret put PRO_USER_EMAILS  
   # Enter: test@trysnowball.local,demo@trysnowball.local
   ```

4. **Deploy Worker:**
   ```bash
   wrangler deploy
   ```

5. **Test Worker:**
   ```bash
   curl -X POST https://your-worker.your-subdomain.workers.dev/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@trysnowball.local","password":"testpass123"}'
   ```

### **Phase 2: Update Frontend**

1. **Add Environment Variable:**
   ```bash
   # In Cloudflare Pages → Settings → Environment Variables
   REACT_APP_AUTH_API_URL=https://your-worker.your-subdomain.workers.dev/auth
   ```

2. **Switch to JWT Context:**
   ```javascript
   // In src/App.js, replace:
   import { UserProvider } from './contexts/UserContext';
   // With:
   import { UserProvider } from './contexts/UserContextJWT';
   ```

3. **Update index.js:**
   ```javascript
   // In src/index.js, replace:
   import('./utils/authDiagnostics');
   // With:
   import('./utils/authDiagnosticsJWT');
   ```

### **Phase 3: Test & Verify**

1. **Test in Browser Console:**
   ```javascript
   // Should now be available:
   jwtAuthDiagnostics.runFullDiagnostic()
   jwtAuthDiagnostics.testLoginFlow()
   ```

2. **Test Login Flow:**
   - Go to `/login`
   - Use: `test@trysnowball.local` / `testpass123`
   - Verify Pro features work

3. **Verify Pro Gating:**
   - Test `/coach` and `/ai-report` access
   - Confirm free users are blocked

---

## **🧪 Testing Accounts**

The Worker includes these demo accounts:

| Email | Password | Pro Status |
|-------|----------|------------|
| `demo@trysnowball.local` | `demo123` | ✅ Pro |
| `test@trysnowball.local` | `testpass123` | ✅ Pro |
| `free@trysnowball.local` | `freeuser123` | ❌ Free |

---

## **🎯 Gradual Migration Strategy**

### **Option A: Full Switch (Recommended)**
Replace all Supabase references at once:

1. Deploy Worker
2. Switch UserContext
3. Update all imports
4. Remove Supabase dependencies

### **Option B: Side-by-Side Testing**
Keep both systems temporarily:

1. Deploy Worker
2. Test with JWT context on staging
3. Keep Supabase for production
4. Switch when confident

---

## **🔧 Configuration Updates Needed**

### **1. Remove Supabase Environment Variables:**
```bash
# Remove from Cloudflare Pages:
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_KEY
```

### **2. Update CSP Headers:**
```html
<!-- In public/index.html and public/_headers -->
<!-- Remove: -->
https://hiddghpqifvstpgehlyx.supabase.co https://*.supabase.co

<!-- Add: -->
https://your-worker.your-subdomain.workers.dev
```

### **3. Update Package.json:**
```bash
# Remove:
npm uninstall @supabase/supabase-js @supabase/auth-js

# Add (optional, for enhanced JWT handling):
npm install jsonwebtoken
```

---

## **🚨 Potential Issues & Solutions**

### **CORS Errors**
- Ensure Worker returns proper CORS headers
- Check `REACT_APP_AUTH_API_URL` matches Worker URL

### **Token Expiry**
- JWT tokens expire in 24 hours
- Refresh mechanism is implemented
- Clear localStorage if issues persist

### **Pro Status Not Working**
- Check JWT payload in browser devtools
- Verify `user_metadata.isPro` is set correctly
- Test with `jwtAuthDiagnostics.verifyProStatus()`

### **Development Mode**
- Dev bypass still works on `localhost`
- Uses mock user with Pro status
- No API calls needed in development

---

## **📋 Migration Checklist**

### **Pre-Deployment**
- [ ] Worker tested locally
- [ ] Environment variables set
- [ ] Demo accounts work
- [ ] CORS headers correct

### **Deployment**
- [ ] Worker deployed to Cloudflare
- [ ] Frontend environment variables updated
- [ ] UserContext switched to JWT version
- [ ] Auth diagnostics updated

### **Post-Deployment**
- [ ] Login flow tested
- [ ] Pro gating verified
- [ ] Debug tools working
- [ ] CSP headers updated
- [ ] Supabase dependencies removed

### **Cleanup**
- [ ] Old Supabase files deleted
- [ ] Environment variables removed
- [ ] Documentation updated
- [ ] Tests updated

---

## **🎉 Expected Benefits**

1. **No External Dependencies** - Self-contained auth
2. **Better Performance** - Faster than Supabase calls
3. **Full Control** - Custom logic and Pro gating
4. **Cost Effective** - No Supabase subscription needed
5. **Cloudflare Integration** - Native CF Pages/Workers

---

## **🆘 Rollback Plan**

If issues arise:

1. **Quick Rollback:**
   ```javascript
   // Revert UserContext import in App.js
   import { UserProvider } from './contexts/UserContext';
   ```

2. **Full Rollback:**
   - Restore Supabase environment variables
   - Revert all file changes
   - Keep both systems until stable

---

## **🔜 Future Enhancements**

1. **Data Storage Migration:**
   - Move from localStorage to Cloudflare D1
   - Implement data sync API
   - Add offline capability

2. **Enhanced Security:**
   - Add rate limiting
   - Implement refresh tokens
   - Add password hashing with bcrypt

3. **Advanced Features:**
   - Magic link authentication
   - Social login providers
   - Multi-tenant support

**Estimated Migration Time:** 1-2 hours
**Risk Level:** Low (can rollback easily)
**Testing Required:** 30 minutes