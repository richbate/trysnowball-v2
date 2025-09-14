-- Migration 004: Make legacy columns nullable for encryption-only workflow
-- Rebuilds debts table with legacy columns nullable to prevent NOT NULL constraint failures

BEGIN TRANSACTION;

-- 1) Create new table with desired schema (legacy columns nullable)
CREATE TABLE debts_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Legacy columns kept but nullable (no NOT NULL constraint)
  name TEXT,
  balance REAL,
  min_payment REAL,
  interest_rate REAL,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Encryption columns (required)
  dek_version INTEGER NOT NULL DEFAULT 1,
  iv TEXT,
  ciphertext TEXT,
  encrypted_at INTEGER,
  last_decrypted_at INTEGER,
  
  -- Analytics columns (de-identified)
  amount_band TEXT,
  issuer_hash TEXT,
  debt_type TEXT,
  
  -- Ordering
  order_index INTEGER DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2) Copy existing data (legacy columns will be copied if they exist, NULL otherwise)
INSERT INTO debts_new (
  id, user_id, name, balance, min_payment, interest_rate,
  created_at, updated_at,
  dek_version, iv, ciphertext, encrypted_at, last_decrypted_at,
  amount_band, issuer_hash, debt_type, order_index
)
SELECT
  id, user_id, name, balance, min_payment, interest_rate,
  created_at, updated_at,
  dek_version, iv, ciphertext, encrypted_at, last_decrypted_at,
  amount_band, issuer_hash, debt_type, order_index
FROM debts;

-- 3) Swap tables
DROP TABLE debts;
ALTER TABLE debts_new RENAME TO debts;

-- 4) Recreate indexes for performance
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_type ON debts(user_id, debt_type);
CREATE INDEX IF NOT EXISTS idx_debts_user_amountband ON debts(user_id, amount_band);
CREATE INDEX IF NOT EXISTS idx_debts_user_order ON debts(user_id, order_index);
CREATE INDEX IF NOT EXISTS idx_debts_issuer_hash ON debts(issuer_hash);

COMMIT;