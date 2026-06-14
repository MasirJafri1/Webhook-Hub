import { Router } from "itty-router";
import { healthHandler } from "./routes/health";
import { versionHandler } from "./routes/version";
import { registerWebhookRoutes } from "./routes/webhooks";
import { registerEventRoutes } from "./routes/events";
import { registerDeliveryRoutes } from "./routes/deliveries";
import { registerMetricsRoutes } from "./routes/metrics";
import { runDeliveryJob } from "./jobs/delivery.job";
import type { Env } from "./types/env";

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

router.get("/test/query-event/:id", async (request: any, env: Env) => {
  const row = await env.DB.prepare("SELECT * FROM events WHERE id = ?").bind(request.params.id).first();
  return new Response(JSON.stringify(row), { headers: { "content-type": "application/json" } });
});

registerWebhookRoutes(router);
registerEventRoutes(router);
registerDeliveryRoutes(router);
registerMetricsRoutes(router);

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    return router.fetch(request, env, ctx);
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(runDeliveryJob(env));
  },
};
