import React, { useState } from "react";
import { Activity, Clock, Terminal, Eye, EyeOff } from "lucide-react";
import { useDeliveries } from "../hooks/useDeliveries";
import { TableSkeleton } from "../components/Loader";

export default function DeliveriesPage() {
  const { deliveries, isLoadingDeliveries } = useDeliveries();
  const [visibleBodyId, setVisibleBodyId] = useState<string | null>(null);

  if (isLoadingDeliveries) {
    return (
      <div className="flex flex-col gap-8 w-full">
        <div className="flex flex-col gap-2 pb-5 border-b border-zinc-800/60 animate-pulse">
          <div className="h-6 w-48 bg-zinc-800 rounded" />
          <div className="h-3 w-80 bg-zinc-800/60 rounded mt-1" />
        </div>
        <TableSkeleton cols={8} rows={10} />
      </div>
    );
  }

  const deliveriesList = deliveries || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 flex flex-col gap-5 glass-panel">
        <h3 className="font-display text-xl text-text-main flex items-center gap-2.5 font-semibold">
          <Activity size={18} />
          <span>Webhook Delivery History Logs</span>
        </h3>

        <div className="w-full overflow-x-auto mb-6">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Delivery ID</th>
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Event ID</th>
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Endpoint ID</th>
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Status</th>
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Response Code</th>
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Latency</th>
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Created</th>
                <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted text-right">Response</th>
              </tr>
            </thead>
            <tbody>
              {deliveriesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted text-base">
                    No deliveries logged yet. Active endpoints will log deliveries here.
                  </td>
                </tr>
              ) : (
                deliveriesList.map((delivery) => {
                  const isVisible = visibleBodyId === delivery.id;

                  return (
                    <React.Fragment key={delivery.id}>
                      <tr className="border-b border-border-color hover:bg-white/[0.02] transition-colors duration-200">
                        <td className="px-6 py-4.5 font-medium align-middle">
                          <div className="text-sm font-semibold text-text-main">{delivery.id}</div>
                        </td>
                        <td className="px-6 py-4.5 align-middle">
                          <code className="font-mono bg-white/[0.05] border border-border-color px-2 py-0.5 rounded text-xs text-accent-primary">{delivery.eventId}</code>
                        </td>
                        <td className="px-6 py-4.5 align-middle">
                          <span className="text-xs text-text-dim">{delivery.endpointId}</span>
                        </td>
                        <td className="px-6 py-4.5 align-middle">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              delivery.status === "success"
                                ? "bg-accent-success-glow text-accent-success border-accent-success/20"
                                : "bg-accent-error-glow text-accent-error border-accent-error/20"
                            }`}
                          >
                            {delivery.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 align-middle">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              delivery.responseCode !== null &&
                              delivery.responseCode >= 200 &&
                              delivery.responseCode < 300
                                ? "bg-accent-success-glow text-accent-success border-accent-success/20"
                                : "bg-accent-error-glow text-accent-error border-accent-error/20"
                            }`}
                          >
                            {delivery.responseCode || "Network Error"}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 align-middle">
                          <div className="flex items-center gap-1 text-xs text-text-main font-medium">
                            <Clock size={12} className="text-text-muted" />
                            <span>{delivery.latencyMs} ms</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 align-middle">
                          <span className="text-xs text-text-muted">
                            {new Date(delivery.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 align-middle text-right">
                          <button
                            onClick={() => setVisibleBodyId(isVisible ? null : delivery.id)}
                            className="border border-border-color p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-card-hover hover:border-border-color-glow transition-all duration-200 cursor-pointer"
                            title={isVisible ? "Hide Response Body" : "View Response Body"}
                          >
                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </td>
                      </tr>

                      {isVisible && (
                        <tr className="bg-white/[0.005]">
                          <td></td>
                          <td colSpan={7} className="px-6 py-4.5">
                            <div className="bg-black/20 border border-border-color rounded-xl p-4">
                              <div className="font-display text-[10px] font-semibold uppercase text-text-muted mb-2 tracking-wider flex items-center gap-1.5">
                                <Terminal size={12} />
                                <span>HTTP Response Content</span>
                              </div>
                              <pre className="font-mono text-xs text-accent-info whitespace-pre-wrap break-all max-h-[250px] overflow-y-auto">
                                {delivery.responseBody || "No response body recorded."}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
