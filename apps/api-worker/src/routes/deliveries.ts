import type { Env } from "../types/env";
import { getDb } from "../db/client";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { json } from "../utils/response";

export const registerDeliveryRoutes = (router: any) => {
  router.get("/api/v1/deliveries", async (_request: any, env: Env) => {
    const db = getDb(env);
    const repository = new DeliveryRepository(db);
    const deliveries = await repository.findAll();
    return json(deliveries);
  });
};
