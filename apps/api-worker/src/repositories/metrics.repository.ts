import { sql } from "drizzle-orm";

export class MetricsRepository {
  constructor(private db: any) {}

  async getOverview() {
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
    `,
    );
    return result[0] || { total: 0, success: 0, failed: 0 };
  }

  async getAverageLatency() {
    const result = await this.db.all(
      sql`
      SELECT
      AVG(latency_ms) AS avg_latency
      FROM deliveries
      WHERE status='success'
    `,
    );
    return result[0] || { avg_latency: 0 };
  }

  async getRetryStats() {
    const result = await this.db.all(
      sql`
      SELECT
      AVG(retry_count) AS average_retry,
      MAX(retry_count) AS max_retry
      FROM events
    `,
    );
    return result[0] || { average_retry: 0, max_retry: 0 };
  }

  async getDeadCount() {
    const result = await this.db.all(
      sql`
      SELECT
      COUNT(*) dead
      FROM events
      WHERE status='dead'
    `,
    );
    return result[0] || { dead: 0 };
  }

  async getEndpointHealth() {
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
      GROUP BY endpoint_id
    `,
    );
    return result;
  }

  async getEndpointMetrics(endpointId: string) {
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
    `,
    );
    const row = result[0];
    return {
      total: Number(row?.total || 0),
      success: Number(row?.success || 0),
    };
  }
}
