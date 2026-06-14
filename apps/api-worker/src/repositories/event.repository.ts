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
}
