# TrySnowball - Analytics & Tracking

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Analytics Stack**: PostHog + Google Analytics 4  

## 🎯 Analytics Overview

TrySnowball implements a privacy-focused analytics approach with dual tracking systems: PostHog for product analytics and Google Analytics 4 for traditional web analytics. The system respects user privacy with granular opt-out controls and excludes developer analytics from production data.

## 📊 Analytics Architecture

### Dual Tracking System
```
User Interactions
       ↓
   Privacy Check
       ↓
┌──────────────────┐
│   PostHog        │  ← Product Analytics
│   (Primary)      │    - Feature usage
│                  │    - User journeys  
│                  │    - A/B testing
└──────────────────┘
       ↓
┌──────────────────┐
│ Google Analytics │  ← Web Analytics
│ (Secondary)      │    - Traffic sources
│                  │    - Page views
│                  │    - Conversions
└──────────────────┘
```

### Privacy Implementation
```javascript
// Privacy-first tracking with user controls
const shouldTrack = (user) => {
  // Never track demo users without explicit consent
  if (!user && !user?.settings?.allowAnalytics) return false;
  
  // Exclude developer users
  if (isDeveloperUser(user)) return false;
  
  // Respect user preferences
  return user.settings.allowAnalytics !== false;
};
```

## 🔧 Implementation Details

### PostHog Integration

#### Configuration
```javascript
// src/lib/posthog.js
import posthog from 'posthog-js';

const POSTHOG_CONFIG = {
  api_host: 'https://app.posthog.com',
  loaded: (ph) => {
    if (process.env.NODE_ENV === 'development') {
      ph.debug();
    }
  },
  capture_pageview: false, // Manual control
  capture_pageleave: true,
  disable_session_recording: true, // Privacy focused
  respect_dnt: true,
  opt_out_capturing_by_default: false
};

export const initializePostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.REACT_APP_POSTHOG_KEY, POSTHOG_CONFIG);
  }
};
```

#### User Identification
```javascript
// User identification with privacy controls
export const identifyUser = (user) => {
  if (!shouldTrackUser(user)) return;
  
  posthog.identify(user.id, {
    email: user.email,
    subscription_tier: user.subscription_tier,
    created_at: user.created_at,
    // Exclude sensitive financial data
  });
};

// Clear identification on logout
export const resetUserIdentification = () => {
  posthog.reset();
};
```

### Google Analytics 4 Integration

#### Configuration
```javascript
// src/lib/analytics.js
export const initializeGA4 = () => {
  if (typeof window === 'undefined') return;
  
  window.gtag = window.gtag || function() {
    (window.gtag.q = window.gtag.q || []).push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
};
```

#### Enhanced E-commerce Tracking
```javascript
// Track subscription purchases
export const trackPurchase = (subscriptionTier, amount, currency = 'GBP') => {
  if (!shouldTrack()) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: generateTransactionId(),
    value: amount,
    currency: currency,
    items: [{
      item_id: subscriptionTier,
      item_name: `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Subscription`,
      category: 'Subscription',
      quantity: 1,
      price: amount
    }]
  });
};
```

## 📈 Event Tracking Schema

### Standard Events

#### Authentication Events
```javascript
const AUTH_EVENTS = {
  'user_signed_up': {
    category: 'auth',
    properties: {
      method: 'email',
      subscription_tier: 'free'
    }
  },
  
  'user_logged_in': {
    category: 'auth',
    properties: {
      method: 'email'
    }
  },
  
  'user_logged_out': {
    category: 'auth'
  }
};
```

#### Debt Management Events
```javascript
const DEBT_EVENTS = {
  'debt_added': {
    category: 'debt_management',
    properties: {
      debt_count: 'number',
      debt_type: 'string',
      balance_range: 'string' // '<1k', '1k-5k', '5k-10k', '10k+'
    }
  },
  
  'debt_updated': {
    category: 'debt_management',
    properties: {
      field_changed: 'string',
      debt_count: 'number'
    }
  },
  
  'debt_cleared': {
    category: 'debt_management',
    properties: {
      months_to_clear: 'number',
      amount_paid: 'number',
      interest_saved: 'number'
    }
  },
  
  'payment_recorded': {
    category: 'debt_management',
    properties: {
      payment_type: 'string', // 'regular', 'extra', 'lump_sum'
      amount_range: 'string'
    }
  }
};
```

#### Feature Usage Events
```javascript
const FEATURE_EVENTS = {
  'ai_coach_used': {
    category: 'features',
    tier_required: 'pro',
    properties: {
      question_type: 'string',
      response_helpful: 'boolean'
    }
  },
  
  'ai_report_generated': {
    category: 'features',
    tier_required: 'pro',
    properties: {
      report_type: 'string',
      debt_count: 'number'
    }
  },
  
  'chart_viewed': {
    category: 'features',
    properties: {
      chart_type: 'string', // 'payoff_timeline', 'balance_trend', 'interest_savings'
      data_points: 'number'
    }
  },
  
  'what_if_analysis': {
    category: 'features',
    properties: {
      scenario_type: 'string',
      extra_payment_amount: 'number'
    }
  }
};
```

#### Subscription Events
```javascript
const SUBSCRIPTION_EVENTS = {
  'checkout_started': {
    category: 'subscription',
    properties: {
      tier: 'string',
      amount: 'number',
      currency: 'string'
    }
  },
  
  'subscription_created': {
    category: 'subscription',
    properties: {
      tier: 'string',
      billing_period: 'string',
      amount: 'number'
    }
  },
  
  'subscription_upgraded': {
    category: 'subscription',
    properties: {
      from_tier: 'string',
      to_tier: 'string'
    }
  },
  
  'subscription_cancelled': {
    category: 'subscription',
    properties: {
      tier: 'string',
      reason: 'string',
      days_active: 'number'
    }
  }
};
```

### Custom Event Implementation

#### React Hook for Analytics
```javascript
// src/hooks/useAnalytics.js
import { useContext, useCallback } from 'react';
import { UserContext } from '../contexts/UserContext';
import { trackEvent as trackPostHog } from '../lib/posthog';
import { trackEvent as trackGA4 } from '../lib/analytics';

export const useAnalytics = () => {
  const { user } = useContext(UserContext);
  
  const track = useCallback((eventName, properties = {}) => {
    // Privacy check
    if (!shouldTrackUser(user)) return;
    
    // Add standard properties
    const enrichedProperties = {
      ...properties,
      user_tier: user?.subscription_tier || 'demo',
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      user_agent: navigator.userAgent
    };
    
    // Track in both systems
    trackPostHog(eventName, enrichedProperties);
    trackGA4(eventName, enrichedProperties);
  }, [user]);
  
  return { track };
};
```

#### Component Usage Example
```javascript
// In React components
import { useAnalytics } from '../hooks/useAnalytics';

const MyDebtsPage = () => {
  const { track } = useAnalytics();
  
  const handleAddDebt = (debtData) => {
    // Add debt logic...
    
    // Track the event
    track('debt_added', {
      debt_type: debtData.type,
      balance_range: getBalanceRange(debtData.balance),
      debt_count: debts.length + 1
    });
  };
  
  return (
    // Component JSX...
  );
};
```

## 🔐 Privacy Controls

### Developer Analytics Exclusion

#### PostHog Exclusion
```javascript
// src/lib/posthog.js
const EXCLUDED_USER_IDS = [
  'dev-user-123',
  '01988524-b5a8-7492-aae0-60f028db3399' // Live user ID
];

const EXCLUDED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  'localhost:3000'
];

export const isDeveloperUser = (user) => {
  // Exclude by user ID
  if (user?.id && EXCLUDED_USER_IDS.includes(user.id)) return true;
  
  // Exclude localhost development
  if (EXCLUDED_HOSTNAMES.includes(window.location.hostname)) return true;
  
  return false;
};
```

#### Google Analytics Exclusion
```javascript
// Exclude internal traffic
export const configureGA4Exclusions = () => {
  // Exclude developer IPs (if available)
  window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
    custom_map: { 'custom_parameter_1': 'user_type' },
    user_type: isDeveloperUser() ? 'developer' : 'user'
  });
};
```

### User Privacy Controls

#### Opt-out Implementation
```javascript
// Privacy settings component
const PrivacySettings = () => {
  const { user, updateUserSettings } = useContext(UserContext);
  const [allowAnalytics, setAllowAnalytics] = useState(user?.settings?.allowAnalytics ?? true);
  
  const handleAnalyticsToggle = async (enabled) => {
    setAllowAnalytics(enabled);
    
    await updateUserSettings({
      allowAnalytics: enabled
    });
    
    if (!enabled) {
      // Opt out of tracking services
      posthog.opt_out_capturing();
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    } else {
      posthog.opt_in_capturing();
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };
  
  return (
    <div className="privacy-controls">
      <label>
        <input
          type="checkbox"
          checked={allowAnalytics}
          onChange={(e) => handleAnalyticsToggle(e.target.checked)}
        />
        Allow analytics and performance tracking
      </label>
    </div>
  );
};
```

## 📊 Analytics Dashboard & Reporting

### Key Performance Indicators (KPIs)

#### User Engagement Metrics
```javascript
const USER_ENGAGEMENT_KPIs = {
  // Activation
  'time_to_first_debt': 'Time from signup to first debt added',
  'onboarding_completion_rate': 'Percentage completing onboarding',
  'demo_to_signup_conversion': 'Demo users who create accounts',
  
  // Retention
  'monthly_active_users': 'Users active in past 30 days',
  'debt_update_frequency': 'How often users update balances',
  'feature_adoption_rate': 'Adoption of premium features',
  
  // Success
  'debt_cleared_rate': 'Users who clear at least one debt',
  'average_debt_reduction': 'Monthly debt reduction per user',
  'plan_adherence_score': 'How well users follow their plan'
};
```

#### Business Metrics
```javascript
const BUSINESS_KPIs = {
  // Revenue
  'subscription_conversion_rate': 'Free to paid conversion',
  'average_revenue_per_user': 'Monthly revenue per user',
  'lifetime_value': 'Projected user lifetime value',
  
  // Growth
  'user_acquisition_cost': 'Cost to acquire new users',
  'organic_growth_rate': 'Users from referrals/organic',
  'churn_rate': 'Monthly subscription cancellations'
};
```

### Custom Dashboards

#### PostHog Dashboard Configuration
```javascript
// Dashboard insights configuration
const POSTHOG_INSIGHTS = {
  user_journey: {
    type: 'funnel',
    steps: [
      'page_viewed://',
      'debt_added',
      'plan_generated',
      'payment_recorded'
    ],
    breakdown: 'subscription_tier'
  },
  
  feature_usage: {
    type: 'trends',
    events: ['ai_coach_used', 'chart_viewed', 'what_if_analysis'],
    breakdown: 'subscription_tier'
  },
  
  retention_cohorts: {
    type: 'retention',
    returning_event: 'debt_updated',
    breakdown: 'signup_method'
  }
};
```

#### Google Analytics 4 Custom Reports
```javascript
// GA4 custom dimensions and metrics
const GA4_CUSTOM_CONFIG = {
  custom_dimensions: {
    'user_tier': 'subscription_tier',
    'debt_count_range': 'debt_count_range',
    'feature_used': 'feature_name'
  },
  
  custom_metrics: {
    'debt_cleared_count': 'total_debts_cleared',
    'interest_saved': 'total_interest_saved'
  },
  
  conversion_events: [
    'subscription_created',
    'debt_cleared',
    'ai_report_generated'
  ]
};
```

## 🧪 A/B Testing Framework

### PostHog Feature Flags

#### Feature Flag Implementation
```javascript
// src/hooks/useFeatureFlag.js
import { useFeatureFlagEnabled } from 'posthog-js/react';

export const useFeatureFlag = (flagName) => {
  const isEnabled = useFeatureFlagEnabled(flagName);
  const { track } = useAnalytics();
  
  // Track feature flag exposure
  useEffect(() => {
    if (isEnabled !== undefined) {
      track('feature_flag_exposed', {
        flag_name: flagName,
        variant: isEnabled ? 'test' : 'control'
      });
    }
  }, [isEnabled, flagName, track]);
  
  return isEnabled;
};
```

#### A/B Test Example
```javascript
// Test new onboarding flow
const NewUserOnboarding = () => {
  const showNewOnboarding = useFeatureFlag('new_onboarding_flow');
  
  return showNewOnboarding ? (
    <ImprovedOnboardingFlow />
  ) : (
    <StandardOnboardingFlow />
  );
};
```

### Test Configuration
```javascript
// Common A/B tests
const AB_TESTS = {
  'new_onboarding_flow': {
    description: 'Test improved onboarding with progress indicators',
    success_metric: 'onboarding_completion_rate',
    variants: ['control', 'progress_indicators']
  },
  
  'ai_coach_placement': {
    description: 'Test AI coach button placement',
    success_metric: 'ai_coach_usage_rate',
    variants: ['sidebar', 'floating', 'top_nav']
  },
  
  'pricing_display': {
    description: 'Test pricing page layout',
    success_metric: 'subscription_conversion_rate',
    variants: ['table', 'cards', 'comparison']
  }
};
```

## 📋 Analytics Maintenance

### Regular Tasks

#### Weekly Analytics Review
```bash
# PostHog CLI (if available)
# Review key metrics
posthog insights list --project-id your-project

# Google Analytics reporting API
# Generate automated reports
```

#### Monthly Data Quality Check
```javascript
// Validate tracking implementation
const validateTracking = () => {
  const requiredEvents = [
    'debt_added', 'payment_recorded', 'subscription_created'
  ];
  
  requiredEvents.forEach(event => {
    if (!isEventTracked(event)) {
      console.error(`Missing tracking for ${event}`);
    }
  });
};
```

### Performance Monitoring
```javascript
// Track analytics performance impact
const measureAnalyticsPerformance = () => {
  const startTime = performance.now();
  
  // Your analytics call
  track('event_name', properties);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Ensure analytics don't slow down the app
  if (duration > 100) { // 100ms threshold
    console.warn(`Analytics call took ${duration}ms`);
  }
};
```

## 🔗 Related Documentation

- **[Technical Architecture](./TECH_ARCHITECTURE.md)** - System overview and privacy controls
- **[Data Model](./DATA_MODEL.md)** - Data structure for analytics events
- **[Operations](./OPERATIONS.md)** - Monitoring and alerting setup
- **[Subscriptions](./SUBSCRIPTIONS.md)** - Billing event tracking
- **[AI System](./AI_SYSTEM.md)** - AI usage analytics and privacy

---

*This analytics implementation balances comprehensive insights with user privacy, providing actionable data while respecting user choices and excluding internal traffic.*