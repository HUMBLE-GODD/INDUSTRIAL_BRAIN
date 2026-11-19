"use client";

import React, { useState } from "react";
import {
  Play,
  CheckCircle2,
  GitBranch,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockRcaData } from "@/data/mockData";

export default function RcaPage() {
  const [selectedEq, setSelectedEq] = useState(mockRcaData.equipmentList[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const rcaResult = mockRcaData.sampleRca;

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Root Cause Analysis (RCA)"
        description="Automated causal decomposition combining sensor anomaly traces, maintenance histories, and operating standard operating procedures."
        badge={<Badge variant="Critical" dot>Diagnostic Engine Ready</Badge>}
      />

      {/* Equipment Selector & Trigger Bar */}
      <Card className="bg-[#0b1220]/90 border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400 shrink-0">
              Select Target Asset:
            </span>
            <select
              value={selectedEq}
              onChange={(e) => setSelectedEq(e.target.value)}
              className="bg-[#11192d] border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            >
              {mockRcaData.equipmentList.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<Play className="w-4 h-4 fill-current" />}
            isLoading={isAnalyzing}
            onClick={handleAnalyze}
          >
            Run RCA Diagnostics
          </Button>
        </div>
      </Card>

      {/* Incident Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Incident Identifier</span>
          <div className="text-base font-bold text-white mt-1 font-mono">{rcaResult.incidentId}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{rcaResult.timestamp}</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Target Asset</span>
          <div className="text-base font-bold text-cyan-400 mt-1">{selectedEq}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hydraulic Booster Circuit #2</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Confidence Score</span>
          <div className="text-base font-bold text-emerald-400 mt-1">{rcaResult.confidenceScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">High cross-signal correlation</div>
        </div>
      </div>

      {/* Causal Chain & 5-Whys Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Causal Hierarchy Timeline */}
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              Causal Decomposition Tree (5-Whys)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              {rcaResult.summary}
            </p>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500/30">
              {rcaResult.rootCauses.map((cause) => (
                <div key={cause.level} className="relative text-xs">
                  {/* Circle Badge */}
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                    L{cause.level}
                  </span>

                  <div className="p-3 bg-[#0f172a] border border-slate-700/60 rounded-xl">
                    <div className="font-semibold text-white">
                      {cause.title}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      {cause.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Prescriptive Action & Mitigation */}
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Prescriptive Recommendations & Mitigation
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              {rcaResult.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-[#0f172a] border border-slate-700/60 rounded-xl text-xs"
                >
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-slate-300 leading-relaxed">{rec}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
              <div>
                <span className="font-semibold">Auto-generate Work Order</span>
                <p className="text-[11px] text-purple-400/80 mt-0.5">
                  Pre-populates parts and technician instructions.
                </p>
              </div>
              <Button variant="purple" size="sm">
                Generate WO
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
