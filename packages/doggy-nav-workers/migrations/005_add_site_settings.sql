CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  site_title TEXT,
  logo_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT NOT NULL DEFAULT '[]',
  copyright_text TEXT,
  feedback_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS update_site_settings_updated_at
  AFTER UPDATE ON site_settings
  FOR EACH ROW
BEGIN
  UPDATE site_settings
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
