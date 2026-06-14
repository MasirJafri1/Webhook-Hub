import { sql } from "drizzle-orm";

export class MetricsRepository {
  constructor(private db: any) {}

  async getOverview(projectId: string) {
    const result = await this.db.all(
      sql`
      SELECT
      COUNT(*) total,
      SUM(
        CASE
          WHEN status='success'
          THEN 1
          ELSE 0
        END
      ) success,
      SUM(
        CASE
          WHEN status='failed'
          THEN 1
          ELSE 0
        END
      ) failed
      FROM deliveries
      WHERE event_id IN (SELECT id FROM events WHERE project_id = ${projectId})
    `,
    );
    return result[0] || { total: 0, success: 0, failed: 0 };
  }

  async getAverageLatency(projectId: string) {
    const result = await this.db.all(
      sql`
      SELECT
      AVG(latency_ms) AS avg_latency
      FROM deliveries
      WHERE status='success'
      AND event_id IN (SELECT id FROM events WHERE project_id = ${projectId})
    `,
    );
    return result[0] || { avg_latency: 0 };
  }

  async getRetryStats(projectId: string) {
    const result = await this.db.all(
      sql`
      SELECT
      AVG(retry_count) AS average_retry,
      MAX(retry_count) AS max_retry
      FROM events
      WHERE project_id = ${projectId}
    `,
    );
    return result[0] || { average_retry: 0, max_retry: 0 };
  }

  async getDeadCount(projectId: string) {
    const result = await this.db.all(
      sql`
      SELECT
      COUNT(*) dead
      FROM events
      WHERE status='dead' AND project_id = ${projectId}
    `,
    );
    return result[0] || { dead: 0 };
  }

  async getEndpointHealth(projectId: string) {
    const result = await this.db.all(
      sql`
      SELECT
      endpoint_id,
      COUNT(*) total,
      SUM(
        CASE
          WHEN status='success'
          THEN 1
          ELSE 0
        END
      ) successful
      FROM deliveries
      WHERE event_id IN (SELECT id FROM events WHERE project_id = ${projectId})
      GROUP BY endpoint_id
    `,
    );
    return result;
  }

  async getEndpointMetrics(endpointId: string, projectId: string) {
    const result = await this.db.all(
      sql`
      SELECT
      COUNT(*) total,
      SUM(
        CASE
          WHEN status='success'
          THEN 1
          ELSE 0
        END
      ) success
      FROM deliveries
      WHERE endpoint_id = ${endpointId}
      AND event_id IN (SELECT id FROM events WHERE project_id = ${projectId})
    `,
    );
    const row = result[0];
    return {
      total: Number(row?.total || 0),
      success: Number(row?.success || 0),
    };
  }
}
