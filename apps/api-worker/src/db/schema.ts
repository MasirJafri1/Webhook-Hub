import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const webhookEndpoints = sqliteTable("webhook_endpoints", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),

  url: text("url").notNull(),

  currentSecret: text("current_secret").notNull(),

  previousSecret: text("previous_secret"),

  secretRotatedAt: integer("secret_rotated_at"),

  active: integer("active", {
    mode: "boolean",
  }).notNull(),

  createdAt: integer("created_at").notNull(),

  deletedAt: integer("deleted_at"),

  requestsPerMinute: integer("requests_per_minute").default(60),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),

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
