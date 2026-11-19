"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    // If on mobile (less than 1024px), toggle mobile drawer
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      // On desktop, toggle collapse/expand
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Fixed Header with always-visible Hamburger menu */}
      <Header onToggleSidebar={handleToggleSidebar} />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 w-full relative">
        {/* Left Sidebar (supports mobile drawer & desktop collapse) */}
        <Sidebar
          isOpen={mobileDrawerOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setMobileDrawerOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        {/* Dynamic Center/Right Page Content */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
