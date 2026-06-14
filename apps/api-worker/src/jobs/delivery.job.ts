import { getDb } from "../db/client";
import { EventRepository } from "../repositories/event.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { WebhookRepository } from "../repositories/webhook.repository";
import { DeliveryService } from "../services/delivery.service";

export async function runDeliveryJob(env: any) {
  const db = getDb(env);
  const eventRepo = new EventRepository(db);
  const deliveryRepo = new DeliveryRepository(db);
  const webhookRepo = new WebhookRepository(db);

  const service = new DeliveryService(deliveryRepo, eventRepo, webhookRepo);

  const events = await eventRepo.getDeliverableEvents();

  for (const event of events) {
    await service.deliver(event);
  }
}
