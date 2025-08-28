-- Migration: Add debts table for server-side debt storage
-- Run with: wrangler d1 execute trysnowball-db --file=./migration-add-debts.sql

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance REAL NOT NULL,
  rate REAL NOT NULL,
  min_payment REAL NOT NULL,
  credit_limit REAL DEFAULT NULL,
  order_index INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts (user_id);

-- Index for ordering debts within user scope
CREATE INDEX IF NOT EXISTS idx_debts_user_order ON debts (user_id, order_index);

-- Sample comment for schema versioning
-- Schema version: v1.0 - Initial debts table with user scoping