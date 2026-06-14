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
  }) {
    const exists = await this.webhookRepository.exists(payload.endpointId);

    if (!exists) {
      throw new Error("Webhook endpoint not found");
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
      createdAt: Date.now(),
    };

    return this.eventRepository.create(event);
  }
}
