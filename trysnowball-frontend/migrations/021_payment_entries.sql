-- Migration 021: Add payment_entries table for encrypted payment tracking
-- This table stores encrypted payment data for secure local-first with cloud sync

CREATE TABLE IF NOT EXISTS payment_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_data TEXT NOT NULL, -- AES-GCM encrypted PaymentEntry JSON
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  
  -- Create index for efficient querying by user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for efficient querying of user payments
CREATE INDEX IF NOT EXISTS idx_payment_entries_user_id ON payment_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_entries_created_at ON payment_entries(created_at);

-- Add database version tracking
INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', '021');