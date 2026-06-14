import React, { useState } from "react";
import { RefreshCw, Clock, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useDeliveries } from "../hooks/useDeliveries";
import type { Event } from "../types";

interface EventTableProps {
  events: Event[];
  onReplay?: (id: string) => Promise<unknown>;
}

export default function EventTable({ events, onReplay }: EventTableProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [payloadVisibleId, setPayloadVisibleId] = useState<string | null>(null);

  const handleReplay = async (id: string) => {
    if (!onReplay) return;
    try {
      setReplayingId(id);
      await onReplay(id);
    } catch (err) {
      console.error(err);
    } finally {
      setReplayingId(null);
    }
  };

  const getStatusBadgeClass = (status: string, poisoned: boolean) => {
    if (poisoned || status === "poisoned") return "bg-accent-error-glow text-accent-error border border-accent-error/20";
    if (status === "delivered" || status === "success") return "bg-accent-success-glow text-accent-success border border-accent-success/20";
    if (status === "dead") return "bg-accent-error-glow text-accent-error border border-accent-error/20";
    if (status === "retrying") return "bg-accent-warning-glow text-accent-warning border border-accent-warning/20";
    return "bg-sky-500/10 text-accent-info border border-accent-info/20";
  };

  return (
    <div className="w-full overflow-x-auto mb-6 glass-panel">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border-color">
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted w-10"></th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Event Details</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Event Type</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Idempotency Key</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Status</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Retries</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Created</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-text-muted text-base">
                No events recorded. Generate webhook payloads to inspect events here.
              </td>
            </tr>
          ) : (
            events.map((event) => {
              const isExpanded = expandedEventId === event.id;
              const isPayloadVisible = payloadVisibleId === event.id;

              return (
                <React.Fragment key={event.id}>
                  <tr className={`border-b border-border-color hover:bg-white/[0.02] transition-colors duration-200 ${isExpanded ? "bg-white/[0.01]" : ""}`}>
                    <td className="px-6 py-4.5 align-middle">
                      <button
                        className="text-text-muted hover:text-text-main p-1 rounded cursor-pointer"
                        onClick={() =>
                          setExpandedEventId(isExpanded ? null : event.id)
                        }
                        title="Toggle delivery timeline"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4.5 align-middle font-medium">
                      <div className="text-sm font-semibold text-text-main">{event.id}</div>
                      <div className="text-xs text-text-dim mt-1">Endpoint: {event.endpointId}</div>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <code className="font-mono bg-white/[0.05] border border-border-color px-2 py-0.5 rounded text-xs text-accent-primary">{event.eventType}</code>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      {event.idempotencyKey ? (
                        <code className="font-mono bg-white/[0.05] border border-border-color px-2 py-0.5 rounded text-xs text-accent-primary">{event.idempotencyKey}</code>
                      ) : (
                        <span className="text-xs text-text-dim">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(event.status, event.poisoned)}`}>
                        {event.poisoned ? "poisoned" : event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span className="text-xs text-text-muted font-medium">
                        {event.retryCount} attempt{event.retryCount !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 align-middle">
                      <span className="text-xs text-text-muted">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setPayloadVisibleId(isPayloadVisible ? null : event.id)
                          }
                          className="border border-border-color p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-card-hover hover:border-border-color-glow transition-all duration-200 cursor-pointer"
                          title={isPayloadVisible ? "Hide Payload" : "View Payload"}
                        >
                          {isPayloadVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {onReplay && (event.status === "dead" || event.status === "poisoned" || event.poisoned) && (
                          <button
                            onClick={() => handleReplay(event.id)}
                            disabled={replayingId === event.id}
                            className="border border-border-color p-2 rounded-lg text-text-muted hover:text-accent-success hover:bg-accent-success-glow hover:border-accent-success/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
                            title="Replay event"
                          >
                            <RefreshCw
                              size={16}
                              className={replayingId === event.id ? "animate-spin" : ""}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Render Payload Drawer Inline */}
                  {isPayloadVisible && (
                    <tr className="bg-white/[0.005]">
                      <td></td>
                      <td colSpan={7} className="px-6 py-4.5">
                        <div className="bg-black/20 border border-border-color rounded-xl p-4">
                          <div className="font-display text-[10px] font-semibold uppercase text-text-muted mb-2 tracking-wider">Event JSON Payload</div>
                          <pre className="font-mono text-xs text-accent-info whitespace-pre-wrap break-all max-h-[250px] overflow-y-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Render Timeline Inline sub-row */}
                  {isExpanded && (
                    <tr className="bg-white/[0.005]">
                      <td></td>
                      <td colSpan={7} className="px-6 py-4.5">
                        <TimelineSection eventId={event.id} />
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
  );
}

function TimelineSection({ eventId }: { eventId: string }) {
  const { timeline, isLoadingTimeline } = useDeliveries(eventId);

  if (isLoadingTimeline) {
    return <div className="p-4 text-center text-xs text-text-muted">Loading timeline...</div>;
  }

  if (!timeline || timeline.length === 0) {
    return <div className="p-4 text-center text-xs text-text-muted">No delivery attempts logged for this event.</div>;
  }

  return (
    <div className="bg-black/20 border border-border-color rounded-xl p-5">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-4">Delivery Attempts Logs</h4>
      <div className="flex flex-col gap-4">
        {timeline.map((attempt, index) => (
          <div key={attempt.id} className="flex gap-4">
            <div className="flex flex-col items-center text-text-dim">
              <Clock size={14} />
              <span className="text-[10px] font-bold mt-1">#{index + 1}</span>
            </div>
            <div className="flex-grow flex flex-col gap-1.5">
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={
                    attempt.status === "success"
                      ? "font-bold text-accent-success"
                      : "font-bold text-accent-error"
                  }
                >
                  {attempt.status.toUpperCase()} (HTTP {attempt.responseCode || "Network Error"})
                </span>
                <span className="text-text-muted font-medium">{attempt.latencyMs} ms</span>
                <span className="text-text-dim">
                  {new Date(attempt.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-2.5">
                <span className="text-[10px] font-semibold text-text-muted block mb-1">Response Body:</span>
                <pre className="font-mono text-xs text-text-muted whitespace-pre-wrap break-all">{attempt.responseBody || "No response body."}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
