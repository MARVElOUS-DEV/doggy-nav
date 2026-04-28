CREATE TABLE IF NOT EXISTS support_payments (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  creator_label TEXT NOT NULL,
  user_id TEXT DEFAULT NULL,
  source_app TEXT DEFAULT '',
  source_path TEXT DEFAULT '',
  source_host TEXT DEFAULT '',
  source_referrer TEXT DEFAULT '',
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_checkout_url TEXT NOT NULL,
  stripe_session_status TEXT DEFAULT '',
  stripe_payment_status TEXT DEFAULT '',
  stripe_metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_support_payments_user_id
  ON support_payments(user_id);
