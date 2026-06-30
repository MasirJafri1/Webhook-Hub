import { useState } from "react";
import {
  Settings,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  Building2,
  FolderOpen,
  X,
} from "lucide-react";
import { useApiKeys } from "../hooks/useApiKeys";
import { TableSkeleton } from "../components/Loader";

function CopyableField({
  label,
  value,
  masked = false,
}: {
  label: string;
  value: string;
  masked?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!masked);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">{label}</label>
      <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
        <code className="flex-grow font-mono text-xs text-text-muted truncate select-all">
          {revealed ? value : value.slice(0, 8) + "•".repeat(20)}
        </code>
        <div className="flex items-center gap-1.5 shrink-0">
          {masked && (
            <button
              onClick={() => setRevealed((r) => !r)}
              className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer border-none bg-transparent text-text-dim hover:text-text-main"
            >
              {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
          <button
            onClick={copy}
            className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer border-none bg-transparent text-text-dim hover:text-emerald-400"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewKeyModalProps {
  onClose: () => void;
  onCreate: (name: string) => Promise<{ id: string; name: string; key: string }>;
}

function NewKeyModal({ onClose, onCreate }: NewKeyModalProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      setIsCreating(true);
      const result = await onCreate(name.trim());
      setCreatedKey(result.key);
    } catch (err) {
      console.error(err);
      alert("Failed to create API key.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!createdKey ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-text-main flex items-center gap-2">
            <Plus size={16} className="text-indigo-400" />
            <span>{createdKey ? "API Key Created!" : "Generate New API Key"}</span>
          </h3>
          {!createdKey && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-main transition-all cursor-pointer border-none bg-transparent">
              <X size={16} />
            </button>
          )}
        </div>

        {!createdKey ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Key Name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Production Publisher"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Generating…" : "Generate Key"}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                This key will only be shown <strong>once</strong>. Copy it now!
              </p>
              <div className="flex items-center gap-2 bg-zinc-950 border border-amber-500/30 rounded-xl px-4 py-3">
                <code className="flex-grow font-mono text-xs text-amber-300 break-all select-all">{createdKey}</code>
                <button onClick={handleCopy} className="shrink-0 p-1.5 hover:bg-white/[0.06] rounded-lg cursor-pointer border-none bg-transparent text-text-dim hover:text-emerald-400 transition-all">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
              {copied && <p className="text-[11px] text-emerald-400 flex items-center gap-1"><Check size={10} /> Copied!</p>}
            </div>
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-text-main font-semibold py-2.5 rounded-xl text-sm cursor-pointer transition-all"
            >
              I've saved it — Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { apiKeys, isLoading, createApiKey, deleteApiKey, isDeleting } = useApiKeys();
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const projectId = localStorage.getItem("whpk_project_id") ?? "—";
  const orgId = localStorage.getItem("whpk_org_id") ?? "—";
  const currentKey = localStorage.getItem("whpk_api_key") ?? "—";
  const email = localStorage.getItem("whpk_user_email") ?? "—";

  const handleDelete = async (id: string) => {
    if (!window.confirm("Revoke this API key? Any services using it will stop working immediately.")) return;
    try {
      setDeletingId(id);
      await deleteApiKey(id);
    } catch (err) {
      console.error(err);
      alert("Failed to revoke API key.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-zinc-800 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50 font-sans flex items-center gap-2.5">
          <Settings size={22} className="text-indigo-400" />
          Settings & Credentials
        </h2>
        <p className="text-xs text-zinc-400">
          Your workspace identifiers, active API keys, and signing security configuration.
        </p>
      </div>

      {/* Workspace Identifiers */}
      <div className="flex flex-col gap-4 p-6 glass-panel">
        <h3 className="font-display font-bold text-text-main flex items-center gap-2 text-sm">
          <Building2 size={15} className="text-indigo-400" />
          Workspace Identifiers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CopyableField label="Account Email" value={email} />
          <CopyableField label="Active API Key" value={currentKey} masked />
          {projectId !== "—" && <CopyableField label="Project ID" value={projectId} />}
          {orgId !== "—" && <CopyableField label="Organization ID" value={orgId} />}
        </div>
        {(projectId === "—" || orgId === "—") && (
          <p className="text-xs text-text-dim flex items-center gap-1.5">
            <FolderOpen size={12} />
            Project & Organization IDs are populated after your first login if the backend has the self-heal middleware deployed.
          </p>
        )}
      </div>

      {/* API Keys Management */}
      <div className="flex flex-col gap-4 p-6 glass-panel">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-display font-bold text-text-main flex items-center gap-2 text-sm">
            <Key size={15} className="text-indigo-400" />
            API Keys
          </h3>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98]"
          >
            <Plus size={14} />
            Generate New Key
          </button>
        </div>

        {isLoading ? (
          <TableSkeleton cols={3} rows={3} />
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center gap-2 text-text-muted">
            <Key size={24} className="opacity-40" />
            <p className="text-sm font-semibold text-text-main">No API keys found</p>
            <p className="text-xs">Generate a new key above to authenticate event publishers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color">
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Key ID</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id} className="border-b border-border-color/50 hover:bg-white/[0.01] transition-all">
                    <td className="py-3.5 px-4 text-sm font-semibold text-text-main">{key.name}</td>
                    <td className="py-3.5 px-4">
                      <code className="font-mono text-xs text-text-dim bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">{key.id}</code>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${key.active ? "bg-accent-success-glow text-accent-success border-accent-success/20" : "bg-accent-error-glow text-accent-error border-accent-error/20"}`}>
                        {key.active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(key.id)}
                        disabled={deletingId === key.id || isDeleting}
                        className="border border-border-color p-2 rounded-lg text-text-muted hover:text-accent-error hover:bg-accent-error-glow hover:border-accent-error/30 transition-all cursor-pointer disabled:opacity-40"
                        title="Revoke API key"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signing Security Info */}
      <div className="flex flex-col gap-4 p-6 glass-panel">
        <h3 className="font-display font-bold text-text-main flex items-center gap-2 text-sm">
          <ShieldCheck size={15} className="text-indigo-400" />
          Webhook Signing Security
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Algorithm</p>
            <code className="font-mono text-xs text-text-main font-semibold">HMAC-SHA256</code>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1 sm:col-span-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Signature Headers</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {["x-webhook-id", "x-webhook-timestamp", "x-webhook-signature"].map((h) => (
                <code key={h} className="text-[10px] px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-text-muted">{h}</code>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-text-dim leading-relaxed">
          Every event delivery includes these headers. Your receiver should verify the signature using the webhook's signing secret to ensure authenticity and prevent replay attacks.
        </p>
      </div>

      {showNewKeyModal && (
        <NewKeyModal
          onClose={() => setShowNewKeyModal(false)}
          onCreate={createApiKey}
        />
      )}
    </div>
  );
}
