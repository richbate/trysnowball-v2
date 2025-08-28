# Pro Access Backend Implementation Guide

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## Overview
Complete backend implementation for Pro access via Stripe checkout. Frontend uses simple Free/Pro model without beta flags.

## 1. Stripe Setup (Dashboard)

### Create Product & Price
1. **Navigate to**: Stripe Dashboard → Products → Create Product
2. **Product Name**: `TrySnowball Pro`
3. **Description**: `Advanced debt management features`
4. **Price**: £9.99/month or £99.99/year, type: `recurring`

### Copy Required Values
```bash
STRIPE_PRICE_MONTHLY=price_xxx          # From monthly price creation
STRIPE_PRICE_YEARLY=price_xxx           # From yearly price creation
STRIPE_SECRET_KEY=sk_live_xxx           # From API keys
STRIPE_WEBHOOK_SECRET=whsec_xxx         # From webhook endpoint
```

## 2. Pro Access Flow

### Stripe Checkout Integration
```javascript
// ✅ Safe Pro upgrade pattern
const { updateSettings } = useSettings();

const upgradeToPro = async (priceId) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId })
    });
    
    const { url } = await response.json();
    window.location = url;
  } catch (error) {
    console.error('Upgrade failed:', error);
  }
};
```

### Pro Status Check
```javascript
// ✅ Safe Pro status verification
const { settings, loading } = useSettings();
const isPro = settings?.subscription?.status === 'active';

if (loading) return <LoadingSpinner />;
if (!isPro) return <UpgradePrompt />;

// Render Pro features
return <ProFeatures />;
```

## 3. Webhook Handling

### Subscription Events
```javascript
// Handle successful payment
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  
  // Update user subscription status
  await updateUserSubscription(session.customer, {
    status: 'active',
    priceId: session.price_id,
    subscriptionId: session.subscription
  });
}

// Handle subscription updates
if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object;
  
  await updateUserSubscription(subscription.customer, {
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end
  });
}
```

## 4. Frontend Integration

### Pro Gate Component
```javascript
// ✅ Simple Pro/Free model
const ProGate = ({ children, fallback = <UpgradePrompt /> }) => {
  const { settings, loading } = useSettings();
  
  if (loading) return <LoadingSpinner />;
  
  const isPro = settings?.subscription?.status === 'active';
  
  return isPro ? children : fallback;
};
```

### Settings Hook Usage
```javascript
// ✅ Safe subscription management
const { settings, updateSettings } = useSettings();

const subscription = settings?.subscription || {
  status: 'inactive',
  plan: 'free'
};
```

## 5. Business Logic

### Free Tier Limits
- Basic debt tracking
- Snowball calculations
- Demo data

### Pro Tier Features
- Advanced analytics
- Export functionality  
- AI coaching
- Premium support

No beta flags or complex access tiers - simple Free vs Pro model.

## 6. Security Notes

- All subscription data in secure IndexedDB
- No sensitive data in localStorage
- JWT tokens for API authentication
- Webhook signature verification required

## 7. Testing

```javascript
// Test Pro upgrade flow
describe('Pro Upgrade', () => {
  test('redirects to Stripe checkout', async () => {
    const { upgradeToPro } = renderHook(() => useProUpgrade());
    await upgradeToPro('price_monthly');
    expect(window.location).toMatch(/checkout\.stripe\.com/);
  });
});
```

This implementation replaces all beta access patterns with a clean Free/Pro subscription model.