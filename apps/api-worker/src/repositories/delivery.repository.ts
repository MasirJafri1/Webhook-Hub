import { and, eq, sql } from "drizzle-orm";
import { deliveries } from "../db/schema";

export class DeliveryRepository {
  constructor(private db: any) {}

  async create(data: any) {
    await this.db.insert(deliveries).values(data);
    return data;
  }

  async findAll(projectId: string) {
    return this.db
      .select()
      .from(deliveries)
      .where(
        sql`event_id IN (SELECT id FROM events WHERE project_id = ${projectId})`,
      );
  }

  async findByEventId(eventId: string, projectId: string) {
    return this.db
      .select()
      .from(deliveries)
      .where(
        and(
          eq(deliveries.eventId, eventId),
          sql`event_id IN (SELECT id FROM events WHERE project_id = ${projectId})`,
        ),
      );
  }
}
