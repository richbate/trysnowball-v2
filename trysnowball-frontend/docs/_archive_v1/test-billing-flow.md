# Bulletproof Billing Flow Test Plan

## Pre-requisites
1. Run migration: `wrangler d1 migrations apply YOUR_DATABASE`
2. Deploy webhook handler to `/webhook/stripe` endpoint
3. Set environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `JWT_SECRET`

## Test Cases

### 1. Authentication & Free State
- [ ] Login via magic link
- [ ] Visit `/billing` page  
- [ ] Should show "Free Plan" status
- [ ] Call `/api/me/plan` → should return `{ is_paid: false, source: 'none' }`

### 2. Beta Access Toggle
- [ ] Manually set `UPDATE users SET beta_access=1 WHERE email='test@example.com'`
- [ ] Refresh `/billing` page
- [ ] Should show "Beta Access" status with gold crown
- [ ] Call `/api/me/plan` → should return `{ is_paid: true, source: 'beta' }`

### 3. Stripe Checkout Flow
- [ ] User clicks "Upgrade to Pro" 
- [ ] Checkout session includes `metadata.user_id` and `subscription_data.metadata.user_id`
- [ ] Complete test payment in Stripe
- [ ] Webhook received: `checkout.session.completed`
- [ ] User record updated: `is_pro=1`
- [ ] Call `/api/me/plan` → should return `{ is_paid: true, source: 'stripe' }`

### 4. Subscription Management  
- [ ] Visit customer portal via "Manage Subscription" 
- [ ] Cancel subscription in portal
- [ ] Webhook received: `customer.subscription.updated` with `status=canceled`
- [ ] User record updated: `is_pro=0`
- [ ] Call `/api/me/plan` → should return `{ is_paid: false, source: 'none' }`

### 5. Idempotency Test
- [ ] Replay the same webhook event (same `event.id`)
- [ ] Should return HTTP 200 with "Event already processed"
- [ ] User status should remain unchanged

### 6. Cross-tab Sync
- [ ] Complete billing in one browser tab
- [ ] Switch focus to another tab with billing page
- [ ] Should automatically refresh and show updated status (window focus event)

## Database Verification Queries

```sql
-- Check user status
SELECT email, is_pro, beta_access, stripe_customer_id FROM users WHERE email='test@example.com';

-- Check processed webhooks  
SELECT * FROM stripe_events ORDER BY processed_at DESC LIMIT 10;

-- Check metadata tracking
SELECT COUNT(*) as total_webhooks FROM stripe_events;
```

## Expected API Responses

**Free user:**
```json
GET /api/me/plan
{ "is_paid": false, "source": "none" }
```

**Beta user:**
```json  
GET /api/me/plan
{ "is_paid": true, "source": "beta" }
```

**Stripe subscriber:**
```json
GET /api/me/plan  
{ "is_paid": true, "source": "stripe" }
```

## Monitoring Checklist
- [ ] Console logs show webhook events being processed
- [ ] No duplicate database updates for replayed events
- [ ] Billing page UI matches `/api/me/plan` response
- [ ] Features are properly gated based on `isPaid` flag from `useUserPlan` hook

## Failure Scenarios to Test
- [ ] Webhook signature mismatch → HTTP 400
- [ ] Missing `user_id` in metadata → falls back to customer lookup
- [ ] User not found → logs warning, continues processing
- [ ] Database connection failure → webhook returns HTTP 500, Stripe retries

## Success Criteria
✅ All acceptance criteria pass  
✅ User can purchase → immediately recognized as paid  
✅ User can cancel → immediately downgraded to free  
✅ System is resilient to webhook replays  
✅ No manual intervention needed for billing state sync