import React, { useState } from "react";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Key,
  RefreshCw,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Send,
  Search,
  ChevronDown,
} from "lucide-react";
import { useAuditLogs } from "../hooks/useAuditLogs";
import { TableSkeleton } from "../components/Loader";

type ActionFilter = "all" | string;

const ACTION_STYLES: Record<
  string,
  { cls: string; icon: React.ReactNode; label: string }
> = {
  WEBHOOK_CREATED: {
    cls: "bg-accent-success-glow text-accent-success border-accent-success/20",
    icon: <CheckCircle size={10} />,
    label: "Webhook Created",
  },
  WEBHOOK_DELETED: {
    cls: "bg-accent-error-glow text-accent-error border-accent-error/20",
    icon: <Trash2 size={10} />,
    label: "Webhook Deleted",
  },
  SECRET_ROTATED: {
    cls: "bg-accent-warning-glow text-accent-warning border-accent-warning/20",
    icon: <RefreshCw size={10} />,
    label: "Secret Rotated",
  },
  WEBHOOK_DISABLED: {
    cls: "bg-accent-error-glow text-accent-error border-accent-error/20",
    icon: <AlertTriangle size={10} className="text-accent-error" />,
    label: "Webhook Disabled by System",
  },
  EVENT_REPLAYED: {
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <Send size={10} />,
    label: "Event Replayed",
  },
  EVENT_REPLAY_WINDOW: {
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <Send size={10} />,
    label: "Replay Window",
  },
  API_KEY_CREATED: {
    cls: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: <Key size={10} />,
    label: "API Key Created",
  },
  API_KEY_REVOKED: {
    cls: "bg-accent-error-glow text-accent-error border-accent-error/20",
    icon: <XCircle size={10} />,
    label: "API Key Revoked",
  },
};

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? {
    cls: "bg-zinc-800 text-zinc-400 border-zinc-700",
    icon: <ShieldCheck size={10} />,
    label: action,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${style.cls}`}
    >
      {style.icon}
      {style.label}
    </span>
  );
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { auditLogsData, auditLogs, isLoading } = useAuditLogs(page, limit);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const isPaginated = auditLogsData && !Array.isArray(auditLogsData) && "data" in auditLogsData;

  const actionTypes = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filtered = auditLogs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const total = isPaginated && typeof auditLogsData === "object" && "total" in auditLogsData ? auditLogsData.total : auditLogs.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 font-sans flex items-center gap-2.5">
            <ClipboardList size={22} className="text-indigo-400" />
            Audit Log
          </h2>
          <p className="text-xs text-zinc-400">
            A chronological record of all actions taken within your workspace.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-[140px]">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="bg-white/[0.03] border border-border-color px-3 py-2 rounded-lg text-text-main text-xs transition-all focus:outline-none focus:border-accent-primary cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search size={14} className="absolute inset-y-0 left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by actor or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/40 border border-zinc-800/80 pl-9 pr-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="appearance-none bg-zinc-900/40 border border-zinc-800/80 px-4 py-2.5 pr-9 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer transition-all"
          >
            <option value="all">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>
                {ACTION_STYLES[a]?.label ?? a}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton cols={4} rows={8} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-text-muted">
            <AlertTriangle size={28} className="opacity-30" />
            <p className="text-sm font-semibold text-text-main">No audit logs found</p>
            <p className="text-xs">Actions you and your team take will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color bg-white/[0.01]">
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">Timestamp</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">Action</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">Actor</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hidden md:table-cell">Project ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border-color/50 hover:bg-white/[0.01] transition-all"
                  >
                    <td className="px-5 py-4 text-xs text-text-dim whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-5 py-4 text-xs text-text-muted font-medium truncate max-w-[180px]">
                      {log.actor === "system" ? (
                        <span className="bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider">
                          System
                        </span>
                      ) : (
                        log.actor || "—"
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <code className="font-mono text-[10px] text-text-dim bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                        {log.projectId}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!isLoading && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-text-dim text-right">
            Showing {filtered.length} of {total} total log entries
          </p>

          {isPaginated && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border-color/40 flex-wrap gap-3">
              <span className="text-xs text-text-muted">
                Showing page {page} of {totalPages} (Total: {total} entries)
              </span>
              <div className="flex items-center gap-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="bg-bg-card border border-border-color text-text-main px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 hover:border-accent-primary hover:bg-bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="bg-bg-card border border-border-color text-text-main px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 hover:border-accent-primary hover:bg-bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
