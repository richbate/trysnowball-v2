-- Local test schema for secure debt encryption
-- Minimal setup for testing

-- Drop and recreate tables to start fresh
DROP TABLE IF EXISTS debts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS migrations;

-- Users table (minimal)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Debts table with encryption columns
CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Non-sensitive metadata
  debt_type TEXT DEFAULT 'other',
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Encryption columns
  dek_version INTEGER DEFAULT 1,
  iv TEXT,
  ciphertext TEXT,
  encrypted_at INTEGER,
  last_decrypted_at INTEGER,
  
  -- Analytics columns (de-identified)
  amount_band TEXT,
  issuer_hash TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Migrations table
CREATE TABLE migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_debts_user ON debts(user_id);
CREATE INDEX idx_debts_user_type ON debts(user_id, debt_type);

-- Insert test data
INSERT INTO users (id, email) VALUES 
  ('test-user-123', 'test@example.com'),
  ('demo-user-456', 'demo@example.com');

-- Mark migration as applied
INSERT INTO migrations (version, name, applied_at) VALUES 
  (1, 'local_test_schema', unixepoch());