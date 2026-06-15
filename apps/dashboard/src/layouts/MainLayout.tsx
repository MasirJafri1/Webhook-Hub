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
  const nameDisplay = emailVal === "admin@webhook.com" ? "Super Admin" : namePart.charAt(0).toUpperCase() + namePart.slice(1);

  return (
    <div className="flex min-h-screen bg-bg-main text-text-main">
      {/* Sidebar */}
      <aside className="w-[260px] bg-bg-sidebar border-r border-border-color flex flex-col p-6 fixed top-0 bottom-0 left-0 z-50">
        <div className="flex items-center gap-3 px-3 pb-6 border-b border-border-color mb-6">
          <Terminal className="w-7 h-7 text-accent-primary" />
          <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-br from-text-main to-accent-primary bg-clip-text text-transparent">
            WebHook Hub
          </span>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
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
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-text-main bg-accent-primary-glow border border-border-color-glow shadow-[0_4px_20px_rgba(99,102,241,0.15)]"
                    : "text-text-muted hover:text-text-main hover:bg-bg-card-hover hover:translate-x-1"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-accent-primary" : "text-text-muted group-hover:text-text-main"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4 pt-4 border-t border-border-color mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-info rounded-full flex items-center justify-center font-bold text-sm text-white border-2 border-white/10">
              {initials}
            </div>
            <div className="flex flex-col flex-grow">
              <p className="text-sm font-semibold text-text-main">{nameDisplay}</p>
              <p className="text-xs text-text-dim">{roleDisplay}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("whpk_api_key");
              localStorage.removeItem("whpk_user_role");
              localStorage.removeItem("whpk_user_email");
              window.location.reload();
            }}
            className="w-full text-left text-xs font-semibold text-text-muted hover:text-red-400 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-all border-none bg-transparent cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-[260px] flex flex-col min-h-screen">
        <header className="h-[70px] border-b border-border-color px-8 flex items-center justify-between sticky top-0 bg-bg-main/60 backdrop-blur-md z-40">
          <h2 className="text-xl font-bold text-text-main">
            {sidebarItems.find((item) =>
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path)
            )?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-accent-success rounded-full shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse" />
            <span className="text-xs text-text-muted font-medium">Environment Live (Local)</span>
          </div>
        </header>

        <section className="p-8 flex-grow">{children}</section>
      </main>
    </div>
  );
}
