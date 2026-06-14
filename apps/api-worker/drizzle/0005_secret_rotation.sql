ALTER TABLE webhook_endpoints ADD COLUMN current_secret TEXT;
ALTER TABLE webhook_endpoints ADD COLUMN previous_secret TEXT;
ALTER TABLE webhook_endpoints ADD COLUMN secret_rotated_at INTEGER;
UPDATE webhook_endpoints SET current_secret = secret;
ALTER TABLE webhook_endpoints DROP COLUMN secret;
