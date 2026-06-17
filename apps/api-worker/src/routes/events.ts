import { and, eq, or } from "drizzle-orm";
import { events } from "../db/schema";
import type { Env } from "../types/env";
import { CreateEventSchema } from "../schemas/event.schema";
import { getDb } from "../db/client";
import { EventRepository } from "../repositories/event.repository";
import { WebhookRepository } from "../repositories/webhook.repository";
import { EventService } from "../services/event.service";
import { json } from "../utils/response";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { authenticate, getActor } from "../middleware/auth";
import { AuditService } from "../services/audit.service";
import { runDeliveryJob } from "../jobs/delivery.job";

export const registerEventRoutes = (router: any) => {
  router.post(
    "/api/v1/events",
    authenticate,
    async (request: any, env: Env, ctx: ExecutionContext) => {
      try {
        const body = await request.json();
        const validated = CreateEventSchema.parse(body);
        const db = getDb(env);
        const eventRepository = new EventRepository(db);
        const webhookRepository = new WebhookRepository(db);
        const service = new EventService(
          eventRepository,
          webhookRepository,
          db,
        );
        const result = await service.createEvent(validated, request.projectId);

        ctx.waitUntil(
          runDeliveryJob(env).catch((e) =>
            console.error("Instant background delivery failed:", e)
          )
        );

        return json(result, 201);
      } catch (err: any) {
        if (err.message === "quota_exceeded") {
          return json({ error: "quota_exceeded" }, 403);
        }
        if (err.message === "Webhook endpoint not found") {
          return json({ error: "Webhook endpoint not found" }, 404);
        }
        console.error("Error creating event:", err);
        return json({ error: "Internal server error" }, 500);
      }
    },
  );

  router.get("/api/v1/events", authenticate, async (request: any, env: Env) => {
    const db = getDb(env);
    const repository = new EventRepository(db);

    const url = new URL(request.url);
    const hasPage = url.searchParams.has("page");
    const hasLimit = url.searchParams.has("limit");

    if (hasPage || hasLimit) {
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);
      const { data, total } = await repository.findPaginated(
        page,
        limit,
        request.projectId,
      );

      return json({
        data,
        total,
        page,
        limit,
      });
    }

    const eventsList = await repository.findAll(request.projectId);
    return json(eventsList);
  });

  router.get(
    "/api/v1/events/dead",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const rows = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.status, "dead"),
            eq(events.projectId, request.projectId),
          ),
        );

      return json(rows);
    },
  );

  router.get(
    "/api/v1/events/poisoned",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const rows = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.status, "poisoned"),
            eq(events.projectId, request.projectId),
          ),
        );

      return json(rows);
    },
  );

  router.post(
    "/api/v1/events/replay-all",
    authenticate,
    async (request: any, env: Env, ctx: ExecutionContext) => {
      const db = getDb(env);
      const repository = new EventRepository(db);
      await repository.replayAllDead(request.projectId);

      // Audit Log
      const auditService = new AuditService(db);
      const actor = getActor(request);
      await auditService.log("EVENT_REPLAYED", actor, request.projectId);

      ctx.waitUntil(
        runDeliveryJob(env).catch((e) =>
          console.error("Replay-all background delivery failed:", e)
        )
      );

      return json({ success: true });
    },
  );

  router.post(
    "/api/v1/events/replay-window",
    authenticate,
    async (request: any, env: Env, ctx: ExecutionContext) => {
      const body: any = await request.json();
      if (!body.from || !body.to) {
        return json({ error: "from and to dates are required" }, 400);
      }

      const from = new Date(body.from).getTime();
      const to = new Date(body.to).getTime();

      if (isNaN(from) || isNaN(to)) {
        return json({ error: "Invalid date format" }, 400);
      }

      const db = getDb(env);
      const repository = new EventRepository(db);
      await repository.replayWindow(from, to, request.projectId);

      // Audit Log
      const auditService = new AuditService(db);
      const actor = getActor(request);
      await auditService.log("EVENT_REPLAY_WINDOW", actor, request.projectId);

      ctx.waitUntil(
        runDeliveryJob(env).catch((e) =>
          console.error("Replay-window background delivery failed:", e)
        )
      );

      return json({ success: true, from: body.from, to: body.to });
    },
  );

  router.get(
    "/api/v1/events/:id/timeline",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new DeliveryRepository(db);
      const result = await repository.findByEventId(
        request.params.id,
        request.projectId,
      );
      return json(result);
    },
  );

  router.post(
    "/api/v1/events/:id/replay",
    authenticate,
    async (request: any, env: Env, ctx: ExecutionContext) => {
      const db = getDb(env);
      const repository = new EventRepository(db);

      // Verify event ownership
      const event = await repository.findById(
        request.params.id,
        request.projectId,
      );
      if (!event) {
        return json({ error: "Event not found" }, 404);
      }

      await repository.replay(request.params.id, request.projectId);

      // Audit Log
      const auditService = new AuditService(db);
      const actor = getActor(request);
      await auditService.log("EVENT_REPLAYED", actor, request.projectId);

      ctx.waitUntil(
        runDeliveryJob(env).catch((e) =>
          console.error("Replay background delivery failed:", e)
        )
      );

      return json({ success: true });
    },
  );

  router.get(
    "/api/v1/events/:id",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new EventRepository(db);
      const event = await repository.findById(
        request.params.id,
        request.projectId,
      );
      if (!event) {
        return json({ error: "Event not found" }, 404);
      }
      return json(event);
    },
  );
};
