-- Migration 005: User Plans for Subscription Management
-- Date: January 2025
-- Description: Add proper subscription management with user_plans table

-- 1. Create user_plans table for subscription management
CREATE TABLE IF NOT EXISTS user_plans (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',                   -- 'free' | 'pro' | 'founder'
  status TEXT NOT NULL DEFAULT 'inactive',             -- Stripe-like: 'active'|'trialing'|'past_due'|'canceled'|'incomplete'|'incomplete_expired'|'paused'
  current_period_end INTEGER,                          -- unix seconds
  cancel_at_period_end INTEGER,                        -- 0/1
  trial_end INTEGER,                                   -- unix seconds
  is_paid INTEGER NOT NULL DEFAULT 0,                  -- 0/1 (derived, but stored for fast reads)
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2. Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plans_customer ON user_plans(stripe_customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plans_sub ON user_plans(stripe_subscription_id);

-- 3. Create webhook events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,               -- event.id from Stripe
  type TEXT NOT NULL,
  processed_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 4. Migrate existing isPro users to user_plans table
INSERT OR IGNORE INTO user_plans (user_id, stripe_customer_id, plan, status, is_paid, updated_at)
SELECT 
  id,
  stripe_customer_id,
  CASE 
    WHEN isPro = 1 THEN 'pro'
    WHEN isFounder = 1 THEN 'founder' 
    ELSE 'free'
  END,
  CASE 
    WHEN isPro = 1 OR isFounder = 1 THEN 'active'
    ELSE 'inactive'
  END,
  CASE 
    WHEN isPro = 1 OR isFounder = 1 THEN 1
    ELSE 0
  END,
  unixepoch()
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_plans);

-- 5. Add indexes for users table foreign keys
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- 6. Update existing webhook_events table if it exists with different schema
-- (The webhook handler expects this specific schema)
DROP TABLE IF EXISTS webhook_events;
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL DEFAULT (unixepoch())
);