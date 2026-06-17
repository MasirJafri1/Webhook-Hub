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
import { registerAuthRoutes } from "./routes/auth";
import { registerAdminRoutes } from "./routes/admin";
import { runDeliveryJob } from "./jobs/delivery.job";
import { runRetentionJob } from "./jobs/retention.job";
import type { Env } from "./types/env";

const router = Router();

router.options("*", () => {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
      "access-control-allow-headers":
        "content-type, authorization, x-webhook-id, x-webhook-timestamp, x-webhook-signature, idempotency-key",
    },
  });
});

router.get("/health", () => healthHandler());
router.get("/version", () => versionHandler());

router.all("/test/*", (request: Request, env: Env) => {
  if (env.ENVIRONMENT === "production") {
    return new Response("Not Found", { status: 404 });
  }
});

router.post("/test/reset-retry", async (request: Request, env: Env) => {
  await env.DB.prepare("UPDATE events SET next_retry_at = 0").run();
  return new Response("Ok");
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
  await env.DB.prepare("DELETE FROM members").run();
  await env.DB.prepare("DELETE FROM audit_logs").run();
  await env.DB.prepare("DELETE FROM users").run();
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
registerAuthRoutes(router);
registerAdminRoutes(router);


export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    return router.fetch(request, env, ctx).catch((err: any) => {
      console.error("Unhandled worker error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
      });
    });
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
