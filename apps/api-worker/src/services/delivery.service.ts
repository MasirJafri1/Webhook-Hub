import { nanoid } from "nanoid";

export class DeliveryService {
  constructor(
    private deliveryRepository: any,
    private eventRepository: any,
    private webhookRepository: any,
  ) {}

  async deliver(event: any) {
    const endpoint = await this.webhookRepository.findById(event.endpointId);

    if (!endpoint) {
      await this.eventRepository.markFailed(event.id);
      return;
    }

    const started = Date.now();

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: event.payload,
      });

      const latency = Date.now() - started;

      await this.deliveryRepository.create({
        id: nanoid(),
        eventId: event.id,
        endpointId: endpoint.id,
        status: response.ok ? "success" : "failed",
        responseCode: response.status,
        responseBody: await response.text(),
        latencyMs: latency,
        createdAt: Date.now(),
      });

      if (response.ok) {
        await this.eventRepository.markDelivered(event.id);
      } else {
        await this.eventRepository.markFailed(event.id);
      }
    } catch (error) {
      await this.eventRepository.markFailed(event.id);

      await this.deliveryRepository.create({
        id: nanoid(),
        eventId: event.id,
        endpointId: endpoint.id,
        status: "failed",
        responseCode: 0,
        responseBody: String(error),
        latencyMs: 0,
        createdAt: Date.now(),
      });
    }
  }
}
