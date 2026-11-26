"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkline } from "@/components/ui/Sparkline";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { mockAnalyticsData } from "@/data/mockData";
import { ApiPending, DemoDataNotice } from "@/components/ui/ApiState";

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("Last 6 Months");

  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== "true") {
    return <div className="space-y-6 animate-in fade-in duration-300"><PageHeader title="Industrial Telemetry & Operational Analytics" description="Predictive failure trend models, MTBF/MTTR diagnostics, and energy efficiency telemetry." badge={<Badge variant="Pending" dot>Backend Pending</Badge>} /><ApiPending feature="Telemetry analytics and failure trend data" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <DemoDataNotice />
      <PageHeader
        title="Seed Equipment Demo Analytics"
        description="Illustrative metrics for the five seeded equipment records. No live telemetry is connected."
        badge={<Badge variant="Info" dot>Local Demo Values</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none bg-[#0f172a] border border-slate-700/80 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-300 font-medium hover:border-slate-600 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
                <option>Year to Date</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* 4 Core Industrial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {mockAnalyticsData.kpis.map((kpi, idx) => (
          <Card key={idx} className="bg-[#0b1220]/90 border-slate-800 p-5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {kpi.label}
            </span>
            <div className="text-3xl font-extrabold text-white">{kpi.value}</div>
            <div
              className={`text-xs font-semibold flex items-center gap-1 ${
                kpi.delta.startsWith("+") ? "text-emerald-400" : "text-cyan-400"
              }`}
            >
              {kpi.delta.startsWith("+") ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {kpi.delta} vs baseline
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Trend Breakdown Chart */}
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Subsystem Incident Trends (Monthly)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            <div className="space-y-4">
              {mockAnalyticsData.failureTrends.map((ft, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span className="font-mono text-cyan-400">{ft.month} 2025</span>
                    <span className="text-slate-400">
                      Total: {ft.mechanical + ft.electrical + ft.sensor} Incidents
                    </span>
                  </div>

                  {/* Multi-tier Stacked Progress Bar */}
                  <div className="h-3 w-full bg-slate-800/80 rounded-full flex overflow-hidden p-0.5 gap-0.5">
                    <div
                      style={{ width: `${ft.mechanical * 4}%` }}
                      className="bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                      title={`Mechanical: ${ft.mechanical}`}
                    />
                    <div
                      style={{ width: `${ft.electrical * 4}%` }}
                      className="bg-amber-500 rounded-sm shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      title={`Electrical: ${ft.electrical}`}
                    />
                    <div
                      style={{ width: `${ft.sensor * 4}%` }}
                      className="bg-cyan-500 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      title={`Sensor: ${ft.sensor}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 text-xs pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-slate-300">Mechanical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-300">Electrical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                <span className="text-slate-300">Sensor Drift</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Performance Breakdown */}
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Power & Operating Efficiency Trends
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Pump P-101 (EQ-001)</span>
                  <span className="text-cyan-400 font-bold">96.2% Eff</span>
                </div>
                <ProgressBar value={96} color="cyan" size="md" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Heat Exchanger HX-202 (EQ-002)</span>
                  <span className="text-cyan-400 font-bold">91.8% Eff</span>
                </div>
                <ProgressBar value={92} color="cyan" size="md" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Compressor C-305 (EQ-003)</span>
                  <span className="text-amber-400 font-bold">81.4% Eff</span>
                </div>
                <ProgressBar value={81} color="amber" size="md" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Conveyor CB-410 (EQ-004)</span>
                  <span className="text-amber-400 font-bold">65.0% Eff</span>
                </div>
                <ProgressBar value={65} color="amber" size="md" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Boiler BLR-501 (EQ-005)</span>
                  <span className="text-cyan-400 font-bold">89.0% Eff</span>
                </div>
                <ProgressBar value={89} color="cyan" size="md" />
              </div>
            </div>

            {/* Sparkline Overlay */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Illustrative Equipment Trend</span>
                <span className="text-emerald-400 font-mono">Local Demo</span>
              </div>
              <Sparkline
                data={[60, 68, 65, 78, 72, 85, 92, 88, 95, 94]}
                color="cyan"
                height={40}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
