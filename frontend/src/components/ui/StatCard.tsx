import React from "react";
import { Activity, Bell, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "alert" | "neutral";
  color?: "cyan" | "purple" | "rose" | "amber";
  iconName?: "activity" | "bell" | "alertTriangle" | "shield";
  sparklineData?: number[];
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  color = "cyan",
  iconName = "activity",
  sparklineData = [70, 75, 78, 76, 82, 85, 90],
  className,
}: StatCardProps) {
  const iconConfig = {
    activity: <Activity className="w-5 h-5" />,
    bell: <Bell className="w-5 h-5" />,
    alertTriangle: <AlertTriangle className="w-5 h-5" />,
    shield: <ShieldCheck className="w-5 h-5" />,
  };

  const styleConfig = {
    cyan: {
      cardBg: "bg-[#0c1626]/90 border-cyan-500/20 hover:border-cyan-500/40",
      iconBg: "bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]",
      changeText: "text-emerald-400",
      glow: "hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]",
      watermarkColor: "text-cyan-500/10",
    },
    purple: {
      cardBg: "bg-[#16122c]/90 border-purple-500/20 hover:border-purple-500/40",
      iconBg: "bg-purple-950/60 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]",
      changeText: "text-purple-400",
      glow: "hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.25)]",
      watermarkColor: "text-purple-500/10",
    },
    rose: {
      cardBg: "bg-[#22101b]/90 border-rose-500/20 hover:border-rose-500/40",
      iconBg: "bg-rose-950/60 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
      changeText: "text-slate-400",
      glow: "hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.25)]",
      watermarkColor: "text-rose-500/10",
    },
    amber: {
      cardBg: "bg-[#1d150b]/90 border-amber-500/20 hover:border-amber-500/40",
      iconBg: "bg-amber-950/60 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
      changeText: "text-amber-400",
      glow: "hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]",
      watermarkColor: "text-amber-500/10",
    },
  };

  const theme = styleConfig[color];

  // SVG Watermarks for industrial aesthetic
  const renderWatermark = () => {
    switch (color) {
      case "cyan": // Machinery / Pump
        return (
          <svg className={cn("w-28 h-28 absolute -right-2 top-2 pointer-events-none transition-transform group-hover:scale-105", theme.watermarkColor)} viewBox="0 0 100 100" fill="currentColor">
            <circle cx="45" cy="55" r="28" fill="none" stroke="currentColor" strokeWidth="6" />
            <circle cx="45" cy="55" r="14" fill="none" stroke="currentColor" strokeWidth="4" />
            <rect x="58" y="20" width="30" height="24" rx="4" fill="currentColor" />
            <path d="M45 12 V27 M45 83 V98 M17 55 H2 M88 55 H73" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
      case "purple": // Lightning Bolt / High Voltage
        return (
          <svg className={cn("w-28 h-28 absolute -right-1 top-1 pointer-events-none transition-transform group-hover:scale-105", theme.watermarkColor)} viewBox="0 0 100 100" fill="currentColor">
            <path d="M55 8 L22 52 H48 L42 92 L78 44 H52 Z" />
          </svg>
        );
      case "rose": // Industrial Plant Skyline
        return (
          <svg className={cn("w-32 h-28 absolute -right-2 top-4 pointer-events-none transition-transform group-hover:scale-105", theme.watermarkColor)} viewBox="0 0 120 100" fill="currentColor">
            <rect x="10" y="35" width="18" height="65" />
            <polygon points="10,35 19,15 28,35" />
            <rect x="34" y="50" width="22" height="50" />
            <rect x="62" y="20" width="14" height="80" />
            <rect x="82" y="40" width="30" height="60" />
            <circle cx="20" cy="10" r="4" opacity="0.6" />
            <circle cx="69" cy="12" r="3" opacity="0.6" />
          </svg>
        );
      case "amber": // Clipboard / Certificate
        return (
          <svg className={cn("w-28 h-28 absolute -right-2 top-2 pointer-events-none transition-transform group-hover:scale-105", theme.watermarkColor)} viewBox="0 0 100 100" fill="currentColor">
            <rect x="25" y="20" width="55" height="72" rx="6" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="40" y="12" width="25" height="14" rx="3" fill="currentColor" />
            <path d="M36 42 H68 M36 56 H68 M36 70 H54" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden group hover:-translate-y-0.5",
        theme.cardBg,
        theme.glow,
        className
      )}
    >
      {/* Background Silhouette Watermark */}
      {renderWatermark()}

      {/* Top Row: Icon Badge */}
      <div className="flex items-start justify-between relative z-10">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
            theme.iconBg
          )}
        >
          {iconConfig[iconName]}
        </div>
      </div>

      {/* Metric Info */}
      <div className="mt-3 relative z-10">
        <h4 className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </h4>
        <div className="text-3xl font-extrabold text-white tracking-tight mt-1">
          {value}
        </div>
        {change && (
          <div className={cn("text-xs font-semibold mt-1 flex items-center gap-1", theme.changeText)}>
            {change}
          </div>
        )}
      </div>

      {/* Bottom Sparkline Wave */}
      <div className="mt-4 -mx-5 -mb-5 pt-2 relative z-10">
        <Sparkline data={sparklineData} color={color} height={42} />
      </div>
    </div>
  );
}
