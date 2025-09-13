-- CP-5 Goals Table Migration
-- Clean goal persistence for Goals & Challenges

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debt_clear', 'interest_saved', 'time_saved')),
  target_value REAL NOT NULL CHECK (target_value > 0),
  current_value REAL DEFAULT 0 CHECK (current_value >= 0),
  forecast_debt_id TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  dismissed INTEGER DEFAULT 0 CHECK (dismissed IN (0, 1))
);

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Index for active goals
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(user_id, dismissed) WHERE dismissed = 0;