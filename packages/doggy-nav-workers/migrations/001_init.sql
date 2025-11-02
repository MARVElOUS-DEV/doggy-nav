-- D1 Database Schema for Doggy Nav Migration
-- Converts MongoDB collections to normalized SQL tables

-- Users table (replaces user collection)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  nick_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  extra_permissions TEXT DEFAULT '[]',
  last_login_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  reset_password_token TEXT DEFAULT NULL,
  reset_password_expires TEXT DEFAULT NULL,
  avatar TEXT DEFAULT NULL
);

-- Roles table (replaces role collection)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  permissions TEXT DEFAULT '[]',
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Groups table (replaces group collection)
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- User roles junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- User groups junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_groups (
  user_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  PRIMARY KEY (user_id, group_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Categories table (replaces category collection)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  description TEXT DEFAULT '',
  create_at INTEGER NOT NULL, -- Chrome time number
  only_folder INTEGER DEFAULT 0,
  icon TEXT DEFAULT '',
  show_in_menu INTEGER DEFAULT 1,
  audience_visibility TEXT DEFAULT 'public' CHECK (audience_visibility IN ('public', 'authenticated', 'restricted', 'hide')),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Category children table for nested structure
CREATE TABLE IF NOT EXISTS category_children (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id_ref TEXT NOT NULL,
  create_at INTEGER NOT NULL, -- Chrome time number
  show_in_menu INTEGER DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Category role permissions
CREATE TABLE IF NOT EXISTS category_role_permissions (
  category_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (category_id, role_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Category group permissions
CREATE TABLE IF NOT EXISTS category_group_permissions (
  category_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  PRIMARY KEY (category_id, group_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Bookmarks/Nav items table (replaces nav collection)
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  category_id TEXT,
  name TEXT NOT NULL,
  href TEXT NOT NULL,
  description TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  author_name TEXT DEFAULT '',
  author_url TEXT DEFAULT '',
  audit_time TEXT DEFAULT NULL,
  create_time INTEGER NOT NULL, -- Chrome time number
  tags TEXT DEFAULT '[]', -- JSON array of tag strings
  view_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  status INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  url_status TEXT DEFAULT 'unknown' CHECK (url_status IN ('unknown', 'checking', 'accessible', 'inaccessible')),
  last_url_check INTEGER DEFAULT NULL, -- Chrome time number
  response_time INTEGER DEFAULT NULL,
  audience_visibility TEXT DEFAULT 'public' CHECK (audience_visibility IN ('public', 'authenticated', 'restricted', 'hide')),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Bookmark role permissions
CREATE TABLE IF NOT EXISTS bookmark_role_permissions (
  bookmark_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (bookmark_id, role_id),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Bookmark group permissions
CREATE TABLE IF NOT EXISTS bookmark_group_permissions (
  bookmark_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  PRIMARY KEY (bookmark_id, group_id),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Bookmark tags junction table
CREATE TABLE IF NOT EXISTS bookmark_tags (
  bookmark_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (bookmark_id, tag_id),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Favorites table (replaces favorite collection)
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  user_id TEXT NOT NULL,
  bookmark_id TEXT NOT NULL,
  folder_name TEXT DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, bookmark_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
);

-- Favorite folders table
CREATE TABLE IF NOT EXISTS favorite_folders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invite codes table (replaces invite_code collection)
CREATE TABLE IF NOT EXISTS invite_codes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  code TEXT NOT NULL UNIQUE,
  used_by TEXT DEFAULT NULL,
  created_by TEXT NOT NULL,
  is_used INTEGER DEFAULT 0,
  used_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT DEFAULT NULL,
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT DEFAULT NULL,
  refresh_token TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email notification settings table
CREATE TABLE IF NOT EXISTS email_notification_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  user_id TEXT NOT NULL UNIQUE,
  enabled INTEGER DEFAULT 1,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4)))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  url TEXT DEFAULT '',
  category_id TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_categories_category_id ON categories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_show_in_menu ON categories(show_in_menu);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category_id ON bookmarks(category_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON bookmarks(is_favorite);
CREATE INDEX IF NOT EXISTS idx_bookmarks_url_status ON bookmarks(url_status);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_bookmark_id ON favorites(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_user_id ON oauth_providers(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_slug ON applications(slug);
CREATE INDEX IF NOT EXISTS idx_applications_category_id ON applications(category_id);

-- Triggers for automatic updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_roles_updated_at
  AFTER UPDATE ON roles
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE roles SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_groups_updated_at
  AFTER UPDATE ON groups
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE groups SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_categories_updated_at
  AFTER UPDATE ON categories
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE categories SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_bookmarks_updated_at
  AFTER UPDATE ON bookmarks
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE bookmarks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tags_updated_at
  AFTER UPDATE ON tags
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE tags SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_favorites_updated_at
  AFTER UPDATE ON favorites
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE favorites SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_invite_codes_updated_at
  AFTER UPDATE ON invite_codes
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE invite_codes SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_oauth_providers_updated_at
  AFTER UPDATE ON oauth_providers
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE oauth_providers SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_email_notification_settings_updated_at
  AFTER UPDATE ON email_notification_settings
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE email_notification_settings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_applications_updated_at
  AFTER UPDATE ON applications
  FOR EACH ROW
  WHEN NEW.updated_at <= OLD.updated_at
BEGIN
  UPDATE applications SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;