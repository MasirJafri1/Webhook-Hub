CREATE TABLE events (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
