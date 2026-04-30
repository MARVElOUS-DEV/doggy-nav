ALTER TABLE site_settings ADD COLUMN creator_profile TEXT NOT NULL DEFAULT '{}';
ALTER TABLE site_settings ADD COLUMN support_settings TEXT NOT NULL DEFAULT '{}';
-- Scope AI prompts by stable feature/task code.
ALTER TABLE prompts ADD COLUMN code TEXT NOT NULL DEFAULT 'global.default';

CREATE INDEX IF NOT EXISTS idx_prompts_code_active ON prompts(code, active);
