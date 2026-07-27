ALTER TABLE site_settings ADD COLUMN creator_profile TEXT NOT NULL DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN support_settings TEXT NOT NULL DEFAULT '{}';
-- Scope AI prompts by stable feature/task code.
ALTER TABLE prompts ADD COLUMN code TEXT NOT NULL DEFAULT 'global.default';

CREATE INDEX IF NOT EXISTS idx_prompts_code_active ON prompts(code, active);
-- ai providers
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'openai-compatible' CHECK (provider IN ('openai-compatible', 'mimo')),
  base_url TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(active);

CREATE TRIGGER IF NOT EXISTS update_ai_providers_updated_at
  AFTER UPDATE ON ai_providers
  FOR EACH ROW
  BEGIN
    UPDATE ai_providers SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
  END;
