-- Clean UK Debt Management Database Schema
-- Zero conversions: amounts in pounds, percentages as decimals
-- API Contract v2.1 compliant

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  -- Encrypted sensitive fields
  name TEXT NOT NULL,             -- Encrypted debt name
  amount TEXT NOT NULL,           -- Encrypted amount (stored as encrypted string)
  apr TEXT NOT NULL,              -- Encrypted APR (stored as encrypted string)
  min_payment TEXT NOT NULL,      -- Encrypted min payment (stored as encrypted string)
  limit_amount TEXT,              -- Encrypted credit limit (optional)
  original_amount TEXT,           -- Encrypted original amount
  
  -- Non-sensitive fields
  order_index INTEGER NOT NULL,   -- Snowball priority (1 = highest)
  debt_type TEXT DEFAULT 'credit_card',
  created_at TEXT NOT NULL,       -- ISO date string
  updated_at TEXT NOT NULL,       -- ISO date string
  
  -- Analytics metadata (privacy-preserving buckets only)
  amount_range TEXT NOT NULL,     -- 'under_1k', '1k_5k', '5k_10k', '10k_plus'
  apr_range TEXT NOT NULL,        -- 'low_0_10', 'medium_10_20', 'high_20_plus'
  payment_burden TEXT NOT NULL,   -- 'light', 'moderate', 'heavy' (min_payment/amount ratio)
  category TEXT NOT NULL,         -- 'credit_card', 'loan', 'mortgage', 'other'
  created_month TEXT NOT NULL,    -- 'YYYY-MM' for cohort analysis
  payoff_quarter TEXT             -- 'YYYY-QN' estimated payoff quarter
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_order ON debts(user_id, order_index);
CREATE INDEX IF NOT EXISTS idx_debts_created ON debts(created_at);

-- Sample data for demo user
INSERT OR IGNORE INTO debts (
  id, user_id, name, amount, apr, min_payment, order_index,
  original_amount, debt_type, created_at, updated_at
) VALUES 
(
  'debt_demo_001',
  'demo_user_123', 
  'Credit Card',
  2500.00,    -- £2,500.00
  18.9,       -- 18.9%
  75.00,      -- £75.00
  1,
  3000.00,    -- Originally £3,000.00
  'credit_card',
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
),
(
  'debt_demo_002',
  'demo_user_123',
  'Student Loan', 
  15000.00,   -- £15,000.00
  3.1,        -- 3.1%
  120.00,     -- £120.00
  2,
  18000.00,   -- Originally £18,000.00
  'student_loan',
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
);