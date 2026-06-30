import React, { useState } from "react";
import { Trash2, RefreshCw, Key, ShieldAlert } from "lucide-react";
import type { Webhook } from "../types";

interface WebhookTableProps {
  webhooks: Webhook[];
  onDelete: (id: string) => Promise<unknown>;
  onRotateSecret: (id: string) => Promise<{ secret: string }>;
  onRowClick?: (id: string) => void;
  onSecretRevealed?: (secret: string) => void;
}

export default function WebhookTable({
  webhooks,
  onDelete,
  onRotateSecret,
  onRowClick,
  onSecretRevealed,
}: WebhookTableProps) {
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRotate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to rotate the signing secret for this endpoint?")) {
      return;
    }
    try {
      setRotatingId(id);
      const result = await onRotateSecret(id);
      if (result?.secret && onSecretRevealed) {
        onSecretRevealed(result.secret);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRotatingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this webhook endpoint?")) {
      return;
    }
    try {
      setDeletingId(id);
      await onDelete(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto mb-6 glass-panel">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border-color">
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Name</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Target URL</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Rate Limit</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Secrets Info</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Status</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted">Created</th>
            <th className="px-6 py-4 font-display font-semibold uppercase text-xs tracking-wider text-text-muted text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-text-muted text-base">
                No webhook endpoints registered. Register one to start routing events.
              </td>
            </tr>
          ) : (
            webhooks.map((webhook) => (
              <tr
                key={webhook.id}
                onClick={() => onRowClick?.(webhook.id)}
                className="border-b border-border-color hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer"
              >
                <td className="px-6 py-4.5 font-medium align-middle">
                  <div className="text-sm font-semibold text-text-main">{webhook.name}</div>
                  <div className="text-xs text-text-dim mt-1">ID: {webhook.id}</div>
                </td>
                <td className="px-6 py-4.5 align-middle">
                  <div className="font-mono text-xs text-accent-info max-width-[300px] truncate" title={webhook.url}>
                    {webhook.url}
                  </div>
                </td>
                <td className="px-6 py-4.5 align-middle">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent-warning-glow text-accent-warning border border-accent-warning/20">
                    {webhook.requestsPerMinute} RPM
                  </span>
                </td>
                <td className="px-6 py-4.5 align-middle">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Key size={12} className="text-accent-success" />
                      <span className="text-[10px] text-text-dim w-11">Current:</span>
                      <code className="font-mono bg-white/[0.05] border border-border-color px-2 py-0.5 rounded text-[11px] text-text-muted" title={webhook.currentSecret}>
                        {webhook.currentSecret.slice(0, 8)}...
                      </code>
                    </div>
                    {webhook.previousSecret && (
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-accent-warning" />
                        <span className="text-[10px] text-text-dim w-11">Prev:</span>
                        <code className="font-mono bg-white/[0.05] border border-border-color px-2 py-0.5 rounded text-[11px] text-text-muted" title={webhook.previousSecret}>
                          {webhook.previousSecret.slice(0, 8)}...
                        </code>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4.5 align-middle">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                      webhook.active
                        ? "bg-accent-success-glow text-accent-success border-accent-success/20"
                        : "bg-accent-error-glow text-accent-error border-accent-error/20"
                    }`}
                  >
                    {webhook.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4.5 align-middle">
                  <span className="text-xs text-text-muted">
                    {new Date(webhook.createdAt).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4.5 align-middle text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => handleRotate(webhook.id, e)}
                      disabled={rotatingId === webhook.id}
                      className="border border-border-color p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-card-hover hover:border-border-color-glow transition-all duration-200 cursor-pointer disabled:opacity-50"
                      title="Rotate signing secret"
                    >
                      <RefreshCw
                        size={16}
                        className={rotatingId === webhook.id ? "animate-spin" : ""}
                      />
                    </button>
                    <button
                      onClick={(e) => handleDelete(webhook.id, e)}
                      disabled={deletingId === webhook.id}
                      className="border border-border-color p-2 rounded-lg text-text-muted hover:text-accent-error hover:bg-accent-error-glow hover:border-accent-error/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
                      title="Delete webhook endpoint"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
