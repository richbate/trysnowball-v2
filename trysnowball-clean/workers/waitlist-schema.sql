-- Waitlist table schema for email capture
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  source TEXT DEFAULT 'maintenance_page',
  notified BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist(source);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON waitlist(notified);