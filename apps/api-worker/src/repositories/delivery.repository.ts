import { and, eq, sql, gte, lte } from "drizzle-orm";
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

  async searchDeliveries(filters: {
    projectId: string;
    status?: string;
    endpointId?: string;
    from?: number;
    to?: number;
  }) {
    const conditions = [
      sql`event_id IN (SELECT id FROM events WHERE project_id = ${filters.projectId})`,
    ];

    if (filters.status) {
      conditions.push(eq(deliveries.status, filters.status));
    }
    if (filters.endpointId) {
      conditions.push(eq(deliveries.endpointId, filters.endpointId));
    }
    if (filters.from) {
      conditions.push(gte(deliveries.createdAt, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(deliveries.createdAt, filters.to));
    }

    return this.db
      .select()
      .from(deliveries)
      .where(and(...conditions));
  }
}
