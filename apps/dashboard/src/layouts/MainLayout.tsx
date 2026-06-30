import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Webhook,
  Send,
  Activity,
  AlertOctagon,
  BarChart3,
  Terminal,
  LogOut,
  ShieldCheck,
  Settings,
  ClipboardList,
  Menu,
  X,
  Users,
} from "lucide-react";
import { useWorkspace } from "../hooks/useWorkspace";
import { useAuthMe } from "../hooks/useAuthMe";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Webhooks", path: "/webhooks", icon: Webhook },
  { name: "Events", path: "/events", icon: Send },
  { name: "Deliveries", path: "/deliveries", icon: Activity },
  { name: "Dead Letters", path: "/dead", icon: AlertOctagon },
  { name: "Metrics", path: "/metrics", icon: BarChart3 },
  { name: "Audit Log", path: "/audit", icon: ClipboardList },
  { name: "Settings", path: "/settings", icon: Settings },
];

function SidebarContent({
  sidebarItems,
  location,
  initials,
  nameDisplay,
  roleDisplay,
  onClose,
}: {
  sidebarItems: SidebarItem[];
  location: ReturnType<typeof useLocation>;
  initials: string;
  nameDisplay: string;
  roleDisplay: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full p-6">
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-3 pb-6 border-b border-zinc-800/60 mb-6">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span className="text-lg font-bold tracking-tight text-zinc-50 font-display">
            WebHook Hub
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-50 cursor-pointer border-none bg-transparent transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-zinc-50 bg-zinc-800/80 border border-zinc-700/60 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/30"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform duration-150 group-hover:scale-110 ${
                  isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800/60 mt-auto">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 bg-zinc-800/80 rounded-full flex items-center justify-center font-bold text-xs text-zinc-200 border border-zinc-700/60 shrink-0">
            {initials}
          </div>
          <div className="flex flex-col flex-grow min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{nameDisplay}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{roleDisplay}</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("whpk_api_key");
            localStorage.removeItem("whpk_user_role");
            localStorage.removeItem("whpk_user_email");
            localStorage.removeItem("whpk_project_id");
            localStorage.removeItem("whpk_org_id");
            localStorage.removeItem("whpk_member_role");
            window.location.reload();
          }}
          className="w-full text-left text-xs font-medium text-zinc-400 hover:text-red-400 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-all border-none bg-transparent cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Disconnect Portal</span>
        </button>
      </div>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    orgs,
    projects,
    invitations,
    acceptInvitation,
    isAcceptingInvitation,
    declineInvitation,
    isDecliningInvitation,
  } = useWorkspace();
  const { user, switchProject, activeRole } = useAuthMe();

  const emailVal = user?.email || localStorage.getItem("whpk_user_email") || "developer@domain.com";
  const isAdmin = localStorage.getItem("whpk_user_role") === "super_admin";

  const sidebarItems = [...SIDEBAR_ITEMS];
  if (isAdmin) {
    sidebarItems.push({ name: "Admin Panel", path: "/admin", icon: ShieldCheck });
  }

  const namePart = emailVal.split("@")[0];
  const initials = namePart.substring(0, 2).toUpperCase() || "US";
  const roleDisplay = isAdmin ? "Super Admin" : activeRole.charAt(0).toUpperCase() + activeRole.slice(1);
  const nameDisplay = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const currentPage =
    sidebarItems.find((item) =>
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path)
    )?.name || "Dashboard";

  const activeProjName = user?.activeProject?.name || "Select Project";
  const activeOrgName = orgs.find((o) => o.id === user?.activeOrgId)?.name || "Default Org";

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      {/* Desktop Sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-[260px] bg-zinc-900/55 backdrop-blur-md border-r border-zinc-800/60 flex-col fixed top-0 bottom-0 left-0 z-50">
        <SidebarContent
          sidebarItems={sidebarItems}
          location={location}
          initials={initials}
          nameDisplay={nameDisplay}
          roleDisplay={roleDisplay}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-zinc-900 border-r border-zinc-800/60 flex flex-col lg:hidden shadow-2xl">
            <SidebarContent
              sidebarItems={sidebarItems}
              location={location}
              initials={initials}
              nameDisplay={nameDisplay}
              roleDisplay={roleDisplay}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-grow lg:ml-[260px] flex flex-col min-h-screen">
        {/* Sticky Header */}
        <header className="h-[65px] border-b border-zinc-800/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 bg-zinc-950/40 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-50 cursor-pointer border-none bg-transparent transition-all"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-base font-bold text-zinc-50 font-display">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-2 relative">
            {/* Project Switcher Dropdown */}
            {projects.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700/80 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer transition-all hover:bg-zinc-850/40"
                >
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">{activeOrgName}</span>
                  <span className="w-[1px] h-3 bg-zinc-800"></span>
                  <span>{activeProjName}</span>
                  <svg
                    className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/40 mb-1">
                        Switch Project Workspace
                      </div>
                      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                        {projects.map((proj) => {
                          const projOrg = orgs.find((o) => o.id === proj.organizationId);
                          const isActive = proj.id === user?.activeProjectId;
                          return (
                            <button
                              key={proj.id}
                              onClick={() => {
                                switchProject(proj.id, proj.organizationId);
                                setDropdownOpen(false);
                              }}
                              className={`flex flex-col items-start gap-0.5 w-full text-left px-3 py-2 rounded-lg text-xs transition-all border-none bg-transparent cursor-pointer ${
                                isActive
                                  ? "bg-indigo-600/15 border border-indigo-500/20 text-zinc-50 font-bold"
                                  : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/40"
                              }`}
                            >
                              <span className="font-semibold">{proj.name}</span>
                              <span className="text-[10px] text-zinc-500">{projOrg?.name || "Organization"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <section className="p-4 sm:p-8 flex-grow">
          {/* Global Invitations Banner */}
          {invitations.length > 0 && (
            <div className="flex flex-col gap-3 mb-6 p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl animate-in fade-in slide-in-from-top-3 duration-250">
              <div className="flex items-center gap-2 text-indigo-400">
                <Users size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Pending Workspace Invitations ({invitations.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-zinc-200">
                        You have been invited to join <strong className="text-zinc-50">{inv.orgName}</strong> as a{" "}
                        <strong className="text-indigo-400 capitalize">{inv.role === "user" ? "Developer" : inv.role}</strong>.
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">ID: {inv.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await acceptInvitation(inv.id);
                            alert(`Successfully joined ${inv.orgName}!`);
                          } catch (err) {
                            console.error(err);
                            alert("Failed to accept invitation.");
                          }
                        }}
                        disabled={isAcceptingInvitation}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Decline invitation to join ${inv.orgName}?`)) {
                            try {
                              await declineInvitation(inv.id);
                            } catch (err) {
                              console.error(err);
                              alert("Failed to decline invitation.");
                            }
                          }
                        }}
                        disabled={isDecliningInvitation}
                        className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-3.5 py-1.5 border border-zinc-800 rounded-lg font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {children}
        </section>
      </main>
    </div>
  );
}
