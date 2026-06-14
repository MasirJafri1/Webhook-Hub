import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const webhookEndpoints = sqliteTable("webhook_endpoints", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),

  url: text("url").notNull(),

  secret: text("secret").notNull(),

  active: integer("active", {
    mode: "boolean",
  }).notNull(),

  createdAt: integer("created_at").notNull(),

  deletedAt: integer("deleted_at"),
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
