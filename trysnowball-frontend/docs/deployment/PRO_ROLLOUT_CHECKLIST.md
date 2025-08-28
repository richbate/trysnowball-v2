# Pro Access Rollout Checklist

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## Pre-Deployment ✅

### Frontend Status
- [x] Upgrade.jsx component with Pro messaging
- [x] useSettings hook with subscription support  
- [x] Pro gating via simple Free/Pro model
- [x] Analytics integration (PostHog, no localStorage)
- [x] No beta flags or complex access tiers
- [x] Build passing with no errors

### Required Backend Work
- [ ] Stripe products created (monthly/yearly)
- [ ] Price IDs in environment (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`)
- [ ] Checkout endpoint (`POST /api/create-checkout-session`)
- [ ] Webhook endpoint (`POST /api/stripe/webhook`)
- [ ] Subscription management endpoints
- [ ] Database tables for user subscriptions

## Deployment Steps

### 1. Backend Deploy
```bash
# Set environment variables
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Update wrangler.toml with price IDs
[vars]
STRIPE_PRICE_MONTHLY = "price_xxx"
STRIPE_PRICE_YEARLY = "price_xxx"
```

### 2. Frontend Deploy
```bash
npm run build
wrangler pages deploy build/
```

### 3. Webhook Configuration
- Configure Stripe webhook URL: `https://yourdomain.com/api/stripe/webhook`
- Enable events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Testing Checklist

### Pro Upgrade Flow
- [ ] Free user sees upgrade prompts
- [ ] Stripe checkout opens correctly
- [ ] Payment processes successfully  
- [ ] User gains Pro access after payment
- [ ] Pro features unlock immediately

### Settings Integration
```javascript
// ✅ Test Pro status
const { settings } = useSettings();
const isPro = settings?.subscription?.status === 'active';
```

### Data Layer Safety
- [ ] No `.data` access in any components
- [ ] All data via `debtsManager.getData()` / `getMetrics()`
- [ ] Settings via `useSettings()` hook
- [ ] No localStorage for subscription data

## Post-Deployment Verification

### 1. Smoke Tests
```bash
# Test Pro upgrade flow
curl -X POST https://yourdomain.com/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_monthly"}'

# Verify webhook handling
# Complete a test purchase and check subscription status
```

### 2. Analytics Verification
- [ ] Pro upgrade events tracked in PostHog
- [ ] No localStorage analytics events
- [ ] User journey tracking works

### 3. Feature Access
- [ ] Free users see appropriate limitations
- [ ] Pro users have full feature access
- [ ] Subscription status updates in real-time

## Rollback Plan

If issues arise:
1. Feature flag Pro access off via environment variable
2. Redirect Pro users to Free tier temporarily  
3. Refund any problematic charges
4. Fix issues and re-enable

## Monitoring

Post-launch monitoring:
- Stripe dashboard for payment issues
- Application logs for errors
- User feedback on upgrade experience
- Conversion metrics (Free → Pro)

This replaces all beta access infrastructure with a clean subscription model.