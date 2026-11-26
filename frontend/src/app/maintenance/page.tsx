"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Wrench,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockMaintenanceData } from "@/data/mockData";
import { ApiEmpty, ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import { maintenanceApi } from "@/lib/api/services";
import type { MaintenanceData, MaintenancePrediction } from "@/lib/api/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function riskVariant(level: string): "Critical" | "Warning" | "Healthy" | "Info" {
  const n = level.toLowerCase();
  return n === "critical" || n === "high" ? "Critical" : n === "medium" ? "Warning" : n === "low" ? "Healthy" : "Info";
}

/** Bucket API predictions into Immediate / This Week / Scheduled urgency cards */
function buildUrgencyCards(predictions: MaintenancePrediction[]) {
  const immediate: string[] = [];
  const thisWeek: string[] = [];
  const scheduled: string[] = [];

  for (const p of predictions) {
    const rl = p.risk_level.toLowerCase();
    const label = `${p.equipment_name} — ${p.recommended_action.slice(0, 60)}`;
    if (rl === "critical" || rl === "high") immediate.push(label);
    else if (rl === "medium") thisWeek.push(label);
    else scheduled.push(label);
  }

  return [
    {
      category: "Immediate Action Required",
      badge: "Critical" as const,
      count: immediate.length,
      items: immediate,
      color: "rose" as const,
    },
    {
      category: "Due This Week",
      badge: "Warning" as const,
      count: thisWeek.length,
      items: thisWeek,
      color: "amber" as const,
    },
    {
      category: "Scheduled Routine",
      badge: "Scheduled" as const,
      count: scheduled.length,
      items: scheduled,
      color: "cyan" as const,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */

export default function MaintenancePage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";

  /* API state */
  const [data, setData] = useState<MaintenanceData | null>(null);
  const [isLoading, setIsLoading] = useState(!demoEnabled);
  const [error, setError] = useState<unknown>(null);
  const [filterUrgency, setFilterUrgency] = useState<string>("all");

  const load = useCallback(async () => {
    if (demoEnabled) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try { setData(await maintenanceApi.predictions()); }
    catch (requestError) { setError(requestError); }
    finally { setIsLoading(false); }
  }, [demoEnabled]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  /* ----- Demo view data ----- */
  const demoUrgencyCards = demoEnabled ? mockMaintenanceData.urgencyCards : [];
  const demoTasks = demoEnabled
    ? mockMaintenanceData.tasks.filter((t) => {
        if (filterUrgency === "all") return true;
        return t.urgency.toLowerCase().includes(filterUrgency.toLowerCase());
      })
    : [];

  /* ----- API view data ----- */
  const apiUrgencyCards = data ? buildUrgencyCards(data.predictions) : [];
  const apiPredictions = data
    ? data.predictions.filter((p) => {
        if (filterUrgency === "all") return true;
        const rl = p.risk_level.toLowerCase();
        if (filterUrgency === "immediate") return rl === "critical" || rl === "high";
        if (filterUrgency === "week") return rl === "medium";
        if (filterUrgency === "scheduled") return rl === "low";
        return true;
      })
    : [];

  /* Which urgency cards to show */
  const urgencyCards = demoEnabled ? demoUrgencyCards : apiUrgencyCards;
  const immediateCount = demoEnabled
    ? mockMaintenanceData.urgencyCards[0].count
    : apiUrgencyCards[0]?.count ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="Preventive & Corrective Maintenance"
        description="Schedule, dispatch, and track work orders based on RUL degradation indicators and telemetry thresholds."
        badge={
          <Badge variant={immediateCount > 0 ? "Critical" : "Info"} dot>
            {demoEnabled ? `${immediateCount} Immediate Actions` : "Heuristic Predictions"}
          </Badge>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load()}
            icon={<RefreshCw className="w-4 h-4" />}
            disabled={demoEnabled}
          >
            Refresh
          </Button>
        }
      />

      {error !== null && <ApiUnavailable error={error} onRetry={() => void load()} />}
      {isLoading && <ApiLoading label="Loading maintenance predictions…" />}

      {/* Heuristic disclaimer for API data */}
      {!demoEnabled && !isLoading && data && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          These are <strong>heuristic rule-based</strong> predictions, not confirmed maintenance records or trained ML predictions.
          Method: {data.method} · Generated: {data.generated_at}
        </div>
      )}

      {/* ========= Urgency Categorization Cards ========= */}
      {!isLoading && urgencyCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {urgencyCards.map((cat, idx) => (
            <Card
              key={idx}
              className={`border ${
                cat.color === "rose"
                  ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
                  : cat.color === "amber"
                  ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
                  : "bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/50"
              }`}
            >
              <CardHeader className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {cat.category}
                </span>
                <Badge
                  variant={
                    cat.badge === "Critical"
                      ? "Critical"
                      : cat.badge === "Warning"
                      ? "Warning"
                      : "Scheduled"
                  }
                  size="sm"
                >
                  {cat.count} Tasks
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-1">
                {cat.items.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-2">No items in this category.</div>
                ) : (
                  cat.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800"
                    >
                      <span className="font-medium truncate">{item}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========= Work Orders / Predictions Table ========= */}
      {!isLoading && (demoEnabled || data) && (
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              {demoEnabled ? "Active Work Orders & Maintenance Pipeline" : "Maintenance Predictions"}
            </CardTitle>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 text-xs">
              {(demoEnabled
                ? ["all", "immediate", "week", "scheduled"]
                : ["all", "immediate", "week", "scheduled"]
              ).map((u) => (
                <button
                  key={u}
                  onClick={() => setFilterUrgency(u)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                    filterUrgency === u
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200 bg-slate-800/40"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0f172a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-5">Work Order ID</th>
                    <th className="py-3 px-5">Task Description</th>
                    <th className="py-3 px-5">Target Equipment</th>
                    <th className="py-3 px-5">Urgency</th>
                    <th className="py-3 px-5">Assigned Team</th>
                    <th className="py-3 px-5">Due Date</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {demoEnabled ? (
                    /* ---------- DEMO: original mock work orders ---------- */
                    demoTasks.length === 0 ? (
                      <tr><td colSpan={7} className="p-6"><ApiEmpty label="No work orders match this filter." /></td></tr>
                    ) : (
                      demoTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-cyan-400">{task.id}</td>
                          <td className="py-3.5 px-5 font-medium text-white">{task.title}</td>
                          <td className="py-3.5 px-5 text-slate-300">{task.equipment}</td>
                          <td className="py-3.5 px-5">
                            <Badge
                              variant={
                                task.urgency === "Immediate"
                                  ? "Critical"
                                  : task.urgency === "This Week"
                                  ? "Warning"
                                  : "Scheduled"
                              }
                              size="sm"
                            >
                              {task.urgency}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5 text-slate-300">{task.assignedTo}</td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">{task.dueDate}</td>
                          <td className="py-3.5 px-5">
                            <Badge
                              variant={
                                task.status === "In Progress"
                                  ? "Info"
                                  : task.status === "Pending"
                                  ? "Warning"
                                  : "Healthy"
                              }
                              size="sm"
                              dot
                            >
                              {task.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    /* ---------- API: predictions mapped to table ---------- */
                    apiPredictions.length === 0 ? (
                      <tr><td colSpan={7} className="p-6"><ApiEmpty label="No predictions match this filter." /></td></tr>
                    ) : (
                      apiPredictions.map((item: MaintenancePrediction) => (
                        <tr key={item.equipment_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-cyan-400">{item.equipment_id}</td>
                          <td className="py-3.5 px-5 font-medium text-white">{item.recommended_action}</td>
                          <td className="py-3.5 px-5 text-slate-300">{item.equipment_name}</td>
                          <td className="py-3.5 px-5">
                            <Badge variant={riskVariant(item.risk_level)} size="sm">
                              {item.risk_level}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5 text-slate-500">Not available</td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                            {item.next_maintenance_window || "Not available"}
                          </td>
                          <td className="py-3.5 px-5">
                            <Badge variant="Info" size="sm" dot>{item.prediction_type}</Badge>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API: per-prediction detail cards with factors & disclaimer */}
      {!demoEnabled && !isLoading && data && apiPredictions.length > 0 && (
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-cyan-400" />
              Prediction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {apiPredictions.map((item: MaintenancePrediction) => (
              <div key={item.equipment_id} className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.equipment_name}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{item.equipment_id} · {item.prediction_type}</div>
                  </div>
                  <Badge variant={riskVariant(item.risk_level)} size="sm" dot>{item.risk_level}</Badge>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">{item.recommended_action}</p>
                <div className="mt-3 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
                  <div><span className="text-slate-500">Rule: </span>{item.rule_applied}</div>
                  <div><span className="text-slate-500">Next window: </span>{item.next_maintenance_window || "Not specified"}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.factors.map((factor) => (
                    <span key={factor} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400">{factor}</span>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-amber-300">{item.disclaimer}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && !data && !demoEnabled && error === null && (
        <ApiEmpty label="No maintenance data is available." />
      )}
    </div>
  );
}
