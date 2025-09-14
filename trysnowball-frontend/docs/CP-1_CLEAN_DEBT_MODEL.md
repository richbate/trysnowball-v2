# CP-1: Clean Debt Model

**Status**: ✅ Live  
**Last Updated**: 2024-09-11  
**Affects**: All debt handling, API contracts, simulation engine

## Purpose

Defines the canonical structure for debt objects throughout the TrySnowball system, eliminating legacy field naming and conversion functions.

## Canonical Debt Structure

```typescript
interface CleanDebt {
  id: string
  name: string
  amount: number          // Dollar amount (not cents)
  apr: number            // Annual percentage rate (not basis points)
  min_payment: number    // Dollar amount (not cents)
  created_at?: string
  updated_at?: string
}
```

## Field Specifications

### `amount`
- **Type**: `number`
- **Units**: US Dollars (decimal)
- **Range**: `0.01` to `999999.99`
- **Validation**: Must be positive, max 2 decimal places
- **Examples**: `1250.50`, `15000.00`, `75.25`

### `apr`
- **Type**: `number` 
- **Units**: Percentage (decimal)
- **Range**: `0.00` to `99.99`
- **Validation**: Must be non-negative, max 2 decimal places
- **Examples**: `18.24`, `0.00`, `29.99`

### `min_payment`
- **Type**: `number`
- **Units**: US Dollars (decimal) 
- **Range**: `0.01` to `9999.99`
- **Validation**: Must be positive, max 2 decimal places
- **Examples**: `25.00`, `125.75`, `500.00`

## Eliminated Legacy Fields

These fields are **DEPRECATED** and must not be used:

- ❌ `amount_cents` - Use `amount` instead
- ❌ `apr_bps` - Use `apr` instead  
- ❌ `min_payment_cents` - Use `min_payment` instead
- ❌ `interestRate` - Use `apr` instead

## Validation Rules

1. **Required Fields**: `id`, `name`, `amount`, `apr`, `min_payment`
2. **Name Length**: 1-100 characters, non-empty after trim
3. **Numeric Precision**: All monetary values rounded to 2 decimal places
4. **Logical Constraints**: `min_payment` should be reasonable relative to `amount` (warn if > 10%)

## API Contract

All API endpoints must accept and return debts in this exact format. No conversion functions should exist between frontend and backend.

### Example Valid Debt
```json
{
  "id": "debt_123",
  "name": "Credit Card - Chase",
  "amount": 3250.75,
  "apr": 22.99,
  "min_payment": 65.00,
  "created_at": "2024-09-11T10:00:00Z"
}
```

## Migration Notes

- All existing conversion functions (`toCents`, `fromCents`, `toBPS`, `fromBPS`) have been removed
- Fallback chains like `debt.amount || debt.amount_cents / 100 || 0` have been eliminated
- Database schema updated to store values in clean format

## Related Documentation
- CP-0: System Overview
- CP-4: Forecast Engine V2