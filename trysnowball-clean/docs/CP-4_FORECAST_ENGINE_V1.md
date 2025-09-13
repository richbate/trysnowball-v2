# CP-4 Forecast Engine v1.0 (Flat Simulation)
**Status**: ✅ OPERATIONAL | **Engine**: `snowballSimulator.ts`

## Algorithm Overview
Traditional snowball method: Pay minimums + all extra to lowest balance debt.

### Core Rules
1. **Interest Calculation**: `APR / 12` per month, rounded to pence
2. **Minimum Payments**: Applied first to all debts
3. **Extra Payment**: Applied to debt with lowest `order_index`
4. **Snowball Rollover**: When debt paid off, minimum goes to next debt

### Input Schema
```typescript
interface SimulationInput {
  debts: UKDebt[];
  extraPerMonth: number;
  startDate?: Date;
}
```

### Output Schema  
```typescript
interface PlanResult {
  month: number;
  debts: DebtSnapshot[];
  totalBalance: number;
  totalInterest: number;
  totalPrincipal: number;
  snowballAmount: number;
}

interface DebtSnapshot {
  id: string;
  name: string;
  startingBalance: number;
  interestCharged: number;
  principalPaid: number;
  snowballApplied: number;
  endingBalance: number;
  isPaidOff: boolean;
}
```

### Known Limitations
- Single APR per debt (no bucket support)
- Fixed monthly payments (no date logic)
- 50-year maximum simulation
- Rounds to pence precision

### Usage Example
```typescript
const results = simulateSnowballPlan({
  debts: ukDebts,
  extraPerMonth: 100
});
// Returns month-by-month payment plan
```