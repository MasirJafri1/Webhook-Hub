import { nanoid } from "nanoid";
import { RETRY_DELAYS } from "../constants/retry-policy";
import { createSignature } from "../utils/signature";
import { TransformService } from "./transform.service";
import { VersionService } from "./version.service";

async function sha256(message: string): Promise<string> {
  const normalized = message.replace(
    /reference\s*=\s*[a-zA-Z0-9_-]+/g,
    "reference=REDACTED",
  );
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
    const endpoint = await this.webhookRepository.findById(
      event.endpointId,
      event.projectId,
    );

    if (!endpoint) {
      await this.eventRepository.markDead(event.id);
      return;
    }

    // Apply payload transformation and versioning
    let finalPayload = event.payload;
    try {
      let parsed =
        typeof event.payload === "string"
          ? JSON.parse(event.payload)
          : event.payload;

      // Apply transforms
      parsed = TransformService.apply(parsed, endpoint.payloadTransform);

      // Apply versioning
      parsed = VersionService.format(parsed, endpoint.version);

      finalPayload = JSON.stringify(parsed);
    } catch {
      // If parsing fails, send raw payload
      finalPayload = event.payload;
    }

    const started = Date.now();

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = await createSignature(
        endpoint.currentSecret,
        timestamp,
        event.id,
        finalPayload,
      );

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-id": event.id,
          "x-webhook-timestamp": timestamp,
          "x-webhook-signature": signature,
          "x-webhook-version": endpoint.version || "v1",
        },
        body: finalPayload,
      });

      const latency = Date.now() - started;
      const responseBody = await response.text();

      await this.deliveryRepository.create({
        id: nanoid(),
        eventId: event.id,
        endpointId: endpoint.id,
        status: response.ok ? "success" : "failed",
        responseCode: response.status,
        responseBody: responseBody,
        latencyMs: latency,
        createdAt: Date.now(),
      });

      if (response.ok) {
        await this.eventRepository.markDelivered(event.id);
      } else {
        const errorHash = await sha256(responseBody);
        if (event.lastErrorHash === errorHash && event.retryCount >= 2) {
          await this.eventRepository.markPoisoned(event.id, errorHash);
        } else {
          const nextRetry = this.getNextRetry(event.retryCount);
          if (!nextRetry) {
            await this.eventRepository.markDeadWithErrorHash(
              event.id,
              errorHash,
            );
          } else {
            await this.eventRepository.scheduleRetryWithErrorHash(
              event.id,
              event.retryCount + 1,
              nextRetry,
              errorHash,
            );
          }
        }
      }
    } catch (error) {
      const errorMsg = String(error);
      const errorHash = await sha256(errorMsg);
      const latency = Date.now() - started;

      await this.deliveryRepository.create({
        id: nanoid(),
        eventId: event.id,
        endpointId: endpoint.id,
        status: "failed",
        responseCode: 0,
        responseBody: errorMsg,
        latencyMs: latency,
        createdAt: Date.now(),
      });

      if (event.lastErrorHash === errorHash && event.retryCount >= 2) {
        await this.eventRepository.markPoisoned(event.id, errorHash);
      } else {
        const nextRetry = this.getNextRetry(event.retryCount);
        if (!nextRetry) {
          await this.eventRepository.markDeadWithErrorHash(event.id, errorHash);
        } else {
          await this.eventRepository.scheduleRetryWithErrorHash(
            event.id,
            event.retryCount + 1,
            nextRetry,
            errorHash,
          );
        }
      }
    }
  }
}
