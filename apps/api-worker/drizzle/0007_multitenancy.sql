CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  monthly_event_limit INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  active INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  email TEXT,
  role TEXT
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  action TEXT,
  actor TEXT,
  created_at INTEGER NOT NULL
);

ALTER TABLE webhook_endpoints ADD COLUMN project_id TEXT NOT NULL DEFAULT 'default_project';
ALTER TABLE events ADD COLUMN project_id TEXT NOT NULL DEFAULT 'default_project';
