import { getDb } from "../db/client";
import { EventRepository } from "../repositories/event.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { WebhookRepository } from "../repositories/webhook.repository";
import { DeliveryService } from "../services/delivery.service";
import { RateLimitService } from "../services/rate-limit.service";

function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function runDeliveryJob(env: any) {
  const db = getDb(env);
  const eventRepo = new EventRepository(db);
  const deliveryRepo = new DeliveryRepository(db);
  const webhookRepo = new WebhookRepository(db);
  const rateLimitService = new RateLimitService(env.CACHE);

  const service = new DeliveryService(deliveryRepo, eventRepo, webhookRepo, db);

  // Auto-release any processing locks held by crashed worker instances (5-minute timeout)
  try {
    await eventRepo.releaseOrphanedLocks(300000);
  } catch (e) {
    console.error("Failed to release orphaned locks:", e);
  }

  const events = await eventRepo.getDeliverableEvents();

  for (const batch of chunk(events, 20)) {
    const deliverables: any[] = [];
    for (const event of batch as any[]) {
      const endpoint = await webhookRepo.findById(
        event.endpointId,
        event.projectId,
      );
      if (!endpoint) {
        continue;
      }

      // Event filter check
      if (endpoint.eventFilters) {
        try {
          const filters: string[] = JSON.parse(endpoint.eventFilters);
          if (filters.length > 0 && !filters.includes(event.eventType)) {
            console.log(
              `Event ${event.id} (${event.eventType}) filtered out by endpoint ${endpoint.id}`,
            );
            await eventRepo.markDelivered(event.id);
            continue;
          }
        } catch {
          // Invalid JSON — skip filter check, deliver normally
        }
      }

      // Rate limit check
      const limit = endpoint.requestsPerMinute ?? 60;
      const isLimited = await rateLimitService.isRateLimited(
        endpoint.id,
        limit,
      );
      if (isLimited) {
        console.log(
          `Endpoint ${endpoint.id} rate limited. Skipping event ${event.id}`,
        );
        continue;
      }

      // Acquire D1 status-update lock
      const acquired = await eventRepo.acquireLock(event.id);
      if (!acquired) {
        console.log(`Event ${event.id} already locked. Skipping.`);
        continue;
      }

      deliverables.push(event);
    }

    await Promise.all(
      deliverables.map(async (event: any) => {
        try {
          await service.deliver(event);
        } catch (e) {
          console.error(`Error delivering event ${event.id}:`, e);
        }
      }),
    );
  }
}
