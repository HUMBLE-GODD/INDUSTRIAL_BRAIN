"use client";

import React, { useMemo, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ApiEmpty, ApiLoading, ApiPending, DemoDataNotice } from "@/components/ui/ApiState";
import type { Equipment } from "@/lib/api/types";
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

export default function EquipmentPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
  const equipment = demoEnabled ? equipmentFromDemo() : [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Equipment | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    if (demoEnabled) { setSelected(equipment.find((item) => item.id === id) || null); return; }
    setIsDetailLoading(false);
  };

  const selectedJson = useMemo(() => selected ? JSON.stringify(selected, null, 2) : "", [selected]);

  if (!demoEnabled) return <div className="space-y-6 animate-in fade-in duration-300"><PageHeader title="Equipment Registry" description="Equipment list and details require Tatvik's verified equipment API contract." badge={<Badge variant="Pending" dot>Backend Pending</Badge>} /><ApiPending feature="Equipment listing, details, history, and observations" /></div>;

  return <div className="space-y-6 animate-in fade-in duration-300">
    {demoEnabled && <DemoDataNotice />}
    <PageHeader title="Equipment Registry" description="Browse equipment health and inspect asset details returned by the equipment service." badge={<Badge variant="Pending" dot>Demo Preview</Badge>} actions={<Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} disabled>Refresh</Button>} />
    {equipment.length === 0 && <ApiEmpty label="No equipment records were returned by the API." />}
    {equipment.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
      <Card className="bg-[#0b1220]/90 border-slate-800">
        <CardHeader><CardTitle className="text-sm">Equipment List</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {equipment.map((item) => <button key={item.id} onClick={() => void loadDetail(item.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === item.id ? "border-cyan-500/50 bg-cyan-950/20" : "border-slate-800 bg-[#0f172a] hover:border-slate-600"}`}>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-white"><Activity className="h-4 w-4 text-cyan-400" />{item.name || item.id}</span><Badge variant={item.status === "critical" ? "Critical" : item.status === "warning" ? "Warning" : "Healthy"} size="sm">{item.status || "Unknown"}</Badge></div>
            <div className="mt-1 text-[11px] text-slate-500">ID: {item.id}{typeof item.health === "number" ? ` · Health: ${item.health}%` : ""}</div>
          </button>)}
        </CardContent>
      </Card>
      <Card className="bg-[#0b1220]/90 border-slate-800"><CardHeader><CardTitle className="text-sm">Equipment Detail</CardTitle></CardHeader><CardContent>{isDetailLoading ? <ApiLoading label="Loading equipment detail…" /> : selectedJson ? <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#080c14] p-4 text-[11px] leading-relaxed text-slate-300">{selectedJson}</pre> : <ApiEmpty label="Select an equipment record to inspect its details." />}</CardContent></Card>
    </div>}
  </div>;
}
