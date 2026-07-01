import { and, eq, lte, or, sql, gte, isNull } from "drizzle-orm";
import { events } from "../db/schema";

export class EventRepository {
  constructor(private db: any) {}

  async create(data: any) {
    await this.db.insert(events).values(data);
    return data;
  }

  async acquireLock(id: string) {
    const result = await this.db
      .update(events)
      .set({ status: "processing", lastAttemptAt: Date.now() })
      .where(
        and(
          eq(events.id, id),
          or(eq(events.status, "pending"), eq(events.status, "retrying"))
        )
      );
    const changes = result.meta?.changes ?? result.changes ?? 0;
    return changes > 0;
  }

  async releaseOrphanedLocks(timeoutMs = 300000) {
    const cutoff = Date.now() - timeoutMs;
    return this.db
      .update(events)
      .set({ status: "pending" })
      .where(
        and(
          eq(events.status, "processing"),
          or(
            isNull(events.lastAttemptAt),
            lte(events.lastAttemptAt, cutoff)
          )
        )
      );
  }


  async findById(id: string, projectId: string) {
    const rows = await this.db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.projectId, projectId)));
    return rows[0];
  }

  async findAll(projectId: string) {
    return this.db.select().from(events).where(eq(events.projectId, projectId));
  }

  async getDeliverableEvents(limit = 50) {
    const now = Date.now();
    return this.db
      .select()
      .from(events)
      .where(
        or(
          eq(events.status, "pending"),
          and(eq(events.status, "retrying"), lte(events.nextRetryAt, now)),
        ),
      )
      .limit(limit);
  }

  async markDelivered(id: string) {
    return this.db
      .update(events)
      .set({
        status: "delivered",
        nextRetryAt: null,
      })
      .where(eq(events.id, id));
  }

  async scheduleRetry(
    eventId: string,
    retryCount: number,
    nextRetryAt: number,
  ) {
    return this.db
      .update(events)
      .set({
        status: "retrying",
        retryCount,
        nextRetryAt,
        lastAttemptAt: Date.now(),
      })
      .where(eq(events.id, eventId));
  }

  async markDead(eventId: string) {
    return this.db
      .update(events)
      .set({
        status: "dead",
        lastAttemptAt: Date.now(),
      })
      .where(eq(events.id, eventId));
  }

  async findByIdempotencyKey(key: string, projectId: string) {
    const rows = await this.db
      .select()
      .from(events)
      .where(
        and(eq(events.idempotencyKey, key), eq(events.projectId, projectId)),
      );
    return rows[0];
  }

  async findPaginated(page: number, limit: number, projectId: string) {
    const offset = (page - 1) * limit;
    const data = await this.db
      .select()
      .from(events)
      .where(eq(events.projectId, projectId))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db.all(
      sql`SELECT COUNT(*) as count FROM events WHERE project_id = ${projectId}`,
    );
    const total = Number(countResult[0]?.count || 0);

    return { data, total };
  }

  async findPaginatedByStatus(
    page: number,
    limit: number,
    projectId: string,
    status: string,
  ) {
    const offset = (page - 1) * limit;
    const data = await this.db
      .select()
      .from(events)
      .where(
        and(
          eq(events.projectId, projectId),
          eq(events.status, status),
        )
      )
      .limit(limit)
      .offset(offset);

    const countResult = await this.db.all(
      sql`SELECT COUNT(*) as count FROM events WHERE project_id = ${projectId} AND status = ${status}`,
    );
    const total = Number(countResult[0]?.count || 0);

    return { data, total };
  }

  async replay(eventId: string, projectId: string) {
    return this.db
      .update(events)
      .set({
        status: "pending",
        retryCount: 0,
        nextRetryAt: null,
        lastErrorHash: null,
        poisoned: false,
      })
      .where(and(eq(events.id, eventId), eq(events.projectId, projectId)));
  }

  async replayAllDead(projectId: string) {
    return this.db
      .update(events)
      .set({
        status: "pending",
        retryCount: 0,
        nextRetryAt: null,
        lastErrorHash: null,
        poisoned: false,
      })
      .where(
        and(
          eq(events.projectId, projectId),
          or(eq(events.status, "dead"), eq(events.status, "poisoned")),
        ),
      );
  }

  async markPoisoned(eventId: string, errorHash: string) {
    return this.db
      .update(events)
      .set({
        status: "poisoned",
        poisoned: true,
        lastErrorHash: errorHash,
        lastAttemptAt: Date.now(),
      })
      .where(eq(events.id, eventId));
  }

  async scheduleRetryWithErrorHash(
    eventId: string,
    retryCount: number,
    nextRetryAt: number,
    errorHash: string,
  ) {
    return this.db
      .update(events)
      .set({
        status: "retrying",
        retryCount,
        nextRetryAt,
        lastErrorHash: errorHash,
        lastAttemptAt: Date.now(),
      })
      .where(eq(events.id, eventId));
  }

  async markDeadWithErrorHash(eventId: string, errorHash: string) {
    return this.db
      .update(events)
      .set({
        status: "dead",
        lastErrorHash: errorHash,
        lastAttemptAt: Date.now(),
      })
      .where(eq(events.id, eventId));
  }

  async searchEvents(filters: {
    projectId: string;
    eventType?: string;
    status?: string;
    from?: number;
    to?: number;
    endpointId?: string;
  }) {
    const conditions = [eq(events.projectId, filters.projectId)];

    if (filters.eventType) {
      conditions.push(eq(events.eventType, filters.eventType));
    }
    if (filters.status) {
      conditions.push(eq(events.status, filters.status));
    }
    if (filters.from) {
      conditions.push(gte(events.createdAt, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(events.createdAt, filters.to));
    }
    if (filters.endpointId) {
      conditions.push(eq(events.endpointId, filters.endpointId));
    }

    return this.db
      .select()
      .from(events)
      .where(and(...conditions));
  }

  async replayWindow(from: number, to: number, projectId: string) {
    return this.db
      .update(events)
      .set({
        status: "pending",
        retryCount: 0,
        nextRetryAt: null,
        lastErrorHash: null,
        poisoned: false,
      })
      .where(
        and(
          eq(events.projectId, projectId),
          gte(events.createdAt, from),
          lte(events.createdAt, to),
        ),
      );
  }
}
