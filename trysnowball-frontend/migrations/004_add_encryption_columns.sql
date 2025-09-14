-- Add encryption support to debts table
-- Since SQLite doesn't support ALTER COLUMN, we need to recreate the table

-- Create new table with encryption columns
CREATE TABLE debts_encrypted (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Non-sensitive fields (stored plaintext)
  debt_type TEXT NOT NULL DEFAULT 'credit_card',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  -- Encryption fields
  iv TEXT,
  ciphertext TEXT,
  dek_version INTEGER DEFAULT 1,
  encrypted_at INTEGER,
  
  -- Analytics fields (privacy-safe)
  amount_band TEXT,
  issuer_hash TEXT,
  
  -- Legacy fields for backward compatibility (nullable since data is encrypted)
  name TEXT,
  amount REAL,
  original_amount REAL,
  apr REAL,
  min_payment REAL,
  debt_limit REAL
);

-- Copy existing data (if any)
INSERT INTO debts_encrypted (
  id, user_id, debt_type, order_index, created_at, updated_at,
  name, amount, original_amount, apr, min_payment, debt_limit
)
SELECT 
  id, user_id, debt_type, order_index, created_at, updated_at,
  name, amount, original_amount, apr, min_payment, debt_limit
FROM debts;

-- Drop old table
DROP TABLE debts;

-- Rename new table
ALTER TABLE debts_encrypted RENAME TO debts;

-- Create indexes
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_user_order ON debts(user_id, order_index);
CREATE INDEX idx_debts_encryption ON debts(user_id, encrypted_at);