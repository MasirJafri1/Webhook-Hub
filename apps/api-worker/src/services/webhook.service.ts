import { nanoid } from "nanoid";

export class WebhookService {
  constructor(private repository: any) {}

  async createWebhook(
    payload: {
      name: string;
      url: string;
      requestsPerMinute?: number;
      eventFilters?: string[];
      payloadTransform?: Record<string, unknown>;
      version?: string;
      customHeaders?: Record<string, string>;
    },
    projectId: string,
  ) {
    const webhook = {
      id: nanoid(),
      projectId,
      name: payload.name,
      url: payload.url,
      currentSecret: crypto.randomUUID(),
      previousSecret: null,
      secretRotatedAt: null,
      eventFilters: payload.eventFilters
        ? JSON.stringify(payload.eventFilters)
        : null,
      payloadTransform: payload.payloadTransform
        ? JSON.stringify(payload.payloadTransform)
        : null,
      version: payload.version || "v1",
      active: true,
      createdAt: Date.now(),
      deletedAt: null,
      requestsPerMinute: payload.requestsPerMinute,
      customHeaders: payload.customHeaders
        ? JSON.stringify(payload.customHeaders)
        : null,
      consecutiveFailures: 0,
    };

    return this.repository.create(webhook);
  }
}
