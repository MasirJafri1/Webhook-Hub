CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  endpoint_id TEXT NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  latency_ms INTEGER,
  created_at INTEGER NOT NULL
);
