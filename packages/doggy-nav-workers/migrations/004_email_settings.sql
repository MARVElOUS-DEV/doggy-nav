-- SMTP Email settings table (single-row config)
CREATE TABLE IF NOT EXISTS email_settings (
  id TEXT PRIMARY KEY,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure INTEGER NOT NULL DEFAULT 0,
  smtp_user TEXT NOT NULL,
  smtp_pass TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT 'Doggy Nav',
  from_address TEXT NOT NULL,
  reply_to TEXT NOT NULL,
  enable_notifications INTEGER NOT NULL DEFAULT 0,
  admin_emails TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS update_email_settings_updated_at
  AFTER UPDATE ON email_settings
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE email_settings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
