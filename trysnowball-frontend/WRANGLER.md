# TrySnowball Cloudflare Workers Setup

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

This document outlines the current Cloudflare Workers architecture for TrySnowball, including deployment configurations, API endpoints, and infrastructure overview.

## Current Workers Architecture

### 1. Main Auth Worker (`trysnowball-auth-prod`)
**File**: `cloudflare-workers/auth-magic.js`  
**Config**: `cloudflare-workers/wrangler.toml`  
**Route**: `trysnowball.co.uk/auth/*`  
**Purpose**: JWT-based magic link authentication

**Endpoints**:
- `POST /auth/login` - Send magic link
- `GET /auth/verify` - Verify magic link token
- `GET /api/user` - Get current user (JWT-based)
- `POST /auth/logout` - Logout user

**Resources**:
- D1 Database: `auth_db` (users, sessions)
- Secrets: `JWT_SECRET`, `SENDGRID_API_KEY`, `BASE_URL`

### 2. Unified API Worker (`trysnowball-checkout-prod`)
**File**: `cloudflare-workers/stripe-checkout-api.js`  
**Config**: `cloudflare-workers/wrangler-checkout.toml`  
**Route**: `trysnowball.co.uk/api/*`  
**Purpose**: Stripe payments, debts API, and AI coach chat

**Endpoints**:

#### Stripe APIs
- `POST /api/stripe/checkout` - Create Pro checkout session
- `POST /api/stripe/checkout/founder` - Create Founder checkout session  
- `POST /api/stripe/portal` - Create customer portal session
- `GET /api/stripe/subscriptions/{id}` - Get subscription details

#### Debts API
- `GET /api/debts` - List user debts
- `POST /api/debts` - Create/update debt
- `DELETE /api/debts/{id}` - Delete debt

#### AI Coach API ⭐ YUKI
- `POST /api/ai/chat` - AI coaching chat with Yuki
  - Daily quota enforcement (40 requests/day)
  - OpenAI GPT-4o-mini integration
  - UK-focused debt coaching persona

**Resources**:
- D1 Database: `auth_db` (shared with auth worker)
- KV Namespace: `AI_QUOTAS` (quota tracking)
- Secrets: `STRIPE_SECRET_KEY`, `JWT_SECRET`, `OPENAI_API_KEY`

### 3. E2E Testing Worker (`trysnowball-e2e-tests`)
**File**: `cloudflare-workers/trysnowball-e2e-worker.ts`  
**Config**: `cloudflare-workers/wrangler-e2e.toml`  
**Purpose**: End-to-end testing automation

## Current Deployment Status

### ✅ DEPLOYED & ACTIVE
1. **Auth Worker** - Fully deployed and handling authentication
2. **Unified API Worker** - Deployed with Stripe + Debts + AI functionality
3. **E2E Testing Worker** - Available for test automation

### ❌ FRONTEND INTEGRATION NEEDED
- AI Coach frontend is **disabled** in React app
- Coach component is commented out in `src/App.js:43`
- No `/ai/coach` route configured
- **Backend AI is ready and waiting for frontend activation**

## Configuration Files

```
├── wrangler.toml                          # Main auth worker config
├── cloudflare-workers/
│   ├── wrangler.toml                      # Auth worker (duplicate)
│   ├── wrangler-checkout.toml             # ⭐ Unified API worker (includes AI)
│   ├── wrangler-e2e.toml                  # E2E testing worker  
│   ├── wrangler-ai.toml                   # ❌ Legacy (not used)
│   └── wrangler-stripe.toml               # ❌ Legacy (merged into checkout)
```

## AI Coach Configuration

The AI coach (Yuki) is configured in the unified API worker with these settings:

```toml
[vars]
AI_MAX_TOKENS = "700"
AI_ALLOWED_MODELS = "gpt-4o-mini,gpt-4o"  
AI_TEMP = "0.2"
AI_DAILY_REQ = "40"  # Daily request limit per user
```

### AI Coach Persona (Yuki)
- **Name**: Yuki
- **Role**: UK-focused debt coach
- **Personality**: Supportive, practical, uses British terminology
- **Specialization**: Debt snowball/avalanche methods, UK debt regulations
- **Crisis handling**: Escalates serious situations to debt charities

## Database Schema

### Users Table (D1 - auth_db)
- `id` - User UUID
- `email` - User email address  
- `created_at`, `updated_at` - Timestamps

### Debts Table (D1 - auth_db)
- `id` - Debt UUID
- `name` - Debt name (e.g., "MBNA Credit Card")
- `balance` - Current balance
- `min_payment` - Minimum monthly payment
- `apr` - Annual percentage rate
- `created_at`, `updated_at` - Timestamps

### AI Quotas (KV - AI_QUOTAS)
- Key: `ai_daily:{userId}:{YYYY-MM-DD}`
- Value: Request count (string)
- TTL: 27 hours (auto-cleanup)

## Security & Access Control

### Authentication
- JWT-based with HTTP-only cookies
- Magic link email verification
- 24-hour session expiry

### AI Rate Limiting  
- 40 requests per user per day
- Per-user KV-based quota tracking
- Automatic reset at midnight

### CORS Configuration
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'  
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

## Development vs Production

### Development (Local)
- Frontend: `localhost:3000` or `localhost:3001`
- Auth bypass: `REACT_APP_AUTH_BYPASS=true`
- Uses production APIs via proxy

### Production  
- Frontend: `trysnowball.co.uk` (Cloudflare Pages)
- Workers: `trysnowball.co.uk/auth/*` and `trysnowball.co.uk/api/*`
- Full authentication and quota enforcement

## Next Steps to Activate Yuki

1. **Enable Coach Frontend** (2 minutes):
   ```javascript
   // In src/App.js, uncomment:
   const Coach = React.lazy(() => import('./pages/Coach'));
   
   // Add route:
   <Route path="/ai/coach" element={<Coach />} />
   ```

2. **Test Integration** (2 minutes):
   - Visit `/ai/coach` 
   - Verify API calls to `/api/ai/chat`
   - Test quota enforcement

3. **Update Navigation** (1 minute):
   - Add "AI Coach" links to navigation
   - Update footer and marketing pages

## Monitoring & Debugging

### Worker Logs
```bash
wrangler tail trysnowball-checkout-prod  # API worker logs
wrangler tail trysnowball-auth-prod      # Auth worker logs
```

### AI Chat Debugging
- Check quota usage: KV namespace `AI_QUOTAS`
- Monitor OpenAI API costs via OpenAI dashboard
- Track user requests via Wrangler analytics

### Health Checks
- Auth: `GET /api/user` (JWT) 
- API: `GET /api/debts`
- AI: `POST /api/ai/chat` (requires auth)

## Cost Optimization

### Current Setup
- **D1 Database**: Shared across workers (cost-effective)
- **KV Storage**: Minimal usage for AI quotas only
- **Worker Requests**: Consolidated into fewer workers
- **OpenAI**: Limited to 40 requests/user/day (cost control)

### Architecture Benefits
- **Unified deployment**: Single API worker handles multiple concerns
- **Shared resources**: Auth and API share same D1 database  
- **Automatic scaling**: Cloudflare Workers scale to zero when unused
- **Edge performance**: Deployed globally on Cloudflare edge

---

**Status**: AI Coach backend is fully operational. Frontend activation needed to complete Yuki integration.