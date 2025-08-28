# TrySnowball - JSON Data Model (CP-1)

**Version**: 2.0.0  
**Last Updated**: August 2025  
**Storage**: IndexedDB via localDebtStore (Dexie ORM)

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## 🏗️ CP-1 Data Architecture Overview

TrySnowball uses IndexedDB via Dexie ORM for all persistence. The structure supports complex queries, relationships, and proper async patterns. **No localStorage** is used for debts, analytics, or theme data.

## 📊 Root Data Structure

```javascript
{
  "userId": "string|null",
  "profile": {
    "name": "string|null",
    "email": "string|null", 
    "createdAt": "ISO8601",
    "lastActive": "ISO8601"
  },
  "debts": [DebtObject],
  "paymentHistory": [PaymentObject],
  "projections": ProjectionsObject,
  "settings": SettingsObject,
  "analytics": AnalyticsObject,
  "referrals": ReferralsObject,
  "milestones": [MilestoneObject],
  "metadata": {
    "version": "string",
    "createdAt": "ISO8601",
    "lastMigration": "ISO8601",
    "migratedAt": "ISO8601"
  }
}
```

## 💰 Debt Object Model

```javascript
{
  "id": "string", // Unique identifier
  "name": "string", // User-friendly debt name
  
  // Financial Details
  "balance": "number", // Current balance (primary field)
  "originalAmount": "number", // Starting balance
  "minPayment": "number", // Minimum monthly payment
  "interestRate": "number", // Annual percentage rate
  "limit": "number|null", // Credit limit (for cards)
  
  // TrySnowball Specific
  "order": "number", // User-defined payoff order (1, 2, 3...)
  "previousBalance": "number|null", // Previous balance for change tracking
  
  // Metadata
  "type": "string", // "credit_card", "loan", "overdraft", etc.
  "isDemo": "boolean", // Demo data flag
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "clearedDate": "ISO8601|null", // When balance reached 0
  
  // History Tracking
  "history": [
    {
      "balance": "number",
      "changedAt": "ISO8601"
    }
  ],
  
  // Legacy Compatibility
  "amount": "number", // Alias for balance (deprecated)
  "regularPayment": "number", // Alias for minPayment (deprecated)
  "interest": "number" // Alias for interestRate (deprecated)
}
```

## 💳 Payment History Model

```javascript
{
  "id": "string",
  "debtId": "string", // Reference to debt object
  "amount": "number", // Payment amount
  "month": "string", // Format: "YYYY-MM"
  "paymentDate": "ISO8601|null", // Actual payment date
  "recordedAt": "ISO8601", // When entered in app
  "type": "string", // "regular", "extra", "lump_sum"
  "notes": "string|null" // User notes
}
```

## 📈 Projections Model

```javascript
{
  "months": [
    {
      "monthKey": "string", // "YYYY-MM"
      "debts": [
        {
          "id": "string",
          "name": "string",
          "startBalance": "number",
          "endBalance": "number",
          "payment": "number",
          "interestCharged": "number",
          "principalPaid": "number",
          "isCleared": "boolean"
        }
      ],
      "totalBalance": "number",
      "totalPayment": "number",
      "totalInterest": "number"
    }
  ],
  "totalMonths": "number", // Time to debt freedom
  "totalInterest": "number", // Total interest paid
  "debtFreeDate": "ISO8601", // Projected completion
  "calculatedAt": "ISO8601"
}
```

## ⚙️ Settings Model

```javascript
{
  "extraPayment": "number", // Monthly extra payment amount
  "currency": "string", // "GBP", "USD", etc.
  "notificationsEnabled": "boolean",
  "reminderDay": "number", // Day of month for balance updates
  "theme": "string", // "light", "dark", "auto"  
  "privacy": {
    "shareProgress": "boolean",
    "allowAnalytics": "boolean",
    "enableAI": "boolean"
  },
  "display": {
    "compactMode": "boolean",
    "showProgressBars": "boolean",
    "hideClearedDebts": "boolean"
  }
}
```

## 📊 Analytics Model

```javascript
{
  "totalDebtPaid": "number", // Lifetime debt eliminated
  "totalInterestSaved": "number", // Interest saved vs minimum payments
  "debtsFreeDate": "ISO8601|null", // Actual debt-free date
  "monthsAhead": "number", // Months ahead of original projection
  "milestonesHit": "number", // Count of achieved milestones
  "averageMonthlyProgress": "number", // Average debt reduction per month
  "consistencyScore": "number", // Payment consistency (0-100)
  "lastCalculated": "ISO8601"
}
```

## 🎉 Referrals & Milestones

### Referrals Model
```javascript
{
  "referralId": "string", // User's unique referral code
  "referredBy": "string|null", // Who referred this user
  "referralCount": "number", // Number of successful referrals
  "events": [
    {
      "type": "string", // "signup", "milestone_shared", "debt_cleared"
      "timestamp": "ISO8601",
      "metadata": "object"
    }
  ]
}
```

### Milestone Model
```javascript
{
  "id": "string",
  "type": "string", // "debt_cleared", "milestone_hit", "all_debts_cleared"
  "debtId": "string|null", // Associated debt (if applicable)
  "achievedAt": "ISO8601",
  "amount": "number|null", // Dollar amount of milestone
  "threshold": "number|null", // Threshold crossed
  "shared": "boolean", // Whether user shared this milestone
  "shareMessage": "string|null", // Generated share text
  "celebrationViewed": "boolean" // Whether user saw celebration modal
}
```

## 🔄 Data Migration Strategy

### Version Tracking
```javascript
{
  "metadata": {
    "version": "0.1.0", // Current data structure version
    "migrations": [
      {
        "from": "0.0.1",
        "to": "0.1.0", 
        "appliedAt": "ISO8601",
        "changes": ["added minPayment field", "normalized balance field"]
      }
    ]
  }
}
```

### Migration Functions
```javascript
// Automatic migration on data load
function migrateDataStructure(data) {
  if (!data.metadata?.version) {
    return migrateLegacyData(data);
  }
  
  if (data.metadata.version < CURRENT_VERSION) {
    return applyMigrations(data);
  }
  
  return data;
}

// Handle legacy data without version info
function migrateLegacyData(data) {
  return {
    ...DEFAULT_STRUCTURE,
    debts: data.debts?.map(normalizeLegacyDebt) || [],
    metadata: {
      version: CURRENT_VERSION,
      migratedFrom: "legacy",
      migratedAt: new Date().toISOString()
    }
  };
}
```

## 🔧 Field Normalization

### Debt Field Aliases
```javascript
// Handle multiple field names for the same data
function normalizeDebtFields(debt) {
  return {
    ...debt,
    balance: debt.balance || debt.amount || 0,
    minPayment: debt.minPayment || debt.regularPayment || calculateMinPayment(debt.balance),
    interestRate: debt.interestRate || debt.interest || 20
  };
}
```

### Required Field Validation
```javascript
// Ensure all debts have required fields
function validateDebtData(debt) {
  const validated = {
    id: debt.id || generateId(),
    name: debt.name || `Debt ${Date.now()}`,
    balance: Math.max(0, debt.balance || 0),
    minPayment: debt.minPayment || Math.max(25, Math.floor(debt.balance * 0.02)),
    interestRate: Math.max(0, Math.min(50, debt.interestRate || 20)),
    order: debt.order || 999,
    createdAt: debt.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return validated;
}
```

## 📱 Storage Implementation

### User-Specific Storage Keys
```javascript
// Guest users
const GUEST_KEY = 'trysnowball-user-data';

// Authenticated users  
const getUserKey = (userId) => `trysnowball-user-data-${userId}`;

// Legacy compatibility
const LEGACY_KEY = 'debtBalances';
```

### Data Persistence
```javascript
class StorageManager {
  constructor() {
    this.key = GUEST_KEY;
  }
  
  setUserKey(userId) {
    this.key = userId ? getUserKey(userId) : GUEST_KEY;
  }
  
  save(data) {
    const serialized = JSON.stringify({
      ...data,
      metadata: {
        ...data.metadata,
        lastSaved: new Date().toISOString()
      }
    });
    
    await localDebtStore.saveData(data); // ✅ Use IndexedDB facade
    
    // Legacy localStorage is forbidden - all data persists in IndexedDB
  }
  
  async load() {
    const stored = await localDebtStore.getData(); // ✅ Use IndexedDB facade
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Data corruption detected, attempting recovery...');
        return this.attemptRecovery();
      }
    }
    return null;
  }
}
```

## 🚀 Evolution Roadmap

### Upcoming Structure Changes
1. **Enhanced AI Context**: Additional fields for AI coaching
2. **Multi-Goal Support**: Savings and investment tracking alongside debt
3. **Family Sharing**: Shared goals with individual privacy
4. **Advanced Analytics**: More detailed progress tracking
5. **Integration Fields**: Placeholders for future bank API integration

### Backwards Compatibility Promise
- **No Breaking Changes**: Old data will always be readable
- **Graceful Migration**: Automatic updates with user notification
- **Export Safety**: Users can always export their complete data
- **Rollback Options**: Ability to revert to previous data versions

## 🔗 Related Documentation

- **[Feature Summary](./FEATURE_SUMMARY.md)** - Application overview and capabilities
- **[AI System](./AI_SYSTEM.md)** - GPT integration and data usage
- **[Offline Workbook](./OFFLINE_WORKBOOK.md)** - Privacy philosophy and approach

---

*This data model balances flexibility, performance, and user privacy while ensuring long-term maintainability and feature evolution.*