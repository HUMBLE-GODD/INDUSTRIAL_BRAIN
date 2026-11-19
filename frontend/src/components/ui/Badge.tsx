import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "Critical"
    | "Warning"
    | "Resolved"
    | "Healthy"
    | "Pending"
    | "Info"
    | "Scheduled"
    | "default";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    Critical: "bg-rose-950/60 text-rose-300 border-rose-800/60 shadow-[0_0_10px_-2px_rgba(244,63,94,0.25)]",
    Warning: "bg-amber-950/60 text-amber-300 border-amber-800/60 shadow-[0_0_10px_-2px_rgba(245,158,11,0.2)]",
    Resolved: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60 shadow-[0_0_10px_-2px_rgba(16,185,129,0.2)]",
    Healthy: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
    Pending: "bg-purple-950/60 text-purple-300 border-purple-800/60",
    Info: "bg-blue-950/60 text-blue-300 border-blue-800/60",
    Scheduled: "bg-cyan-950/60 text-cyan-300 border-cyan-800/60",
    default: "bg-slate-800 text-slate-300 border-slate-700",
  };

  const dotColors = {
    Critical: "bg-rose-400 animate-pulse",
    Warning: "bg-amber-400",
    Resolved: "bg-emerald-400",
    Healthy: "bg-emerald-400",
    Pending: "bg-purple-400",
    Info: "bg-blue-400",
    Scheduled: "bg-cyan-400",
    default: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 font-medium tracking-wide",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border backdrop-blur-sm select-none",
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant] || dotColors.default
          )}
        />
      )}
      {children}
    </span>
  );
}
