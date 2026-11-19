"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Network,
  FileText,
  Wrench,
  Activity,
  ShieldCheck,
  BarChart3,
  ClipboardList,
  Cpu,
  Bell,
  FileSpreadsheet,
  Settings,
  X,
  LucideIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrainLogo } from "./BrainLogo";

interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

export function Sidebar({
  isOpen = false,
  isCollapsed = false,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const operationsNav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ai-query", label: "AI Query", icon: Sparkles },
    { href: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/rca", label: "RCA", icon: Activity },
    { href: "/compliance", label: "Compliance", icon: ShieldCheck },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const systemNav: NavItem[] = [
    { href: "/maintenance", label: "Work Orders", icon: ClipboardList },
    { href: "/dashboard", label: "Equipment", icon: Cpu },
    { href: "/dashboard", label: "Alerts", icon: Bell, badge: "12", badgeColor: "bg-rose-500" },
    { href: "/documents", label: "Reports", icon: FileSpreadsheet },
    { href: "/dashboard", label: "Settings", icon: Settings },
  ];

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <li key={item.label}>
            <Link
              href={item.href}
              onClick={onClose}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                isActive
                  ? "bg-[#1c2a4f] text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_-4px_rgba(6,182,212,0.35)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors shrink-0",
                    isActive
                      ? "text-cyan-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white leading-tight shadow-sm",
                    item.badgeColor || "bg-slate-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-[#080d1a] border-r border-slate-800/80 flex flex-col justify-between p-3.5 transition-all duration-300 ease-in-out lg:static",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="space-y-6 overflow-y-auto no-scrollbar">
          {/* Mobile Header with Close Button and Brain Logo */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <BrainLogo size={32} />
              <span className="font-bold text-xs text-white">INDUSTRIAL BRAIN</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Operations Nav Section */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                OPERATIONS
              </div>
            )}
            {renderNavList(operationsNav)}
          </div>

          {/* System Nav Section */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                SYSTEM
              </div>
            )}
            {renderNavList(systemNav)}
          </div>
        </div>

        {/* Bottom Area: System Status Card & Copyright Footer */}
        <div className="pt-4 mt-auto space-y-3">
          {/* System Status Widget */}
          {!isCollapsed && (
            <div className="rounded-2xl bg-[#0d1629] border border-slate-700/60 p-3.5 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  System Status
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-slate-300">
                  All systems operational
                </span>
              </div>

              {/* Glowing neon waveform line */}
              <div className="mt-3 -mx-3.5 -mb-3.5 h-7 opacity-90">
                <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
                  <path
                    d="M 0 15 L 20 15 L 30 5 L 40 18 L 50 2 L 60 16 L 70 8 L 80 15 L 100 15"
                    fill="none"
                    stroke="#00E5FF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    filter="drop-shadow(0 0 3px #06b6d4)"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Footer & Collapse Toggle */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 pt-1">
            {!isCollapsed && <span>© 2025 Industrial Brain</span>}
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors hidden lg:block"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
