import { Router } from "itty-router";
import { healthHandler } from "./routes/health";
import { versionHandler } from "./routes/version";
import { registerWebhookRoutes } from "./routes/webhooks";
import { registerSearchRoutes } from "./routes/search";
import { registerEventRoutes } from "./routes/events";
import { registerDeliveryRoutes } from "./routes/deliveries";
import { registerMetricsRoutes } from "./routes/metrics";
import { registerMultitenancyRoutes } from "./routes/multitenancy";
import { registerDocsRoutes } from "./routes/docs";
import { runDeliveryJob } from "./jobs/delivery.job";
import { runRetentionJob } from "./jobs/retention.job";
import type { Env } from "./types/env";
import { sha256 } from "./utils/hash";

const router = Router();

router.options("*", () => {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
      "access-control-allow-headers":
        "content-type, x-webhook-id, x-webhook-timestamp, x-webhook-signature, idempotency-key",
    },
  });
});

router.get("/health", () => healthHandler());
router.get("/version", () => versionHandler());

router.post("/test/reset-retry", async (request: Request, env: Env) => {
  await env.DB.prepare("UPDATE events SET next_retry_at = 0").run();
  return new Response("Ok");
});

router.post("/test/seed", async (request: Request, env: Env) => {
  const db = env.DB;
  await db.prepare("DELETE FROM api_keys WHERE id = 'key_seed_dev'").run();
  await db.prepare("DELETE FROM projects WHERE id = 'proj_seed_dev'").run();
  await db.prepare("DELETE FROM organizations WHERE id = 'org_seed_dev'").run();

  const orgId = "org_seed_dev";
  const projId = "proj_seed_dev";
  const keyId = "key_seed_dev";
  const rawKey = "whpk_live_seed_dev_key_abc123";
  const hashedKey = await sha256(rawKey);
  const now = Date.now();

  await db.prepare("INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)")
    .bind(orgId, "Seed Dev Org", now)
    .run();

  await db.prepare("INSERT INTO projects (id, organization_id, name, monthly_event_limit, retention_days, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(projId, orgId, "Seed Dev Project", 100000, 30, now)
    .run();

  await db.prepare("INSERT INTO api_keys (id, project_id, key_hash, name, active, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(keyId, projId, hashedKey, "Seed Dev Key", 1, now)
    .run();

  return new Response(JSON.stringify({ apiKey: rawKey }), {
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
});

router.get("/test/query-event/:id", async (request: any, env: Env) => {
  const row = await env.DB.prepare("SELECT * FROM events WHERE id = ?")
    .bind(request.params.id)
    .first();
  return new Response(JSON.stringify(row), {
    headers: { "content-type": "application/json" },
  });
});

router.post("/test/reset-db", async (request: Request, env: Env) => {
  await env.DB.prepare("DELETE FROM deliveries").run();
  await env.DB.prepare("DELETE FROM events").run();
  await env.DB.prepare("DELETE FROM webhook_endpoints").run();
  await env.DB.prepare("DELETE FROM api_keys").run();
  await env.DB.prepare("DELETE FROM projects").run();
  await env.DB.prepare("DELETE FROM organizations").run();
  await env.DB.prepare("DELETE FROM audit_logs").run();
  return new Response("Ok");
});

router.post("/test/update-created-at", async (request: Request, env: Env) => {
  const body: any = await request.json();
  await env.DB.prepare("UPDATE events SET created_at = ? WHERE id = ?")
    .bind(body.createdAt, body.eventId)
    .run();
  await env.DB.prepare("UPDATE deliveries SET created_at = ? WHERE event_id = ?")
    .bind(body.createdAt, body.eventId)
    .run();
  return new Response("Ok");
});

registerWebhookRoutes(router);
registerSearchRoutes(router);
registerEventRoutes(router);
registerDeliveryRoutes(router);
registerMetricsRoutes(router);
registerMultitenancyRoutes(router);
registerDocsRoutes(router);


export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    return router.fetch(request, env, ctx);
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      runDeliveryJob(env).catch((e) =>
        console.error("Scheduled delivery job failed:", e),
      ),
    );
    ctx.waitUntil(
      runRetentionJob(env).catch((e) =>
        console.error("Scheduled retention job failed:", e),
      ),
    );
  },
};
