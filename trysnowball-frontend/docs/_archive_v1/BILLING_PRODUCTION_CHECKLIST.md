# 🚀 Bulletproof Billing - Production Deployment Checklist

## ⚠️ CRITICAL: Cut-over Checklist (Must-Do)

### 1. Stripe Keys & Environment Variables
```bash
# Set live Stripe keys (NOT test keys)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET  
wrangler secret put STRIPE_PRICE_PRO       # Live price ID: price_1xxxxx

# Verify secrets are set
wrangler secret list
```

**⚡ Common Gotcha**: Test price ID in prod → user pays, webhook arrives, but billing drifts later.

### 2. Stripe Dashboard Webhook Configuration
- [ ] Dashboard → Webhooks → Add endpoint: `https://yourdomain.com/webhook/stripe`
- [ ] Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`, `invoice.payment_succeeded`
- [ ] Copy signing secret → matches `STRIPE_WEBHOOK_SECRET` in env
- [ ] Test webhook delivery in dashboard

### 3. Cloudflare Routes & Caching
```toml
# In wrangler.toml - ensure webhook route bypasses cache
[[routes]]
pattern = "yourdomain.com/webhook/stripe"
zone_name = "yourdomain.com"
cache_control = "no-cache, no-store, must-revalidate"
```

- [ ] Webhook path NOT cached
- [ ] Webhook path NOT behind auth middleware
- [ ] No body parsing before webhook handler

### 4. Database Migration
```bash
# Deploy billing migration
wrangler d1 migrations apply auth_db --remote

# Verify tables exist
wrangler d1 execute auth_db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 5. Deploy Updated Workers
```bash
# Deploy main auth worker with new /api/me/plan endpoint
wrangler deploy

# Deploy webhook handler 
wrangler deploy stripe-webhook-bulletproof.js
```

---

## 🧪 10-Step Smoke Test (Manual QA)

### Pre-test Setup
```sql
-- Reset test user for clean slate
UPDATE users SET is_pro=0, beta_access=0 WHERE email='test@yourdomain.com';
```

### Test Sequence

1. **Free State Verification**
   - [ ] Login with test account
   - [ ] `GET /api/me/plan` → `{ "is_paid": false, "source": "none" }`
   - [ ] UI shows "Free Plan", no crown icon

2. **Beta Access Toggle**
   - [ ] `UPDATE users SET beta_access=1 WHERE email='test@yourdomain.com'`
   - [ ] Refresh page → `GET /api/me/plan` → `{ "is_paid": true, "source": "beta" }`
   - [ ] UI shows "Beta Access" with gold crown
   - [ ] Stripe portal button hidden

3. **Stripe Checkout Flow**
   - [ ] Set `beta_access=0`
   - [ ] Click "Upgrade to Pro" → redirected to Stripe
   - [ ] Email pre-filled correctly
   - [ ] Price matches expected amount

4. **Payment Completion**
   - [ ] Complete test payment (use 4242 4242 4242 4242)
   - [ ] Redirected to success URL
   - [ ] Within 10 seconds: `GET /api/me/plan` → `{ "is_paid": true, "source": "stripe" }`

5. **Webhook Verification**
   - [ ] Check Stripe dashboard → webhook delivered successfully
   - [ ] Check worker logs → see processing messages
   - [ ] Check database: `SELECT is_pro FROM users WHERE email='test@...'` → 1

6. **Idempotency Test**
   - [ ] In Stripe dashboard, find the `checkout.session.completed` event
   - [ ] Click "Resend webhook"
   - [ ] No errors in logs
   - [ ] User flags unchanged (no double-flip)

7. **Customer Portal Access**
   - [ ] Click "Manage Subscription" → opens Stripe portal
   - [ ] Shows correct customer email and subscription
   - [ ] Cancel subscription in portal

8. **Cancellation Propagation**
   - [ ] After portal cancellation → webhook arrives within 30 seconds
   - [ ] `GET /api/me/plan` → `{ "is_paid": false, "source": "none" }`
   - [ ] UI updates to show "Free Plan"

9. **Session Persistence**
   - [ ] Sign out and sign back in
   - [ ] Billing status persists (server-side flags are truth)

10. **Cross-Tab Sync**
    - [ ] Open billing page in two tabs
    - [ ] Complete billing flow in tab 1
    - [ ] Switch focus to tab 2 → should auto-refresh and show updated status

---

## 🔍 Health Check SQL Queries

```sql
-- Check for webhook processing issues
SELECT type, COUNT(*) as count FROM stripe_events 
GROUP BY type ORDER BY count DESC;

-- Verify user status distribution
SELECT 
  SUM(is_pro) as stripe_users,
  SUM(beta_access) as beta_users,
  COUNT(*) - SUM(is_pro) - SUM(beta_access) as free_users,
  COUNT(*) as total_users
FROM users;

-- Recent activity audit
SELECT email, is_pro, beta_access, updated_at 
FROM users 
ORDER BY updated_at DESC 
LIMIT 20;

-- Find any duplicate webhook events (should be none)
SELECT id, COUNT(*) as dupes FROM stripe_events 
GROUP BY id HAVING COUNT(*) > 1;
```

---

## 📊 Monitoring Setup

### PostHog Events to Track
```javascript
// Client-side (on checkout start)
posthog.capture('billing_checkout_started', {
  plan: 'pro',
  user_id: user.id,
  checkout_url: checkoutUrl
});

// Server-side webhook (on plan change)
posthog.capture('plan_status_changed', {
  user_id: userId,
  old_is_pro: oldStatus,
  new_is_pro: newStatus,
  source: 'stripe',
  webhook_event: event.type
});
```

### Stripe Alerts
- [ ] Webhook failure rate > 0% → immediate alert
- [ ] Webhook retry rate > 10% → investigate alert
- [ ] Failed payments → daily digest

### Worker Logs Monitoring
- [ ] Alert on: "Cannot find user for subscription"
- [ ] Alert on: "Webhook signature verification failed"
- [ ] Monitor: Event processing times > 5 seconds

---

## 🚨 Rollback & Hotfix Procedures

### Emergency User Unsticking
```sql
-- Grant beta access to affected user
UPDATE users SET beta_access=1 WHERE email='affected@user.com';

-- Or manually flip pro status (use sparingly)
UPDATE users SET is_pro=1 WHERE email='affected@user.com';
```

### Feature Circuit Breakers
```javascript
// Temporarily disable billing portal if Stripe misbehaves
const BILLING_PORTAL_ENABLED = env.BILLING_PORTAL_ENABLED !== 'false';
if (!BILLING_PORTAL_ENABLED) {
  return json({ error: 'Billing portal temporarily unavailable' });
}
```

### Worker Rollback
```bash
# Keep last known good deployment tagged
git tag prod-billing-v1
wrangler deploy --name trysnowball-auth-main-rollback

# Webhook can be paused in Stripe dashboard while redeploying
# App keeps last known is_paid status during downtime
```

---

## ✅ Final Launch Checklist

- [ ] All environment variables set with LIVE values
- [ ] Database migration deployed successfully  
- [ ] Webhook endpoint configured and tested
- [ ] All 10 smoke tests pass
- [ ] Monitoring and alerts configured
- [ ] Rollback procedures documented and tested
- [ ] Team notified of launch window
- [ ] PostHog events firing correctly

**🎯 Success Criteria**: User can purchase → immediately recognized as paid → can manage billing → cancellation works → no duplicate processing → bulletproof!

---

## 🔧 Common Issues & Fixes

**"User not found for subscription"**
→ Check metadata.user_id in Stripe events

**"Webhook signature verification failed"** 
→ Verify STRIPE_WEBHOOK_SECRET matches dashboard

**"Price not found"**
→ Check STRIPE_PRICE_PRO points to live price ID

**Portal shows wrong customer**
→ Check stripe_customer_id linkage in database

---

**Deployment Lead**: _________________ **Date**: _________  
**QA Sign-off**: _________________ **Date**: _________  
**Final Approval**: __________________ **Date**: _________