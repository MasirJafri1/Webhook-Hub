import { eq } from "drizzle-orm";
import { events } from "../db/schema";
import type { Env } from "../types/env";
import { CreateEventSchema } from "../schemas/event.schema";
import { getDb } from "../db/client";
import { EventRepository } from "../repositories/event.repository";
import { WebhookRepository } from "../repositories/webhook.repository";
import { EventService } from "../services/event.service";
import { json } from "../utils/response";
import { DeliveryRepository } from "../repositories/delivery.repository";

export const registerEventRoutes = (router: any) => {
  router.post("/api/v1/events", async (request: Request, env: Env) => {
    const body = await request.json();
    const validated = CreateEventSchema.parse(body);
    const db = getDb(env);
    const eventRepository = new EventRepository(db);
    const webhookRepository = new WebhookRepository(db);
    const service = new EventService(eventRepository, webhookRepository);
    const result = await service.createEvent(validated);

    try {
      result.payload = JSON.parse(result.payload);
    } catch {}

    return json(result, 201);
  });

  router.get("/api/v1/events", async (_request: any, env: Env) => {
    const db = getDb(env);
    const repository = new EventRepository(db);
    const events = await repository.findAll();

    const formattedEvents = events.map((event: any) => {
      try {
        return {
          ...event,
          payload: JSON.parse(event.payload),
        };
      } catch {
        return event;
      }
    });
    return json(formattedEvents);
  });

  router.get("/api/v1/events/dead", async (_request: any, env: Env) => {
    const db = getDb(env);
    const rows = await db
      .select()
      .from(events)
      .where(eq(events.status, "dead"));

    const formattedRows = rows.map((event: any) => {
      try {
        return {
          ...event,
          payload: JSON.parse(event.payload),
        };
      } catch {
        return event;
      }
    });
    return json(formattedRows);
  });

  router.get("/api/v1/events/:id/timeline", async (request: any, env: Env) => {
    const db = getDb(env);
    const repository = new DeliveryRepository(db);
    const result = await repository.findByEventId(request.params.id);
    return json(result);
  });

  router.get("/api/v1/events/:id", async (request: any, env: Env) => {
    const db = getDb(env);
    const repository = new EventRepository(db);
    const event = await repository.findById(request.params.id);
    if (event) {
      try {
        event.payload = JSON.parse(event.payload);
      } catch {}
    }
    return json(event);
  });
};
