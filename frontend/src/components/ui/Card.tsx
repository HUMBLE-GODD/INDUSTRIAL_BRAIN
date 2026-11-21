import React from "react";
import { cn } from "@/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "cyan" | "purple" | "rose" | "amber";
  glow?: boolean;
}

export function Card({
  className,
  variant = "default",
  glow = false,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-[#0f172a]/90 border-[#1e293b]",
    elevated: "bg-[#131d33] border-slate-700/60 shadow-xl",
    bordered: "bg-transparent border-slate-800",
    cyan: "bg-[#0c192c]/80 border-cyan-500/20 hover:border-cyan-500/40",
    purple: "bg-[#18132d]/80 border-purple-500/20 hover:purple-500/40",
    rose: "bg-[#25121e]/80 border-rose-500/20 hover:border-rose-500/40",
    amber: "bg-[#221a11]/80 border-amber-500/20 hover:border-amber-500/40",
  };

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-md transition-all duration-200 text-slate-100",
        variantStyles[variant],
        glow && "shadow-lg shadow-cyan-500/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-4 border-b border-slate-800/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-slate-100 tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-400 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-3 border-t border-slate-800/80 bg-slate-900/30 rounded-b-xl text-xs text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
