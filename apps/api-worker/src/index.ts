import { Router } from "itty-router";
import { healthHandler } from "./routes/health";
import { versionHandler } from "./routes/version";
import { registerWebhookRoutes } from "./routes/webhooks";
import { registerEventRoutes } from "./routes/events";
import type { Env } from "./types/env";

const router = Router();

router.get("/health", () => healthHandler());
router.get("/version", () => versionHandler());

registerWebhookRoutes(router);
registerEventRoutes(router);

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    return router.fetch(request, env, ctx);
  },
};
