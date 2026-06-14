import { eq, isNull } from "drizzle-orm";
import { webhookEndpoints } from "../db/schema";

export class WebhookRepository {
  constructor(private db: any) {}

  async create(data: any) {
    await this.db.insert(webhookEndpoints).values(data);
    return data;
  }

  async findAll() {
    return this.db
      .select()
      .from(webhookEndpoints)
      .where(isNull(webhookEndpoints.deletedAt));
  }

  async findById(id: string) {
    const rows = await this.db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, id));
    return rows[0];
  }

  async softDelete(id: string) {
    return this.db
      .update(webhookEndpoints)
      .set({
        deletedAt: Date.now(),
        active: false,
      })
      .where(eq(webhookEndpoints.id, id));
  }

  async exists(id: string) {
    const rows = await this.db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, id));
    return rows.length > 0;
  }

  async rotateSecret(id: string) {
    const webhook = await this.findById(id);
    if (!webhook) {
      throw new Error("Webhook not found");
    }
    const newSecret = crypto.randomUUID();
    await this.db
      .update(webhookEndpoints)
      .set({
        previousSecret: webhook.currentSecret,
        currentSecret: newSecret,
        secretRotatedAt: Date.now(),
      })
      .where(eq(webhookEndpoints.id, id));
    return newSecret;
  }
}
