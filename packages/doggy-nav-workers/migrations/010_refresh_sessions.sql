CREATE TABLE refresh_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('main', 'admin')),
  current_token_hash TEXT NOT NULL,
  previous_token_hash TEXT,
  rotated_at TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_sessions_user_active
  ON refresh_sessions(user_id, revoked_at);
CREATE INDEX idx_refresh_sessions_expires_at
  ON refresh_sessions(expires_at);
