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
  Users,
  UserPlus,
  PlusCircle,
} from "lucide-react";
import { useApiKeys } from "../hooks/useApiKeys";
import { useWorkspace } from "../hooks/useWorkspace";
import { useAuthMe } from "../hooks/useAuthMe";
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
  onCreate: (payload: { name: string }) => Promise<{ id: string; name: string; key: string }>;
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
      const result = await onCreate({ name: name.trim() });
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
  const { isAdmin } = useAuthMe();
  const {
    orgs,
    isLoadingOrgs,
    projects,
    isLoadingProjects,
    createOrg,
    isCreatingOrg,
    createProject,
    isCreatingProject,
    addMember,
    isAddingMember,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<"credentials" | "workspace">("credentials");
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states for Organization
  const [orgName, setOrgName] = useState("");
  
  // Form states for Project
  const [projName, setProjName] = useState("");
  const [selectedOrgIdForProj, setSelectedOrgIdForProj] = useState("");

  // Form states for Member
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("user");
  const [selectedOrgIdForMember, setSelectedOrgIdForMember] = useState("");

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

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    try {
      await createOrg({ name: orgName.trim() });
      setOrgName("");
      alert("Organization created successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to create organization.");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !selectedOrgIdForProj) return;
    try {
      await createProject({
        name: projName.trim(),
        organizationId: selectedOrgIdForProj,
      });
      setProjName("");
      alert("Project created successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to create project.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim() || !selectedOrgIdForMember) return;
    try {
      await addMember({
        organizationId: selectedOrgIdForMember,
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail("");
      alert("Member added to organization successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to add member.");
    }
  };

  // Set default dropdown options once orgs load
  if (orgs.length > 0) {
    if (!selectedOrgIdForProj) setSelectedOrgIdForProj(orgs[0].id);
    if (!selectedOrgIdForMember) setSelectedOrgIdForMember(orgs[0].id);
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-zinc-800 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50 font-sans flex items-center gap-2.5">
          <Settings size={22} className="text-indigo-400" />
          Settings & Workspace
        </h2>
        <p className="text-xs text-zinc-400">
          Manage your credentials, API keys, organizations, projects, and team members.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-4 border-b border-border-color pb-3 select-none">
        <button
          onClick={() => setActiveTab("credentials")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm cursor-pointer transition-all duration-200 border-b-2 ${
            activeTab === "credentials"
              ? "text-text-main border-indigo-500 font-bold"
              : "text-text-muted border-transparent hover:text-text-main"
          }`}
        >
          <Key size={16} className={activeTab === "credentials" ? "text-indigo-400" : "text-text-muted"} />
          <span>Credentials & Keys</span>
        </button>
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm cursor-pointer transition-all duration-200 border-b-2 ${
            activeTab === "workspace"
              ? "text-text-main border-indigo-500 font-bold"
              : "text-text-muted border-transparent hover:text-text-main"
          }`}
        >
          <Building2 size={16} className={activeTab === "workspace" ? "text-indigo-400" : "text-text-muted"} />
          <span>Workspace & Team</span>
        </button>
      </div>

      {activeTab === "credentials" ? (
        <>
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
                Project & Organization IDs are populated automatically when you authenticate.
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
              {isAdmin ? (
                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98]"
                >
                  <Plus size={14} />
                  Generate New Key
                </button>
              ) : (
                <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider">
                  Admin Action Locked
                </span>
              )}
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
                          {isAdmin ? (
                            <button
                              onClick={() => handleDelete(key.id)}
                              disabled={deletingId === key.id || isDeleting}
                              className="border border-border-color p-2 rounded-lg text-text-muted hover:text-accent-error hover:bg-accent-error-glow hover:border-accent-error/30 transition-all cursor-pointer disabled:opacity-40"
                              title="Revoke API key"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Read-Only</span>
                          )}
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
        </>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Organizations Directory & Creation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 p-6 glass-panel">
              <h3 className="font-display font-bold text-text-main flex items-center gap-2 text-sm">
                <Building2 size={15} className="text-indigo-400" />
                Organizations Directory
              </h3>
              {isLoadingOrgs ? (
                <TableSkeleton cols={1} rows={3} />
              ) : orgs.length === 0 ? (
                <p className="text-xs text-text-dim">No organizations configured. Create one below.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {orgs.map((o) => (
                    <div key={o.id} className="flex justify-between items-center text-xs p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="font-semibold text-text-main">{o.name}</span>
                      <code className="text-text-dim text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{o.id}</code>
                    </div>
                  ))}
                </div>
              )}
              {isAdmin ? (
                <form onSubmit={handleCreateOrg} className="flex flex-col gap-2 border-t border-zinc-800 pt-3 mt-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Create Organization</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Organization Name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="flex-grow bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-zinc-700"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isCreatingOrg}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <PlusCircle size={14} />
                      <span>{isCreatingOrg ? "Creating..." : "Create"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-[11px] text-text-dim border-t border-zinc-850/60 pt-3 mt-1 text-center font-medium bg-zinc-900/10 py-2.5 rounded-lg border border-dashed border-zinc-800">
                  🔒 Ask an Admin to manage Organizations.
                </div>
              )}
            </div>

            {/* Projects Directory & Creation */}
            <div className="flex flex-col gap-4 p-6 glass-panel">
              <h3 className="font-display font-bold text-text-main flex items-center gap-2 text-sm">
                <FolderOpen size={15} className="text-indigo-400" />
                Workspace Projects
              </h3>
              {isLoadingProjects ? (
                <TableSkeleton cols={1} rows={3} />
              ) : projects.length === 0 ? (
                <p className="text-xs text-text-dim">No workspace projects found. Create one below.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {projects.map((p) => {
                    const org = orgs.find((o) => o.id === p.organizationId);
                    return (
                      <div key={p.id} className="flex justify-between items-center text-xs p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-main">{p.name}</span>
                          <span className="text-[9px] text-text-dim mt-0.5">Org: {org ? org.name : p.organizationId}</span>
                        </div>
                        <code className="text-text-dim text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{p.id}</code>
                      </div>
                    );
                  })}
                </div>
              )}
              {isAdmin ? (
                <form onSubmit={handleCreateProject} className="flex flex-col gap-2 border-t border-zinc-800 pt-3 mt-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Create New Project</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedOrgIdForProj}
                      onChange={(e) => setSelectedOrgIdForProj(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 px-2 py-2 rounded-xl text-zinc-50 text-xs focus:outline-none"
                      required
                    >
                      <option value="" disabled>Select Org</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-zinc-700"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingProject || orgs.length === 0}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 mt-1 transition-all disabled:opacity-50"
                  >
                    <PlusCircle size={14} />
                    <span>{isCreatingProject ? "Creating Project..." : "Create Project"}</span>
                  </button>
                </form>
              ) : (
                <div className="text-[11px] text-text-dim border-t border-zinc-850/60 pt-3 mt-1 text-center font-medium bg-zinc-900/10 py-2.5 rounded-lg border border-dashed border-zinc-800">
                  🔒 Ask an Admin to manage Projects.
                </div>
              )}
            </div>
          </div>

          {/* Org Members Management */}
          <div className="flex flex-col gap-4 p-6 glass-panel">
            <h3 className="font-display font-bold text-text-main flex items-center gap-2 text-sm">
              <Users size={15} className="text-indigo-400" />
              Invite Team Members
            </h3>
            <p className="text-xs text-text-dim -mt-1 leading-normal">
              Grant other developers access to read or administer webhooks and API metrics within your organization.
            </p>
            {isAdmin ? (
              <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-t border-zinc-800 pt-4 mt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Target Organization</label>
                  <select
                    value={selectedOrgIdForMember}
                    onChange={(e) => setSelectedOrgIdForMember(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Org</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Developer Email</label>
                  <input
                    type="email"
                    placeholder="collaborator@company.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-zinc-700"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Role</label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 px-2 py-2.5 rounded-xl text-zinc-50 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="user">Developer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingMember || orgs.length === 0}
                    className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <UserPlus size={14} />
                    <span>{isAddingMember ? "Adding..." : "Add"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-xs text-text-dim border-t border-zinc-850/60 pt-4 mt-1 text-center font-semibold bg-zinc-900/10 py-3.5 rounded-xl border border-dashed border-zinc-800">
                🔒 You must be an organization administrator to invite team members.
              </div>
            )}
          </div>

        </div>
      )}

      {showNewKeyModal && (
        <NewKeyModal
          onClose={() => setShowNewKeyModal(false)}
          onCreate={createApiKey}
        />
      )}
    </div>
  );
}
