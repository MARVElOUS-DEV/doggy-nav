CREATE TABLE IF NOT EXISTS tool_output_publications (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  publish_id TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 0,
  direction TEXT NOT NULL CHECK (direction IN ('yaml-to-json', 'json-to-yaml')),
  content_type TEXT NOT NULL,
  encrypted_output TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_tag TEXT NOT NULL,
  basic_auth_username TEXT NOT NULL,
  basic_auth_password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(user_id, tool_id)
);

CREATE INDEX IF NOT EXISTS idx_tool_output_publications_publish_id
  ON tool_output_publications(publish_id);

CREATE INDEX IF NOT EXISTS idx_tool_output_publications_user_tool
  ON tool_output_publications(user_id, tool_id);

CREATE TRIGGER IF NOT EXISTS update_tool_output_publications_updated_at
  AFTER UPDATE ON tool_output_publications
  FOR EACH ROW
BEGIN
  UPDATE tool_output_publications
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
