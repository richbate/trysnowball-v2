-- Performance indexes and operational views
-- Migration: Add indexes and views for funnel analytics

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_isfunder ON users(isFounder);
CREATE INDEX IF NOT EXISTS idx_users_ispro ON users(isPro);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_stripecustomerid ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Webhook idempotency table
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_email TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);

-- Paying customers view for ops
CREATE VIEW IF NOT EXISTS paying_customers AS
SELECT 
  email, 
  stripe_customer_id,
  CASE 
    WHEN isFounder = true THEN 'founder'
    WHEN isPro = true THEN 'pro' 
    ELSE 'free' 
  END AS user_type,
  created_at,
  updated_at
FROM users
WHERE isFounder = true OR isPro = true;

-- User stats view
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN isFounder = true THEN 1 ELSE 0 END) as founders,
  SUM(CASE WHEN isPro = true AND isFounder = false THEN 1 ELSE 0 END) as pro_users,
  SUM(CASE WHEN isPro = false AND isFounder = false THEN 1 ELSE 0 END) as free_users,
  SUM(CASE WHEN stripe_customer_id IS NOT NULL THEN 1 ELSE 0 END) as paying_customers
FROM users;