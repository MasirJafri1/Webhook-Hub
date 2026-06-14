import type { Env } from "../types/env";
import { getDb } from "../db/client";
import { EventRepository } from "../repositories/event.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { json } from "../utils/response";
import { authenticate } from "../middleware/auth";
import { auditLogs } from "../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export const registerSearchRoutes = (router: any) => {
  // Event Search
  router.get(
    "/api/v1/events/search",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new EventRepository(db);
      const url = new URL(request.url);

      const filters = {
        projectId: request.projectId as string,
        eventType: url.searchParams.get("eventType") || undefined,
        status: url.searchParams.get("status") || undefined,
        from: url.searchParams.get("from")
          ? Number(url.searchParams.get("from"))
          : undefined,
        to: url.searchParams.get("to")
          ? Number(url.searchParams.get("to"))
          : undefined,
        endpointId: url.searchParams.get("endpointId") || undefined,
      };

      const results = await repository.searchEvents(filters);

      const formattedResults = results.map((event: any) => {
        try {
          return { ...event, payload: JSON.parse(event.payload) };
        } catch {
          return event;
        }
      });

      return json(formattedResults);
    },
  );

  // Delivery Search
  router.get(
    "/api/v1/deliveries/search",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new DeliveryRepository(db);
      const url = new URL(request.url);

      const filters = {
        projectId: request.projectId as string,
        status: url.searchParams.get("status") || undefined,
        endpointId: url.searchParams.get("endpointId") || undefined,
        from: url.searchParams.get("from")
          ? Number(url.searchParams.get("from"))
          : undefined,
        to: url.searchParams.get("to")
          ? Number(url.searchParams.get("to"))
          : undefined,
      };

      const results = await repository.searchDeliveries(filters);
      return json(results);
    },
  );

  // Audit Log Search
  router.get(
    "/api/v1/audit-logs/search",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const url = new URL(request.url);

      const conditions = [eq(auditLogs.projectId, request.projectId)];

      const action = url.searchParams.get("action");
      if (action) {
        conditions.push(eq(auditLogs.action, action));
      }

      const from = url.searchParams.get("from");
      if (from) {
        conditions.push(gte(auditLogs.createdAt, Number(from)));
      }

      const to = url.searchParams.get("to");
      if (to) {
        conditions.push(lte(auditLogs.createdAt, Number(to)));
      }

      const rows = await db
        .select()
        .from(auditLogs)
        .where(and(...conditions));

      return json(rows);
    },
  );
};
