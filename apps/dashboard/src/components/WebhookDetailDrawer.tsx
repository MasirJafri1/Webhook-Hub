import { useState } from "react";
import {
  X,
  Webhook as WebhookIcon,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Key,
  ShieldCheck,
  Activity,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
} from "lucide-react";
import { useWebhookDetail } from "../hooks/useWebhookDetail";
import type { Webhook } from "../types";

interface WebhookDetailDrawerProps {
  webhookId: string | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<unknown>;
  onRotateSecret: (id: string) => Promise<{ secret: string }>;
  onSecretRevealed: (secret: string) => void;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">{label}</label>
      <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
        <code className="flex-grow font-mono text-xs text-text-muted truncate">{value}</code>
        <button
          onClick={copy}
          className="shrink-0 p-1 hover:bg-white/[0.06] rounded transition-all cursor-pointer border-none bg-transparent text-text-dim hover:text-text-main"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}

export default function WebhookDetailDrawer({
  webhookId,
  onClose,
  onDelete,
  onRotateSecret,
  onSecretRevealed,
}: WebhookDetailDrawerProps) {
  const { webhook, isLoadingDetail, metrics, isLoadingMetrics, signingInfo } =
    useWebhookDetail(webhookId);

  const [isRotating, setIsRotating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRotate = async () => {
    if (!webhookId) return;
    if (!window.confirm("Rotate the signing secret? Your receiver must update to the new secret.")) return;
    try {
      setIsRotating(true);
      const result = await onRotateSecret(webhookId);
      onSecretRevealed(result.secret);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRotating(false);
    }
  };

  const handleDelete = async () => {
    if (!webhookId) return;
    if (!window.confirm("Permanently delete this webhook endpoint?")) return;
    try {
      setIsDeleting(true);
      await onDelete(webhookId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const successRate =
    metrics && metrics.total > 0
      ? ((metrics.successful / metrics.total) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h3 className="font-display font-bold text-text-main flex items-center gap-2">
            <WebhookIcon size={16} className="text-indigo-400" />
            <span>Endpoint Detail</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-main transition-all cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {isLoadingDetail ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-zinc-800/60 rounded-lg" />
              ))}
            </div>
          ) : webhook ? (
            <>
              {/* Identity */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-text-main text-base">{webhook.name}</p>
                    <p className="text-xs text-text-dim mt-0.5">
                      Created {new Date(webhook.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shrink-0 ${
                      webhook.active
                        ? "bg-accent-success-glow text-accent-success border-accent-success/20"
                        : "bg-accent-error-glow text-accent-error border-accent-error/20"
                    }`}
                  >
                    {webhook.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <CopyField label="Endpoint ID" value={webhook.id} />
                <CopyField label="Target URL" value={webhook.url} />
                <div className="flex items-center justify-between text-xs px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <span className="text-text-muted font-medium">Rate Limit</span>
                  <span className="font-bold text-amber-400">{webhook.requestsPerMinute} RPM</span>
                </div>
              </div>

              {/* Signing Secret */}
              <div className="flex flex-col gap-3 p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-2 text-text-muted">
                  <Key size={14} className="text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Signing Secret</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                  <code className="flex-grow font-mono text-xs text-text-dim">
                    {webhook.currentSecret.slice(0, 12)}{"•".repeat(16)}
                  </code>
                  <button
                    onClick={handleRotate}
                    disabled={isRotating}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-text-main cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isRotating ? "animate-spin" : ""} />
                    <span>{isRotating ? "Rotating…" : "Rotate"}</span>
                  </button>
                </div>
                {signingInfo && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>Algorithm: <strong className="text-text-main">{signingInfo.algorithm}</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {signingInfo.headers.map((h) => (
                        <code key={h} className="text-[10px] px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-text-muted">{h}</code>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Per-Webhook Metrics */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-muted">
                  <Activity size={14} className="text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Endpoint Metrics</span>
                </div>
                {isLoadingMetrics ? (
                  <div className="grid grid-cols-2 gap-3 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-zinc-800/60 rounded-xl" />
                    ))}
                  </div>
                ) : metrics ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Zap size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Total</span>
                      </div>
                      <p className="text-xl font-bold text-text-main">{metrics.total}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-accent-success">
                        <CheckCircle size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Success</span>
                      </div>
                      <p className="text-xl font-bold text-accent-success">{metrics.successful}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-accent-error">
                        <XCircle size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Failed</span>
                      </div>
                      <p className="text-xl font-bold text-accent-error">{metrics.failed}</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Clock size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Avg Latency</span>
                      </div>
                      <p className="text-xl font-bold text-text-main">
                        {metrics.avg_latency != null ? `${Math.round(metrics.avg_latency)}ms` : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-dim">No metrics yet.</p>
                )}
                {metrics && metrics.total > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Success Rate</span>
                      <span className="font-bold text-accent-success">{successRate}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-success rounded-full transition-all duration-500"
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="border border-accent-error/20 bg-accent-error-glow rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs font-bold text-accent-error uppercase tracking-wider">Danger Zone</p>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 text-sm font-semibold text-accent-error border border-accent-error/30 hover:bg-accent-error/10 px-4 py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>{isDeleting ? "Deleting…" : "Delete Endpoint"}</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-text-muted text-sm">Webhook not found.</p>
          )}
        </div>
      </aside>
    </>
  );
}
