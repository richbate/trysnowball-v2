---
**⚠️ LEGACY V1 REFERENCE DOCUMENT**
This document contains outdated information from the original TrySnowball frontend.
Implementation details may no longer be current.
For current implementation, see CP-series documentation.
---

# Authentication System Guide (V1 Legacy)

**Status**: Consolidated and production-ready as of August 2025

This document describes TrySnowball's authentication architecture and provides guidelines for developers working with user authentication and authorization.

---

## 🏗️ Architecture Overview

TrySnowball uses a **single source of truth** authentication system built around `AuthContext` with magic link authentication powered by Cloudflare Workers.

### Core Components

```
[Magic Link Email] 
       ↓
[Cloudflare Auth Worker] ── Sets httpOnly cookie ── [JWT Token]
       ↓                                                 ↓
[AuthContext Provider] ─────────────── Reads token ─────┘
       ↓
[useAuth() Hook] ── Provides user state & helpers
       ↓
[All Components] ── Single consistent auth interface
```

---

## 🔑 The useAuth() Hook

**✅ CORRECT: Use this everywhere**

```typescript
import { useAuth } from '../contexts/AuthContext.tsx';

const MyComponent = () => {
  const { 
    user,              // User object or null
    authReady,         // Boolean - is auth state loaded?
    isAuthenticated,   // Boolean - is user logged in?
    isPro,             // Boolean - computed Pro status
    entitlement,       // Subscription details
    logout,            // Logout function
    refreshAuth        // Refresh auth state
  } = useAuth();

  // Loading state
  if (!authReady) return <LoadingSpinner />;
  
  // Authentication check
  if (!isAuthenticated) return <LoginPrompt />;
  
  // Feature gating
  if (!isPro) return <UpgradePrompt />;
  
  return <ProFeature />;
};
```

### Computed Helpers

The hook provides pre-computed values to eliminate repetitive logic:

- **`isPro`**: `!!user?.isPro || !!entitlement?.isPro`
- **`isAuthenticated`**: Alias for `isAuthed` (compatibility)

---

## ❌ What NOT to Use

### useUser() - DEPRECATED
```typescript
// ❌ NEVER USE - Returns null, breaks features
import { useUser } from '../contexts/UserContext';
const { user } = useUser(); // Always null!
```

**Why it's dangerous:**
- Always returns `user: null`
- Breaks AI coach, billing, profile pages
- Causes feature gating to fail
- Creates confusion about auth state

### Manual isPro Checks
```typescript
// ❌ DON'T DO THIS
const isPro = user?.isPro || user?.plan === 'pro' || user?.isFounder;

// ✅ DO THIS INSTEAD
const { isPro } = useAuth();
```

---

## 🔒 Authentication Flow

### Magic Link Journey

1. **User requests login** → `POST /auth/request-link`
2. **Email sent** with magic link → `https://trysnowball.co.uk/auth/verify?token=xyz`
3. **User clicks link** → Auth worker verifies token
4. **Cookie set** → `ts_session` httpOnly cookie with JWT
5. **Redirect** → `/auth/success?token=jwt`
6. **LoginSuccess component** → Calls `refreshAuth()` 
7. **Auth state updated** → User logged in across app

### Token Storage & Lifecycle

- **Primary**: `ts_session` httpOnly cookie (secure)
- **Fallback**: `ts_jwt` localStorage (for compatibility)
- **Lifetime**: 14 days with automatic refresh 24h before expiry
- **Background Refresh**: Seamless token renewal without user interaction
- **User Warnings**: Modal alerts when <24h remaining
- **Auth worker** reads from both sources with zero-trust validation

---

## 🛡️ Security Model

### JWT Token Structure
```json
{
  "sub": "user_abc123",
  "email": "user@example.com", 
  "isPro": false,
  "plan": "free",
  "exp": 1723456789,
  "iat": 1723370389
}
```

### Cookie Security
- **HttpOnly**: Prevents XSS access
- **Secure**: HTTPS only
- **SameSite=Lax**: CSRF protection
- **24h expiry**: Matches JWT lifetime

### Automatic Token Refresh

**Implementation**: `src/hooks/useTokenRefresh.js` + `src/components/TokenExpiryModal.jsx`

- **Trigger**: 24 hours before token expiry
- **Frequency**: Health checks every 60 minutes  
- **Background**: Silent refresh without user interruption
- **Warning System**: Modal shows when <24h remaining
- **Manual Actions**: Users can refresh, logout, or dismiss
- **Event-Driven**: Uses custom events for UI coordination

```javascript
// Background refresh cycle
const { isExpired, timeToExpiry } = getTokenExpiry(24 * 60); // 24h buffer
if (isExpired) {
  await refreshToken(); // Silent refresh
}
```

---

## 🎯 Usage Patterns

### Loading States
```typescript
const { authReady, user } = useAuth();

// Wait for auth to be determined
if (!authReady) {
  return <div>Loading...</div>;
}

// Now safe to check authentication
if (!user) {
  return <LoginPrompt />;
}
```

### Feature Gating
```typescript
const { isPro, user } = useAuth();

// Simple Pro check
if (!isPro) {
  return <UpgradePrompt feature="AI Coach" />;
}

// Complex logic (still prefer computed helpers)
const canAccessFeature = isPro && user?.betaAccess;
```

### Protected Routes
```typescript
const ProtectedRoute = ({ children }) => {
  const { authReady, isAuthenticated } = useAuth();
  
  if (!authReady) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};
```

---

## 🧪 Testing

### Mock useAuth for Tests
```typescript
// Mock the auth hook
jest.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    authReady: true,
    user: { 
      id: 'test-user', 
      email: 'test@example.com',
      isPro: true 
    },
    isAuthenticated: true,
    isPro: true,
    entitlement: { isPro: true, plan: 'pro' },
    logout: jest.fn(),
    refreshAuth: jest.fn()
  })
}));
```

### Test Scenarios
- ✅ **Authenticated Pro user**
- ✅ **Authenticated Free user**  
- ✅ **Unauthenticated user**
- ✅ **Loading state** (`authReady: false`)

---

## 🔧 Development Guidelines

### DO ✅
- Always import from `AuthContext.tsx`
- Use computed helpers (`isPro`, `isAuthenticated`)
- Check `authReady` before accessing user state
- Handle loading states gracefully
- Use consistent patterns across components

### DON'T ❌
- Import from `UserContext` (deprecated)
- Manually compute `isPro` logic
- Access user state before `authReady: true`
- Mix different auth patterns in same component
- Assume user is always loaded

---

## 🐛 Common Issues & Solutions

### "User is null" Errors
**Problem**: Component importing from wrong context
```typescript
// ❌ Wrong - returns null
import { useUser } from '../contexts/UserContext';

// ✅ Correct
import { useAuth } from '../contexts/AuthContext.tsx';
```

### "isPro undefined" Errors  
**Problem**: Manual isPro logic with missing user
```typescript
// ❌ Breaks when user is null
const isPro = user.isPro;

// ✅ Safe computed helper
const { isPro } = useAuth();
```

### Authentication Not Persisting
**Problem**: Token/cookie mismatch between auth worker and frontend
- Check `ts_session` cookie is set by auth worker
- Verify frontend `fetchLocalUser()` calls `/auth/me`
- Ensure cookie domain matches (`trysnowball.co.uk`)

---

## 🚀 Production Checklist

### Before Deployment
- [ ] All components use `useAuth()` (not `useUser()`)
- [ ] Feature gates use computed `isPro` helper
- [ ] Loading states check `authReady`
- [ ] Auth worker routes exclude from `_redirects`
- [ ] JWT secrets configured in production
- [ ] SendGrid API key set for magic links

### Monitoring
- Watch for "Missing token" errors (auth worker issues)
- Monitor magic link click-through rates
- Track authentication success/failure rates
- Alert on high logout rates (session issues)

---

## 📚 Migration Guide

### From useUser() to useAuth()

**Old Pattern**:
```typescript
import { useUser } from '../contexts/UserContext';

const { user, loading, isAuthenticated } = useUser();
const isPro = user?.isPro || user?.plan === 'pro';

if (loading) return <Spinner />;
```

**New Pattern**:
```typescript  
import { useAuth } from '../contexts/AuthContext.tsx';

const { user, authReady, isAuthenticated, isPro } = useAuth();

if (!authReady) return <Spinner />;
```

### Benefits of Migration
- 🔒 **Reliable authentication** (no more null users)
- ⚡ **Better performance** (computed helpers)
- 🧪 **Easier testing** (single mock point)
- 🛠️ **Better DX** (consistent API)

---

## 🏛️ Architecture Decisions

### Why Single Context?
- **Eliminates confusion** about which hook to use
- **Prevents auth state divergence** between contexts
- **Simplifies testing** with single mock point
- **Reduces bundle size** (less duplicate code)

### Why Computed Helpers?
- **DRY principle** - logic defined once
- **Consistency** - same isPro logic everywhere  
- **Safety** - handles null user gracefully
- **Performance** - computed during render cycle

### Why Magic Links?
- **Passwordless** - better UX, no password management
- **Secure** - JWT tokens with expiry
- **Mobile-friendly** - works across devices
- **Low friction** - single click authentication

---

## 🔮 Future Enhancements

### Optional Improvements
- **Runtime invariants** for extra safety
- **ESLint rule** to prevent `useUser` imports  
- **Auth middleware** for API route protection
- **Session refresh** for long-lived sessions
- **Multi-factor auth** for Pro accounts

### When to Consider
- If authentication bugs appear in production
- If team grows and needs stricter guidelines
- If security requirements increase
- If session management becomes complex

---

## 📞 Support

### Common Commands
```bash
# Check auth worker deployment
npx wrangler worker deployment list

# View auth worker logs  
npx wrangler tail auth-magic-prod

# Test magic link generation
curl -X POST https://trysnowball.co.uk/auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check auth secrets
npx wrangler secret list --env production
```

### Debug URLs
- **Auth health**: https://trysnowball.co.uk/auth/health
- **Auth debug panel**: https://trysnowball.co.uk/dev/auth-debug (dev only)

---

**Last Updated**: August 30, 2025  
**Next Review**: December 2025