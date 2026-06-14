import { eq } from "drizzle-orm";
import { deliveries } from "../db/schema";

export class DeliveryRepository {
  constructor(private db: any) {}

  async create(data: any) {
    await this.db.insert(deliveries).values(data);
    return data;
  }

  async findAll() {
    return this.db.select().from(deliveries);
  }

  async findByEventId(eventId: string) {
    return this.db
      .select()
      .from(deliveries)
      .where(eq(deliveries.eventId, eventId));
  }
}
