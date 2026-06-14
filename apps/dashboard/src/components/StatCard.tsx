import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  theme?: "primary" | "success" | "error" | "warning";
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  theme = "primary",
}: StatCardProps) {
  const themeClasses = {
    primary: {
      iconBg: "bg-accent-primary-glow text-accent-primary",
      hover: "hover:border-accent-primary/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)]",
    },
    success: {
      iconBg: "bg-accent-success-glow text-accent-success",
      hover: "hover:border-accent-success/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]",
    },
    error: {
      iconBg: "bg-accent-error-glow text-accent-error",
      hover: "hover:border-accent-error/40 hover:shadow-[0_8px_30px_rgba(244,63,94,0.1)]",
    },
    warning: {
      iconBg: "bg-accent-warning-glow text-accent-warning",
      hover: "hover:border-accent-warning/40 hover:shadow-[0_8px_30px_rgba(251,191,36,0.1)]",
    },
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`p-6 flex flex-col gap-3 relative overflow-hidden glass-panel ${currentTheme.hover}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</span>
        {icon && (
          <span className={`flex items-center justify-center w-[38px] h-[38px] rounded-lg ${currentTheme.iconBg}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between mt-auto">
        <span className="font-display text-4xl font-bold text-text-main">{value}</span>
        {trend && <span className="text-xs font-semibold text-accent-success">{trend}</span>}
      </div>
    </div>
  );
}
