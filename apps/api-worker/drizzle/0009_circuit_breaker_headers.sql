ALTER TABLE webhook_endpoints ADD COLUMN consecutive_failures INTEGER DEFAULT 0;
ALTER TABLE webhook_endpoints ADD COLUMN custom_headers TEXT;
