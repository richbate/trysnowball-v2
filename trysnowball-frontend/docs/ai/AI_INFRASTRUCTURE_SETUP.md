# 🚀 AI Infrastructure Setup Guide

**Status**: Code complete ✅ | Infrastructure pending ⏳

All AI code is deployed and ready. These are the final infrastructure steps to make AI features live on production.

---

## 1. 🌐 Cloudflare Worker DNS Routing

### Step 1: Add Worker Route
1. **Go to Cloudflare Dashboard** → Your Domain (`trysnowball.co.uk`)
2. **Workers Routes** section (or **Workers & Pages** → **trysnowball-auth-prod** → **Settings** → **Triggers**)
3. **Add Route**:
   ```
   Route Pattern: trysnowball.co.uk/ai/*
   Worker: trysnowball-auth-prod
   ```
4. **Set Proxy Mode**: ✅ Proxied (orange cloud) - ensures CORS headers work
5. **Save Changes**

### Step 2: Verify Worker Deployment
```bash
# Confirm your production worker is active
wrangler deployments list --name trysnowball-auth-prod

# Should show recent deployment with AI routes
```

### Step 3: Test DNS Routing
```bash
# This should return AI health data (not the React app)
curl https://trysnowball.co.uk/ai/health

# Expected response:
# {
#   "provider": "openai",
#   "enabled": true,
#   "model": "gpt-4o-mini",
#   "timestamp": "2025-08-10T...",
#   "environment": "production"
# }
```

---

## 2. 🔒 CORS & CSP Configuration

### Update _headers file
**File**: `/public/_headers`

Add these lines to ensure AI endpoints are accessible:
```
/ai/*
  Access-Control-Allow-Origin: https://trysnowball.co.uk
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400
```

### Update CSP (if needed)
**File**: `/public/_headers` or meta tags

If you have Content-Security-Policy headers, ensure they allow:
```
connect-src 'self' https://trysnowball.co.uk/ai/*
```

---

## 3. ⚙️ Environment Variable Sync

### Worker Secrets (Already Done ✅)
```bash
# These are already set:
wrangler secret list --env production
# Should show: OPENAI_API_KEY, JWT_SECRET, SENDGRID_API_KEY
```

### Worker Environment Variables (Already Done ✅)
**File**: `wrangler.toml` production section:
```toml
[env.production.vars]
AI_PROVIDER = "openai"
GPT_MODEL_CHAT = "gpt-4o-mini"
GPT_MODEL_INGEST = "gpt-4o-mini"
GPT_TIMEOUT_MS = "10000"
GPT_MAX_TOKENS = "512"
GPT_STREAMING = "off"
GPT_DAILY_TOKEN_BUDGET = "100000"  # 100k tokens/day in prod
GPT_ENABLED = "true"
```

### Frontend Environment Variables (Already Done ✅)
**File**: `.env`:
```bash
REACT_APP_AI_ENABLED=true
REACT_APP_AI_PROVIDER=openai
REACT_APP_WORKER_URL=https://trysnowball.co.uk  # Uses same domain after routing
```

**⚠️ Security Check**: No `OPENAI_API_KEY` in client environment - all secrets stay server-side ✅

---

## 4. 🧪 Production Smoke Tests

### Test 1: Health Check
**Browser Console** (on `https://trysnowball.co.uk`):
```javascript
fetch('/ai/health')
  .then(r => r.json())
  .then(console.log)

// Expected: { provider: "openai", enabled: true, model: "gpt-4o-mini", ... }
```

### Test 2: AI Debt Ingestion
1. **Go to**: `https://trysnowball.co.uk` → My Debts
2. **Click**: "Paste your debts" or similar debt import feature
3. **Paste test data**:
   ```
   Credit card £2500 at 19.5% APR
   Car loan £8000 at 4.2% APR
   Overdraft £500 at 25% APR
   ```
4. **Expected**: Debts parse automatically, no "AI parsing not available" message

### Test 3: AI Coach Chat
1. **Go to**: AI Coach page
2. **Ask**: "How should I pay off my debts?"
3. **Expected**: AI response appears, no errors in console

### Test 4: Usage Logging
**Cloudflare Dashboard** → **D1 Database** → **auth_db** → **Query**:
```sql
SELECT * FROM ai_usage WHERE date = date('now') ORDER BY updated_at DESC LIMIT 5;
```
**Expected**: Recent AI requests logged with token usage

---

## 5. 📊 Monitoring Setup

### Daily Budget Monitoring
```sql
-- Check current daily usage
SELECT 
  date,
  total_tokens,
  request_count,
  (total_tokens / 100000.0 * 100) as budget_used_percent
FROM ai_usage 
WHERE date >= date('now', '-7 days')
ORDER BY date DESC;
```

### Alert Thresholds
- **80% budget used**: Warning alert
- **95% budget used**: Critical alert  
- **Budget exceeded**: AI automatically disabled until next day

### Error Rate Monitoring
```sql
-- Check for high error rates (from Worker logs)
SELECT COUNT(*) as error_count 
FROM auth_logs 
WHERE created_at >= datetime('now', '-1 hour')
  AND metadata LIKE '%AI%error%';
```

---

## 6. 🎯 Success Criteria Checklist

After infrastructure setup, verify these outcomes:

- [ ] `curl https://trysnowball.co.uk/ai/health` returns 200 OK
- [ ] DebtPasteInput shows no "AI parsing not available" warnings  
- [ ] AI Coach chat works with proper responses
- [ ] AI-generated share messages work
- [ ] D1 `ai_usage` table logs all requests with token counts
- [ ] Daily budget enforcement works (test by setting low limit)
- [ ] No API keys visible in browser network tab or source code
- [ ] All AI requests show as `/ai/*` in network tab (not external domains)

---

## 🆘 Rollback Plan

If issues occur after infrastructure changes:

### Quick Disable
1. **Disable AI client-side**: Set `REACT_APP_AI_ENABLED=false` → redeploy frontend
2. **Disable Worker AI**: Set `GPT_ENABLED=false` in wrangler.toml → `wrangler deploy --env production`

### Remove Routing
1. **Cloudflare Dashboard** → **Workers Routes** → Delete `trysnowball.co.uk/ai/*` route
2. **Fallback**: All AI features gracefully degrade to manual entry

---

## 📈 Cost Projections

**Current Settings**:
- **Daily Budget**: 100,000 tokens/day (production)
- **Model**: gpt-4o-mini (~$0.15/1M input tokens, ~$0.60/1M output tokens)
- **Estimated Cost**: ~$10-15/month for moderate usage
- **Automatic Cutoff**: Prevents runaway costs

**Scaling**: If usage grows, increase `GPT_DAILY_TOKEN_BUDGET` in wrangler.toml

---

## ✅ Next Steps

1. **Infrastructure Team**: Configure DNS routing (Step 1)
2. **Test**: Run smoke tests (Step 4) 
3. **Monitor**: Check D1 usage logs after 24 hours
4. **Optimize**: Adjust budgets based on actual usage patterns

**The AI system is code-complete and production-ready!** 🎉