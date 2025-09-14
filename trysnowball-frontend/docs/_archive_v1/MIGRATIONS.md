# TrySnowball Data Migration Guide

## API Field Migrations

### Debt Fields (v2.0 → v3.0)
| Old Field | New Field | Format Change | Notes |
|-----------|-----------|---------------|-------|
| `balance` | `amount_cents` | £ → pence (×100) | Integer cents for precision |
| `interestRate` | `apr_bps` | % → basis points (×100) | 19.99% = 1999 bps |
| `minPayment` | `min_payment_cents` | £ → pence (×100) | Integer cents |
| `name` | `issuer` | Same | Clearer semantic meaning |
| `type` | `debt_type` | Same | Consistent naming |
| `order` | `order_index` | Same | Explicit index naming |

### Response Format Example
```javascript
// OLD (legacy)
{
  "id": "debt-123",
  "name": "Barclaycard",
  "balance": 2500.50,
  "interestRate": 19.99,
  "minPayment": 75.00
}

// NEW (normalized)
{
  "id": "debt-123",
  "issuer": "Barclaycard",
  "amount_cents": 250050,
  "apr_bps": 1999,
  "min_payment_cents": 7500
}
```

## Hook Migrations

### useDebts → useUserDebts
```javascript
// OLD
import { useDebts } from '../hooks/useDebts';
const { debts, addDebt, updateDebt } = useDebts();

// NEW
import { useUserDebts } from '../hooks/useUserDebts';
const { debts, upsertDebt, deleteDebt } = useUserDebts();
```

### Key differences:
- `useUserDebts` always uses authenticated API when logged in
- `addDebt` + `updateDebt` → unified `upsertDebt`
- Automatic encryption/decryption for sensitive data
- Returns normalized fields (amount_cents, apr_bps)

## Analytics Migrations

### Direct posthog → secureAnalytics
```javascript
// OLD (PII leak risk)
posthog.capture('debt_added', {
  balance: 2500,
  issuer: 'Barclaycard'
});

// NEW (de-identified)
import { captureDebtAdded } from '../utils/secureAnalytics';
captureDebtAdded({
  balance: 2500,
  name: 'Barclaycard'
});
// Automatically bands amounts and hashes issuer
```

## Component Migrations

### Display formatting
```javascript
// OLD
<div>£{debt.balance.toFixed(2)}</div>

// NEW
import { formatDebtAmount } from '../utils/debtValidation';
<div>{formatDebtAmount(debt.amount_cents)}</div>
```

### Form inputs
```javascript
// OLD
<input value={debt.balance} onChange={e => setBalance(e.target.value)} />

// NEW (convert at boundaries)
<input 
  value={debt.amount_cents / 100} 
  onChange={e => setAmountCents(Math.round(e.target.value * 100))} 
/>
```

## Migration Checklist

- [ ] Replace all `useDebts` imports with `useUserDebts`
- [ ] Update API calls to send/expect normalized fields
- [ ] Replace direct `posthog.capture` with `secureAnalytics.*`
- [ ] Update display components to use formatters
- [ ] Add validation at form boundaries
- [ ] Run `scripts/check-legacy.sh` to verify
- [ ] Update tests to use new field names

## Rollback Plan

If you need to temporarily support legacy fields:

1. The API already normalizes on input via `normalizeDebtPatch()`
2. Add a response transformer if needed:
```javascript
function addLegacyFields(debt) {
  return {
    ...debt,
    // Add legacy aliases (read-only)
    balance: debt.amount_cents / 100,
    interestRate: debt.apr_bps / 100,
    minPayment: debt.min_payment_cents / 100
  };
}
```

## Timeline
- **Phase 1** (Complete): API accepts both formats, returns normalized
- **Phase 2** (Current): Migrate all components to normalized format  
- **Phase 3** (Next): Remove legacy field support from API
- **Phase 4** (Future): Drop legacy columns from database