-- Migration 001: User Accounts Foundation (Fixed)
-- Date: September 1, 2025
-- Description: Add user account system with foreign keys for all user data

-- 1. Extend users table with new columns (non-unique first)
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN data_migrated_at TEXT;

-- 2. Create user_debts table (replaces localStorage ts_debts)
CREATE TABLE user_debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance INTEGER NOT NULL, -- stored as pence/cents to avoid float precision issues
  original_amount INTEGER,
  interest_rate REAL NOT NULL,
  min_payment INTEGER NOT NULL,
  debt_type TEXT DEFAULT 'credit_card', -- 'credit_card', 'loan', 'mortgage', 'overdraft'
  order_index INTEGER DEFAULT 0,
  is_cleared BOOLEAN DEFAULT false,
  cleared_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 3. Create user_snapshots table (replaces localStorage ts_snapshots)  
CREATE TABLE user_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  debt_id TEXT NOT NULL,
  balance INTEGER NOT NULL, -- stored as pence/cents
  payment_amount INTEGER, -- if this snapshot records a payment
  recorded_at TEXT NOT NULL, -- when the balance was actually this amount
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(debt_id) REFERENCES user_debts(id)
);

-- 4. Create user_snowflakes table (replaces localStorage ts_snowflakes)
CREATE TABLE user_snowflakes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  debt_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- stored as pence/cents
  month_index INTEGER NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(debt_id) REFERENCES user_debts(id)
);

-- 5. Create user_goals table (replaces localStorage ts_goals)
CREATE TABLE user_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- 'debt_payoff', 'debt_reduction', 'payment_boost'
  title TEXT NOT NULL,
  target_value INTEGER, -- stored as pence/cents if monetary
  target_debt_id TEXT,
  target_date TEXT,
  is_completed BOOLEAN DEFAULT false,
  progress_value INTEGER DEFAULT 0,
  progress_pct INTEGER DEFAULT 0,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(target_debt_id) REFERENCES user_debts(id)
);

-- 6. Create user_commitments table (replaces localStorage ts_commitments)
CREATE TABLE user_commitments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  commitment_text TEXT NOT NULL,
  commitment_type TEXT, -- 'monthly_extra', 'debt_focus', 'spending_cut'
  amount INTEGER, -- stored as pence/cents if monetary
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 7. Create indexes for performance
CREATE INDEX idx_user_debts_user_id ON user_debts(user_id);
CREATE INDEX idx_user_debts_order ON user_debts(user_id, order_index);
CREATE INDEX idx_user_snapshots_user_id ON user_snapshots(user_id);
CREATE INDEX idx_user_snapshots_debt ON user_snapshots(debt_id);
CREATE INDEX idx_user_snapshots_date ON user_snapshots(recorded_at);
CREATE INDEX idx_user_snowflakes_user_id ON user_snowflakes(user_id);
CREATE INDEX idx_user_snowflakes_debt ON user_snowflakes(debt_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_commitments_user_id ON user_commitments(user_id);