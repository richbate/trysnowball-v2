# TrySnowball API Contract - De Facto Reference

**Status**: Production-ready canonical API reference  
**Last Updated**: September 2025  
**Version**: 2.0  

This document serves as the **single source of truth** for all TrySnowball API endpoints across systems, suitable for PostHog analytics, documentation sites, and developer onboarding.

---

## 📡 **API BASE URLS**

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| **Production** | `https://trysnowball.co.uk` | Live user traffic |
| **Staging** | `https://staging-trysnowball.pages.dev` | Pre-production testing |
| **Development** | `http://localhost:3000` | Local development |

---

## 🏗️ **CORE API DOMAINS**

### 🏦 **DEBTS API** - Primary Operations
**Base Pattern**: `/api/clean/debts`

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/api/clean/debts` | GET | Fetch all user debts | ✅ Required | `{debts: UKDebt[]}` |
| `/api/clean/debts` | POST | Create new debt | ✅ Required | `{debt: UKDebt}` |
| `/api/clean/debts/:id` | PUT | Update existing debt | ✅ Required | `{success: true}` |
| `/api/clean/debts/:id` | DELETE | Delete debt | ✅ Required | `{success: true}` |

**Legacy Endpoints (Deprecated)**:
- `/api/debts` - Use `/api/clean/debts` instead
- `/api/user/debts` - Fully deprecated

### 🔐 **AUTHENTICATION** - User Management  
**Base Pattern**: `/auth/*`

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/auth/request-link` | POST | Send magic link email | ❌ Public | `{message: string}` |
| `/auth/verify` | GET | Verify magic link token | ❌ Public | Redirect + Cookie |
| `/auth/me` | GET | Get current user info | ✅ Required | `{user: User}` |
| `/auth/refresh` | POST | Refresh JWT token | ✅ Required | `{token: string}` |
| `/auth/logout` | POST | Clear user session | ✅ Required | `{success: true}` |
| `/auth/health` | GET | Service health check | ❌ Public | `{status: "ok"}` |

### 💳 **BILLING** - Subscription Management
**Base Pattern**: `/api/*` (Auth worker hosted)

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/api/checkout/session` | POST | Create Stripe checkout | ✅ Required | `{url: string}` |
| `/api/create-portal-session` | POST | Billing portal access | ✅ Required | `{url: string}` |
| `/api/account/entitlement` | GET | User Pro/Free status | ✅ Required | `{isPro: boolean}` |
| `/api/stripe/webhook` | POST | Stripe webhook handler | ❌ Public | `{received: true}` |

### ⚙️ **SETTINGS** - User Preferences
**Base Pattern**: `/api/user_settings`

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/api/user_settings` | GET | Fetch user preferences | ✅ Required | `{settings: Object}` |
| `/api/user_settings` | POST | Update preferences | ✅ Required | `{success: true}` |

### 🤖 **AI COACHING** - GPT Integration
**Base Pattern**: `/api/ai/*`

| Endpoint | Method | Purpose | Auth | Response |
|----------|--------|---------|------|----------|
| `/api/ai/chat` | POST | General AI chat | ✅ Required | `{response: string}` |
| `/api/ai/coach` | POST | Debt coaching chat | ✅ Required | `{advice: string}` |

---

## 📊 **DATA SCHEMAS**

### UKDebt Schema
```typescript
interface UKDebt {
  id: string;
  name: string;
  amount: number;        // In pounds (not pence)
  apr: number;          // As percentage (not basis points)  
  min_payment: number;  // In pounds (not pence)
  debt_type?: string;   // Default: "credit_card"
  created_at?: string;
  updated_at?: string;
}
```

### User Schema  
```typescript
interface User {
  id: string;
  email: string;
  isPro: boolean;
  plan: 'free' | 'pro' | 'founder';
  created_at: string;
}
```

---

## 🔧 **DEVELOPER INTEGRATION**

### Using RouteRegistry (Recommended)
```typescript
import { RouteHelpers } from '../routes/routeRegistry';

// ✅ Ergonomic with IntelliSense
const route = RouteHelpers.getRoute('debts.create');
const updateRoute = RouteHelpers.getRoute('debts.update', debtId);

// ✅ Available route paths
type RoutePath = 
  | 'debts.getAll' | 'debts.create' | 'debts.update' | 'debts.delete'
  | 'auth.me' | 'auth.refresh' | 'auth.logout' 
  | 'billing.createCheckoutSession' | 'settings.get'
  // ... all endpoints available with autocomplete
```

### Direct Usage
```typescript
import { RouteRegistry } from '../routes/routeRegistry';

// ✅ Direct registry access
fetch(RouteRegistry.debts.getAll)
fetch(RouteRegistry.debts.update('debt-123'))
fetch(RouteRegistry.auth.me)
```

### Authentication Headers
```typescript
// All protected endpoints require:
headers: {
  'Authorization': `Bearer ${jwt_token}`,
  'Content-Type': 'application/json'
}
```

---

## 📈 **ANALYTICS INTEGRATION**

### PostHog Event Tracking
Track API usage with these standardized events:

```javascript
// Route usage tracking
posthog.capture('api_route_called', {
  route: '/api/clean/debts',
  method: 'GET',
  success: true,
  response_time_ms: 234
});

// Gateway operations
posthog.capture('debts_gateway_operation', {
  operation: 'create',
  status: 'success', 
  route: '/api/clean/debts'
});
```

### Error Tracking
```javascript
posthog.capture('api_error', {
  route: '/api/clean/debts',
  status_code: 401,
  error_type: 'AUTH_REQUIRED'
});
```

---

## 🚨 **ERROR RESPONSES**

### Standard Error Format
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes
| Status | Code | Meaning | Action |
|--------|------|---------|---------|
| 401 | AUTH_REQUIRED | Missing/invalid JWT | Redirect to login |
| 403 | FORBIDDEN | Valid token, insufficient permissions | Show upgrade prompt |
| 404 | NOT_FOUND | Resource doesn't exist | Handle gracefully |
| 429 | RATE_LIMITED | Too many requests | Implement backoff |
| 500 | INTERNAL_ERROR | Server error | Show error message |

---

## 🔒 **SECURITY CONSIDERATIONS**

### Authentication Flow
1. **Magic Link**: User requests link via `/auth/request-link`
2. **Verification**: Click verifies via `/auth/verify?token=xxx`
3. **JWT Storage**: Secure httpOnly cookie + localStorage fallback
4. **API Calls**: Include `Authorization: Bearer ${token}` header
5. **Refresh**: Automatic renewal 24h before expiry

### Data Protection
- **Encryption at Rest**: AES-256-GCM in D1 database
- **User Isolation**: All queries scoped by `user_id` from JWT
- **HTTPS Only**: All endpoints require secure connections
- **Rate Limiting**: Implemented on auth-sensitive endpoints

---

## 📝 **CHANGELOG**

### v2.0 (September 2025) - Current
- ✅ Unified RouteRegistry system
- ✅ Ergonomic `getRoute()` helpers with IntelliSense
- ✅ Clean UK debt API (`/api/clean/debts`)
- ✅ Deprecated legacy `/api/debts` endpoints
- ✅ Enhanced error handling and telemetry

### v1.x (Legacy)
- ❌ Multiple competing endpoints
- ❌ Hardcoded route strings
- ❌ Inconsistent data formats

---

## 🎯 **USAGE EXAMPLES**

### Fetch All Debts
```typescript
import { RouteHelpers } from '../routes/routeRegistry';

const response = await fetch(RouteHelpers.getRoute('debts.getAll'), {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { debts } = await response.json();
```

### Create New Debt
```typescript
const debt = { name: "Credit Card", amount: 1234.56, apr: 19.9, min_payment: 45.00 };
const response = await fetch(RouteHelpers.getRoute('debts.create'), {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify(debt)
});
```

### Update Existing Debt
```typescript
const updates = { amount: 1100.00 };
await fetch(RouteHelpers.getRoute('debts.update', debtId), {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify(updates)
});
```

---

## 📞 **SUPPORT & MONITORING**

### Health Checks
- **Auth Service**: `GET /auth/health`
- **Main Site**: `GET /health`  
- **API Status**: Monitor via automated scripts

### Monitoring URLs
- **Production Logs**: Cloudflare Workers logs
- **Error Tracking**: PostHog error events
- **Performance**: Response time analytics

---

**This document is the canonical API reference for TrySnowball. All systems, documentation, and integrations should reference this contract as the single source of truth.**

**🔗 Integration Links**:
- PostHog Dashboard: Event schemas match this contract
- Developer Docs: Auto-generated from RouteRegistry
- Monitoring: Health checks based on these endpoints