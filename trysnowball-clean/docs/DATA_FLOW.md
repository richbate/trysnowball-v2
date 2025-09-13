# 📊 Clean UK Debt App - Data Flow Architecture

**Status**: Production Ready  
**Migration**: Completed React Query Integration  
**Zero Conversions**: ✅ Bulletproof and Boring  

---

## 🔄 **Canonical Data Flow**

```
Dashboard.tsx
    ↓
useDebts() hook (React Query)
    ↓
debtsAPI.ts (Single API Client)
    ↓
/api/v2/debts (Cloudflare Worker)
    ↓
D1 Database: debts table
    ↓
UKDebt schema (UK format only)
```

---

## 🏗️ **Architecture Layers**

### **1. UI Layer**
- **File**: `src/App.tsx` → `Dashboard` component
- **State**: Server-first using React Query
- **Pattern**: No manual `useState([])` for debts
- **Source**: `const { data: debts = [], isLoading, isError } = useDebts()`

### **2. Hook Layer** 
- **File**: `src/hooks/useDebts.ts`
- **Pattern**: Canonical React Query hooks
- **Query**: `useQuery<UKDebt[]>({ queryKey: ['debts'] })`
- **Mutations**: `useCreateDebt()`, `useUpdateDebt()`, `useDeleteDebt()`
- **Cache**: Automatic invalidation on mutations

### **3. API Client Layer**
- **File**: `src/api/debtsAPI.ts` 
- **Pattern**: Single API client (no adapters/gateways)
- **Base URL**: `/api/v2/debts`
- **Auth**: Bearer token injection via `localStorage.getItem('auth_token')`
- **Error**: `DebtAPIError` with proper status codes

### **4. Backend Layer**
- **Platform**: Cloudflare Workers
- **Database**: D1 (SQLite) 
- **Endpoints**: GET, POST, PATCH, DELETE `/api/v2/debts`
- **Schema**: UKDebt format (pounds, percentages - zero conversions)

---

## 📋 **Schema Definition**

### **UKDebt Interface**
```typescript
interface UKDebt {
  id: string;                // UUID primary key
  user_id: string;          // Required per API v2.1
  name: string;             // "Credit Card", "Student Loan"
  amount: number;           // £12,500.50 (pounds, NOT pence)
  apr: number;              // 18.9 (percentage, NOT basis points)
  min_payment: number;      // £125.00 (pounds, NOT pence)
  order_index: number;      // Snowball priority (1 = highest)
  limit?: number;           // Optional credit limit
  original_amount?: number; // Optional for progress tracking
  debt_type?: string;       // Default: "credit_card"
  created_at?: string;      // ISO date string
  updated_at?: string;      // ISO date string
}
```

### **API Response Shapes**

#### GET `/api/v2/debts`
```json
[
  {
    "id": "debt_123",
    "user_id": "user_456", 
    "name": "Credit Card",
    "amount": 12500.50,
    "apr": 18.9,
    "min_payment": 125.00,
    "order_index": 1,
    "debt_type": "credit_card",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST/PATCH `/api/v2/debts`
```json
{
  "id": "debt_123",
  "user_id": "user_456",
  "name": "Credit Card", 
  "amount": 12500.50,
  "apr": 18.9,
  "min_payment": 125.00,
  "order_index": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:05:00Z"
}
```

---

## 🚨 **Forbidden Patterns**

### ❌ **NEVER DO THIS**
```javascript
// Conversion functions (deleted)
const cents = toCents(debt.amount);
const bps = toBPS(debt.apr);

// Fallback chains (eliminated) 
const amount = debt.amount || debt.amount_cents / 100 || 0;

// Multiple API clients (prevented)
import { legacyDebtsAPI } from './legacy';
import { cleanDebtsAPI } from './clean';

// Manual state management (replaced)
const [debts, setDebts] = useState([]);
```

### ✅ **CANONICAL PATTERNS**
```javascript
// Direct schema usage
const amount = debt.amount; // £12,500.50
const apr = debt.apr;       // 18.9%
const minPayment = debt.min_payment; // £125.00

// Single API path
import { fetchAllDebts } from '../api/debtsAPI';

// Server-first state
const { data: debts } = useDebts();
```

---

## 🔧 **CRUD Operations**

### **Create Debt**
```typescript
const createMutation = useCreateDebt();
await createMutation.mutateAsync({
  name: "Credit Card",
  amount: 12500.50,      // £12,500.50
  apr: 18.9,            // 18.9%  
  min_payment: 125.00,  // £125.00
  user_id: "user_456"
});
// Cache automatically invalidated
```

### **Update Debt**
```typescript
const updateMutation = useUpdateDebt();
await updateMutation.mutateAsync({
  id: "debt_123",
  updates: {
    amount: 11500.00  // £11,500.00
  }
});
// Cache automatically invalidated
```

### **Delete Debt**
```typescript
const deleteMutation = useDeleteDebt();
await deleteMutation.mutateAsync("debt_123");
// Cache automatically invalidated
```

---

## 🛡️ **Error Handling**

### **API Level**
```typescript
try {
  const debts = await fetchAllDebts();
} catch (error) {
  if (error instanceof DebtAPIError) {
    console.log(error.status, error.message);
  }
}
```

### **UI Level** 
```typescript
const { data: debts, isLoading, isError, error, refetch } = useDebts();

if (isError) {
  return (
    <div className="error-banner">
      <p>Failed to load debts: {error?.message}</p>
      <button onClick={() => refetch()}>Try again</button>
    </div>
  );
}
```

---

## 📈 **State Management Flow**

1. **Dashboard mounts** → `useDebts()` hook triggered
2. **Hook executes** → `fetchAllDebts()` API call  
3. **API validates** → Response shape checking
4. **Cache updates** → React Query stores result
5. **UI re-renders** → Dashboard shows debts
6. **User creates debt** → `useCreateDebt().mutateAsync()`
7. **Optimistic update** → UI shows loading state
8. **Server confirms** → Cache invalidated and refetched
9. **UI syncs** → Dashboard shows updated list

---

## 📦 **File Structure**

```
src/
├── hooks/
│   └── useDebts.ts          # React Query hooks
├── api/  
│   └── debtsAPI.ts          # Single API client
├── types/
│   └── UKDebt.ts           # TypeScript schema
├── components/
│   ├── DebtForm.tsx        # Create/edit forms
│   └── DebtList.tsx        # Display component
└── App.tsx                 # Dashboard with QueryProvider
```

---

## 🎯 **Production Checklist**

- ✅ **Single API Client**: Only `src/api/debtsAPI.ts` 
- ✅ **Zero Conversions**: Direct pounds/percentages
- ✅ **Server-First State**: React Query integration
- ✅ **Proper Error Handling**: `DebtAPIError` + UI boundaries
- ✅ **Response Validation**: Array/object shape checking  
- ✅ **Token Injection**: Bearer auth via localStorage
- ✅ **Cache Management**: Automatic invalidation
- ✅ **TypeScript Coverage**: Full type safety

---

## 🔄 **Cache Strategy**

- **Stale Time**: 5 minutes (data considered fresh)
- **Retry Policy**: 1 retry on failure
- **Invalidation**: On successful mutations
- **Background Refetch**: When window regains focus
- **Optimistic Updates**: None (server-first approach)

---

**Last Updated**: 2025-09-11  
**Architecture**: Server-First React Query  
**Status**: Production Ready  