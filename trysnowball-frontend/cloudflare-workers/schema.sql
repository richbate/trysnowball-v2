-- D1 Database Schema for TrySnowball Auth
-- Run: wrangler d1 execute auth_db --file=schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  referral_id TEXT UNIQUE,          -- e.g. snowball-abc123
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT,
  is_beta BOOLEAN DEFAULT TRUE,     -- Beta access control
  plan TEXT DEFAULT 'free',         -- 'free', 'pro', 'beta'
  is_pro BOOLEAN DEFAULT FALSE,     -- Backward compatibility
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, -- Legacy field
  last_login TEXT,                  -- Legacy field  
  login_count INTEGER DEFAULT 0     -- Legacy field
);

-- Login tokens for magic links
CREATE TABLE IF NOT EXISTS login_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User preferences/metadata
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  extra_payment INTEGER DEFAULT 100,
  preferences TEXT, -- JSON blob for settings
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Debt data (future expansion)
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance REAL NOT NULL,
  min_payment REAL NOT NULL,
  interest_rate REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Authentication logs for analytics
CREATE TABLE IF NOT EXISTS auth_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'magic_link_login', 'token_refresh', 'logout', etc.
  metadata TEXT, -- JSON blob for additional data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_id ON users(referral_id);
CREATE INDEX IF NOT EXISTS idx_login_tokens_email ON login_tokens(email);
CREATE INDEX IF NOT EXISTS idx_login_tokens_expires ON login_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event ON auth_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_logs(created_at);

-- Insert some demo data for testing
INSERT OR IGNORE INTO users (id, email, referral_id, is_pro, is_beta, plan, created_at, joined_at) VALUES 
  ('demo-user-1', 'demo@trysnowball.local', 'snowball-demo123', TRUE, TRUE, 'pro', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
  ('test-user-1', 'test@trysnowball.local', 'snowball-test456', TRUE, TRUE, 'beta', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
  ('free-user-1', 'free@trysnowball.local', 'snowball-free789', FALSE, TRUE, 'free', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');