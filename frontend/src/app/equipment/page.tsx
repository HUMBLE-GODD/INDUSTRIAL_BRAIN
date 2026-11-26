"use client";

import React, { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ApiEmpty, ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import type { Equipment, EquipmentHistoryEvent, EquipmentResponse, ObservationSeverity } from "@/lib/api/types";
import { equipmentApi } from "@/lib/api/services";
import { mockDashboardData } from "@/data/mockData";

function equipmentFromDemo(): Equipment[] {
  return mockDashboardData.equipmentHealth.map((item) => ({
    id: item.id,
    name: item.name,
    status: item.status,
    health: item.health,
    metric: item.metric,
  }));
}

function statusVariant(status?: string): "Healthy" | "Warning" | "Critical" | "Info" {
  const normalized = status?.toLowerCase();
  if (["critical", "failed", "offline"].includes(normalized || "")) return "Critical";
  if (["warning", "maintenance", "degraded"].includes(normalized || "")) return "Warning";
  if (["operational", "healthy", "active"].includes(normalized || "")) return "Healthy";
  return "Info";
}

export default function EquipmentPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
  const demoEquipment = useMemo(() => equipmentFromDemo(), []);
  const [apiEquipment, setApiEquipment] = useState<EquipmentResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(demoEnabled ? "EQ-001" : null);
  const [apiDetail, setApiDetail] = useState<EquipmentResponse | null>(null);
  const [history, setHistory] = useState<EquipmentHistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(!demoEnabled);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [observationCategory, setObservationCategory] = useState("inspection");
  const [observationSeverity, setObservationSeverity] = useState<ObservationSeverity>("medium");
  const [observationNote, setObservationNote] = useState("");
  const [observationMessage, setObservationMessage] = useState<string | null>(null);

  const loadEquipment = useCallback(async () => {
    if (demoEnabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await equipmentApi.list({ page: 1, page_size: 100 });
      setApiEquipment(response.items);
      setSelectedId((current) => current && response.items.some((item) => item.id === current) ? current : response.items[0]?.id || null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, [demoEnabled]);

  useEffect(() => { void Promise.resolve().then(loadEquipment); }, [loadEquipment]);

  useEffect(() => {
    if (demoEnabled || !selectedId) return;
    let cancelled = false;
    const loadSelectedEquipment = async () => {
      if (cancelled) return;
      setIsDetailLoading(true);
      setApiDetail(null);
      setHistory([]);
      setError(null);
      try {
        const [detail, historyPage] = await Promise.all([
          equipmentApi.get(selectedId),
          equipmentApi.history(selectedId, { page: 1, page_size: 100 }),
        ]);
        if (cancelled) return;
        setApiDetail(detail);
        setHistory(historyPage.items);
      } catch (requestError) {
        if (!cancelled) setError(requestError);
      } finally {
        if (!cancelled) setIsDetailLoading(false);
      }
    };
    void Promise.resolve().then(loadSelectedEquipment);
    return () => { cancelled = true; };
  }, [demoEnabled, selectedId, detailRefreshKey]);

  const retryLoading = () => {
    void loadEquipment();
    if (selectedId) setDetailRefreshKey((key) => key + 1);
  };

  const equipment: Equipment[] = demoEnabled ? demoEquipment : apiEquipment;
  const selected = demoEnabled
    ? equipment.find((item) => item.id === selectedId) || null
    : apiDetail || equipment.find((item) => item.id === selectedId) || null;

  const submitObservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !observationNote.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setObservationMessage(null);
    try {
      const created = await equipmentApi.submitObservation({
        equipment_id: selectedId,
        category: observationCategory,
        severity: observationSeverity,
        note: observationNote.trim(),
      });
      setObservationNote("");
      setObservationMessage(`Observation ${created.id} saved to ${selectedId}.`);
      const historyPage = await equipmentApi.history(selectedId, { page: 1, page_size: 100 });
      setHistory(historyPage.items);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="Equipment Registry"
        description={demoEnabled ? "Browse the local synthetic asset fixture." : "Review platform equipment records, history, and submit a field observation."}
        badge={<Badge variant={demoEnabled ? "Info" : "Healthy"} dot>{demoEnabled ? "Local Fixture" : "Platform API"}</Badge>}
        actions={<Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={retryLoading} disabled={demoEnabled || isLoading}>Refresh</Button>}
      />

      {error !== null && <ApiUnavailable error={error} onRetry={retryLoading} />}
      {isLoading && <ApiLoading label="Loading equipment from the platform API…" />}
      {!isLoading && equipment.length === 0 && error === null && <ApiEmpty label="No equipment records are available." />}

      {equipment.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6">
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader><CardTitle className="text-sm">Equipment List · {equipment.length}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
              {equipment.map((item) => <button key={item.id} disabled={isSubmitting} onClick={() => { setSelectedId(item.id); setApiDetail(null); setHistory([]); }} className={`w-full rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${selectedId === item.id ? "border-cyan-500/50 bg-cyan-950/20" : "border-slate-800 bg-[#0f172a] hover:border-slate-600"}`}>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-white"><Activity className="h-4 w-4 text-cyan-400" />{item.name || item.id}</span><Badge variant={statusVariant(item.status)} size="sm">{item.status || "Unknown"}</Badge></div>
              <div className="mt-1 text-[11px] text-slate-500">ID: {item.id}{typeof item.health === "number" ? ` · Health: ${item.health}%` : ""}{item.metric ? ` · ${item.metric}` : ""}</div>
            </button>)}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#0b1220]/90 border-slate-800">
            <CardHeader><CardTitle className="text-sm">Equipment Detail</CardTitle></CardHeader>
            <CardContent>
              {isDetailLoading ? <ApiLoading label="Loading equipment detail and history…" /> : selected ? <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div><div className="text-[10px] uppercase text-slate-500">Asset ID</div><div className="mt-1 font-mono text-cyan-300">{selected.id}</div></div>
                <div><div className="text-[10px] uppercase text-slate-500">Status</div><div className="mt-1 text-slate-200">{selected.status || "Not available"}</div></div>
                <div className="col-span-2"><div className="text-[10px] uppercase text-slate-500">Equipment</div><div className="mt-1 text-white font-semibold">{selected.name || selected.id}</div></div>
                {!demoEnabled && apiDetail && <>
                  <div><div className="text-[10px] uppercase text-slate-500">Type / Model</div><div className="mt-1 text-slate-200">{apiDetail.type} · {apiDetail.model || "Not recorded"}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500">Criticality</div><div className="mt-1 text-slate-200">{apiDetail.criticality}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500">Manufacturer</div><div className="mt-1 text-slate-200">{apiDetail.manufacturer || "Not recorded"}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500">Location</div><div className="mt-1 text-slate-200">{apiDetail.location}</div></div>
                  <div className="col-span-2"><div className="text-[10px] uppercase text-slate-500">Install Date</div><div className="mt-1 text-slate-200">{apiDetail.install_date ? new Date(apiDetail.install_date).toLocaleDateString() : "Not recorded"}</div></div>
                </>}
                {demoEnabled && <div className="col-span-2 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-200">This panel uses local fixture values. Sign in and switch off fixture mode to view database records.</div>}
              </div> : <ApiEmpty label="Select an equipment record to inspect its details." />}
            </CardContent>
          </Card>

          {!demoEnabled && <>
            <Card className="bg-[#0b1220]/90 border-slate-800">
              <CardHeader><CardTitle className="text-sm">Recent History · {history.length}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {history.length === 0 ? <ApiEmpty label="No history events were returned for this equipment." /> : history.map((event) => <div key={`${event.event_type}-${event.id}`} className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 text-xs">
                  <div className="flex items-center justify-between gap-3"><span className="font-semibold text-white">{event.title}</span><Badge variant={event.severity === "critical" || event.severity === "high" ? "Critical" : "Info"} size="sm">{event.event_type.replaceAll("_", " ")}</Badge></div>
                  <div className="mt-1 text-slate-300">{event.description}</div>
                  <div className="mt-2 text-[10px] text-slate-500">{new Date(event.occurred_at).toLocaleString()}</div>
                </div>)}
              </CardContent>
            </Card>

            <Card className="bg-[#0b1220]/90 border-slate-800">
              <CardHeader><CardTitle className="text-sm">Submit Field Observation</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={(event) => void submitObservation(event)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[11px] text-slate-400">Category<input value={observationCategory} onChange={(event) => setObservationCategory(event.target.value)} required maxLength={80} className="mt-1 w-full rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500" /></label>
                    <label className="text-[11px] text-slate-400">Severity<select value={observationSeverity} onChange={(event) => setObservationSeverity(event.target.value as ObservationSeverity)} className="mt-1 w-full rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
                  </div>
                  <label className="block text-[11px] text-slate-400">Note<textarea value={observationNote} onChange={(event) => setObservationNote(event.target.value)} required maxLength={5000} rows={3} placeholder="Describe what you observed…" className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-[#080d1a] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500" /></label>
                  {observationMessage && <p role="status" className="text-xs text-emerald-300">{observationMessage}</p>}
                  <Button type="submit" size="sm" icon={<Send className="h-3.5 w-3.5" />} isLoading={isSubmitting} disabled={!selectedId || !observationNote.trim()}>Submit Observation</Button>
                </form>
              </CardContent>
            </Card>
          </>}
        </div>
      </div>}
    </div>
  );
}
