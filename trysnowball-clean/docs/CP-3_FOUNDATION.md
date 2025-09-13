# CP-3 Foundation Documentation
**Status**: ✅ LOCKED | **Last Updated**: January 2025

## UKDebt Schema v2.1

### Core Interface
```typescript
interface UKDebt {
  id: string;
  user_id: string;         // Required per v2.1
  name: string;
  amount: number;          // In pounds (not pence)
  apr: number;            // As percentage (not basis points)
  min_payment: number;     // In pounds (not pence)
  order_index: number;    // Snowball priority (1 = highest)
  limit?: number;         // Optional credit limit
  original_amount?: number; // Optional for progress tracking
  debt_type?: string;     // Default: "credit_card"
  buckets?: DebtBucket[];  // CP-4 Extension: Multi-APR buckets
  created_at?: string;    // ISO date string
  updated_at?: string;    // ISO date string
}
```

### Validation Rules
- **name**: 1-100 characters
- **amount**: £0 - £1,000,000
- **min_payment**: £0 - £1,000,000, cannot exceed amount
- **apr**: 0-100%
- **order_index**: 1-9999

## CRUD Endpoint Contracts

### GET /api/v2/debts
**Purpose**: Fetch all user debts
**Headers**: `Authorization: Bearer <token>`
**Response**: `UKDebt[]`

### POST /api/v2/debts
**Purpose**: Create new debt
**Payload**: `CreateUKDebt`
**Response**: `UKDebt` (with generated ID)

### PATCH /api/v2/debts/:id
**Purpose**: Update existing debt
**Payload**: `UpdateUKDebt` (partial)
**Response**: `UKDebt` (updated)

### DELETE /api/v2/debts/:id
**Purpose**: Remove debt
**Response**: `{ success: true }`

## Migration Status
- ✅ Legacy fields purged (`interestRate`, `_cents` fields)
- ✅ All data converted to pounds (not pence)
- ✅ Percentage APRs (not basis points)

## Feature Flag Access Rules
- **Free users**: Single APR debts only
- **Pro users**: Multi-APR bucket support
- **Admin users**: All features + debug panels