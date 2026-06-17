import { nanoid } from "nanoid";
import { projects } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export class EventService {
  constructor(
    private eventRepository: any,
    private webhookRepository: any,
    private db: any,
  ) {}

  async createEvent(
    payload: {
      endpointId: string;
      eventType: string;
      payload: unknown;
      idempotencyKey?: string;
    },
    projectId: string,
  ) {
    // 1. Quota Check
    const projectRows = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    const project = projectRows[0];
    if (
      project &&
      project.monthlyEventLimit !== null &&
      project.monthlyEventLimit !== undefined
    ) {
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).getTime();

      const countResult = await this.db.all(
        sql`SELECT COUNT(*) as count FROM events WHERE project_id = ${projectId} AND created_at >= ${startOfMonth}`,
      );
      const usage = Number(countResult[0]?.count || 0);

      if (usage >= project.monthlyEventLimit) {
        throw new Error("quota_exceeded");
      }
    }

    // 2. Webhook existence (scoped by project!)
    const exists = await this.webhookRepository.exists(
      payload.endpointId,
      projectId,
    );
    if (!exists) {
      throw new Error("Webhook endpoint not found");
    }

    // 3. Idempotency (scoped by project!)
    if (payload.idempotencyKey) {
      const existing = await this.eventRepository.findByIdempotencyKey(
        payload.idempotencyKey,
        projectId,
      );
      if (existing) {
        return existing;
      }
    }

    const event = {
      id: "evt_" + nanoid(),
      projectId,
      endpointId: payload.endpointId,
      eventType: payload.eventType,
      payload: payload.payload,
      status: "pending",
      retryCount: 0,
      nextRetryAt: null,
      lastAttemptAt: null,
      idempotencyKey: payload.idempotencyKey || null,
      lastErrorHash: null,
      poisoned: false,
      createdAt: Date.now(),
    };

    return this.eventRepository.create(event);
  }
}
