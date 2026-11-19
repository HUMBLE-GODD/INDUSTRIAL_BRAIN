"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  SlidersHorizontal,
  ChevronRight,
  Activity,
  Cpu,
  Server,
  GitBranch,
  Gauge,
  FileText,
  FileCheck,
  ShieldAlert,
  PlusCircle,
  Clock,
  Sparkles,
  Plus,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/ui/Sparkline";
import { DonutChart } from "@/components/ui/DonutChart";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { mockDashboardData } from "@/data/mockData";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("Last 24 Hours");
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);

  const equipmentIcons = {
    "P-101": <Activity className="w-4 h-4 text-cyan-400" />,
    "M-204": <Cpu className="w-4 h-4 text-cyan-400" />,
    "C-01": <Server className="w-4 h-4 text-amber-400" />,
    "V-033": <GitBranch className="w-4 h-4 text-cyan-400" />,
    "T-501": <Gauge className="w-4 h-4 text-cyan-400" />,
  };

  const activityIcons = {
    work_order: <FileText className="w-3.5 h-3.5 text-blue-400" />,
    report: <FileCheck className="w-3.5 h-3.5 text-emerald-400" />,
    compliance: <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />,
    equipment: <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />,
    maintenance: <Clock className="w-3.5 h-3.5 text-amber-400" />,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Greeting & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Good morning, Admin! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here&apos;s what&apos;s happening in your operations today.
          </p>
        </div>

        {/* Top-right Filters */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Date Picker Pill */}
          <div className="flex items-center gap-2 bg-[#0f172a] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-300 hover:border-slate-600 transition-colors shadow-sm">
            <span className="font-medium">21 May 2025</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Time Filter Dropdown */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-[#0f172a] border border-slate-700/80 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-300 font-medium hover:border-slate-600 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Year to Date</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Action Button */}
          <button
            className="p-2 bg-[#0f172a] border border-slate-700/80 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors shadow-sm"
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 KPI Top Stat Cards with SVG Watermarks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {mockDashboardData.stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            color={stat.color}
            iconName={stat.icon as "activity" | "bell" | "alertTriangle" | "shield"}
            sparklineData={stat.sparkline}
          />
        ))}
      </div>

      {/* Middle Grid: Equipment Health Overview & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Health Overview Card */}
        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-100">
              Equipment Health Overview
            </CardTitle>
            <Link
              href="/maintenance"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all
            </Link>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {mockDashboardData.equipmentHealth.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center justify-between gap-4 p-2 rounded-xl hover:bg-slate-800/40 transition-colors"
              >
                {/* Equipment Icon & Name */}
                <div className="flex items-center gap-3 w-44 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      eq.color === "amber"
                        ? "bg-amber-950/40 border border-amber-500/30 text-amber-400"
                        : "bg-cyan-950/40 border border-cyan-500/30 text-cyan-400"
                    }`}
                  >
                    {equipmentIcons[eq.id as keyof typeof equipmentIcons] || (
                      <Activity className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {eq.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {eq.metric}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 max-w-xs">
                  <ProgressBar
                    value={eq.health}
                    color={eq.color === "amber" ? "amber" : "cyan"}
                    size="md"
                  />
                </div>

                {/* Percentage */}
                <div className="text-xs font-bold text-slate-200 w-10 text-right shrink-0">
                  {eq.health}%
                </div>

                {/* Mini Sparkline */}
                <div className="w-16 hidden sm:block shrink-0">
                  <Sparkline
                    data={eq.sparkline}
                    color={eq.color === "amber" ? "amber" : "cyan"}
                    height={22}
                    showFill={false}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts Card */}
        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-100">
              Recent Alerts
            </CardTitle>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all
            </Link>
          </CardHeader>

          <CardContent className="space-y-2.5 pt-2">
            {mockDashboardData.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={alert.severity} size="sm" dot className="shrink-0 w-24 justify-start">
                    {alert.severity}
                  </Badge>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {alert.title}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {alert.time}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom 3-Column Grid: Recent Activity, Maintenance Overview, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Recent Activity Timeline Card */}
        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-100">
              Recent Activity
            </CardTitle>
            <Link
              href="/documents"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all
            </Link>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {mockDashboardData.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="relative flex items-center justify-between gap-3 text-xs"
                >
                  {/* Connected Bullet Node */}
                  <span
                    className="absolute -left-6 top-1.5 w-2 h-2 rounded-full ring-4 ring-[#0b1220]"
                    style={{ backgroundColor: activity.color }}
                  />

                  {/* Activity Detail */}
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="shrink-0">
                      {activityIcons[activity.type]}
                    </span>
                    <span className="text-slate-300 font-medium truncate">
                      {activity.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Col 2: Maintenance Overview Donut Card */}
        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100">
              Maintenance Overview
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-2">
            <DonutChart
              total={mockDashboardData.maintenanceOverview.total}
              totalLabel="Total"
              segments={mockDashboardData.maintenanceOverview.segments}
            />
          </CardContent>
        </Card>

        {/* Col 3: Quick Actions Card */}
        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100">
              Quick Actions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2.5 pt-2">
            {/* Action 1: Create Work Order */}
            <button
              onClick={() => setIsWorkOrderOpen(true)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#11192e] hover:bg-[#18233f] border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-white transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Create Work Order</span>
            </button>

            {/* Action 2: Add Equipment */}
            <button
              onClick={() => setIsAddEquipmentOpen(true)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#11192e] hover:bg-[#18233f] border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Add Equipment</span>
            </button>

            {/* Action 3: View Reports */}
            <Link
              href="/documents"
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#11192e] hover:bg-[#18233f] border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">View Reports</span>
            </Link>

            {/* Action 4: Upload Document */}
            <button
              onClick={() => setIsUploadDocOpen(true)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#11192e] hover:bg-[#18233f] border border-slate-800 hover:border-blue-500/40 text-slate-200 hover:text-white transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Upload Document</span>
            </button>

            {/* Action 5: AI Query Assistant */}
            <Link
              href="/ai-query"
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#11192e] hover:bg-[#18233f] border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-white transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">AI Query Assistant</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Modals for Quick Actions */}
      {/* 1. Create Work Order Modal */}
      <Modal
        isOpen={isWorkOrderOpen}
        onClose={() => setIsWorkOrderOpen(false)}
        title="Create Work Order"
        description="Dispatch automated maintenance or inspection assignment."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsWorkOrderOpen(false)}>
              Cancel
            </Button>
            <Button variant="purple" size="sm" onClick={() => setIsWorkOrderOpen(false)}>
              Confirm & Dispatch
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Equipment</label>
            <select className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
              <option>Pump P-101 (Critical - Booster Line)</option>
              <option>Motor M-204 (Warning - Temp Elevated)</option>
              <option>Compressor C-01 (Warning - Vibration Monitor)</option>
              <option>Turbine T-501 (Healthy)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Task Title</label>
            <input type="text" placeholder="e.g., Dynamic Vibration Analysis & Bearing Swap" className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
          </div>
        </div>
      </Modal>

      {/* 2. Add Equipment Modal */}
      <Modal
        isOpen={isAddEquipmentOpen}
        onClose={() => setIsAddEquipmentOpen(false)}
        title="Register New Industrial Asset"
        description="Connect IoT telemetry sensors, baseline metrics, and maintenance manuals."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddEquipmentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddEquipmentOpen(false)}>
              Register Asset
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Asset Tag ID</label>
            <input type="text" placeholder="e.g., P-102 or VAL-045" className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Equipment Type / Category</label>
            <select className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
              <option>Centrifugal Booster Pump</option>
              <option>Induction Electric Motor</option>
              <option>Rotary Screw Compressor</option>
              <option>Steam / Gas Turbine</option>
              <option>Electro-Pneumatic Control Valve</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* 3. Upload Document Modal */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Technical Document"
        description="Index engineering manuals and inspection reports into the Knowledge Graph."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsUploadDocOpen(false)}>
              Upload & Ingest
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold">Drop PDF manuals, CSV logs, or SOP checklists</p>
            <p className="text-slate-500 text-[10px] mt-1">Up to 50MB per file</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
