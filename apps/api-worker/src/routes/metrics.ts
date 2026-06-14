import { getDb } from "../db/client";
import { json } from "../utils/response";
import { MetricsRepository } from "../repositories/metrics.repository";
import { MetricsService } from "../analytics/metrics.service";
import { authenticate } from "../middleware/auth";
import type { Env } from "../types/env";

export const registerMetricsRoutes = (router: any) => {
  router.get(
    "/api/v1/metrics",
    authenticate,
    async (request: any, env: Env) => {
      const db = getDb(env);
      const repository = new MetricsRepository(db);
      const service = new MetricsService(repository);
      const result = await service.getDashboardMetrics(request.projectId);
      return json(result);
    },
  );
};
