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
      iconBg: "bg-zinc-800/80 border-zinc-700/80",
      glow: "from-zinc-500/5 to-transparent",
      hoverBorder: "hover:border-zinc-700/80",
    },
    success: {
      iconText: "text-green-400",
      iconBg: "bg-green-500/10 border-green-500/20",
      glow: "from-green-500/5 to-transparent",
      hoverBorder: "hover:border-green-500/30",
    },
    error: {
      iconText: "text-red-400",
      iconBg: "bg-red-500/10 border-red-500/20",
      glow: "from-red-500/5 to-transparent",
      hoverBorder: "hover:border-red-500/30",
    },
    warning: {
      iconText: "text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      glow: "from-amber-500/5 to-transparent",
      hoverBorder: "hover:border-amber-500/30",
    },
  };

  const currentStyle = themeStyles[theme];

  return (
    <div className={`p-6 flex flex-col gap-3.5 relative overflow-hidden bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 z-10 ${currentStyle.hoverBorder}`}>
      {/* Glow background accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${currentStyle.glow} rounded-bl-full pointer-events-none z-0`} />
      
      <div className="flex justify-between items-center z-10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{title}</span>
        {icon && (
          <span className={`flex items-center justify-center w-9 h-9 rounded-xl border shadow-inner ${currentStyle.iconBg} ${currentStyle.iconText}`}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" }) : icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between mt-auto z-10">
        <span className="text-3xl font-extrabold tracking-tight text-zinc-50 font-display">{value}</span>
        {trend && <span className="text-[10px] font-bold text-green-400 bg-green-500/5 px-2 py-0.5 rounded-full border border-green-500/10">{trend}</span>}
      </div>
    </div>
  );
}
