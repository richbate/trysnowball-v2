-- Migration 002: Add encryption and analytics columns to debts table
-- Run this after 001_user_accounts.sql

-- Add encryption columns
ALTER TABLE debts ADD COLUMN dek_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE debts ADD COLUMN iv TEXT;
ALTER TABLE debts ADD COLUMN ciphertext TEXT;

-- Add analytics-safe columns
ALTER TABLE debts ADD COLUMN amount_band TEXT;
ALTER TABLE debts ADD COLUMN issuer_hash TEXT;
ALTER TABLE debts ADD COLUMN debt_type TEXT;

-- Create indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_type ON debts(user_id, debt_type);
CREATE INDEX IF NOT EXISTS idx_debts_user_amountband ON debts(user_id, amount_band);
CREATE INDEX IF NOT EXISTS idx_debts_issuer_hash ON debts(issuer_hash);

-- Add audit columns if not exists
ALTER TABLE debts ADD COLUMN encrypted_at INTEGER;
ALTER TABLE debts ADD COLUMN last_decrypted_at INTEGER;

-- Create analytics events table for local tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON string with de-identified data only
    created_at INTEGER NOT NULL,
    synced_at INTEGER,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_synced ON analytics_events(synced_at);

-- Create user preferences table for analytics opt-in
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    analytics_opt_in BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Migration metadata
INSERT INTO migrations (version, name, applied_at) 
VALUES (2, 'secure_debts', unixepoch());