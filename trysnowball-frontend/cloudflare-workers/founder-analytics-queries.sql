-- Founders Analytics Queries
-- Use these with: wrangler d1 execute auth_db --command="QUERY_HERE" --remote

-- Get all Founder users
SELECT email, created_at, updated_at 
FROM users 
WHERE isFounder = true 
ORDER BY updated_at DESC;

-- Count Founders vs Pro vs Free users
SELECT 
  CASE 
    WHEN isFounder = true THEN 'Founder'
    WHEN isPro = true THEN 'Pro'
    ELSE 'Free'
  END as user_type,
  COUNT(*) as count
FROM users 
GROUP BY user_type;

-- Recent Founder signups (last 7 days)
SELECT email, created_at
FROM users 
WHERE isFounder = true 
  AND created_at >= datetime('now', '-7 days')
ORDER BY created_at DESC;

-- Users with Stripe customer IDs (paying customers)
SELECT email, isPro, isFounder, stripe_customer_id, updated_at
FROM users 
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC;