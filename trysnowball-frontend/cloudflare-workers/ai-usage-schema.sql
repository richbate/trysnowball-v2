-- AI Usage Tracking Schema for TrySnowball
-- Minimal, cheap, deterministic cost control

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id TEXT NOT NULL,
  period  TEXT NOT NULL,         -- '2025-08' (YYYY-MM format, UTC)
  messages INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, period)
);

CREATE TABLE IF NOT EXISTS user_flags (
  user_id TEXT PRIMARY KEY,
  is_pro  INTEGER NOT NULL DEFAULT 0,  -- 1/0; derive from billing or auth
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast period-based queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_period ON ai_usage(period);
CREATE INDEX IF NOT EXISTS idx_user_flags_pro ON user_flags(is_pro);