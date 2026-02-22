-- Moxpenses Cloud: D1 schema
CREATE TABLE IF NOT EXISTS users (
  sub TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  picture TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS states (
  owner_sub TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(owner_sub) REFERENCES users(sub) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shares (
  owner_sub TEXT NOT NULL,
  viewer_sub TEXT NOT NULL,
  can_write INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY(owner_sub, viewer_sub),
  FOREIGN KEY(owner_sub) REFERENCES users(sub) ON DELETE CASCADE,
  FOREIGN KEY(viewer_sub) REFERENCES users(sub) ON DELETE CASCADE
);
