-- Migration: Add billing support columns
-- Creates beta_access flag and stripe_events idempotency table

-- Add beta_access column for manual Pro access (testing, special cases)
ALTER TABLE users ADD COLUMN beta_access INTEGER NOT NULL DEFAULT 0;

-- Create Stripe events table for webhook idempotency
-- Critical: prevents double-processing of webhooks
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,           -- Stripe event ID (evt_xxx)
  type TEXT NOT NULL,           -- Event type (e.g., 'customer.subscription.created')
  processed_at INTEGER NOT NULL -- Unix timestamp
);

-- Migrate existing isPro users to the new system
-- This preserves existing Pro users during the transition
UPDATE users SET is_pro = 1 WHERE isPro = 1;

-- Create index for fast event lookups
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at ON stripe_events(processed_at);