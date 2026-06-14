import { nanoid } from "nanoid";

export class EventService {
  constructor(
    private eventRepository: any,
    private webhookRepository: any,
  ) {}

  async createEvent(payload: {
    endpointId: string;
    eventType: string;
    payload: unknown;
    idempotencyKey?: string;
  }) {
    const exists = await this.webhookRepository.exists(payload.endpointId);

    if (!exists) {
      throw new Error("Webhook endpoint not found");
    }

    if (payload.idempotencyKey) {
      const existing = await this.eventRepository.findByIdempotencyKey(
        payload.idempotencyKey,
      );
      if (existing) {
        // Return parsed payload if it is double stringified or parsed
        return existing;
      }
    }

    const event = {
      id: "evt_" + nanoid(),
      endpointId: payload.endpointId,
      eventType: payload.eventType,
      payload: JSON.stringify(payload.payload),
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
