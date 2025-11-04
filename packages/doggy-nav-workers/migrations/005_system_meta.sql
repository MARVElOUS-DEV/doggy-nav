-- System meta key-value store for idempotent operations (e.g., seeding guards)
CREATE TABLE IF NOT EXISTS system_meta (
  meta_key TEXT PRIMARY KEY,
  meta_value TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS update_system_meta_updated_at
  AFTER UPDATE ON system_meta
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE system_meta SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE meta_key = NEW.meta_key;
END;
