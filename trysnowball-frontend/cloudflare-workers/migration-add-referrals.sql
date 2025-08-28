-- Migration: Add referral_id and enhanced user management fields
-- Run: wrangler d1 execute auth_db --file=migration-add-referrals.sql

-- Add new columns to existing users table
ALTER TABLE users ADD COLUMN referral_id TEXT;
ALTER TABLE users ADD COLUMN joined_at TEXT DEFAULT CURRENT_TIMESTAMP;  
ALTER TABLE users ADD COLUMN last_seen_at TEXT;
ALTER TABLE users ADD COLUMN is_beta BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';

-- Create unique index for referral_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_id ON users(referral_id);

-- Generate referral_id for existing users who don't have one
-- This uses a simple approach - in production you might want a more sophisticated system
UPDATE users 
SET referral_id = 'snowball-' || substr(hex(randomblob(8)), 1, 8)
WHERE referral_id IS NULL;

-- Copy created_at to joined_at for existing users
UPDATE users 
SET joined_at = created_at, 
    last_seen_at = last_login
WHERE joined_at IS NULL;