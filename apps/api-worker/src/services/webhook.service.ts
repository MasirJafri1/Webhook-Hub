import { nanoid } from "nanoid"

export class WebhookService {
  constructor(
    private repository: any
  ) {}

  async createWebhook(
    payload: {
      name: string
      url: string
    }
  ) {
    const webhook = {
      id: nanoid(),
      name: payload.name,
      url: payload.url,
      secret: crypto.randomUUID(),
      active: true,
      createdAt: Date.now(),
      deletedAt: null
    }

    return this.repository.create(
      webhook
    )
  }
}
