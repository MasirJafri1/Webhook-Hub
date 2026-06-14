export class MetricsService {
  constructor(private metricsRepository: any) {}

  async getOverview() {
    const stats = await this.metricsRepository.getOverview();

    const total = Number(stats?.total || 0);
    const success = Number(stats?.success || 0);
    const failed = Number(stats?.failed || 0);

    return {
      total,
      success,
      failed,
      successRate: total === 0 ? 0 : (success / total) * 100,
      failureRate: total === 0 ? 0 : (failed / total) * 100,
    };
  }

  async getDashboardMetrics() {
    const overview = await this.getOverview();
    const latency = await this.metricsRepository.getAverageLatency();
    const retry = await this.metricsRepository.getRetryStats();
    const dead = await this.metricsRepository.getDeadCount();
    const endpointHealthRaw = await this.metricsRepository.getEndpointHealth();

    const endpointHealth = endpointHealthRaw.map((row: any) => ({
      endpoint_id: String(row.endpoint_id),
      total: Number(row.total || 0),
      successful: Number(row.successful || 0),
    }));

    return {
      overview,
      latency: {
        avg_latency: Number(latency?.avg_latency || 0),
      },
      retry: {
        average_retry: Number(retry?.average_retry || 0),
        max_retry: Number(retry?.max_retry || 0),
      },
      dead: {
        dead: Number(dead?.dead || 0),
      },
      endpointHealth,
    };
  }
}
