import { useEffect, useState } from "react";
import { Users, CheckCircle, ShieldCheck, Copy, Check, Info } from "lucide-react";
import { api } from "../services/api";

interface PendingUser {
  id: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: number;
}

interface ApprovalDetails {
  apiKey: string;
  projectId: string;
  organizationId: string;
  email: string;
}

export default function AdminPage() {
  const [usersList, setUsersList] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalDetails, setApprovalDetails] = useState<ApprovalDetails | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<PendingUser[]>("/admin/pending");
      setUsersList(res.data);
    } catch (err) {
      console.error("Failed to load pending users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string, email: string) => {
    try {
      setApprovingId(id);
      const res = await api.post<{
        success: boolean;
        details: { apiKey: string; projectId: string; organizationId: string };
      }>(`/admin/approve/${id}`);

      setApprovalDetails({
        email,
        apiKey: res.data.details.apiKey,
        projectId: res.data.details.projectId,
        organizationId: res.data.details.organizationId,
      });

      // Reload list
      await fetchPending();
    } catch (err) {
      console.error("Failed to approve user:", err);
      alert("Error approving user. Check console for details.");
    } finally {
      setApprovingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Card */}
      <div className="p-6 flex flex-col gap-2.5 glass-panel relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="font-display text-xl text-text-main flex items-center gap-2.5 font-semibold">
          <ShieldCheck className="text-accent-primary w-5 h-5" />
          <span>Super Admin Approval Dashboard</span>
        </h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
          Review and approve pending developer signups. Approving a user automatically provisions their default organization, database projects, members context, and generates their primary publisher API key.
        </p>
      </div>

      {/* Main Approval Table & Modal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Pending Users Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel overflow-hidden border border-border-color rounded-xl bg-white/[0.01]">
            <div className="p-5 border-b border-border-color bg-white/[0.01] flex items-center justify-between">
              <span className="font-semibold text-text-main flex items-center gap-2 text-sm">
                <Users size={16} className="text-text-muted" />
                <span>Pending Accounts ({usersList.length})</span>
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-sm text-text-muted">Loading pending registration list...</div>
            ) : usersList.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-2 text-text-muted">
                <CheckCircle size={32} className="text-emerald-400 opacity-60 mb-1" />
                <span className="text-sm font-medium text-text-main">Clean Slate!</span>
                <span className="text-xs">No pending user registrations await approval.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-color bg-white/[0.02]">
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Email</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Created At</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.id} className="border-b border-border-color/50 hover:bg-white/[0.01] transition-all">
                        <td className="p-4 text-sm font-semibold text-text-main">{user.email}</td>
                        <td className="p-4 text-xs text-text-dim">
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleApprove(user.id, user.email)}
                            disabled={approvingId !== null}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approvingId === user.id ? "Approving..." : "Approve"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Live Approval Details panel */}
        <div className="lg:col-span-1">
          {approvalDetails ? (
            <div className="glass-panel border-2 border-emerald-500/20 bg-emerald-500/[0.02] p-6 rounded-xl flex flex-col gap-5 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="font-semibold text-text-main flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="text-emerald-400" />
                <span>Workspace Provisioned!</span>
              </h4>

              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/[0.03] border border-border-color">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Target User</span>
                <span className="text-xs font-semibold text-text-main break-all">{approvalDetails.email}</span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Generated Publisher API Key</label>
                <div className="flex items-center gap-2 bg-white/[0.03] border border-border-color rounded-lg p-2.5 relative">
                  <input
                    type="text"
                    value={approvalDetails.apiKey}
                    readOnly
                    className="bg-transparent border-none text-xs text-text-main outline-none w-full select-all font-mono font-medium"
                  />
                  <button
                    onClick={() => copyToClipboard(approvalDetails.apiKey)}
                    className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all border-none bg-transparent cursor-pointer text-text-muted hover:text-text-main"
                  >
                    {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <span className="text-[9px] text-text-dim flex items-center gap-1.5 leading-normal mt-0.5">
                  <Info size={10} />
                  <span>Provide this key to the developer to authenticate their events ingestion client.</span>
                </span>
              </div>

              <div className="flex flex-col gap-3.5 border-t border-border-color pt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Project ID</span>
                  <span className="font-mono text-text-dim text-[11px] font-medium">{approvalDetails.projectId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Organization ID</span>
                  <span className="font-mono text-text-dim text-[11px] font-medium">{approvalDetails.organizationId}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 border border-border-color rounded-xl flex flex-col gap-4 text-center items-center text-text-muted">
              <Info size={24} className="text-text-dim" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-main">No Active Approvals</span>
                <span className="text-[11px]">When you click Approve on a pending user, the generated API key and workspace identifiers will appear here for copying.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
