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
import { RateLimitService } from "./services/rate-limit.service";
import { json } from "./utils/response";

const router = Router();

router.options("*", () => {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-allow-headers":
        "content-type, authorization, x-webhook-id, x-webhook-timestamp, x-webhook-signature, idempotency-key, x-project-id",
    },
  });
});

// Global request rate limiting
router.all("*", async (request: any, env: Env) => {
  if (request.method === "OPTIONS") return;

  const url = new URL(request.url);
  if (url.pathname === "/health" || url.pathname === "/version") return;

  const clientIp = request.headers.get("CF-Connecting-IP") || "local-ip";
  const rateLimitService = new RateLimitService(env.CACHE);

  // Brute force protection for sensitive auth endpoints: 5 attempts per minute per IP
  const isAuthRoute = url.pathname.startsWith("/api/v1/auth/login") || url.pathname.startsWith("/api/v1/auth/signup");
  if (isAuthRoute) {
    const isAuthLimited = await rateLimitService.isRateLimited(
      `auth:${clientIp}`,
      5,
      60,
    );
    if (isAuthLimited) {
      return json({ error: "Too many login/signup attempts. Please slow down and try again in a minute." }, 429);
    }
  }

  // General rate limit: 60 requests per minute per IP address
  const isLimited = await rateLimitService.isRateLimited(
    `req:${clientIp}`,
    60,
    60,
  );
  if (isLimited) {
    return json({ error: "Too many requests. Please slow down." }, 429);
  }
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
  await env.DB.prepare(
    "UPDATE deliveries SET created_at = ? WHERE event_id = ?",
  )
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
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    let response: Response;
    try {
      response = await router.fetch(request, env, ctx);
    } catch (err: any) {
      console.error("Unhandled worker error:", err);
      response = new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // Secure dynamic CORS response formatting
    const origin = request.headers.get("origin");
    const url = new URL(request.url);
    const newHeaders = new Headers(response.headers);

    if (url.pathname === "/api/v1/events") {
      // Keep wildcard for public event ingestion
      newHeaders.set("access-control-allow-origin", "*");
    } else {
      // Restrict dashboard APIs to trusted domains
      const allowedOrigins = [
        "http://localhost:5173",
        "https://webhook-platform.masir-projects.me",
      ];
      let allowedOrigin = "";
      if (origin) {
        const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".webhook-platform.pages.dev");
        if (isAllowed) {
          allowedOrigin = origin;
        }
      }
      newHeaders.set("access-control-allow-origin", allowedOrigin || "https://webhook-platform.masir-projects.me");
    }

    newHeaders.set("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    newHeaders.set("access-control-allow-headers", "content-type, authorization, x-webhook-id, x-webhook-timestamp, x-webhook-signature, idempotency-key, x-project-id");
    newHeaders.set("access-control-allow-credentials", "true");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
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
