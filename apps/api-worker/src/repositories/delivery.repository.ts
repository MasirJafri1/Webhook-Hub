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
}
