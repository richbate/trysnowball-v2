# TrySnowball - Data Model & Schema

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Storage**: Dual Architecture (localStorage + Cloudflare D1)  

## 🏗️ Data Architecture Overview

TrySnowball implements a dual storage architecture supporting both privacy-focused local storage for demo users and cloud storage for authenticated users. The system automatically routes data operations based on authentication state while maintaining consistent APIs across both storage layers.

## 🔄 Storage Routing Logic

```javascript
// Automatic storage selection
const getStorageAdapter = (user) => {
  if (!user) return new LocalStorageAdapter();
  return new CloudStorageAdapter(user.id);
};

// Unified data interface
const useDebts = () => {
  const { user } = useAuth();
  const storage = useMemo(() => getStorageAdapter(user), [user]);
  return useDebtsWithStorage(storage);
};
```

## 📊 Cloud Database Schema (Cloudflare D1)

### Core Tables

#### `user_debts`
```sql
CREATE TABLE user_debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  original_amount REAL NOT NULL DEFAULT 0,
  min_payment REAL NOT NULL DEFAULT 0,
  interest_rate REAL NOT NULL DEFAULT 20,
  credit_limit REAL NULL,
  payoff_order INTEGER NOT NULL DEFAULT 999,
  debt_type TEXT NOT NULL DEFAULT 'credit_card',
  is_cleared BOOLEAN DEFAULT FALSE,
  cleared_date TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_user_debts_user_id ON user_debts(user_id);
CREATE INDEX idx_user_debts_order ON user_debts(user_id, payoff_order);
CREATE INDEX idx_user_debts_active ON user_debts(user_id, is_cleared);
```

#### `user_payments`
```sql
CREATE TABLE user_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  debt_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'regular',
  notes TEXT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (debt_id) REFERENCES user_debts(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_payments_user_id ON user_payments(user_id);
CREATE INDEX idx_user_payments_debt_id ON user_payments(debt_id);
CREATE INDEX idx_user_payments_date ON user_payments(user_id, payment_date DESC);
```

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT NULL,
  extra_payment REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  reminder_day INTEGER DEFAULT 1,
  allow_analytics BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_stripe ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_tier ON user_profiles(subscription_tier);
```

#### `stripe_customers`
```sql
CREATE TABLE stripe_customers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  subscription_id TEXT NULL,
  subscription_status TEXT NULL,
  current_period_end TEXT NULL,
  price_id TEXT NULL,
  product_id TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_subscription ON stripe_customers(subscription_id);
```

#### `payment_events`
```sql
CREATE TABLE payment_events (
  id TEXT PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  user_id TEXT NULL,
  customer_id TEXT NULL,
  subscription_id TEXT NULL,
  amount_paid INTEGER NULL,
  currency TEXT NULL,
  status TEXT NOT NULL DEFAULT 'processed',
  processed_at TEXT NOT NULL DEFAULT (datetime('now')),
  webhook_received_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT NULL
);

CREATE INDEX idx_payment_events_stripe_id ON payment_events(stripe_event_id);
CREATE INDEX idx_payment_events_user_id ON payment_events(user_id);
CREATE INDEX idx_payment_events_type ON payment_events(event_type);
CREATE INDEX idx_payment_events_date ON payment_events(processed_at DESC);
```

### Materialized Views for Performance

#### `user_debt_summary`
```sql
CREATE VIEW user_debt_summary AS
SELECT 
  user_id,
  COUNT(*) as total_debts,
  COUNT(CASE WHEN is_cleared = FALSE THEN 1 END) as active_debts,
  SUM(CASE WHEN is_cleared = FALSE THEN balance ELSE 0 END) as total_balance,
  SUM(CASE WHEN is_cleared = FALSE THEN min_payment ELSE 0 END) as total_min_payments,
  MIN(CASE WHEN is_cleared = FALSE THEN payoff_order END) as next_debt_order,
  MAX(updated_at) as last_debt_update
FROM user_debts 
GROUP BY user_id;
```

#### `user_payment_summary`
```sql
CREATE VIEW user_payment_summary AS
SELECT 
  user_id,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount_paid,
  MAX(payment_date) as last_payment_date,
  AVG(amount) as avg_payment_amount
FROM user_payments 
GROUP BY user_id;
```

## 💾 Local Storage Schema (Demo Users)

### Data Structure
```javascript
{
  "userId": null,
  "profile": {
    "name": null,
    "email": null,
    "isDemo": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastActive": "2025-01-01T00:00:00.000Z"
  },
  "debts": [
    {
      "id": "debt_123456",
      "name": "Credit Card 1",
      "balance": 2500.00,
      "originalAmount": 3000.00,
      "minPayment": 75.00,
      "interestRate": 18.9,
      "creditLimit": 3000.00,
      "order": 1,
      "type": "credit_card",
      "isDemo": true,
      "isCleared": false,
      "clearedDate": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "history": [
        {
          "balance": 2500.00,
          "changedAt": "2025-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "payments": [],
  "settings": {
    "extraPayment": 200.00,
    "currency": "GBP",
    "notificationsEnabled": false,
    "reminderDay": 1,
    "theme": "auto",
    "privacy": {
      "shareProgress": false,
      "allowAnalytics": false,
      "enableAI": false
    }
  },
  "analytics": {
    "totalDebtPaid": 0,
    "totalInterestSaved": 0,
    "debtsFreeDate": null,
    "lastCalculated": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "version": "2.0.0",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastMigration": null,
    "lastSaved": "2025-01-01T00:00:00.000Z"
  }
}
```

### Storage Keys
```javascript
// Storage key patterns
const GUEST_KEY = 'trysnowball-guest-data';
const DEMO_KEY = 'trysnowball-demo-data';
const LEGACY_KEY = 'debtBalances'; // For backwards compatibility
```

## 🔄 Data Migration System

### Version Management
```javascript
const CURRENT_VERSION = '2.0.0';

const MIGRATION_MAP = {
  '1.0.0': migrate_1_0_0_to_2_0_0,
  '1.1.0': migrate_1_1_0_to_2_0_0,
  'legacy': migrateLegacyData
};

function migrateUserData(data) {
  const currentVersion = data.metadata?.version || 'legacy';
  
  if (currentVersion === CURRENT_VERSION) {
    return data;
  }
  
  const migrationFn = MIGRATION_MAP[currentVersion];
  if (!migrationFn) {
    throw new Error(`No migration path from version ${currentVersion}`);
  }
  
  return migrationFn(data);
}
```

### Cloud Migration Process
```javascript
// Migrate localStorage to cloud on first login
async function migrateLocalToCloud(userId) {
  const localData = localStorage.getItem(GUEST_KEY);
  if (!localData) return;
  
  const parsed = JSON.parse(localData);
  const migrated = migrateUserData(parsed);
  
  // Upload to cloud storage
  await api.importUserData(userId, migrated);
  
  // Archive local data
  localStorage.setItem(`${GUEST_KEY}_archived`, localData);
  localStorage.removeItem(GUEST_KEY);
}
```

### Database Migrations
```sql
-- Migration tracking table
CREATE TABLE migrations (
  version TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  checksum TEXT NOT NULL
);

-- Example migration
INSERT INTO migrations (version, description, checksum) VALUES 
('2.0.0', 'Add user_payments table and subscription fields', 'abc123def456');
```

## 🧮 Business Logic Data Models

### Debt Calculation Model
```javascript
class DebtCalculation {
  constructor(debt) {
    this.id = debt.id;
    this.balance = debt.balance;
    this.minPayment = debt.minPayment;
    this.interestRate = debt.interestRate / 100 / 12; // Monthly rate
    this.order = debt.order;
  }
  
  calculatePayoffMonths(extraPayment = 0) {
    const payment = this.minPayment + extraPayment;
    if (payment <= this.balance * this.interestRate) {
      return Infinity; // Never pays off
    }
    
    return Math.ceil(
      Math.log(1 + (this.balance * this.interestRate) / payment) /
      Math.log(1 + this.interestRate)
    );
  }
  
  calculateTotalInterest(extraPayment = 0) {
    const months = this.calculatePayoffMonths(extraPayment);
    const payment = this.minPayment + extraPayment;
    return (payment * months) - this.balance;
  }
}
```

### Snowball Strategy Model
```javascript
class SnowballCalculator {
  constructor(debts, extraPayment = 0) {
    this.debts = debts
      .filter(d => !d.isCleared && d.balance > 0)
      .sort((a, b) => a.order - b.order);
    this.extraPayment = extraPayment;
  }
  
  calculatePayoffPlan() {
    const timeline = [];
    let remainingDebts = [...this.debts];
    let availableExtra = this.extraPayment;
    let currentMonth = 0;
    
    while (remainingDebts.length > 0 && currentMonth < 600) {
      const monthData = this.processMonth(remainingDebts, availableExtra);
      timeline.push(monthData);
      
      // Remove cleared debts and add their payments to available extra
      remainingDebts = remainingDebts.filter(debt => {
        if (debt.balance <= 0) {
          availableExtra += debt.minPayment;
          return false;
        }
        return true;
      });
      
      currentMonth++;
    }
    
    return {
      timeline,
      totalMonths: currentMonth,
      totalInterest: timeline.reduce((sum, month) => sum + month.totalInterest, 0),
      debtFreeDate: this.addMonths(new Date(), currentMonth)
    };
  }
}
```

## 📊 Analytics Data Model

### Event Schema
```javascript
const EventSchema = {
  // User identification
  user_id: 'string|null',
  session_id: 'string',
  
  // Event details
  event_name: 'string',
  event_category: 'string',
  timestamp: 'ISO8601',
  
  // Context
  page_url: 'string',
  referrer: 'string|null',
  user_agent: 'string',
  
  // Custom properties
  properties: {
    debt_count: 'number',
    total_balance: 'number',
    subscription_tier: 'string',
    feature_used: 'string'
  }
};
```

### Standard Events
```javascript
const ANALYTICS_EVENTS = {
  // Authentication
  'user_signed_up': { category: 'auth' },
  'user_logged_in': { category: 'auth' },
  'user_logged_out': { category: 'auth' },
  
  // Debt Management
  'debt_added': { category: 'debt_management' },
  'debt_updated': { category: 'debt_management' },
  'debt_cleared': { category: 'debt_management' },
  'payment_recorded': { category: 'debt_management' },
  
  // Features
  'ai_coach_used': { category: 'features', tier: 'pro' },
  'ai_report_generated': { category: 'features', tier: 'pro' },
  'chart_viewed': { category: 'features' },
  
  // Subscription
  'checkout_started': { category: 'subscription' },
  'subscription_created': { category: 'subscription' },
  'subscription_cancelled': { category: 'subscription' }
};
```

## 🔐 Privacy & Security Models

### Data Classification
```javascript
const DATA_CLASSIFICATION = {
  PUBLIC: {
    description: 'Non-sensitive data safe for logging',
    examples: ['event names', 'feature usage', 'page views'],
    retention: '2 years'
  },
  
  PERSONAL: {
    description: 'Identifiable but not financial',
    examples: ['email', 'name', 'preferences'],
    retention: 'Account lifetime + 1 year',
    encryption: 'At rest and in transit'
  },
  
  FINANCIAL: {
    description: 'Sensitive financial information',
    examples: ['debt balances', 'payments', 'bank details'],
    retention: 'User controlled',
    encryption: 'End-to-end where possible',
    access: 'Authenticated users only'
  }
};
```

### Access Control Model
```javascript
const ACCESS_CONTROL = {
  demo_user: {
    data_location: 'localStorage only',
    features: ['basic_tracking', 'calculations', 'charts'],
    analytics: 'Opt-in only'
  },
  
  free_user: {
    data_location: 'Cloud storage',
    features: ['cloud_sync', 'basic_features'],
    analytics: 'Standard tracking with opt-out'
  },
  
  pro_user: {
    data_location: 'Cloud storage',
    features: ['all_features', 'ai_coaching', 'premium_charts'],
    analytics: 'Enhanced tracking with opt-out'
  },
  
  founders_user: {
    data_location: 'Cloud storage',
    features: ['lifetime_access', 'priority_support'],
    analytics: 'Enhanced tracking with opt-out'
  }
};
```

## 🧪 Testing Data Models

### Test Data Factory
```javascript
class TestDataFactory {
  static createDemoDebt(overrides = {}) {
    return {
      id: `debt_${Date.now()}`,
      name: 'Demo Credit Card',
      balance: 2500,
      originalAmount: 3000,
      minPayment: 75,
      interestRate: 18.9,
      order: 1,
      type: 'credit_card',
      isDemo: true,
      isCleared: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }
  
  static createTestUser(tier = 'free') {
    return {
      id: `user_${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      subscription_tier: tier,
      subscription_status: tier === 'free' ? 'inactive' : 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
```

## 🔗 Related Documentation

- **[Technical Architecture](./TECH_ARCHITECTURE.md)** - System architecture and component overview
- **[AI System](./AI_SYSTEM.md)** - GPT integration and data privacy
- **[Operations](./OPERATIONS.md)** - Database management and monitoring
- **[Analytics](./ANALYTICS.md)** - Event tracking and privacy controls
- **[Subscriptions](./SUBSCRIPTIONS.md)** - Billing data and tier management

---

*This data model ensures consistency across storage layers while maintaining privacy controls and supporting the application's dual-architecture approach.*