import type { Env } from "../types/env";
import { getDb } from "../db/client";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { json } from "../utils/response";
import { authenticate } from "../middleware/auth";

export const registerDeliveryRoutes = (router: any) => {
  router.get(
    "/api/v1/deliveries",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new DeliveryRepository(db);

      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);

      const { data, total } = await repository.findPaginated(
        page,
        limit,
        request.projectId,
      );

      return json({
        data,
        total,
        page,
        limit,
      });
    },
  );
};
