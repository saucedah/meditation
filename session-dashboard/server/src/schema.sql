-- FleetDeck schema. Applied idempotently on boot.

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  path        TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  favorite    INTEGER NOT NULL DEFAULT 0,   -- 0/1
  color       TEXT NOT NULL DEFAULT '#5b8cff',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commands (
  id          TEXT PRIMARY KEY,
  project_id  TEXT,                          -- NULL = global template
  label       TEXT NOT NULL,
  command     TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'custom', -- claude|dev|test|git|custom
  icon        TEXT NOT NULL DEFAULT 'terminal',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id             TEXT PRIMARY KEY,
  project_id     TEXT,
  name           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active', -- active|idle|needs_review|completed|error
  source         TEXT NOT NULL DEFAULT 'dashboard', -- dashboard|imported|manual
  pid            INTEGER,
  terminal       TEXT NOT NULL DEFAULT 'windows-terminal',
  command        TEXT NOT NULL DEFAULT '',
  cwd            TEXT NOT NULL DEFAULT '',
  summary        TEXT NOT NULL DEFAULT '',
  next_steps     TEXT NOT NULL DEFAULT '',
  notes          TEXT NOT NULL DEFAULT '',
  started_at     TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at       TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS session_events (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  type        TEXT NOT NULL, -- launch|status|rename|note|detected|linked|closed
  message     TEXT NOT NULL DEFAULT '',
  meta        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commands_project ON commands(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status  ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_events_session   ON session_events(session_id);
