-- Affiches table for homepage announcements
CREATE TABLE IF NOT EXISTS affiches (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  text TEXT NOT NULL,
  link_href TEXT DEFAULT NULL,
  link_text TEXT DEFAULT NULL,
  link_target TEXT DEFAULT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_affiches_active ON affiches(active);
CREATE INDEX IF NOT EXISTS idx_affiches_sort ON affiches(sort_order, id);

-- Trigger to keep updated_at fresh
CREATE TRIGGER IF NOT EXISTS update_affiches_updated_at
  AFTER UPDATE ON affiches
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE affiches SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
