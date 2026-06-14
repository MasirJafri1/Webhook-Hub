import { and, eq, isNull } from "drizzle-orm";
import { webhookEndpoints } from "../db/schema";

export class WebhookRepository {
  constructor(private db: any) {}

  async create(data: any) {
    await this.db.insert(webhookEndpoints).values(data);
    return data;
  }

  async findAll(projectId: string) {
    return this.db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.projectId, projectId),
          isNull(webhookEndpoints.deletedAt),
        ),
      );
  }

  async findById(id: string, projectId: string) {
    const rows = await this.db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.projectId, projectId),
        ),
      );
    return rows[0];
  }

  async softDelete(id: string, projectId: string) {
    return this.db
      .update(webhookEndpoints)
      .set({
        deletedAt: Date.now(),
        active: false,
      })
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.projectId, projectId),
        ),
      );
  }

  async exists(id: string, projectId: string) {
    const rows = await this.db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.projectId, projectId),
        ),
      );
    return rows.length > 0;
  }

  async rotateSecret(id: string, projectId: string) {
    const webhook = await this.findById(id, projectId);
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
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.projectId, projectId),
        ),
      );
    return newSecret;
  }

  async incrementConsecutiveFailures(id: string, projectId: string) {
    const webhook = await this.findById(id, projectId);
    if (!webhook) return 0;
    const count = (webhook.consecutiveFailures ?? 0) + 1;

    const updates: any = { consecutiveFailures: count };
    if (count >= 20) {
      updates.active = false;
    }

    await this.db
      .update(webhookEndpoints)
      .set(updates)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.projectId, projectId),
        ),
      );

    return count;
  }

  async resetConsecutiveFailures(id: string, projectId: string) {
    await this.db
      .update(webhookEndpoints)
      .set({ consecutiveFailures: 0 })
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.projectId, projectId),
        ),
      );
  }
}
