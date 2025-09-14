# Open Beta Launch - 24h Monitoring Guide

## Quick Status Check

```bash
# Check both services are operational
curl -s https://trysnowball.co.uk/auth/status | jq '.status'
curl -s https://trysnowball.co.uk/api/status | jq '.status'
```

## Real-Time Monitoring Commands

### 1. Worker Error Logs (Terminal 1)

```bash
# Auth worker logs
wrangler tail trysnowball-auth-main-prod --format=pretty

# Debts worker logs
wrangler tail trysnowball-debts-api-prod --format=pretty
```

### 2. Status Endpoints (every 5 minutes)

```bash
# Combined status check
echo "=== Auth Service ===" && curl -s https://trysnowball.co.uk/auth/status | jq
echo "=== Debts Service ===" && curl -s https://trysnowball.co.uk/api/status | jq
echo "Check completed at: $(date)"
```

### 3. User Authentication Test

```bash
# Generate test token and verify auth flow
TOKEN=$(cd cloudflare-workers && node generate-test-token.js | head -2 | tail -1)
echo "Testing auth..."
curl -sS -H "Authorization: Bearer $TOKEN" https://trysnowball.co.uk/auth/me | jq

echo "Testing debts..."
curl -sS -H "Authorization: Bearer $TOKEN" "https://trysnowball.co.uk/api/debts?limit=1" | jq
```

### 4. Key Metrics to Watch

**🟢 Healthy Indicators:**

- Status endpoints return `"status": "operational"`
- Auth `/auth/me` returns user object (not error)
- Debts API returns `{"debts": [...]}` (not 401/500)
- Database `total_debts` count increasing
- Worker logs show successful requests

**🔴 Alert Triggers:**

- Status endpoints return `"status": "degraded"`
- Auth 401 rate >10% sustained 5+ minutes
- Debt decryption failures >5%
- Database connection errors
- User reports of data loss/corruption

## PostHog Analytics Events (Manual Check)
Visit PostHog dashboard and monitor:
- `debt_added` - Users successfully creating debts
- `user_registered` - New user signups
- `analytics_opt_in` - Privacy consent rates
- `experiment_variant_displayed` - A/B test tracking

## Emergency Actions

**If status endpoints show degraded:**
1. Check worker logs for error patterns
2. Verify D1 database health in Cloudflare dashboard
3. Consider rollback if >50% error rate

**If authentication issues:**
1. Verify JWT_SECRET is set: `wrangler secret list --env production`
2. Check token generation: `node generate-test-token.js`
3. Test manual auth flow in browser

**Rollback Command (if needed):**
```bash
# See LAUNCH_ROLLBACK_PLAN.md for version IDs
wrangler rollback <VERSION_ID> --config wrangler.toml --env production
wrangler rollback <VERSION_ID> --config wrangler-debts.toml --env production
```

## Database Monitoring
```bash
# Check recent debt creation activity
wrangler d1 execute auth_db --remote --command "
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_debts,
  COUNT(DISTINCT user_id) as unique_users
FROM debts 
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY DATE(created_at)
ORDER BY date DESC;
"

# Verify encryption (no plaintext leakage)
wrangler d1 execute auth_db --remote --command "
SELECT name, balance, interest_rate, length(ciphertext) as encrypted_size 
FROM debts 
ORDER BY created_at DESC LIMIT 5;
"
# Expected: name/balance/interest_rate should be NULL, encrypted_size > 100
```

---
*Launch Date: 2025-09-03*  
*Monitor for first 24 hours, then transition to routine ops*