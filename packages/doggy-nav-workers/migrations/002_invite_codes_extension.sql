-- Extend invite_codes for usage limits and metadata
ALTER TABLE invite_codes ADD COLUMN usage_limit INTEGER NOT NULL DEFAULT 1;
ALTER TABLE invite_codes ADD COLUMN used_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE invite_codes ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE invite_codes ADD COLUMN note TEXT DEFAULT NULL;
ALTER TABLE invite_codes ADD COLUMN allowed_email_domain TEXT DEFAULT NULL;

-- Indexes to optimize lookup
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code_like ON invite_codes(code);
