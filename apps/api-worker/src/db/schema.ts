import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  monthlyEventLimit: integer("monthly_event_limit"),
  retentionDays: integer("retention_days").default(30),
  createdAt: integer("created_at").notNull(),
});

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  keyHash: text("key_hash").notNull(),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }),
  createdAt: integer("created_at").notNull(),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id"),
  email: text("email"),
  role: text("role"),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  action: text("action"),
  actor: text("actor"),
  createdAt: integer("created_at").notNull(),
});

export const webhookEndpoints = sqliteTable("webhook_endpoints", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  currentSecret: text("current_secret").notNull(),
  previousSecret: text("previous_secret"),
  secretRotatedAt: integer("secret_rotated_at"),
  eventFilters: text("event_filters"),
  payloadTransform: text("payload_transform"),
  version: text("version").default("v1"),
  active: integer("active", {
    mode: "boolean",
  }).notNull(),
  createdAt: integer("created_at").notNull(),
  deletedAt: integer("deleted_at"),
  requestsPerMinute: integer("requests_per_minute").default(60),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  endpointId: text("endpoint_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  status: text("status").notNull(),
  retryCount: integer("retry_count").notNull(),
  nextRetryAt: integer("next_retry_at"),
  lastAttemptAt: integer("last_attempt_at"),
  idempotencyKey: text("idempotency_key"),
  lastErrorHash: text("last_error_hash"),
  poisoned: integer("poisoned", { mode: "boolean" }),
  createdAt: integer("created_at").notNull(),
});

export const deliveries = sqliteTable("deliveries", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  endpointId: text("endpoint_id").notNull(),
  status: text("status").notNull(),
  responseCode: integer("response_code"),
  responseBody: text("response_body"),
  latencyMs: integer("latency_ms"),
  createdAt: integer("created_at").notNull(),
});
