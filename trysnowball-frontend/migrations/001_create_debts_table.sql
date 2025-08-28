-- Create debts table for debt management
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  balance REAL,
  interest_rate REAL NOT NULL DEFAULT 0,
  min_payment REAL NOT NULL DEFAULT 0,
  "order" INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Indexes for performance
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_order ON debts(user_id, "order");

-- Payment history table for tracking payments
CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  debt_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

-- Index for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON debt_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON debt_payments(payment_date);