import React from "react";
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
} from "lucide-react";

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
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const role = localStorage.getItem("whpk_user_role");
  const emailVal = localStorage.getItem("whpk_user_email") || "developer@domain.com";
  const isAdmin = role === "super_admin";

  const sidebarItems = [...SIDEBAR_ITEMS];
  if (isAdmin) {
    sidebarItems.push({ name: "Admin Panel", path: "/admin", icon: ShieldCheck });
  }

  const namePart = emailVal.split("@")[0];
  const initials = namePart.substring(0, 2).toUpperCase() || "US";
  const roleDisplay = isAdmin ? "Super Admin" : "Developer";
  const nameDisplay = isAdmin ? "Super Admin" : namePart.charAt(0).toUpperCase() + namePart.slice(1);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      {/* Sidebar */}
      <aside className="w-[260px] bg-zinc-900/55 backdrop-blur-md border-r border-zinc-800/60 flex flex-col p-6 fixed top-0 bottom-0 left-0 z-50">
        <div className="flex items-center gap-3 px-3 pb-6 border-b border-zinc-800/60 mb-6">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span className="text-lg font-bold tracking-tight text-zinc-50 font-display">
            WebHook Hub
          </span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-grow">
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

        <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800/60 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 bg-zinc-800/80 rounded-full flex items-center justify-center font-bold text-xs text-zinc-200 border border-zinc-700/60">
              {initials}
            </div>
            <div className="flex flex-col flex-grow">
              <p className="text-xs font-semibold text-zinc-200">{nameDisplay}</p>
              <p className="text-[10px] text-zinc-500 font-medium">{roleDisplay}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("whpk_api_key");
              localStorage.removeItem("whpk_user_role");
              localStorage.removeItem("whpk_user_email");
              window.location.reload();
            }}
            className="w-full text-left text-xs font-medium text-zinc-400 hover:text-red-400 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-all border-none bg-transparent cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-[260px] flex flex-col min-h-screen">
        <header className="h-[65px] border-b border-zinc-800/60 px-8 flex items-center justify-between sticky top-0 bg-zinc-950/40 backdrop-blur-md z-40">
          <h2 className="text-base font-bold text-zinc-50 font-display">
            {sidebarItems.find((item) =>
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path)
            )?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-2">
            {/* Status indicator has been cleaned up and header spacing tightened */}
          </div>
        </header>

        <section className="p-8 flex-grow">{children}</section>
      </main>
    </div>
  );
}
