-- Prompts table for AI system prompts management
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(active);
CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts(name);

-- Trigger to keep updated_at fresh
CREATE TRIGGER IF NOT EXISTS update_prompts_updated_at
  AFTER UPDATE ON prompts
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE prompts SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
