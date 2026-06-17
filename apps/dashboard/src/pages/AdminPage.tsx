import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle,
  ShieldCheck,
  Copy,
  Check,
  Info,
  Trash2,
  UserCheck,
  UserX,
  Search,
} from "lucide-react";
import { api } from "../services/api";
import { TableSkeleton } from "../components/Loader";

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
  const [pendingList, setPendingList] = useState<PendingUser[]>([]);
  const [allUsersList, setAllUsersList] = useState<PendingUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "directory">("pending");
  
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [approvalDetails, setApprovalDetails] = useState<ApprovalDetails | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchPending = async () => {
    try {
      setIsLoadingPending(true);
      const res = await api.get<PendingUser[]>("/admin/pending");
      setPendingList(res.data);
    } catch (err) {
      console.error("Failed to load pending users:", err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setIsLoadingAll(true);
      const res = await api.get<PendingUser[]>("/admin/users");
      setAllUsersList(res.data);
    } catch (err) {
      console.error("Failed to load all users:", err);
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchAllUsers();
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

      // Reload lists
      await fetchPending();
      await fetchAllUsers();
    } catch (err) {
      console.error("Failed to approve user:", err);
      alert("Error approving user. Check console for details.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleToggleApproval = async (user: PendingUser) => {
    try {
      setUpdatingId(user.id);
      await api.patch(`/admin/users/${user.id}`, { approved: !user.approved });
      await fetchAllUsers();
      await fetchPending();
    } catch (err) {
      console.error("Failed to toggle approval status:", err);
      alert("Error updating user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      setUpdatingId(id);
      await api.patch(`/admin/users/${id}`, { role: newRole });
      await fetchAllUsers();
      await fetchPending();
    } catch (err) {
      console.error("Failed to update user role:", err);
      alert("Error updating user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (user: PendingUser) => {
    const isMe = localStorage.getItem("whpk_user_email") === user.email;
    if (isMe) {
      alert("You cannot delete your own super admin account.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently delete the user '${user.email}' and remove their workspace memberships? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(user.id);
      await api.delete(`/admin/users/${user.id}`);
      await fetchAllUsers();
      await fetchPending();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Error deleting user.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filter user directory list
  const filteredUsers = allUsersList.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Card */}
      <div className="p-6 flex flex-col gap-2.5 glass-panel relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="font-display text-xl text-text-main flex items-center gap-2.5 font-bold">
          <ShieldCheck className="text-indigo-400 w-5 h-5 animate-pulse" />
          <span>Super Admin Operations Panel</span>
        </h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
          Configure security credentials, manage roles, view user access directories, and approve pending developers.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-4 border-b border-border-color pb-3 select-none">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm cursor-pointer transition-all duration-200 border-b-2 ${
            activeTab === "pending"
              ? "text-text-main border-indigo-500 font-bold"
              : "text-text-muted border-transparent hover:text-text-main"
          }`}
        >
          <UserCheck size={16} className={activeTab === "pending" ? "text-indigo-400" : "text-text-muted"} />
          <span>Pending Approvals ({pendingList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm cursor-pointer transition-all duration-200 border-b-2 ${
            activeTab === "directory"
              ? "text-text-main border-indigo-500 font-bold"
              : "text-text-muted border-transparent hover:text-text-main"
          }`}
        >
          <Users size={16} className={activeTab === "directory" ? "text-indigo-400" : "text-text-muted"} />
          <span>User Access Directory ({allUsersList.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Pending approvals tab view */}
        {activeTab === "pending" && (
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-panel overflow-hidden border border-border-color rounded-2xl bg-white/[0.01]">
              <div className="p-5 border-b border-border-color bg-white/[0.01] flex items-center justify-between">
                <span className="font-bold text-text-main flex items-center gap-2 text-sm">
                  <UserCheck size={16} className="text-text-muted" />
                  <span>Pending Registrations</span>
                </span>
              </div>

              {isLoadingPending ? (
                <div className="p-5">
                  <TableSkeleton cols={3} rows={3} />
                </div>
              ) : pendingList.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-2 text-text-muted bg-white/[0.005]">
                  <CheckCircle size={32} className="text-indigo-400 opacity-60 mb-1" />
                  <span className="text-sm font-semibold text-text-main">No Pending Approvals!</span>
                  <span className="text-xs">All user registrations have been verified and processed.</span>
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
                      {pendingList.map((user) => (
                        <tr key={user.id} className="border-b border-border-color/50 hover:bg-white/[0.01] transition-all">
                          <td className="p-4 text-sm font-semibold text-text-main">{user.email}</td>
                          <td className="p-4 text-xs text-text-dim">
                            {new Date(user.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleApprove(user.id, user.email)}
                              disabled={approvingId !== null}
                              className="bg-indigo-500 hover:bg-indigo-600 hover:shadow-lg active:scale-[0.98] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}

        {/* User directory tab view */}
        {activeTab === "directory" && (
          <div className="lg:col-span-2 flex flex-col gap-4 animate-in fade-in duration-200">
            
            {/* Search filter bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search user directory by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/40 border border-zinc-800/80 pl-10 pr-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all"
              />
            </div>

            <div className="glass-panel overflow-hidden border border-border-color rounded-2xl bg-white/[0.01]">
              <div className="p-5 border-b border-border-color bg-white/[0.01] flex items-center justify-between">
                <span className="font-bold text-text-main flex items-center gap-2 text-sm">
                  <Users size={16} className="text-text-muted" />
                  <span>User Directory Database ({filteredUsers.length})</span>
                </span>
              </div>

              {isLoadingAll ? (
                <div className="p-5">
                  <TableSkeleton cols={5} rows={5} />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-text-muted">
                  No directory records found matching query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-color bg-white/[0.02]">
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Email</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Role</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Approved</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Created At</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const isMe = localStorage.getItem("whpk_user_email") === user.email;
                        
                        return (
                          <tr key={user.id} className="border-b border-border-color/50 hover:bg-white/[0.01] transition-all">
                            <td className="p-4 text-sm font-semibold text-text-main">
                              <span>{user.email}</span>
                              {isMe && <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-bold">You</span>}
                            </td>
                            <td className="p-4 align-middle">
                              <select
                                value={user.role}
                                disabled={isMe || updatingId !== null}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-1.5 rounded-lg text-text-main outline-none focus:border-indigo-400 disabled:opacity-50 font-sans cursor-pointer"
                              >
                                <option value="user">Developer</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                            </td>
                            <td className="p-4 align-middle">
                              <button
                                onClick={() => handleToggleApproval(user)}
                                disabled={isMe || updatingId !== null}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer select-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  user.approved
                                    ? "bg-accent-success-glow text-accent-success border-accent-success/20 hover:bg-accent-success/20"
                                    : "bg-accent-error-glow text-accent-error border-accent-error/20 hover:bg-accent-error/20"
                                }`}
                                title={user.approved ? "Revoke Approval Access" : "Grant Approval Access"}
                              >
                                {user.approved ? (
                                  <>
                                    <UserCheck size={10} />
                                    <span>Approved</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX size={10} />
                                    <span>Pending</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-4 text-xs text-text-dim">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={isMe || deletingId !== null}
                                className="border border-border-color p-2 rounded-lg text-text-muted hover:text-accent-error hover:bg-accent-error-glow hover:border-accent-error/30 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Delete user"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Approval Details panel */}
        <div className="lg:col-span-1">
          {approvalDetails ? (
            <div className="glass-panel border-2 border-emerald-500/20 bg-emerald-500/[0.02] p-6 rounded-xl flex flex-col gap-5 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="font-semibold text-text-main flex items-center gap-2 text-sm font-display">
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
