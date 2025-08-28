-- Add isPro column to users table for Stripe Pro subscriptions
-- Migration: Add isPro subscription status

ALTER TABLE users ADD COLUMN isPro BOOLEAN DEFAULT false;

-- Optional: Add stripe_customer_id for easier webhook matching
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT DEFAULT NULL;

-- Add index on stripe_customer_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Add index on isPro for feature gating queries  
CREATE INDEX IF NOT EXISTS idx_users_ispro ON users(isPro);