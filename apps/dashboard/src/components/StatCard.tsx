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
  // Clean semantic border indicators (subtle top borders or icon text coloring)
  const themeStyles = {
    primary: {
      iconText: "text-zinc-200",
      iconBg: "bg-zinc-800/80 border-zinc-700",
    },
    success: {
      iconText: "text-green-400",
      iconBg: "bg-green-500/10 border-green-500/20",
    },
    error: {
      iconText: "text-red-400",
      iconBg: "bg-red-500/10 border-red-500/20",
    },
    warning: {
      iconText: "text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/20",
    },
  };

  const currentStyle = themeStyles[theme];

  return (
    <div className="p-6 flex flex-col gap-3 relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm transition-colors duration-150 hover:border-zinc-700">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{title}</span>
        {icon && (
          <span className={`flex items-center justify-center w-8.5 h-8.5 rounded-md border ${currentStyle.iconBg} ${currentStyle.iconText}`}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" }) : icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between mt-auto">
        <span className="text-3xl font-bold tracking-tight text-zinc-50">{value}</span>
        {trend && <span className="text-[10px] font-medium text-green-400">{trend}</span>}
      </div>
    </div>
  );
}
