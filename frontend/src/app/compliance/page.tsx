"use client";

import React from "react";
import {
  ShieldCheck,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { mockComplianceData } from "@/data/mockData";

export default function CompliancePage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Regulatory Compliance & Audit Framework"
        description="Automated cross-checking against ISO 45001, OSHA 1910, and safety instrumented systems standards."
        badge={<Badge variant="Healthy" dot>91% Compliant</Badge>}
        actions={
          <Button variant="primary" size="sm" icon={<FileCheck className="w-4 h-4" />}>
            Run Audit Scan
          </Button>
        }
      />

      {/* Top Banner KPI / Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-400 uppercase">
              Overall Compliance
            </span>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">91%</div>
          <div className="text-[11px] text-amber-300 mt-1">
            ▲ 1.8% from last month
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            Active Frameworks
          </span>
          <div className="text-3xl font-extrabold text-white mt-2">4</div>
          <div className="text-[11px] text-slate-400 mt-1">ISO & OSHA standards</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            Identified Gaps
          </span>
          <div className="text-3xl font-extrabold text-rose-400 mt-2">3</div>
          <div className="text-[11px] text-rose-300 mt-1">1 High severity</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            Next Plant Audit
          </span>
          <div className="text-xl font-bold text-cyan-400 mt-2">12 Jun 2025</div>
          <div className="text-[11px] text-slate-400 mt-1">In 14 days</div>
        </div>
      </div>

      {/* Standard / Regulation Framework Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {mockComplianceData.regulations.map((reg, idx) => (
          <Card key={idx} className="bg-[#0b1220]/90 border-slate-800 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {reg.code}
              </span>
              <Badge variant={reg.status === "Compliant" ? "Healthy" : "Warning"} size="sm">
                {reg.status}
              </Badge>
            </div>

            <div>
              <div className="text-xs font-semibold text-white leading-tight">
                {reg.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Last audit: {reg.lastAudit}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-400">Score</span>
                <span className="text-slate-200">{reg.score}%</span>
              </div>
              <ProgressBar
                value={reg.score}
                color={reg.score >= 90 ? "emerald" : "amber"}
                size="sm"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Compliance Gaps and Corrective Actions */}
      <Card className="bg-[#0b1220]/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Compliance Gaps & Corrective Action Registry
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0f172a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-5">Gap ID</th>
                  <th className="py-3 px-5">Standard</th>
                  <th className="py-3 px-5">Finding Description</th>
                  <th className="py-3 px-5">Severity</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Owner</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mockComplianceData.gaps.map((gap) => (
                  <tr
                    key={gap.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-cyan-400">
                      {gap.id}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-white">
                      {gap.standard}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 max-w-sm">
                      {gap.description}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          gap.severity === "High"
                            ? "Critical"
                            : gap.severity === "Medium"
                            ? "Warning"
                            : "Info"
                        }
                        size="sm"
                      >
                        {gap.severity}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                      {gap.dueDate}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">{gap.owner}</td>
                    <td className="py-3.5 px-5 text-right">
                      <Button variant="secondary" size="sm">
                        Remediate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
