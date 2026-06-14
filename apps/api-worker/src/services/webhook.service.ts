import { nanoid } from "nanoid";

export class WebhookService {
  constructor(private repository: any) {}

  async createWebhook(payload: { name: string; url: string }) {
    const webhook = {
      id: nanoid(),
      name: payload.name,
      url: payload.url,
      currentSecret: crypto.randomUUID(),
      previousSecret: null,
      secretRotatedAt: null,
      active: true,
      createdAt: Date.now(),
      deletedAt: null,
    };

    return this.repository.create(webhook);
  }
}
