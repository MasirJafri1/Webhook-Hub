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

router.get("/health", () => healthHandler());
router.get("/version", () => versionHandler());

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
