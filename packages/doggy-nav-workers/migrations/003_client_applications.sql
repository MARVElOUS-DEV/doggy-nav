-- Client Applications table for API client secrets (separate from navigation applications)
CREATE TABLE IF NOT EXISTS client_applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  client_secret TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  allowed_origins TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_client_apps_active ON client_applications(is_active);

CREATE TRIGGER IF NOT EXISTS update_client_applications_updated_at
  AFTER UPDATE ON client_applications
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE client_applications SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
