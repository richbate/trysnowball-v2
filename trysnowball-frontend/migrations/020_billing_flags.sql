-- Migration 020: Bulletproof Billing Flags
-- Date: January 2025
-- Description: Add beta_access flag and stripe_events idempotency table

-- 1. Add beta access flag (if it doesn't exist)
-- This lets us onboard testers without going through Stripe
ALTER TABLE users ADD COLUMN beta_access INTEGER NOT NULL DEFAULT 0;

-- 2. Create stripe_events table for webhook idempotency
-- Critical: prevents duplicate webhook processing
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,               -- event.id from Stripe
  type TEXT NOT NULL,                -- event.type
  processed_at INTEGER NOT NULL      -- unix timestamp
);

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed_at);