# TrySnowball - Subscriptions & Billing

**Version**: 2.1.0  
**Last Updated**: January 2025  
**Payment Provider**: Stripe  
**Billing Models**: Subscription + One-time Payment  
**AI Integration**: Tier-based model access with realistic daily limits  

## 💳 Billing Overview

TrySnowball implements a tiered billing model using Stripe: Free accounts with basic AI access, monthly Pro subscriptions (£4.99/month), and one-time Founders Access payments (£79 lifetime). Each tier provides different AI capabilities and usage limits while maintaining comprehensive debt management features.

## 🏗️ Subscription Architecture

### Tier Comparison Table

| Plan | Price | AI Access | Features |
|------|-------|-----------|----------|
| **Free / Demo** | £0 | GPT-3.5-turbo – 5 chats/day (20k tokens), no reports | Demo debts, limited AI coaching, milestone messages, manual updates |
| **Pro** | £4.99 / month | GPT-4 coach & reports, GPT-3.5-turbo parsing – 50 chats/day (100k tokens), 5 reports/day (50k tokens) | Full AI Coach, scenario analysis, personalised milestones, monthly progress PDFs, priority email support |
| **Founders Access** | £79 one-off | GPT-4-turbo coach & deep analysis, GPT-4 reports – 100 chats/day (200k tokens), 10 reports/day (100k tokens) | All Pro features + deep multi-year projections, AI budget reviews, custom PDF plans, Founders badge, early access to beta features, lifetime entitlement |

### Founders Access ROI
**Break-even point**: 16 months (16 × £4.99 = £79.84)  
Planning to use TrySnowball for more than 16 months? Choose Founders Access for lifetime value.

### Technical Tier Configuration
```javascript
const SUBSCRIPTION_TIERS = {
  demo: {
    name: 'Demo',
    price: 0,
    billing: 'none',
    ai_model: null,
    ai_limits: { coach: 0, reports: 0, parsing: 0 },
    features: ['local_storage_only', 'basic_calculations'],
    limitations: ['no_cloud_storage', 'no_ai_features']
  },
  
  free: {
    name: 'Free',
    price: 0,
    billing: 'none',
    ai_model: 'gpt-3.5-turbo',
    ai_limits: { 
      coach: { dailyRequests: 5, dailyTokens: 20000 }, 
      reports: { dailyRequests: 0, dailyTokens: 0 },
      parsing: { dailyRequests: 2, dailyTokens: 5000 }
    },
    features: ['cloud_storage', 'basic_features', 'mobile_sync', 'limited_ai_coach'],
    limitations: ['basic_charts_only', 'no_ai_reports']
  },
  
  pro: {
    name: 'Pro',
    price: 4.99,
    billing: 'monthly',
    stripe_price_id: 'price_1RtblBGCnKks4oppUKmKnq2C',
    ai_model: 'gpt-4',
    ai_limits: { 
      coach: { dailyRequests: 50, dailyTokens: 100000 }, 
      reports: { dailyRequests: 5, dailyTokens: 50000 },
      parsing: { dailyRequests: 20, dailyTokens: 20000 }
    },
    features: ['all_features', 'ai_coach', 'ai_reports', 'priority_support'],
    limitations: []
  },
  
  founders: {
    name: 'Founders',
    price: 79,
    billing: 'one_time',
    stripe_price_id: 'price_1RtcbRGCnKks4opplsTYCdlb',
    stripe_product_id: 'prod_SpH9jAIEBykhni',
    ai_model: 'gpt-4-turbo',
    ai_limits: { 
      coach: { dailyRequests: 100, dailyTokens: 200000 }, 
      reports: { dailyRequests: 10, dailyTokens: 100000 },
      parsing: { dailyRequests: 50, dailyTokens: 50000 }
    },
    features: ['lifetime_access', 'all_features', 'priority_support', 'founder_badge', 'extended_ai'],
    limitations: []
  }
};
```

## 🔒 Feature Gating

### AI Access Controls
- **AI Coach limits**: Enforced via `rateLimitAI` in backend logic with UTC midnight reset
- **Founders tier**: Unlocks GPT-4-turbo model and extended token allowance (200k daily)
- **Pro tier**: Uses GPT-4 for coaching/reports, GPT-3.5-turbo for parsing
- **Free/Demo tier**: No debt history context in AI responses, basic GPT-3.5-turbo access

### Implementation Logic
```javascript
// src/utils/featureGating.js
export const hasFeatureAccess = (user, feature) => {
  if (!user) {
    // Demo user - only basic features
    return ['basic_calculations', 'local_storage'].includes(feature);
  }
  
  const tier = user.subscription_tier || 'free';
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  
  return tierConfig.features.includes(feature) && 
         !tierConfig.limitations.includes(`no_${feature}`);
};

// AI-specific feature gating
export const getAIAccess = (user) => {
  const tier = user?.subscription_tier || 'demo';
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  
  return {
    model: tierConfig.ai_model,
    limits: tierConfig.ai_limits,
    hasReports: tierConfig.ai_limits.reports?.dailyRequests > 0,
    hasAdvancedCoaching: tier === 'pro' || tier === 'founders'
  };
};

// Usage in components
export const useAIFeature = () => {
  const { user } = useContext(UserContext);
  return getAIAccess(user);
};
```

## 💰 Stripe Integration

### Checkout Implementation

#### Pro Subscription Checkout
```javascript
// src/utils/stripe.js
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const createProSubscription = async (userId) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        userId,
        priceId: 'price_1OabcdEF12345678',
        mode: 'subscription',
        returnUrl: `${window.location.origin}/billing?session_id={CHECKOUT_SESSION_ID}`
      })
    });
    
    const { sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
    
  } catch (error) {
    console.error('Subscription creation failed:', error);
    throw error;
  }
};
```

#### Founders One-time Payment
```javascript
export const createFoundersPayment = async (userId) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        userId,
        priceId: 'price_1FoundersAccess12345',
        mode: 'payment',
        returnUrl: `${window.location.origin}/welcome-founders?session_id={CHECKOUT_SESSION_ID}`
      })
    });
    
    const { sessionId } = await response.json();
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
    
  } catch (error) {
    console.error('Founders payment failed:', error);
    throw error;
  }
};
```

### Backend Checkout API (Cloudflare Worker)

```javascript
// cloudflare-workers/stripe-checkout-api.js
import Stripe from 'stripe';

export default {
  async fetch(request, env) {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    if (request.method === 'POST') {
      const { userId, priceId, mode, returnUrl } = await request.json();
      
      try {
        // Create or retrieve customer
        const customer = await getOrCreateStripeCustomer(stripe, userId, env.DB);
        
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          payment_method_types: ['card'],
          line_items: [{
            price: priceId,
            quantity: 1
          }],
          mode: mode, // 'subscription' or 'payment'
          success_url: returnUrl.replace('{CHECKOUT_SESSION_ID}', '{session_id}'),
          cancel_url: `${new URL(request.url).origin}/upgrade?cancelled=true`,
          metadata: {
            userId,
            priceId
          }
        });
        
        return Response.json({ sessionId: session.id });
        
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
};

async function getOrCreateStripeCustomer(stripe, userId, db) {
  // Check if customer exists in database
  const existingCustomer = await db
    .prepare('SELECT stripe_customer_id FROM stripe_customers WHERE user_id = ?')
    .first(userId);
    
  if (existingCustomer) {
    return await stripe.customers.retrieve(existingCustomer.stripe_customer_id);
  }
  
  // Get user details
  const user = await db
    .prepare('SELECT email, name FROM user_profiles WHERE id = ?')
    .first(userId);
    
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId }
  });
  
  // Store in database
  await db
    .prepare(`
      INSERT INTO stripe_customers (user_id, stripe_customer_id, created_at)
      VALUES (?, ?, datetime('now'))
    `)
    .run(userId, customer.id);
    
  return customer;
}
```

## 🔔 Webhook Processing

### Webhook Handler Implementation
```javascript
// cloudflare-workers/stripe-webhook.js
import Stripe from 'stripe';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const sig = request.headers.get('stripe-signature');
    const payload = await request.text();
    
    let event;
    
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(payload, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    // Process the event
    try {
      await processWebhookEvent(event, env.DB);
      return Response.json({ received: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return Response.json({ error: 'Processing failed' }, { status: 500 });
    }
  }
};

async function processWebhookEvent(event, db) {
  // Check for duplicate processing
  const existingEvent = await db
    .prepare('SELECT id FROM payment_events WHERE stripe_event_id = ?')
    .first(event.id);
    
  if (existingEvent) {
    console.log(`Event ${event.id} already processed`);
    return;
  }
  
  const eventData = event.data.object;
  let userId = null;
  
  // Extract user ID from customer metadata
  if (eventData.customer) {
    const customer = await db
      .prepare('SELECT user_id FROM stripe_customers WHERE stripe_customer_id = ?')
      .first(eventData.customer);
    userId = customer?.user_id;
  }
  
  // Process specific event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(eventData, userId, db);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(eventData, userId, db);
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(eventData, userId, db);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(eventData, userId, db);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  // Log the event
  await db
    .prepare(`
      INSERT INTO payment_events (
        stripe_event_id, event_type, user_id, customer_id,
        amount_paid, currency, status, metadata,
        processed_at, webhook_received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    .run(
      event.id,
      event.type,
      userId,
      eventData.customer,
      eventData.amount_paid || eventData.amount_total,
      eventData.currency,
      'processed',
      JSON.stringify({ eventData })
    );
}

async function handleCheckoutCompleted(session, userId, db) {
  if (session.mode === 'subscription') {
    // Pro subscription
    await updateUserSubscription(userId, 'pro', 'active', db);
    await trackAnalyticsEvent('subscription_created', { tier: 'pro', userId });
    
  } else if (session.mode === 'payment') {
    // One-time Founders payment
    await updateUserSubscription(userId, 'founders', 'active', db);
    await trackAnalyticsEvent('founders_access_purchased', { userId });
  }
}

async function handlePaymentSucceeded(invoice, userId, db) {
  // Recurring subscription payment
  if (invoice.subscription) {
    await trackAnalyticsEvent('subscription_renewed', { 
      tier: 'pro', 
      userId,
      amount: invoice.amount_paid 
    });
  }
}

async function updateUserSubscription(userId, tier, status, db) {
  // Update user profile
  await db
    .prepare(`
      UPDATE user_profiles 
      SET subscription_tier = ?, subscription_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    .run(tier, status, userId);
}
```

## 🏪 Customer Portal Integration

### Portal Session Creation
```javascript
// Create customer portal session
export const createPortalSession = async (customerId) => {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/billing`
      })
    });
    
    const { url } = await response.json();
    window.location.href = url;
    
  } catch (error) {
    console.error('Portal session creation failed:', error);
  }
};
```

### Backend Portal API
```javascript
// cloudflare-workers/customer-portal.js
export default {
  async fetch(request, env) {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const { customerId, returnUrl } = await request.json();
    
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
      
      return Response.json({ url: portalSession.url });
      
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  }
};
```

## 💻 Frontend Billing Components

### Billing Dashboard
```javascript
// src/pages/Billing.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/UserContext';

const Billing = () => {
  const { user } = useAuth();
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBillingInfo();
  }, [user]);
  
  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/billing-info', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setBillingInfo(await response.json());
    } catch (error) {
      console.error('Failed to fetch billing info:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleManageSubscription = () => {
    createPortalSession(billingInfo.stripe_customer_id);
  };
  
  if (loading) return <div>Loading billing information...</div>;
  
  return (
    <div className="billing-dashboard">
      <h1>Billing & Subscription</h1>
      
      <div className="subscription-status">
        <h2>Current Plan</h2>
        <div className="plan-card">
          <span className="plan-name">{user.subscription_tier}</span>
          <span className="plan-status">{user.subscription_status}</span>
        </div>
      </div>
      
      {billingInfo?.subscription && (
        <div className="subscription-details">
          <p><strong>Next Billing Date:</strong> {billingInfo.next_billing_date}</p>
          <p><strong>Amount:</strong> £{billingInfo.amount}</p>
        </div>
      )}
      
      <div className="billing-actions">
        {user.subscription_tier === 'pro' && (
          <button onClick={handleManageSubscription} className="btn-primary">
            Manage Subscription
          </button>
        )}
        
        {user.subscription_tier === 'free' && (
          <div className="upgrade-options">
            <button onClick={() => createProSubscription(user.id)} className="btn-primary">
              Upgrade to Pro
            </button>
            <button onClick={() => createFoundersPayment(user.id)} className="btn-secondary">
              Get Founders Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Upgrade Success Handling
```javascript
// src/pages/UpgradeSuccess.jsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/UserContext';
import { useAnalytics } from '../hooks/useAnalytics';

const UpgradeSuccess = () => {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const { track } = useAnalytics();
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Refresh user data to get updated subscription
      refreshUser();
      
      // Track successful upgrade
      track('upgrade_completed', {
        session_id: sessionId,
        timestamp: new Date().toISOString()
      });
      
      // Show success toast
      showSuccessToast('Welcome to Pro! 🎉');
    }
  }, [searchParams, refreshUser, track]);
  
  return (
    <div className="upgrade-success">
      <div className="success-message">
        <h1>Welcome to TrySnowball Pro! 🎉</h1>
        <p>Your subscription is now active. You have access to all Pro features including:</p>
        <ul>
          <li>AI Debt Coach</li>
          <li>AI-Generated Reports</li>
          <li>Advanced Charts & Analytics</li>
          <li>Priority Support</li>
        </ul>
        
        <div className="next-steps">
          <a href="/coach" className="btn-primary">Try AI Coach</a>
          <a href="/my-debts" className="btn-secondary">Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
};
```

## 📊 Analytics & Usage Tracking

### Subscription Analytics Alignment
All subscription usage is comprehensively tracked across PostHog + GA4 for funnel analysis and AI cost monitoring:

**Standard Events Tracked:**
- `subscription_tier`: User's current tier (free, pro, founders)
- `feature_used`: Specific feature accessed (ai_coach, ai_report, debt_calculator)
- `ai_model_used`: Model accessed (gpt-3.5-turbo, gpt-4, gpt-4-turbo)
- `tokens_consumed`: Token usage for cost monitoring
- `upgrade_funnel`: Conversion tracking from free to paid tiers

**Daily Usage Monitoring:**
```javascript
// Track AI usage with tier context
const trackAIUsage = (user, feature, tokensUsed, model) => {
  posthog.capture('ai_feature_used', {
    user_tier: user.subscription_tier,
    feature_used: feature,
    tokens_used: tokensUsed,
    model_used: model,
    daily_quota_remaining: getRemainingQuota(user, feature)
  });
  
  // GA4 enhanced e-commerce tracking
  gtag('event', 'ai_interaction', {
    custom_parameter_user_tier: user.subscription_tier,
    custom_parameter_tokens: tokensUsed,
    value: calculateTokenCost(tokensUsed)
  });
};
```

### Cross-Reference Documentation
**🔗 Critical Sync**: This tier structure must stay synchronized with [AI_SYSTEM.md](./AI_SYSTEM.md) tier table to ensure consistent feature delivery.

### Billing Event Tracking
```javascript
// Track subscription events
export const trackBillingEvents = {
  checkoutStarted: (tier) => {
    track('checkout_started', {
      tier,
      amount: SUBSCRIPTION_TIERS[tier].price,
      timestamp: new Date().toISOString()
    });
  },
  
  subscriptionCreated: (tier, customerId) => {
    track('subscription_created', {
      tier,
      customer_id: customerId,
      amount: SUBSCRIPTION_TIERS[tier].price
    });
  },
  
  subscriptionCancelled: (tier, reason) => {
    track('subscription_cancelled', {
      tier,
      reason,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Revenue Metrics
```javascript
// Calculate key subscription metrics
export const calculateSubscriptionMetrics = async (db) => {
  const metrics = {};
  
  // Monthly Recurring Revenue (MRR)
  const activeSubs = await db
    .prepare(`
      SELECT COUNT(*) as count, SUM(5.99) as revenue
      FROM user_profiles 
      WHERE subscription_tier = 'pro' AND subscription_status = 'active'
    `)
    .first();
  
  metrics.mrr = activeSubs.revenue || 0;
  metrics.activeSubscriptions = activeSubs.count || 0;
  
  // Lifetime Founders Revenue
  const foundersRevenue = await db
    .prepare(`
      SELECT COUNT(*) as count, SUM(79) as revenue
      FROM user_profiles 
      WHERE subscription_tier = 'founders'
    `)
    .first();
  
  metrics.foundersRevenue = foundersRevenue.revenue || 0;
  metrics.foundersCount = foundersRevenue.count || 0;
  
  // Churn rate (last 30 days)
  const churnedSubs = await db
    .prepare(`
      SELECT COUNT(*) as count
      FROM payment_events 
      WHERE event_type = 'customer.subscription.deleted' 
      AND processed_at > datetime('now', '-30 days')
    `)
    .first();
  
  metrics.monthlyChurn = churnedSubs.count || 0;
  metrics.churnRate = metrics.activeSubscriptions > 0 
    ? (metrics.monthlyChurn / metrics.activeSubscriptions) * 100 
    : 0;
  
  return metrics;
};
```

## 🔗 Related Documentation

- **[AI System](./AI_SYSTEM.md)** - **CRITICAL SYNC**: AI tier table must match subscription tiers exactly
- **[Technical Architecture](./TECH_ARCHITECTURE.md)** - System architecture and Stripe integration
- **[Data Model](./DATA_MODEL.md)** - Subscription data structure and billing tables
- **[Operations](./OPERATIONS.md)** - Webhook monitoring and billing operations
- **[Analytics](./ANALYTICS.md)** - Subscription event tracking and revenue metrics
- **[Content Style Guide](./CONTENT_STYLE_GUIDE.md)** - British English pricing and terminology standards

## 📋 Implementation Checklist

### Marketing Copy Updates Required
- [ ] Remove all "unlimited AI" language from marketing materials
- [ ] Update pricing pages to show realistic daily limits
- [ ] Add Founders ROI messaging (16-month break-even)
- [ ] Ensure British English pricing format (£4.99, not $4.99)

### Backend Implementation
- [ ] Implement tier-aware `rateLimitAI` function
- [ ] Add AI usage quota API endpoints for frontend display
- [ ] Configure PostHog + GA4 tracking for AI usage monitoring
- [ ] Update Stripe webhook processing for tier assignments

### Frontend Updates
- [ ] Display remaining daily AI quota in coach interface
- [ ] Add tier-appropriate upgrade prompts
- [ ] Implement feature gating for AI reports (Free = 0, Pro = 5, Founders = 10)
- [ ] Update billing dashboard with AI usage statistics

---

*This subscription system provides realistic AI tiers with clear upgrade incentives while maintaining comprehensive analytics tracking and British English standards throughout.*