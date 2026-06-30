import type { EndpointHealth } from "../types";

interface MetricTableProps {
  metrics: EndpointHealth[];
}

export default function MetricTable({ metrics }: MetricTableProps) {
  const getSuccessRate = (total: number, successful: number) => {
    if (total === 0) return 0;
    return (successful / total) * 100;
  };

  const getHealthStatus = (rate: number) => {
    if (rate >= 90) return { label: "Healthy", class: "bg-accent-success-glow text-accent-success border border-accent-success/20" };
    if (rate >= 50) return { label: "Warning", class: "bg-accent-warning-glow text-accent-warning border border-accent-warning/20" };
    return { label: "Degraded", class: "bg-accent-error-glow text-accent-error border border-accent-error/20" };
  };

  return (
    <div className="w-full mb-6">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto glass-panel">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-color">
              <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Endpoint ID</th>
              <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Total Deliveries</th>
              <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Successful Attempts</th>
              <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Success Rate</th>
              <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Health Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted text-base">
                  No delivery metrics recorded yet. Send webhook events to compile analytics.
                </td>
              </tr>
            ) : (
              metrics.map((m) => {
                const successRate = getSuccessRate(m.total, m.successful);
                const health = getHealthStatus(successRate);

                return (
                  <tr key={m.endpoint_id} className="border-b border-border-color hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="px-6 py-4.5 font-medium align-middle">
                      <div className="text-sm font-semibold text-text-main">{m.endpoint_id}</div>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span className="font-display text-base font-semibold text-text-main">{m.total}</span>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span className="font-display text-base font-semibold text-text-main">{m.successful}</span>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <div className="flex flex-col gap-1.5 w-[140px]">
                        <span className="font-display text-xs font-semibold text-text-main">
                          {successRate.toFixed(1)}%
                        </span>
                        <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${successRate}%`,
                              backgroundColor:
                                successRate >= 90
                                  ? "var(--accent-success)"
                                  : successRate >= 50
                                  ? "var(--accent-warning)"
                                  : "var(--accent-error)",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${health.class}`}>
                        {health.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {metrics.length === 0 ? (
          <div className="px-6 py-12 text-center text-text-muted text-base glass-panel">
            No delivery metrics recorded yet. Send webhook events to compile analytics.
          </div>
        ) : (
          metrics.map((m) => {
            const successRate = getSuccessRate(m.total, m.successful);
            const health = getHealthStatus(successRate);

            return (
              <div
                key={m.endpoint_id}
                className="p-5 rounded-xl border border-border-color bg-zinc-900/40 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] text-text-dim uppercase tracking-wider font-semibold block">Endpoint ID</span>
                    <span className="text-xs font-semibold text-text-main font-mono truncate block mt-0.5">{m.endpoint_id}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${health.class}`}>
                    {health.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-border-color/30">
                  <div>
                    <span className="text-[10px] text-text-dim block">Total Deliveries</span>
                    <span className="font-display text-base font-bold text-text-main mt-0.5 block">{m.total}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-dim block">Successful Attempts</span>
                    <span className="font-display text-base font-bold text-text-main mt-0.5 block">{m.successful}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-dim">Success Rate</span>
                    <span className="font-semibold text-text-main">{successRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${successRate}%`,
                        backgroundColor:
                          successRate >= 90
                            ? "var(--accent-success)"
                            : successRate >= 50
                            ? "var(--accent-warning)"
                            : "var(--accent-error)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
