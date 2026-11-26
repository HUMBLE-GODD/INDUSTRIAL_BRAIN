"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ApiEmpty, ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import { complianceApi } from "@/lib/api/services";
import type { ComplianceData, ComplianceGap } from "@/lib/api/types";
import { mockComplianceData } from "@/data/mockData";

type ViewRegulation = {
  code: string;
  name: string;
  status: string;
  score: string;
  lastAudit: string;
};

type ViewGap = {
  id: string;
  standard: string;
  description: string;
  severity: string;
  dueDate: string;
  owner: string;
};

type ComplianceView = {
  overallScore: string;
  activeFrameworks: string;
  identifiedGaps: string;
  highSeverity: string;
  nextPlantAudit: string;
  regulations: ViewRegulation[];
  gaps: ViewGap[];
};

function statusVariant(status: string): "Healthy" | "Critical" | "Warning" | "Info" {
  const normalized = status.toLowerCase();
  if (normalized === "compliant") return "Healthy";
  if (normalized === "non_compliant") return "Critical";
  if (normalized === "pending_audit") return "Warning";
  return "Info";
}

function riskVariant(level: string): "Critical" | "Warning" | "Info" {
  const normalized = level.toLowerCase();
  if (normalized === "critical" || normalized === "high") return "Critical";
  if (normalized === "medium") return "Warning";
  return "Info";
}

function fromApi(data: ComplianceData): ComplianceView {
  const highSeverity = data.gaps.filter((gap) => ["high", "critical"].includes(gap.risk_level.toLowerCase())).length;
  const regulations = data.gaps.map((gap) => ({
    code: gap.regulation,
    name: gap.equipment_name,
    status: gap.status,
    score: "Not available",
    lastAudit: "Not available",
  }));
  const gaps = data.gaps.map((gap: ComplianceGap, index) => ({
    id: `${gap.equipment_id}-${index + 1}`,
    standard: gap.regulation,
    description: gap.gap_description || "Not available",
    severity: gap.risk_level,
    dueDate: gap.due_date || "Not available",
    owner: "Not available",
  }));
  const totalChecked = data.summary.total_checked;
  const overallScore = totalChecked > 0
    ? `${Math.round((data.summary.compliant_count / totalChecked) * 100)}%`
    : "Not available";
  return {
    overallScore,
    activeFrameworks: "Not available",
    identifiedGaps: String(data.gaps.length),
    highSeverity: String(highSeverity),
    nextPlantAudit: "Not available",
    regulations,
    gaps,
  };
}

function fromDemo(): ComplianceView {
  return {
    overallScore: `${mockComplianceData.overallScore}%`,
    activeFrameworks: String(mockComplianceData.regulations.length),
    identifiedGaps: String(mockComplianceData.gaps.length),
    highSeverity: String(mockComplianceData.gaps.filter((gap) => gap.severity === "High").length),
    nextPlantAudit: "12 Jun 2025",
    regulations: mockComplianceData.regulations.map((reg) => ({ code: reg.code, name: reg.name, status: reg.status, score: `${reg.score}%`, lastAudit: reg.lastAudit })),
    gaps: mockComplianceData.gaps.map((gap) => ({ id: gap.id, standard: gap.standard, description: gap.description, severity: gap.severity, dueDate: gap.dueDate, owner: gap.owner })),
  };
}

export default function CompliancePage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
  const [data, setData] = useState<ComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(!demoEnabled);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (demoEnabled) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try { setData(await complianceApi.gaps()); }
    catch (requestError) { setError(requestError); }
    finally { setIsLoading(false); }
  }, [demoEnabled]);

  useEffect(() => { void load(); }, [load]);

  const view = useMemo(() => demoEnabled ? fromDemo() : data ? fromApi(data) : null, [data, demoEnabled]);
  const complianceBadge = view ? `${view.overallScore} Compliant` : "Compliance API";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="Regulatory Compliance & Audit Framework"
        description="Automated cross-checking against ISO 45001, OSHA 1910, and safety instrumented systems standards."
        badge={<Badge variant={demoEnabled ? "Pending" : "Info"} dot>{demoEnabled ? `DEMO ${complianceBadge}` : complianceBadge}</Badge>}
        actions={<Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()} disabled={demoEnabled}>Refresh Assessments</Button>}
      />

      {error !== null && <ApiUnavailable error={error} onRetry={() => void load()} />}
      {isLoading && <ApiLoading label="Loading compliance assessments…" />}
      {!isLoading && !view && error === null && <ApiEmpty label="No compliance data is available." />}

      {view && <>
        {/* Top Banner KPI / Overall Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-amber-400 uppercase">Overall Compliance</span><ShieldCheck className="w-5 h-5 text-amber-400" /></div>
            <div className="text-3xl font-extrabold text-white mt-2">{view.overallScore}</div>
            <div className="text-[11px] text-amber-300 mt-1">{demoEnabled ? "Demo preview" : "Based on API summary"}</div>
          </div>
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"><span className="text-[11px] font-semibold text-slate-400 uppercase">Active Frameworks</span><div className="text-3xl font-extrabold text-white mt-2">{view.activeFrameworks}</div><div className="text-[11px] text-slate-400 mt-1">{demoEnabled ? "ISO & OSHA standards" : "Not available from API"}</div></div>
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"><span className="text-[11px] font-semibold text-slate-400 uppercase">Identified Gaps</span><div className="text-3xl font-extrabold text-rose-400 mt-2">{view.identifiedGaps}</div><div className="text-[11px] text-rose-300 mt-1">{view.highSeverity} high/critical</div></div>
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"><span className="text-[11px] font-semibold text-slate-400 uppercase">Next Plant Audit</span><div className="text-xl font-bold text-cyan-400 mt-2">{view.nextPlantAudit}</div><div className="text-[11px] text-slate-400 mt-1">Not available from API</div></div>
        </div>

        {/* Standard / Regulation Framework Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {view.regulations.length === 0 ? <ApiEmpty label="No regulation findings were returned." /> : view.regulations.map((reg) => (
            <Card key={`${reg.code}-${reg.name}`} className="bg-[#0b1220]/90 border-slate-800 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2"><span className="text-xs font-bold text-cyan-400 font-mono">{reg.code}</span><Badge variant={statusVariant(reg.status)} size="sm">{reg.status.replaceAll("_", " ")}</Badge></div>
              <div><div className="text-xs font-semibold text-white leading-tight">{reg.name}</div><div className="text-[10px] text-slate-500 mt-1">Last audit: {reg.lastAudit}</div></div>
              <div className="space-y-1"><div className="flex justify-between text-[11px] font-semibold"><span className="text-slate-400">Score</span><span className="text-slate-200">{reg.score}</span></div><ProgressBar value={reg.score.endsWith("%") ? Number.parseInt(reg.score, 10) : 0} color="amber" size="sm" /></div>
            </Card>
          ))}
        </div>

        {/* Compliance Gaps and Corrective Actions */}
        <Card className="bg-[#0b1220]/90 border-slate-800"><CardHeader><CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-400" />Compliance Gaps & Corrective Action Registry</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-[#0f172a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800"><tr><th className="py-3 px-5">Gap ID</th><th className="py-3 px-5">Standard</th><th className="py-3 px-5">Finding Description</th><th className="py-3 px-5">Severity</th><th className="py-3 px-5">Due Date</th><th className="py-3 px-5">Owner</th><th className="py-3 px-5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-800/60">{view.gaps.length === 0 ? <tr><td colSpan={7} className="p-6"><ApiEmpty label="No compliance gaps were returned." /></td></tr> : view.gaps.map((gap) => <tr key={gap.id} className="hover:bg-slate-800/30 transition-colors"><td className="py-3.5 px-5 font-mono font-bold text-cyan-400">{gap.id}</td><td className="py-3.5 px-5 font-medium text-white">{gap.standard}</td><td className="py-3.5 px-5 text-slate-300 max-w-sm">{gap.description}</td><td className="py-3.5 px-5"><Badge variant={riskVariant(gap.severity)} size="sm">{gap.severity}</Badge></td><td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">{gap.dueDate}</td><td className="py-3.5 px-5 text-slate-300">{gap.owner}</td><td className="py-3.5 px-5 text-right text-slate-500">Not available</td></tr>)}</tbody></table></div></CardContent></Card>
      </>}
    </div>
  );
}
