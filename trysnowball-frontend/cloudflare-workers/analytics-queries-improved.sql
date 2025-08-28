-- Improved Analytics Queries with Standardized Schema
-- Run with: wrangler d1 execute auth_db --command="QUERY_HERE" --remote

-- User type breakdown (standardized)
SELECT 
  CASE 
    WHEN isFounder = true THEN 'founder'
    WHEN isPro = true THEN 'pro' 
    ELSE 'free' 
  END as user_type,
  COUNT(*) as count
FROM users 
GROUP BY user_type;

-- Paying customers view
SELECT * FROM paying_customers ORDER BY created_at DESC LIMIT 20;

-- Recent founder signups (last 7 days)
SELECT email, created_at
FROM users 
WHERE isFounder = true 
  AND created_at >= datetime('now', '-7 days')
ORDER BY created_at DESC;

-- User stats summary
SELECT * FROM user_stats;

-- Webhook processing stats
SELECT 
  event_type,
  COUNT(*) as processed_count,
  MIN(processed_at) as first_processed,
  MAX(processed_at) as last_processed
FROM webhook_events 
GROUP BY event_type 
ORDER BY processed_count DESC;

-- Recent webhook events
SELECT * FROM webhook_events 
ORDER BY processed_at DESC 
LIMIT 50;

-- Users with Stripe customer IDs (successful payments)
SELECT 
  email, 
  stripe_customer_id,
  CASE 
    WHEN isFounder = true THEN 'founder'
    WHEN isPro = true THEN 'pro' 
    ELSE 'free' 
  END as user_type,
  created_at,
  updated_at
FROM users 
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC;