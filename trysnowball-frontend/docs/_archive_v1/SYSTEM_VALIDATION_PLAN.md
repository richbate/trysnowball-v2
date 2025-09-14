# System Validation Plan - Complete Surface Area Testing

**Goal**: Validate every route, connection, interaction, and entry point works correctly

---

## 🗺️ COMPLETE ENDPOINT MAPPING

### Auth Worker (`auth-magic.js`)
**Base URL**: `https://trysnowball.co.uk/auth/*`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/health` | GET | Health check | ❌ |
| `/auth/request-link` | POST | Magic link email | ❌ |
| `/auth/verify` | GET | Verify magic link token | ❌ |
| `/auth/me` | GET | Get current user | ✅ |
| `/auth/refresh` | POST | Refresh JWT token | ✅ |
| `/auth/logout` | POST | Clear session | ✅ |
| `/auth/stats` | GET | Auth statistics | ✅ |
| `/auth/api/me/plan` | GET | User billing status | ✅ |
| `/api/me` | GET | User info (alias) | ✅ |
| `/api/account/entitlement` | GET | Pro/Free status | ✅ |
| `/api/checkout/session` | POST | Create Stripe session | ✅ |
| `/api/stripe/webhook` | POST | Stripe webhook handler | ❌ |

### Debts API Worker (`debts-api.js`)
**Base URL**: `https://trysnowball.co.uk/api/*`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/debts` | GET | Get all user debts | ✅ |
| `/api/debts` | POST | Create new debt | ✅ |
| `/api/debts/:id` | PUT | Update existing debt | ✅ |
| `/api/debts/:id` | DELETE | Delete debt | ✅ |
| `/api/clean/debts` | GET | UK format debts | ✅ |
| `/api/clean/debts` | POST | Create UK debt | ✅ |
| `/api/clean/debts/:id` | PUT | Update UK debt | ✅ |
| `/api/clean/debts/:id` | DELETE | Delete UK debt | ✅ |

### Additional Workers

| Worker | Endpoints | Purpose |
|--------|-----------|---------|
| `stripe-portal-api.js` | `/api/create-portal-session` | Billing portal |
| `stripe-webhook-bulletproof.js` | `/webhook/stripe` | Stripe webhooks |
| `ai-coach-worker.js` | `/health`, `/usage`, `/chat` | AI coaching |

---

## 🧪 VALIDATION TEST PLAN

### Phase 1: Health Check All Endpoints

```bash
# Auth Worker Health
curl -i https://trysnowball.co.uk/health
curl -i https://trysnowball.co.uk/auth/health

# Expected: 200 OK, JSON response with status
```

### Phase 2: Authentication Flow End-to-End

```bash
# 1. Request Magic Link
curl -X POST https://trysnowball.co.uk/auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected: 200 OK, email sent confirmation

# 2. Verify Token (manual - need token from email)
# curl -i "https://trysnowball.co.uk/auth/verify?token=MAGIC_TOKEN"

# 3. Get Current User
curl -i https://trysnowball.co.uk/auth/me \
  -H "Authorization: Bearer JWT_TOKEN"

# Expected: 200 OK, user object
```

### Phase 3: CRUD Operations Validation

```bash
# Get current debts
curl -i https://trysnowball.co.uk/api/debts \
  -H "Authorization: Bearer JWT_TOKEN"

# Create new debt
curl -X POST https://trysnowball.co.uk/api/debts \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Debt",
    "amount": 1000,
    "apr": 19.9,
    "min_payment": 25
  }'

# Update debt
curl -X PUT https://trysnowball.co.uk/api/debts/DEBT_ID \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 950}'

# Delete debt  
curl -X DELETE https://trysnowball.co.uk/api/debts/DEBT_ID \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Phase 4: Security & Encryption Validation

```bash
# Check D1 directly for encrypted data
wrangler d1 execute trysnowball_prod_users_db \
  --command "SELECT id, user_id, ciphertext, iv FROM debts LIMIT 5;"

# Expected: ciphertext field contains encrypted data, not plaintext
```

### Phase 5: Error Handling Validation

```bash
# Test 401 Unauthorized
curl -i https://trysnowball.co.uk/api/debts
# Expected: 401 Unauthorized

# Test 404 Not Found
curl -i https://trysnowball.co.uk/api/nonexistent
# Expected: 404 Not Found

# Test invalid JSON
curl -X POST https://trysnowball.co.uk/api/debts \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid": json'
# Expected: 400 Bad Request
```

---

## 🔍 AUTOMATED VALIDATION SCRIPT

### Frontend Integration Test
```javascript
// Test all critical paths from frontend
const runSystemValidation = async () => {
  const results = {
    auth: await testAuthFlow(),
    debts: await testDebtCRUD(),
    encryption: await testEncryption(),
    tokenRefresh: await testTokenRefresh()
  };
  
  return results;
};
```

### Preflight Health Check
```javascript
// Run on app startup
const preflightChecks = [
  () => fetch('/health'),
  () => fetch('/auth/health'),
  () => checkTokenValid(),
  () => testDebtSync()
];
```

---

## 🚨 CRITICAL VALIDATION POINTS

### 1. Authentication Enforcement
- ✅ All `/api/debts/*` require valid JWT
- ✅ 401 returned for missing/invalid tokens
- ✅ User isolation enforced (user A can't see user B's data)

### 2. Encryption at Rest
- ✅ D1 contains ciphertext, not plaintext
- ✅ Decryption works correctly
- ✅ Per-user encryption keys

### 3. CRUD Consistency
- ✅ CREATE: Data persists after refresh
- ✅ READ: Returns all user's debts only
- ✅ UPDATE: Changes reflected immediately
- ✅ DELETE: Removes from both local and remote

### 4. Token Management
- ✅ Background refresh works
- ✅ Expiry warnings show correctly
- ✅ Manual refresh succeeds
- ✅ Expired tokens trigger re-auth

### 5. Error Recovery
- ✅ API 404 shows "Offline Mode" banner
- ✅ Network errors queue for retry
- ✅ Zombie sessions auto-recover

---

## 🎯 SUCCESS CRITERIA

**System is validated when:**
- [ ] All endpoints return expected status codes
- [ ] Authentication flow completes successfully
- [ ] CRUD operations persist data correctly
- [ ] Encryption verified in D1 database
- [ ] Token refresh cycle works automatically
- [ ] Error scenarios handled gracefully
- [ ] User isolation enforced
- [ ] No silent failures detected

---

## 🔧 MONITORING & ALERTS

### Production Health Monitoring
```bash
# Continuous monitoring commands
wrangler tail --config wrangler.toml --env production
wrangler tail --config wrangler-debts.toml --env production
```

### Key Metrics to Track
- API response times
- Authentication success/failure rates
- Token refresh frequency
- Database query performance
- Error rates by endpoint

This comprehensive validation ensures the system works as intended and eliminates the chaos of surprise failures.