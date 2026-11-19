import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  color?: "cyan" | "amber" | "rose" | "emerald" | "purple";
  size?: "sm" | "md" | "lg";
  className?: string;
  glow?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color = "cyan",
  size = "md",
  className,
  glow = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const colorConfig = {
    cyan: {
      bar: "bg-gradient-to-r from-cyan-500 to-teal-400",
      glow: "shadow-[0_0_10px_rgba(6,182,212,0.6)]",
    },
    amber: {
      bar: "bg-gradient-to-r from-amber-500 to-orange-400",
      glow: "shadow-[0_0_10px_rgba(245,158,11,0.6)]",
    },
    rose: {
      bar: "bg-gradient-to-r from-rose-500 to-red-400",
      glow: "shadow-[0_0_10px_rgba(244,63,94,0.6)]",
    },
    emerald: {
      bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
      glow: "shadow-[0_0_10px_rgba(16,185,129,0.6)]",
    },
    purple: {
      bar: "bg-gradient-to-r from-purple-500 to-indigo-400",
      glow: "shadow-[0_0_10px_rgba(168,85,247,0.6)]",
    },
  };

  const currentTheme = colorConfig[color];

  return (
    <div
      className={cn(
        "w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5",
        sizeClasses[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          currentTheme.bar,
          glow && currentTheme.glow
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
