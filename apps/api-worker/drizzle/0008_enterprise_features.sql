-- Part 1: Event Filters
ALTER TABLE webhook_endpoints ADD COLUMN event_filters TEXT;

-- Part 2: Payload Transformations
ALTER TABLE webhook_endpoints ADD COLUMN payload_transform TEXT;

-- Part 3: Webhook Versioning
ALTER TABLE webhook_endpoints ADD COLUMN version TEXT DEFAULT 'v1';

-- Part 5: Retention Policies
ALTER TABLE projects ADD COLUMN retention_days INTEGER DEFAULT 30;
