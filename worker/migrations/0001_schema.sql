-- Miriel D1 Schema (migrated from Supabase PostgreSQL)
-- Conversion: UUID→TEXT, text[]→JSON TEXT, JSONB→JSON TEXT, timestamptz→TEXT, boolean→INTEGER

-- users (auth.users + profiles merged)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  user_metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- entries
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- summaries
CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  period TEXT NOT NULL CHECK(period IN ('daily','weekly','monthly')),
  period_start TEXT NOT NULL,
  text TEXT NOT NULL,
  entry_links TEXT DEFAULT '[]',
  sentences_data TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- todos
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  source_entry_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','done')),
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- user_ai_preferences
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  summary_style TEXT DEFAULT '',
  focus_areas TEXT DEFAULT '[]',
  custom_instructions TEXT DEFAULT '',
  share_persona INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- email_verifications
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  verification_token TEXT,
  verified INTEGER DEFAULT 0,
  ip_address TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_summaries_user_period ON summaries(user_id, period, period_start);
CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_entry ON todos(source_entry_id);
CREATE INDEX IF NOT EXISTS idx_rt_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_ev_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_ev_ip ON email_verifications(ip_address);
