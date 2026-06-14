import type { Env } from "../types/env";
import { CreateWebhookSchema } from "../schemas/webhook.schema";
import { getDb } from "../db/client";
import { WebhookRepository } from "../repositories/webhook.repository";
import { WebhookService } from "../services/webhook.service";
import { json } from "../utils/response";
import { MetricsRepository } from "../repositories/metrics.repository";

export const registerWebhookRoutes = (router: any) => {
  router.post("/api/v1/webhooks", async (request: Request, env: Env) => {
    const body = await request.json();
    const validated = CreateWebhookSchema.parse(body);
    const db = getDb(env);
    const repository = new WebhookRepository(db);
    const service = new WebhookService(repository);
    const result = await service.createWebhook(validated);
    return json(result, 201);
  });

  router.get("/api/v1/webhooks", async (_request: any, env: Env) => {
    const db = getDb(env);
    const repository = new WebhookRepository(db);
    const result = await repository.findAll();
    return json(result);
  });

  router.get("/api/v1/webhooks/:id", async (request: any, env: Env) => {
    const id = request.params.id;
    const db = getDb(env);
    const repository = new WebhookRepository(db);
    const result = await repository.findById(id);
    return json(result);
  });

  router.delete("/api/v1/webhooks/:id", async (request: any, env: Env) => {
    const id = request.params.id;
    const db = getDb(env);
    const repository = new WebhookRepository(db);
    await repository.softDelete(id);
    return json({
      success: true,
    });
  });

  router.post(
    "/api/v1/webhooks/:id/rotate-secret",
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new WebhookRepository(db);
      const secret = await repository.rotateSecret(request.params.id);
      return json({ secret });
    },
  );

  router.get(
    "/api/v1/webhooks/:id/signing-info",
    async (_request: any, _env: Env) => {
      return json({
        algorithm: "HMAC-SHA256",
        headers: ["x-webhook-id", "x-webhook-timestamp", "x-webhook-signature"],
      });
    },
  );

  router.get("/api/v1/webhooks/:id/metrics", async (request: any, env: Env) => {
    const db = getDb(env);
    const repository = new MetricsRepository(db);
    const result = await repository.getEndpointMetrics(request.params.id);
    return json(result);
  });
};
