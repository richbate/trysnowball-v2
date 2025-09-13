# Entitlements System
**Status**: SPEC | **Version**: v1.0 | **Configurable**: Yes

## Purpose
Configurable limits for features, separating business rules from engine logic. Allows A/B testing and market-responsive changes without code modifications.

## Schema

```typescript
interface Entitlement {
  feature: string;              // Dot-notation feature identifier
  value: number | string | string[]; // Limit value or allowed list
  tier: string;                 // User tier identifier
  effective_date?: string;      // Optional: when this rule takes effect
}
```

## Default Configuration (v1.0)

```json
[
  { 
    "feature": "goals.max_active", 
    "value": 1, 
    "tier": "free" 
  },
  { 
    "feature": "goals.max_active", 
    "value": 10, 
    "tier": "pro" 
  },
  { 
    "feature": "goals.allowed_types", 
    "value": ["DEBT_CLEAR"], 
    "tier": "free" 
  },
  { 
    "feature": "goals.allowed_types", 
    "value": ["DEBT_CLEAR", "AMOUNT_PAID", "INTEREST_SAVED", "TIMEBOUND"], 
    "tier": "pro" 
  },
  { 
    "feature": "goals.bucket_targeting", 
    "value": false, 
    "tier": "free" 
  },
  { 
    "feature": "goals.bucket_targeting", 
    "value": true, 
    "tier": "pro" 
  }
]
```

## Feature Definitions

### goals.max_active
**Type**: `number`
**Purpose**: Maximum concurrent active goals per user
**Free Default**: 1
**Pro Default**: 10

### goals.allowed_types  
**Type**: `string[]`
**Purpose**: Goal types user can create
**Free Default**: `["DEBT_CLEAR"]` (basic debt completion only)
**Pro Default**: All types (advanced targeting)

### goals.bucket_targeting
**Type**: `boolean`
**Purpose**: Can goals target specific buckets within debts
**Free Default**: `false` (debt-level only)
**Pro Default**: `true` (bucket-level precision)

## Enforcement Rules

### 1. Check Before Action
- All goal creation must check entitlements first
- Throw `EntitlementError` if limit exceeded
- Log `entitlement_blocked` analytics event

### 2. Graceful Degradation
- If entitlement check fails, show upgrade prompt
- Never silently ignore user actions
- Always explain why action was blocked

### 3. Config Override
- Business rules change via config update only
- No code changes required for tier adjustments
- Effective dates allow staged rollouts

## Integration Points

```typescript
// Usage example in goal creation
async function createGoal(goalData: CreateGoal, userTier: string): Promise<Goal> {
  // Check max active goals
  const maxActive = getEntitlement('goals.max_active', userTier);
  const activeCount = await countActiveGoals(goalData.user_id);
  
  if (activeCount >= maxActive.value) {
    trackAnalytics('entitlement_blocked', {
      feature: 'goals.max_active',
      user_tier: userTier,
      attempted_value: activeCount + 1,
      limit_value: maxActive.value
    });
    throw new EntitlementError('Maximum active goals reached');
  }
  
  // Check allowed goal types
  const allowedTypes = getEntitlement('goals.allowed_types', userTier);
  if (!allowedTypes.value.includes(goalData.type)) {
    trackAnalytics('entitlement_blocked', {
      feature: 'goals.allowed_types',
      user_tier: userTier,
      attempted_value: goalData.type,
      limit_value: allowedTypes.value
    });
    throw new EntitlementError(`Goal type ${goalData.type} not available on ${userTier} tier`);
  }
  
  return await saveGoal(goalData);
}
```

## Future Extensions

### Admin UI (v2.0)
- Web interface for entitlement management
- A/B test configuration
- Real-time limit adjustments

### Dynamic Entitlements (v3.0)  
- User-specific overrides
- Time-limited promotions
- Usage-based adjustments

## Known Limitations (v1.0)
- Config stored in code, not database
- No admin UI for runtime changes
- Tier changes require user data update
- No automatic tier detection based on usage