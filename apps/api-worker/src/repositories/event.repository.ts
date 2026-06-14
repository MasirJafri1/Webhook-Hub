import { eq } from "drizzle-orm";
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

  async getPendingEvents() {
    return this.db.select().from(events).where(eq(events.status, "pending"));
  }

  async markDelivered(id: string) {
    return this.db
      .update(events)
      .set({ status: "delivered" })
      .where(eq(events.id, id));
  }

  async markFailed(id: string) {
    return this.db
      .update(events)
      .set({ status: "failed" })
      .where(eq(events.id, id));
  }
}
