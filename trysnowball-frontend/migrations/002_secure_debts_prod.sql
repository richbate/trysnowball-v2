-- Migration 002: Add encryption and analytics columns to debts table
-- Production version without migrations table dependency

-- Add encryption columns
ALTER TABLE debts ADD COLUMN dek_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE debts ADD COLUMN iv TEXT;
ALTER TABLE debts ADD COLUMN ciphertext TEXT;

-- Add analytics-safe columns
ALTER TABLE debts ADD COLUMN amount_band TEXT;
ALTER TABLE debts ADD COLUMN issuer_hash TEXT;
ALTER TABLE debts ADD COLUMN debt_type TEXT;

-- Add audit columns
ALTER TABLE debts ADD COLUMN encrypted_at INTEGER;
ALTER TABLE debts ADD COLUMN last_decrypted_at INTEGER;

-- Create indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_type ON debts(user_id, debt_type);
CREATE INDEX IF NOT EXISTS idx_debts_user_amountband ON debts(user_id, amount_band);
CREATE INDEX IF NOT EXISTS idx_debts_issuer_hash ON debts(issuer_hash);

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