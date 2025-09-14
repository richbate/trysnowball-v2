# API Design Request: Clean UK Debt Management API

## Context
We've been struggling with a debt management API that has conversion chaos between:
- American cents (123400 = £1,234.00) vs British pounds (1234.00 = £1,234.00)  
- Basis points (1990 = 19.9%) vs percentages (19.9 = 19.9%)
- Multiple field name formats (amount_cents, amount_pennies, amount)
- Complex sanitization and normalization layers
- Silent failures where forms claim success but data doesn't persist

## Our Mistakes
1. **Over-engineering**: Multiple conversion layers, sanitization functions, normalizers
2. **Field Name Chaos**: Frontend sends `balance`, backend expects `amount_cents`
3. **Type Confusion**: Strings vs numbers, undefined vs null vs empty string
4. **Silent Failures**: API returns 200 but data doesn't save due to field mismatches
5. **American vs UK**: Built for US market then retrofitted for UK

## Requirements
- Clean UK format: £1234.56 = 1234.56 (number), 19.9% = 19.9 (number)
- Zero conversions anywhere in the system
- Simple, predictable field names
- Fail fast with clear error messages
- TypeScript interfaces that match API exactly

## Current Database Schema (D1)
```sql
CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  amount REAL,              -- £1234.56
  original_amount REAL,     -- £5000.00 (optional)
  apr REAL,                 -- 19.9
  min_payment REAL,         -- £45.00
  debt_limit REAL,          -- £5000.00 (optional)
  debt_type TEXT DEFAULT 'credit_card',
  order_index INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
```

## Please Design
1. **TypeScript interface** for UKDebt that matches the DB exactly
2. **API endpoints** with clear request/response examples
3. **Error handling** strategy that fails fast
4. **Validation rules** for each field
5. **Simple client-side functions** with zero conversion logic

Make it bulletproof and boring. No clever abstractions.