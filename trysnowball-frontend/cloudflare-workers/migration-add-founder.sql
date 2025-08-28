-- Add isFounder column to users table for Founders Access tracking
-- Migration: Add Founder status tracking

ALTER TABLE users ADD COLUMN isFounder BOOLEAN DEFAULT false;

-- Add index on isFounder for feature gating queries  
CREATE INDEX IF NOT EXISTS idx_users_isfounder ON users(isFounder);