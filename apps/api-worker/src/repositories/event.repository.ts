import { and, eq, lte, or } from "drizzle-orm";
import { events } from "../db/schema";

export class EventRepository {
  constructor(private db: any) {}

  async create(data: any) {
    await this.db.insert(events).values(data);
    return data;
  }

  async findById(id: string) {
    const rows = await this.db.select().from(events).where(eq(events.id, id));
    return rows[0];
  }

  async findAll() {
    return this.db.select().from(events);
  }

  async getDeliverableEvents() {
    const now = Date.now();
    return this.db
      .select()
      .from(events)
      .where(
        or(
          eq(events.status, "pending"),
          and(eq(events.status, "retrying"), lte(events.nextRetryAt, now)),
        ),
      );
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
}
