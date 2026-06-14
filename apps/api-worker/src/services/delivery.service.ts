import { nanoid } from "nanoid";
import { RETRY_DELAYS } from "../constants/retry-policy";
import { createSignature } from "../utils/signature";

export class DeliveryService {
  constructor(
    private deliveryRepository: any,
    private eventRepository: any,
    private webhookRepository: any,
  ) {}

  private getNextRetry(retryCount: number) {
    const delay = RETRY_DELAYS[retryCount];
    if (!delay) {
      return null;
    }
    return Date.now() + delay * 1000;
  }

  async deliver(event: any) {
    const endpoint = await this.webhookRepository.findById(event.endpointId);

    if (!endpoint) {
      await this.eventRepository.markDead(event.id);
      return;
    }

    const started = Date.now();

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = await createSignature(
        endpoint.currentSecret,
        timestamp,
        event.id,
        event.payload,
      );

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-id": event.id,
          "x-webhook-timestamp": timestamp,
          "x-webhook-signature": signature,
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
        const nextRetry = this.getNextRetry(event.retryCount);
        if (!nextRetry) {
          await this.eventRepository.markDead(event.id);
        } else {
          await this.eventRepository.scheduleRetry(
            event.id,
            event.retryCount + 1,
            nextRetry,
          );
        }
      }
    } catch (error) {
      const nextRetry = this.getNextRetry(event.retryCount);
      if (!nextRetry) {
        await this.eventRepository.markDead(event.id);
      } else {
        await this.eventRepository.scheduleRetry(
          event.id,
          event.retryCount + 1,
          nextRetry,
        );
      }

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
