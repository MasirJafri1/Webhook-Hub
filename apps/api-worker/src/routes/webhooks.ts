import type { Env } from "../types/env";
import { CreateWebhookSchema } from "../schemas/webhook.schema";
import { getDb } from "../db/client";
import { WebhookRepository } from "../repositories/webhook.repository";
import { WebhookService } from "../services/webhook.service";
import { json } from "../utils/response";
import { MetricsRepository } from "../repositories/metrics.repository";
import { authenticate } from "../middleware/auth";
import { AuditService } from "../services/audit.service";

export const registerWebhookRoutes = (router: any) => {
  router.post(
    "/api/v1/webhooks",
    authenticate,
    async (request: any, env: Env) => {
      const body = await request.json();
      const validated = CreateWebhookSchema.parse(body);
      const db = getDb(env);
      const repository = new WebhookRepository(db);
      const service = new WebhookService(repository);
      const result = await service.createWebhook(validated, request.projectId);

      // Audit Log
      const auditService = new AuditService(db);
      const actor =
        request.headers.get("x-member-email") ||
        `api_key:${request.apiKeyName || "unnamed"}`;
      await auditService.log("WEBHOOK_CREATED", actor, request.projectId);

      return json(result, 201);
    },
  );

  router.get(
    "/api/v1/webhooks",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new WebhookRepository(db);
      const result = await repository.findAll(request.projectId);
      return json(result);
    },
  );

  router.get(
    "/api/v1/webhooks/:id",
    authenticate,
    async (request: any, env: Env) => {
      const id = request.params.id;
      const db = getDb(env);
      const repository = new WebhookRepository(db);
      const result = await repository.findById(id, request.projectId);
      if (!result) {
        return json({ error: "Webhook not found" }, 404);
      }
      return json(result);
    },
  );

  router.delete(
    "/api/v1/webhooks/:id",
    authenticate,
    async (request: any, env: Env) => {
      const id = request.params.id;
      const db = getDb(env);
      const repository = new WebhookRepository(db);

      const exists = await repository.exists(id, request.projectId);
      if (!exists) {
        return json({ error: "Webhook not found" }, 404);
      }

      await repository.softDelete(id, request.projectId);

      // Audit Log
      const auditService = new AuditService(db);
      const actor =
        request.headers.get("x-member-email") ||
        `api_key:${request.apiKeyName || "unnamed"}`;
      await auditService.log("WEBHOOK_DELETED", actor, request.projectId);

      return json({
        success: true,
      });
    },
  );

  router.post(
    "/api/v1/webhooks/:id/rotate-secret",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new WebhookRepository(db);

      const exists = await repository.exists(
        request.params.id,
        request.projectId,
      );
      if (!exists) {
        return json({ error: "Webhook not found" }, 404);
      }

      const secret = await repository.rotateSecret(
        request.params.id,
        request.projectId,
      );

      // Audit Log
      const auditService = new AuditService(db);
      const actor =
        request.headers.get("x-member-email") ||
        `api_key:${request.apiKeyName || "unnamed"}`;
      await auditService.log("SECRET_ROTATED", actor, request.projectId);

      return json({ secret });
    },
  );

  router.get(
    "/api/v1/webhooks/:id/signing-info",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new WebhookRepository(db);

      const exists = await repository.exists(
        request.params.id,
        request.projectId,
      );
      if (!exists) {
        return json({ error: "Webhook not found" }, 404);
      }

      return json({
        algorithm: "HMAC-SHA256",
        headers: ["x-webhook-id", "x-webhook-timestamp", "x-webhook-signature"],
      });
    },
  );

  router.get(
    "/api/v1/webhooks/:id/metrics",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const webhookRepository = new WebhookRepository(db);

      const exists = await webhookRepository.exists(
        request.params.id,
        request.projectId,
      );
      if (!exists) {
        return json({ error: "Webhook not found" }, 404);
      }

      const repository = new MetricsRepository(db);
      const result = await repository.getEndpointMetrics(
        request.params.id,
        request.projectId,
      );
      return json(result);
    },
  );
};
