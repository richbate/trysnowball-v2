-- Clean UK debt schema - no American cents/bps
-- Uses real British pounds and percentages

-- Drop old messy table (no users, so safe)
DROP TABLE IF EXISTS debts;

-- Create clean UK debt table with historical tracking
CREATE TABLE debts_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,              -- current amount £1234.56
  original_amount REAL,              -- starting amount £5000.00 (optional)
  apr REAL NOT NULL,                 -- 19.9%  
  min_payment REAL NOT NULL,         -- £45.00
  debt_limit REAL,                   -- £5000.00 (optional)
  debt_type TEXT NOT NULL DEFAULT 'credit_card',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  -- Constraints
  CHECK (amount >= 0),
  CHECK (original_amount IS NULL OR original_amount >= 0),
  CHECK (apr >= 0),
  CHECK (min_payment >= 0),
  CHECK (debt_limit IS NULL OR debt_limit >= 0),
  CHECK (debt_type IN ('credit_card', 'loan', 'other'))
);

-- Index for user queries
CREATE INDEX idx_debts_v2_user_id ON debts_v2(user_id);
CREATE INDEX idx_debts_v2_user_order ON debts_v2(user_id, order_index);

-- Rename to primary table
ALTER TABLE debts_v2 RENAME TO debts;