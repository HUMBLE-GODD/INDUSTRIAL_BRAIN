"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Building,
  RefreshCw,
  ShieldCheck,
  Wrench,
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
import { ApiEmpty, ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import { PageHeader } from "@/components/ui/PageHeader";
import { equipmentApi, maintenanceApi, complianceApi, graphApi } from "@/lib/api/services";
import { ApiError, AUTH_STATE_CHANGED_EVENT, getAccessToken } from "@/lib/api/client";
import type { ComplianceData, EquipmentPage, MaintenanceData, SupplierRisksResponse } from "@/lib/api/types";

type DashboardApiErrors = {
  equipment: unknown | null;
  maintenance: unknown | null;
  compliance: unknown | null;
  supplierRisks: unknown | null;
};

function statusVariant(status: string): "Healthy" | "Warning" | "Critical" | "Info" {
  const normalized = status.toLowerCase();
  if (["critical", "high", "failed", "offline", "non_compliant"].includes(normalized)) return "Critical";
  if (["warning", "maintenance", "degraded", "pending_audit", "medium"].includes(normalized)) return "Warning";
  if (["operational", "healthy", "active", "compliant", "low"].includes(normalized)) return "Healthy";
  return "Info";
}

function numberOrUnavailable(value: number | undefined, isLoading: boolean): string {
  if (value !== undefined) return value.toLocaleString();
  return isLoading ? "Loading…" : "Unavailable";
}

function ApiDashboardPage() {
  const [equipment, setEquipment] = useState<EquipmentPage | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [supplierRisks, setSupplierRisks] = useState<SupplierRisksResponse | null>(null);
  const [errors, setErrors] = useState<DashboardApiErrors>({ equipment: null, maintenance: null, compliance: null, supplierRisks: null });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    if (!getAccessToken()) {
      const authError = new ApiError("Sign in to load live data.", 401, { code: "authentication_required" });
      setEquipment(null);
      setMaintenance(null);
      setCompliance(null);
      setSupplierRisks(null);
      setErrors({ equipment: authError, maintenance: authError, compliance: authError, supplierRisks: authError });
      setIsLoading(false);
      return;
    }

    const nextErrors: DashboardApiErrors = { equipment: null, maintenance: null, compliance: null, supplierRisks: null };
    const [equipmentResult, maintenanceResult, complianceResult, supplierRiskResult] = await Promise.allSettled([
      equipmentApi.list({ page: 1, page_size: 100 }),
      maintenanceApi.predictions(),
      complianceApi.gaps(),
      graphApi.supplierRisks(),
    ]);

    if (equipmentResult.status === "fulfilled") setEquipment(equipmentResult.value);
    else nextErrors.equipment = equipmentResult.reason;
    if (maintenanceResult.status === "fulfilled") setMaintenance(maintenanceResult.value);
    else nextErrors.maintenance = maintenanceResult.reason;
    if (complianceResult.status === "fulfilled") setCompliance(complianceResult.value);
    else nextErrors.compliance = complianceResult.reason;
    if (supplierRiskResult.status === "fulfilled") setSupplierRisks(supplierRiskResult.value);
    else nextErrors.supplierRisks = supplierRiskResult.reason;

    setErrors(nextErrors);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthChange = () => { void load(); };
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
    void Promise.resolve().then(load);
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
  }, [load]);

  const failedSources = Object.values(errors).filter((error) => error !== null).length;
  const hasErrors = failedSources > 0;
  const signInRequired = Object.values(errors).some((error) => error instanceof ApiError && error.status === 401);
  const highRiskPredictions = maintenance?.predictions.filter((prediction) => ["high", "critical"].includes(prediction.risk_level.toLowerCase())).length;
  const exposedEquipmentCount = supplierRisks
    ? new Set(supplierRisks.supplier_risks.flatMap((risk) => risk.affected_equipment_ids)).size
    : undefined;
  const failureLinkCount = supplierRisks
    ? supplierRisks.supplier_risks.reduce((sum, risk) => sum + risk.failure_link_count, 0)
    : undefined;
  const visibleEquipment = equipment?.items.slice(0, 8) ?? [];
  const visiblePredictions = maintenance?.predictions.slice(0, 6) ?? [];
  const visibleGaps = compliance?.gaps.slice(0, 6) ?? [];
  const visibleSupplierRisks = supplierRisks?.supplier_risks.slice(0, 6) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Operations Dashboard"
        description="Shared API view of equipment inventory, rule-based maintenance and compliance checks, and graph-linked supplier exposure."
        badge={<Badge variant={isLoading ? "Info" : hasErrors ? "Warning" : "Healthy"} dot>{isLoading ? "Loading API data" : signInRequired ? "Sign in required" : hasErrors ? `API errors · ${failedSources}/4` : "Shared API data"}</Badge>}
        actions={<Button variant="secondary" size="sm" onClick={() => void load()} disabled={isLoading} icon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>}
      />

      {isLoading && <ApiLoading label="Loading equipment, maintenance, compliance, and supplier-risk data…" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-[#0b1220]/90 border-slate-800/90"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Building className="h-4 w-4 text-cyan-400" />Equipment assets</div><div className="mt-2 text-2xl font-bold text-white">{numberOrUnavailable(equipment?.total, isLoading)}</div><div className="mt-1 text-[11px] text-slate-500">Count from the equipment registry API</div></CardContent></Card>
        <Card className="bg-[#0b1220]/90 border-slate-800/90"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Wrench className="h-4 w-4 text-amber-400" />Elevated maintenance risk</div><div className="mt-2 text-2xl font-bold text-white">{numberOrUnavailable(highRiskPredictions, isLoading)}</div><div className="mt-1 text-[11px] text-amber-300/80">High/critical heuristic predictions, not work orders</div></CardContent></Card>
        <Card className="bg-[#0b1220]/90 border-slate-800/90"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4 text-purple-400" />Compliance findings</div><div className="mt-2 text-2xl font-bold text-white">{numberOrUnavailable(compliance?.gaps.length, isLoading)}</div><div className="mt-1 text-[11px] text-slate-500">Findings returned by rule-based checks</div></CardContent></Card>
        <Card className="bg-[#0b1220]/90 border-slate-800/90"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><GitBranch className="h-4 w-4 text-rose-400" />Graph-linked failure paths</div><div className="mt-2 text-2xl font-bold text-white">{numberOrUnavailable(failureLinkCount, isLoading)}</div><div className="mt-1 text-[11px] text-slate-500">Across {numberOrUnavailable(supplierRisks?.count, isLoading)} supplier records · {numberOrUnavailable(exposedEquipmentCount, isLoading)} linked assets</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader>
            <div><CardTitle className="text-sm">Equipment Inventory</CardTitle><div className="mt-1 text-[11px] text-slate-500">Registry records; health percentages and telemetry are not provided by this endpoint.</div></div>
            <Link href="/equipment" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Open registry</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {errors.equipment !== null && <ApiUnavailable error={errors.equipment} onRetry={() => void load()} />}
            {!equipment && !errors.equipment && isLoading && <ApiLoading label="Loading equipment records…" />}
            {!equipment && !errors.equipment && !isLoading && <ApiEmpty label="No equipment data is available." />}
            {equipment && visibleEquipment.length === 0 && <ApiEmpty label="The equipment registry returned no records." />}
            {equipment && visibleEquipment.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0f172a] px-3 py-2.5">
                <div className="min-w-0"><div className="truncate text-xs font-semibold text-white">{item.name}</div><div className="mt-1 text-[10px] text-slate-500">{item.id} · {item.type} · {item.location}</div></div>
                <div className="flex items-center gap-2"><Badge variant={statusVariant(item.status)} size="sm">{item.status.replaceAll("_", " ")}</Badge><Badge variant={statusVariant(item.criticality)} size="sm">{item.criticality} criticality</Badge></div>
              </div>
            ))}
            {equipment && equipment.items.length > visibleEquipment.length && <div className="pt-1 text-[10px] text-slate-500">Showing {visibleEquipment.length} of {equipment.total.toLocaleString()} registered assets.</div>}
          </CardContent>
        </Card>

        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader>
            <div><CardTitle className="text-sm">Maintenance Predictions</CardTitle><div className="mt-1 text-[11px] text-amber-300/80">Heuristic rule output · not confirmed work orders or trained ML predictions</div></div>
            <Link href="/maintenance" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Open maintenance</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.maintenance !== null && <ApiUnavailable error={errors.maintenance} onRetry={() => void load()} />}
            {!maintenance && !errors.maintenance && isLoading && <ApiLoading label="Loading heuristic maintenance predictions…" />}
            {!maintenance && !errors.maintenance && !isLoading && <ApiEmpty label="No maintenance predictions are available." />}
            {maintenance && <div className="rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2 text-[10px] text-slate-400">Method: <span className="text-slate-200">{maintenance.method}</span> · Generated: <time dateTime={maintenance.generated_at}>{maintenance.generated_at}</time>{maintenance.note ? ` · ${maintenance.note}` : ""}</div>}
            {maintenance && visiblePredictions.length === 0 && <ApiEmpty label="The API returned no maintenance predictions." />}
            {maintenance && visiblePredictions.map((prediction) => (
              <div key={prediction.equipment_id} className="rounded-lg border border-slate-800 bg-[#0f172a] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-semibold text-white">{prediction.equipment_name} <span className="font-normal text-slate-500">· {prediction.equipment_id}</span></div><Badge variant={statusVariant(prediction.risk_level)} size="sm">{prediction.risk_level} risk</Badge></div>
                <div className="mt-2 text-xs text-slate-300">{prediction.recommended_action}</div>
                <div className="mt-2 text-[10px] text-slate-500">Rule: {prediction.rule_applied} · Next window: {prediction.next_maintenance_window || "Not provided"}</div>
              </div>
            ))}
            {maintenance && maintenance.predictions.length > visiblePredictions.length && <div className="text-[10px] text-slate-500">Showing {visiblePredictions.length} of {maintenance.predictions.length} predictions.</div>}
          </CardContent>
        </Card>

        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader>
            <div><CardTitle className="text-sm">Compliance Assessment</CardTitle><div className="mt-1 text-[11px] text-slate-500">Rule-based findings from the shared compliance API</div></div>
            <Link href="/compliance" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Open compliance</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.compliance !== null && <ApiUnavailable error={errors.compliance} onRetry={() => void load()} />}
            {!compliance && !errors.compliance && isLoading && <ApiLoading label="Loading compliance findings…" />}
            {!compliance && !errors.compliance && !isLoading && <ApiEmpty label="No compliance assessment is available." />}
            {compliance && <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[{ label: "Checked", value: compliance.summary.total_checked }, { label: "Compliant", value: compliance.summary.compliant_count }, { label: "Non-compliant", value: compliance.summary.non_compliant_count }, { label: "Pending audit", value: compliance.summary.pending_audit_count }].map((item) => <div key={item.label} className="rounded-lg border border-slate-800 bg-[#0f172a] p-2"><div className="text-lg font-bold text-white">{item.value}</div><div className="text-[10px] text-slate-500">{item.label}</div></div>)}
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#0f172a] px-3 py-2 text-[10px] text-slate-400">Method: <span className="text-slate-200">{compliance.method}</span> · Generated: <time dateTime={compliance.generated_at}>{compliance.generated_at}</time>{compliance.note ? ` · ${compliance.note}` : ""}</div>
              {visibleGaps.length === 0 ? <ApiEmpty label="No compliance gaps were returned." /> : visibleGaps.map((gap, index) => <div key={`${gap.equipment_id}-${gap.regulation}-${index}`} className="rounded-lg border border-slate-800 bg-[#0f172a] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-semibold text-white">{gap.equipment_name}<span className="font-normal text-slate-500"> · {gap.regulation}</span></div><Badge variant={statusVariant(gap.risk_level)} size="sm">{gap.risk_level} risk</Badge></div><div className="mt-1 text-xs text-slate-300">{gap.gap_description || gap.recommended_action}</div><div className="mt-2 text-[10px] text-slate-500">Status: {gap.status.replaceAll("_", " ")} · Due: {gap.due_date || "Not provided"} · Rule: {gap.rule_applied}</div></div>)}
              {compliance.gaps.length > visibleGaps.length && <div className="text-[10px] text-slate-500">Showing {visibleGaps.length} of {compliance.gaps.length} findings.</div>}
            </>}
          </CardContent>
        </Card>

        <Card className="bg-[#0b1220]/90 border-slate-800/90 shadow-xl">
          <CardHeader>
            <div><CardTitle className="text-sm">Supplier Exposure</CardTitle><div className="mt-1 text-[11px] text-slate-500">Graph-derived supplier, component, equipment, and failure-mode relationships</div></div>
            <Link href="/knowledge-graph" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">Open graph</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.supplierRisks !== null && <ApiUnavailable error={errors.supplierRisks} onRetry={() => void load()} />}
            {!supplierRisks && !errors.supplierRisks && isLoading && <ApiLoading label="Loading graph supplier-risk summary…" />}
            {!supplierRisks && !errors.supplierRisks && !isLoading && <ApiEmpty label="No supplier-risk summary is available." />}
            {supplierRisks && <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/15 px-3 py-2 text-[10px] text-slate-400">{supplierRisks.count} supplier records · {exposedEquipmentCount} distinct linked assets · {failureLinkCount} failure links. Relationships summarize graph evidence and are not a standalone reliability forecast.</div>}
            {supplierRisks && visibleSupplierRisks.length === 0 && <ApiEmpty label="The graph returned no supplier-risk relationships." />}
            {supplierRisks && visibleSupplierRisks.map((risk) => (
              <div key={risk.supplier_id} className="rounded-lg border border-slate-800 bg-[#0f172a] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-semibold text-white"><Building className="mr-1.5 inline h-3.5 w-3.5 text-amber-400" />{risk.supplier_name}<span className="ml-2 font-normal text-slate-500">{risk.supplier_country || "Country not provided"}</span></div><Badge variant="Info" size="sm">Rating {risk.supplier_rating ?? "not provided"}</Badge></div>
                <div className="mt-2 text-[10px] text-slate-400">{risk.affected_equipment_count} affected assets · {risk.failure_link_count} failure links</div>
                <div className="mt-1 text-[11px] text-slate-300">{risk.affected_equipment_names.join(", ") || "Equipment names not provided"}</div>
                <div className="mt-1 text-[10px] text-slate-500">Failure modes: {risk.failure_mode_names.join(", ") || "Not provided"}</div>
              </div>
            ))}
            {supplierRisks && supplierRisks.supplier_risks.length > visibleSupplierRisks.length && <div className="text-[10px] text-slate-500">Showing {visibleSupplierRisks.length} of {supplierRisks.count} supplier records.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true" ? <DemoDashboardPage /> : <ApiDashboardPage />;
}

function DemoDashboardPage() {
  const [timeRange, setTimeRange] = useState("Last 24 Hours");
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const viewData = mockDashboardData;

  const equipmentIcons = {
    "EQ-001": <Activity className="w-4 h-4 text-cyan-400" />,
    "EQ-002": <Cpu className="w-4 h-4 text-cyan-400" />,
    "EQ-003": <Server className="w-4 h-4 text-amber-400" />,
    "EQ-004": <GitBranch className="w-4 h-4 text-cyan-400" />,
    "EQ-005": <Gauge className="w-4 h-4 text-cyan-400" />,
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
      {process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true" && <DemoDataNotice />}
      {/* Header Greeting & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Good morning, Admin! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Local demo snapshot for the five equipment records seeded in this workspace.
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
        {viewData.stats.map((stat, idx) => (
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
            {viewData.equipmentHealth.map((eq) => (
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
                      {eq.id} · {eq.metric}
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
            {viewData.recentAlerts.map((alert) => (
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
              {viewData.recentActivity.map((activity) => (
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
              total={viewData.maintenanceOverview.total}
              totalLabel="Total"
              segments={viewData.maintenanceOverview.segments}
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
            {/* Action 1: Open local demo work order form */}
            <button
              onClick={() => setIsWorkOrderOpen(true)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#11192e] hover:bg-[#18233f] border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-white transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Create Demo Work Order</span>
            </button>

            {/* Action 2: Add Equipment */}
            <button
              onClick={() => setIsAddEquipmentOpen(true)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#11192e] hover:bg-[#18233f] border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Add Demo Equipment</span>
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
              <span className="text-xs font-semibold">Add Demo Document</span>
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
      {/* 1. Local Demo Work Order Modal */}
      <Modal
        isOpen={isWorkOrderOpen}
        onClose={() => setIsWorkOrderOpen(false)}
        title="Create Demo Work Order"
        description="Review an illustrative local maintenance task for the seeded equipment."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsWorkOrderOpen(false)}>
              Cancel
            </Button>
            <Button variant="purple" size="sm" onClick={() => setIsWorkOrderOpen(false)}>
              Close Demo Form
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Equipment</label>
            <select className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
              <option value="EQ-001">EQ-001 · Pump P-101</option>
              <option value="EQ-002">EQ-002 · Heat Exchanger HX-202</option>
              <option value="EQ-003">EQ-003 · Compressor C-305</option>
              <option value="EQ-004">EQ-004 · Conveyor CB-410</option>
              <option value="EQ-005">EQ-005 · Boiler BLR-501</option>
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
        title="Add an Equipment Demo Record"
        description="Add a local example record to the demo equipment catalog."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddEquipmentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddEquipmentOpen(false)}>
              Add Demo Record
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Asset Tag ID</label>
            <input type="text" placeholder="e.g., EQ-006" className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Equipment Type / Category</label>
            <select className="w-full bg-[#131d33] border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
              <option>Pump</option>
              <option>Heat Exchanger</option>
              <option>Compressor</option>
              <option>Conveyor</option>
              <option>Boiler</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* 3. Upload Document Modal */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Add a Demo Document"
        description="The documents shown in this interface are local sample metadata; no file upload or indexing is connected."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsUploadDocOpen(false)}>
              Close Demo Form
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
