"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Play,
  CheckCircle2,
  GitBranch,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockRcaData } from "@/data/mockData";
import { ApiEmpty, ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import { equipmentApi, rcaApi } from "@/lib/api/services";
import type { EquipmentResponse, RcaResult } from "@/lib/api/types";

interface CausalNode {
  level: number;
  title: string;
  description: string;
}

export default function RcaPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";

  const fixtureEquipment = mockRcaData.equipmentList;
  const [liveEquipment, setLiveEquipment] = useState<EquipmentResponse[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(!demoEnabled);
  const [equipmentError, setEquipmentError] = useState<unknown>(null);
  const equipmentList = demoEnabled ? fixtureEquipment : liveEquipment;
  const [selectedEq, setSelectedEq] = useState(demoEnabled ? fixtureEquipment[0]?.id || "" : "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [apiResult, setApiResult] = useState<RcaResult | null>(null);

  const loadEquipment = useCallback(async () => {
    if (demoEnabled) return;
    setIsLoadingEquipment(true);
    setEquipmentError(null);
    try {
      const response = await equipmentApi.list({ page: 1, page_size: 100 });
      setLiveEquipment(response.items);
      setSelectedEq((current) => current && response.items.some((item) => item.id === current)
        ? current
        : response.items[0]?.id || "");
    } catch (requestError) {
      setEquipmentError(requestError);
    } finally {
      setIsLoadingEquipment(false);
    }
  }, [demoEnabled]);

  useEffect(() => {
    void Promise.resolve().then(loadEquipment);
  }, [loadEquipment]);

  const fetchRca = useCallback(async (targetEquipment: string) => {
    if (!targetEquipment) return;
    setIsAnalyzing(true);
    setError(null);
    setApiResult(null);

    if (demoEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await rcaApi.analyze(targetEquipment);
      setApiResult(res);
    } catch (err) {
      setError(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [demoEnabled]);

  // Initial fetch on mount & fetch whenever selectedEq changes
  useEffect(() => {
    if (!demoEnabled && selectedEq) {
      void Promise.resolve().then(() => fetchRca(selectedEq));
    }
  }, [demoEnabled, selectedEq, fetchRca]);

  // Manual trigger for "Run RCA Diagnostics"
  const handleAnalyze = () => { void fetchRca(selectedEq); };
  const retry = () => {
    if (equipmentList.length === 0) void loadEquipment();
    else if (selectedEq) void fetchRca(selectedEq);
  };

  // Derive Banner data
  const incidentId = demoEnabled ? mockRcaData.sampleRca.incidentId : "Graph risk paths";
  const incidentTimestamp = demoEnabled
    ? mockRcaData.sampleRca.timestamp
    : "No dated incident timeline is part of this evidence.";
  const targetAssetName = demoEnabled
    ? fixtureEquipment.find((equipment) => equipment.id === selectedEq)?.name || selectedEq
    : apiResult?.equipment_name || liveEquipment.find((equipment) => equipment.id === selectedEq)?.name || selectedEq;
  const targetAssetSubtitle = demoEnabled
    ? "Hydraulic Booster Circuit #2"
    : `${apiResult?.equipment_id || selectedEq} · Criticality: ${apiResult?.equipment_criticality || "Not available"}`;
  const confidenceScore = demoEnabled ? mockRcaData.sampleRca.confidenceScore : "Not provided";
  const confidenceSubtitle = demoEnabled
    ? "High cross-signal correlation"
    : "This graph API returns relationships, not a model confidence score.";

  // Derive Tree / Risk Path data
  const treeSummary = demoEnabled
    ? mockRcaData.sampleRca.summary
    : apiResult?.evidence_note ||
      "Explainable risk paths from equipment to components, suppliers, and failure modes.";

  const causalNodes: CausalNode[] = demoEnabled
    ? mockRcaData.sampleRca.rootCauses
    : (apiResult?.component_risk_paths || []).map((path, idx) => {
        const failureDetails = path.risk_links.length > 0
          ? path.risk_links
              .map((link) => `${link.name}${link.severity ? ` [Severity: ${link.severity}]` : ""}${link.description ? ` - ${link.description}` : ""}`)
              .join("; ")
          : "No specific failure mode links reported";

        const supplierInfo = path.supplier
          ? ` · Supplier: ${path.supplier.name}${path.supplier.rating !== null && path.supplier.rating !== undefined ? ` (Rating: ${path.supplier.rating})` : ""}${path.supplier.country ? `, ${path.supplier.country}` : ""}`
          : "";

        return {
          level: idx + 1,
          title: `${path.component_name} (${path.component_id})`,
          description: `${failureDetails}${supplierInfo}`,
        };
      });

  // Derive Recommendations
  const recommendations: string[] = demoEnabled ? mockRcaData.sampleRca.recommendations : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="Root Cause Analysis (RCA)"
        description={demoEnabled
          ? "Explore the local sample analysis or graph links between equipment, components, suppliers, and failure modes."
          : "Explore graph-derived component, supplier, and failure-mode risk paths for the selected equipment. These links are risk evidence, not dated incident timelines or generated root-cause conclusions."}
        badge={
          <Badge variant={demoEnabled ? "Critical" : "Info"} dot>
            {demoEnabled ? "DEMO Diagnostic Engine Ready" : "Graph Risk Evidence"}
          </Badge>
        }
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
              disabled={isLoadingEquipment || equipmentList.length === 0}
              className="bg-[#11192d] border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            >
              {equipmentList.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.id} · {equipment.name}
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
            disabled={!selectedEq || isLoadingEquipment}
          >
            {demoEnabled ? "Run Demo Analysis" : "Refresh Risk Evidence"}
          </Button>
        </div>
      </Card>

      {equipmentError !== null && <ApiUnavailable error={equipmentError} onRetry={() => void loadEquipment()} />}
      {error !== null && <ApiUnavailable error={error} onRetry={retry} />}
      {isLoadingEquipment && <ApiLoading label="Loading equipment from the platform API…" />}
      {!demoEnabled && !isLoadingEquipment && equipmentList.length === 0 && equipmentError === null && <ApiEmpty label="No equipment records are available for RCA." />}
      {isAnalyzing && <ApiLoading label={demoEnabled ? "Running the local sample analysis…" : "Loading graph-derived risk evidence…"} />}

      {/* Non-ML disclaimer for API data */}
      {!demoEnabled && !isAnalyzing && apiResult && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          This RCA is <strong>graph-derived risk evidence</strong> from the knowledge graph. The backend contract returns explainable component risk links and failure modes, not a simulated incident timeline or model-generated root cause conclusion.
        </div>
      )}

      {/* 1. Evidence Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">{demoEnabled ? "Sample Incident" : "Evidence Type"}</span>
          <div className="text-base font-bold text-white mt-1 font-mono">{incidentId}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{incidentTimestamp}</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Target Asset</span>
          <div className="text-base font-bold text-cyan-400 mt-1">{targetAssetName}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{targetAssetSubtitle}</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">{demoEnabled ? "AI Confidence Score" : "Model Confidence"}</span>
          <div className="text-base font-bold text-emerald-400 mt-1">{confidenceScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{confidenceSubtitle}</div>
        </div>
      </div>

      {/* 2. Causal Chain / Graph Risk Paths & 3. Prescriptive Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Causal Hierarchy / Risk Path Timeline */}
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              {demoEnabled ? "Causal Decomposition Tree (5-Whys)" : "Graph-Derived Component Risk Paths"}
            </CardTitle>
            {!demoEnabled && (
              <Badge variant="Info" size="sm">
                Graph Risk Paths
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              {treeSummary}
            </p>

            {!demoEnabled && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2 text-[11px] text-cyan-200">
                Note: The entries below represent <strong>graph-derived component risk paths</strong> from Knowledge Graph relationships, not confirmed 5-Whys root causes.
              </div>
            )}

            {causalNodes.length === 0 ? (
              <ApiEmpty label="No component risk paths were returned for this asset." />
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500/30">
                {causalNodes.map((cause) => (
                  <div key={cause.level} className="relative text-xs">
                    {/* Circle Badge */}
                    <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                      {demoEnabled ? `L${cause.level}` : `#${cause.level}`}
                    </span>

                    <div className="p-3 bg-[#0f172a] border border-slate-700/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-white">
                          {cause.title}
                        </div>
                        {!demoEnabled && (
                          <span className="text-[10px] text-amber-300 font-medium">
                            Risk Path #{cause.level}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] leading-relaxed">
                        {cause.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {demoEnabled ? (
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
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
            ) : (
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 font-medium text-slate-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  Prescriptive Recommendations Not Available
                </div>
                <p className="leading-relaxed text-[11px] text-slate-400">
                  The verified RCA API contract (`/api/v1/rca/{`equipment_id`}`) provides explainable component risk links and failure modes, but does not provide automated recommendations. Mitigation strategies will be populated here when supported by the backend service.
                </p>
              </div>
            )}

            {/* Auto-generate Work Order (non-functional / unavailable notice) */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold">Auto-generate Work Order</span>
                <p className="text-[11px] text-purple-400/80 mt-0.5">
                  {demoEnabled
                    ? "Demo preview only — work order generation requires a dedicated backend contract."
                    : "Not supported by the current backend contract."}
                </p>
              </div>
              <Button variant="purple" size="sm" disabled title="Not supported by the backend contract">
                Generate WO
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
