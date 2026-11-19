"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  HelpCircle,
  Sun,
  ChevronDown,
  Plus,
  LayoutDashboard,
  Sparkles,
  Network,
  FileText,
  Wrench,
  Activity,
  ShieldCheck,
  BarChart3,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { BrainLogo } from "./BrainLogo";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai-query", label: "AI Query", icon: Sparkles },
  { href: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/rca", label: "RCA", icon: Activity },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 w-full bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 gap-4">
        {/* Left: Hamburger Menu Button & Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all active:scale-95"
            aria-label="Toggle Navigation Menu"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* Custom Cyber Brain Logo */}
            <BrainLogo size={38} />

            <div>
              <div className="font-extrabold text-sm md:text-base tracking-wider text-white flex items-center gap-1.5 font-sans group-hover:text-cyan-300 transition-colors">
                INDUSTRIAL BRAIN
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight">
                Intelligent Operations Platform
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment, work orders, documents, alerts..."
              className="w-full bg-[#0f172a] text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-14 py-2.5 border border-slate-700/60 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all shadow-inner"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 select-none">
              ⌘ K
            </div>
          </div>
        </div>

        {/* Right: Actions, Alerts, Theme, User */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Alerts Pill with Badge */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline font-medium">Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-tight shadow-[0_0_8px_rgba(244,63,94,0.5)]">
              12
            </span>
          </Link>

          {/* Help Button */}
          <button
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Help & Documentation"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Help</span>
          </button>

          {/* Theme Sun Toggle */}
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors" title="Toggle Theme">
            <Sun className="w-4 h-4" />
          </button>

          {/* Language Selector: EN */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white rounded-md hover:bg-slate-800/60 transition-colors font-medium"
            >
              <span>EN</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {isLanguageOpen && (
              <div className="absolute right-0 mt-1 w-24 bg-[#0f172a] border border-slate-700 rounded-lg shadow-xl p-1 text-xs text-slate-300 z-50 animate-in fade-in">
                <div className="px-2 py-1 hover:bg-slate-800 rounded cursor-pointer text-cyan-400 font-semibold">English</div>
                <div className="px-2 py-1 hover:bg-slate-800 rounded cursor-pointer">Español</div>
                <div className="px-2 py-1 hover:bg-slate-800 rounded cursor-pointer">Deutsch</div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shrink-0 shadow-md">
              <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center text-xs font-bold text-cyan-300">
                AU
              </div>
            </div>
            <div className="hidden xl:block text-left leading-tight">
              <div className="text-xs font-semibold text-slate-200">Admin User</div>
              <div className="text-[10px] text-slate-400">Operations Team</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Module Tabs Bar & Action Button */}
      <div className="px-4 lg:px-6 flex items-center justify-between border-t border-slate-800/50 bg-[#070b16]/90 overflow-x-auto no-scrollbar">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 py-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap",
                  isActive
                    ? "text-cyan-400 bg-cyan-950/20 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-cyan-400" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>

                {/* Active Indicator Underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button: "+ New Work Order ⌵" Split Button */}
        <div className="py-1.5 pl-4 shrink-0 hidden sm:block">
          <div className="inline-flex rounded-lg shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs">
            <button
              onClick={() => setIsWorkOrderModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-white/10 rounded-l-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Work Order</span>
            </button>
            <button
              onClick={() => setIsWorkOrderModalOpen(true)}
              className="px-2 py-2 border-l border-white/20 hover:bg-white/10 rounded-r-lg transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Work Order Modal */}
      <Modal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        title="Create New Work Order"
        description="Dispatch automated maintenance or inspection assignment."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsWorkOrderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="purple"
              size="sm"
              onClick={() => setIsWorkOrderModalOpen(false)}
            >
              Create Work Order
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Target Equipment
            </label>
            <select className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500">
              <option>Pump P-101 (Critical - Booster Line)</option>
              <option>Motor M-204 (Warning - Temp Elevated)</option>
              <option>Compressor C-01 (Warning - Vibration Monitor)</option>
              <option>Turbine T-501 (Healthy)</option>
              <option>Valve V-033 (Healthy)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Work Order Title
            </label>
            <input
              type="text"
              placeholder="e.g., Immediate Seal Flush and Vibration Calibration"
              className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Priority
              </label>
              <select className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500">
                <option>Critical (Immediate)</option>
                <option>High (24h)</option>
                <option>Medium (This Week)</option>
                <option>Low (Scheduled)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Assigned Team
              </label>
              <select className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500">
                <option>Field Team A (Mechanical)</option>
                <option>Electrical Crew 2</option>
                <option>Instrumentation Specialists</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </header>
  );
}
