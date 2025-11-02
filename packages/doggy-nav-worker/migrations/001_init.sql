-- D1 schema for groups
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  displayName TEXT NOT NULL,
  description TEXT DEFAULT '',
  createdAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Helpful index for lookups by slug
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
