import React, { useState } from "react";
import {
  X,
  Send,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useEventTimeline } from "../hooks/useEventTimeline";
import type { Event } from "../types";

interface EventDetailDrawerProps {
  event: Event | null;
  onClose: () => void;
  onReplay: (id: string) => Promise<unknown>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
    success: {
      cls: "bg-accent-success-glow text-accent-success border-accent-success/20",
      icon: <CheckCircle size={10} />,
    },
    failed: {
      cls: "bg-accent-error-glow text-accent-error border-accent-error/20",
      icon: <XCircle size={10} />,
    },
    pending: {
      cls: "bg-zinc-800 text-zinc-400 border-zinc-700",
      icon: <Clock size={10} />,
    },
    dead: {
      cls: "bg-accent-error-glow text-accent-error border-accent-error/20",
      icon: <AlertTriangle size={10} />,
    },
  };
  const style = cfg[status] ?? cfg["pending"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.cls}`}
    >
      {style.icon}
      {status}
    </span>
  );
}

export default function EventDetailDrawer({
  event,
  onClose,
  onReplay,
}: EventDetailDrawerProps) {
  const { timeline, isLoading: isLoadingTimeline } = useEventTimeline(
    event?.id ?? null
  );
  const [copied, setCopied] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  if (!event) return null;

  const payloadStr = JSON.stringify(event.payload, null, 2);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payloadStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplay = async () => {
    try {
      setIsReplaying(true);
      await onReplay(event.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplaying(false);
    }
  };

  const canReplay = event.status === "dead" || event.status === "failed" || event.poisoned;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <Send size={16} className="text-indigo-400" />
            <div>
              <p className="font-bold text-text-main text-sm font-display">{event.eventType}</p>
              <p className="text-[10px] text-text-dim font-mono mt-0.5">{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-main transition-all cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Status & Meta */}
          <div className="flex flex-wrap gap-4 items-center p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Status</span>
              <StatusBadge status={event.status} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Retries</span>
              <span className="text-sm font-bold text-text-main">{event.retryCount}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Created</span>
              <span className="text-xs text-text-muted">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
            {event.poisoned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle size={10} /> Poisoned
              </span>
            )}
          </div>

          {/* Payload Viewer */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                Event Payload
              </label>
              <button
                onClick={handleCopyPayload}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted hover:text-text-main px-2 py-1 rounded-lg hover:bg-white/[0.05] cursor-pointer border-none bg-transparent transition-all"
              >
                {copied ? (
                  <><Check size={11} className="text-emerald-400" /> Copied</>
                ) : (
                  <><Copy size={11} /> Copy JSON</>
                )}
              </button>
            </div>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-text-muted overflow-x-auto max-h-64 leading-relaxed">
              {payloadStr}
            </pre>
          </div>

          {/* Delivery Timeline */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
              Delivery Timeline
            </label>
            {isLoadingTimeline ? (
              <div className="flex flex-col gap-2 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-zinc-800/60 rounded-xl" />
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-xs text-text-dim p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                No delivery attempts recorded yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {timeline.map((delivery, idx) => (
                  <div
                    key={delivery.id}
                    className="flex items-start gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl"
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full mt-1 ${
                          delivery.status === "success"
                            ? "bg-accent-success"
                            : "bg-accent-error"
                        }`}
                      />
                      {idx < timeline.length - 1 && (
                        <div className="w-px h-4 bg-zinc-800" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <StatusBadge status={delivery.status} />
                        <div className="flex items-center gap-3 text-xs text-text-dim shrink-0">
                          {delivery.responseCode && (
                            <code
                              className={`font-mono font-bold ${
                                delivery.responseCode >= 200 && delivery.responseCode < 300
                                  ? "text-accent-success"
                                  : "text-accent-error"
                              }`}
                            >
                              HTTP {delivery.responseCode}
                            </code>
                          )}
                          {delivery.latencyMs != null && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {delivery.latencyMs}ms
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-text-dim mt-1">
                        {new Date(delivery.createdAt).toLocaleString()}
                      </p>
                      {delivery.responseBody && (
                        <code className="block text-[10px] font-mono text-text-dim mt-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 truncate">
                          {delivery.responseBody}
                        </code>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Replay Action */}
          {canReplay && (
            <button
              onClick={handleReplay}
              disabled={isReplaying}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={15} className={isReplaying ? "animate-spin" : ""} />
              <span>{isReplaying ? "Replaying…" : "Replay This Event"}</span>
              {!isReplaying && <ChevronRight size={15} />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
