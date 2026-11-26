"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Network, Search, Layers, ZoomIn, ZoomOut, Maximize2, Cpu, Shield, Users, Building, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import { graphApi } from "@/lib/api/services";
import type { GraphSummary, SupplierRisk } from "@/lib/api/types";
import { mockGraphData } from "@/data/mockData";

type DemoNode = (typeof mockGraphData.nodes)[number];

function groupIcon(type: string) {
  switch (type) {
    case "Equipment":
    case "Component": return <Cpu className="w-4 h-4 text-cyan-400" />;
    case "Regulation": return <Shield className="w-4 h-4 text-emerald-400" />;
    case "Team": return <Users className="w-4 h-4 text-purple-400" />;
    case "Supplier": return <Building className="w-4 h-4 text-amber-400" />;
    default: return <Layers className="w-4 h-4 text-slate-400" />;
  }
}

export default function KnowledgeGraphPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedNode, setSelectedNode] = useState<DemoNode | null>(demoEnabled ? mockGraphData.nodes[0] : null);
  const [summary, setSummary] = useState<GraphSummary | null>(null);
  const [supplierRisks, setSupplierRisks] = useState<SupplierRisk[]>([]);
  const [isLoading, setIsLoading] = useState(!demoEnabled);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (demoEnabled) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const [summaryResult, riskResult] = await Promise.all([graphApi.summary(), graphApi.supplierRisks()]);
      setSummary(summaryResult);
      setSupplierRisks(riskResult.supplier_risks);
    } catch (requestError) { setError(requestError); }
    finally { setIsLoading(false); }
  }, [demoEnabled]);

  useEffect(() => { void load(); }, [load]);

  const filteredNodes = useMemo(() => mockGraphData.nodes.filter((node) => node.label.toLowerCase().includes(search.toLowerCase()) && (selectedGroup === "all" || node.group === selectedGroup)), [search, selectedGroup]);
  const liveSummary = demoEnabled ? null : summary;
  const totalEntities = demoEnabled ? mockGraphData.stats.totalEntities.toLocaleString() : liveSummary?.total_nodes ?? "Not available";
  const relationships = demoEnabled ? mockGraphData.stats.totalRelationships.toLocaleString() : liveSummary?.total_relationships ?? "Not available";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="Knowledge Graph Explorer"
        description="Explore multi-hop relationships between industrial assets, maintenance teams, telemetry sensors, and compliance policies."
        badge={<Badge variant={demoEnabled ? "Pending" : "Info"} dot>{demoEnabled ? "DEMO Graph Preview" : "Graph Evidence"}</Badge>}
        actions={<div className="flex items-center gap-2"><Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => void load()} disabled={demoEnabled}>Refresh Graph</Button><Button variant="outline" size="sm" icon={<Maximize2 className="w-3.5 h-3.5" />} disabled title="Fullscreen is unavailable without graph visualization data">Fullscreen unavailable</Button></div>}
      />

      {error !== null && <ApiUnavailable error={error} onRetry={() => void load()} />}
      {isLoading && <ApiLoading label="Loading graph summary and supplier risks…" />}

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5"><div className="text-[11px] text-slate-400 uppercase font-semibold">Total Entities</div><div className="text-xl font-bold text-white mt-1">{totalEntities}</div></div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5"><div className="text-[11px] text-slate-400 uppercase font-semibold">Relationships</div><div className="text-xl font-bold text-cyan-400 mt-1">{relationships}</div></div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5"><div className="text-[11px] text-slate-400 uppercase font-semibold">Asset Clusters</div><div className="text-xl font-bold text-purple-400 mt-1">{demoEnabled ? mockGraphData.stats.equipmentClusters : "Not available"}</div></div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5"><div className="text-[11px] text-slate-400 uppercase font-semibold">Graph Latency</div><div className="text-xl font-bold text-emerald-400 mt-1">Not available</div></div>
      </div>

      {/* Main Graph Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1220] p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={search} onChange={(event) => setSearch(event.target.value)} disabled={!demoEnabled} aria-label="Search graph nodes" placeholder={demoEnabled ? "Search nodes (e.g. Pump P-101)..." : "Search unavailable without graph nodes"} className="w-full bg-[#11192d] text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-700/80 focus:outline-none focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60" /></div>
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">{["all", "pumps", "motors", "sensors", "compliance"].map((group) => <button key={group} onClick={() => setSelectedGroup(group)} disabled={!demoEnabled} className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${selectedGroup === group && demoEnabled ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 bg-slate-800/40 disabled:cursor-not-allowed disabled:opacity-60"}`}>{group}</button>)}</div>
            <div className="flex items-center gap-1"><button disabled className="p-1.5 bg-slate-800/60 rounded-lg text-slate-500 cursor-not-allowed" title="Zoom unavailable without graph visualization data"><ZoomIn className="w-4 h-4" /></button><button disabled className="p-1.5 bg-slate-800/60 rounded-lg text-slate-500 cursor-not-allowed" title="Zoom unavailable without graph visualization data"><ZoomOut className="w-4 h-4" /></button></div>
          </div>

          {/* Original Graph Canvas Area */}
          <div className="relative h-[480px] bg-[#070b14] rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-6">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#06b6d4 1px, transparent 1px)", backgroundSize: "32px 32px", backgroundPosition: "0 0, 16px 16px" }} />
            {demoEnabled ? <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl w-full">{filteredNodes.map((node) => { const isSelected = selectedNode?.id === node.id; return <button key={node.id} onClick={() => setSelectedNode(node)} className={`text-left cursor-pointer p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 flex items-center gap-3 ${isSelected ? "bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105" : "bg-[#0f172a]/90 border-slate-700/80 hover:border-slate-500 hover:bg-[#151f38]"}`}><div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">{groupIcon(node.type)}</div><div className="min-w-0"><div className="text-xs font-bold text-white truncate">{node.label}</div><div className="text-[10px] text-slate-400">{node.type}</div></div></button>; })}</div> : <div className="relative z-10 max-w-sm rounded-xl border border-amber-500/30 bg-amber-950/30 px-5 py-4 text-center"><Network className="mx-auto mb-2 h-6 w-6 text-amber-400" /><div className="text-sm font-semibold text-amber-200">Graph visualization data unavailable</div><div className="mt-1 text-xs text-amber-300/80">The verified API exposes summary and supplier-risk data, but no general node/edge visualization payload.</div></div>}
          </div>
        </div>

        {/* Original Entity Inspector Side Panel */}
        <Card className="bg-[#0b1220]/90 border-slate-800"><CardHeader><CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2"><Network className="w-4 h-4 text-cyan-400" />Entity Inspector</CardTitle></CardHeader><CardContent className="space-y-4">
          {demoEnabled && selectedNode ? <div className="space-y-4 text-xs"><div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1"><div className="text-slate-400 text-[10px] uppercase font-semibold">Node ID: #{selectedNode.id}</div><div className="text-base font-bold text-white">{selectedNode.label}</div><Badge variant={selectedNode.status === "Critical" ? "Critical" : selectedNode.status === "Warning" ? "Warning" : "Healthy"} size="sm">Status: {selectedNode.status}</Badge></div><div className="space-y-2"><span className="text-slate-400 font-semibold text-[11px] uppercase">Connected Relationships</span>{mockGraphData.links.filter((link) => link.source === selectedNode.id || link.target === selectedNode.id).map((link, index) => <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-[#0f172a] border border-slate-800 text-[11px]"><span className="text-slate-300 font-mono">{link.label}</span><span className="text-cyan-400">Node #{link.source === selectedNode.id ? link.target : link.source}</span></div>)}</div><Button variant="primary" size="sm" className="w-full mt-4" disabled>GraphRAG diagnostics unavailable</Button></div> : supplierRisks.length > 0 ? <div className="space-y-3 text-xs"><div className="text-[11px] uppercase font-semibold text-slate-400">Verified Supplier Risks</div>{supplierRisks.map((risk) => <div key={risk.supplier_id} className="rounded-xl border border-slate-800 bg-[#0f172a] p-3"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 font-semibold text-white"><Building className="h-3.5 w-3.5 text-amber-400" />{risk.supplier_name}</span><Badge variant={risk.supplier_rating !== null && risk.supplier_rating !== undefined && risk.supplier_rating < 3.5 ? "Warning" : "Healthy"} size="sm">{risk.supplier_rating ?? "Not available"}</Badge></div><div className="mt-2 text-[11px] text-slate-400">{risk.affected_equipment_count} affected equipment · {risk.failure_link_count} failure links</div><div className="mt-2 text-[11px] text-slate-300">{risk.failure_mode_names.join(", ") || "Failure modes not available"}</div></div>)}</div> : <div className="text-center py-12 text-slate-500 text-xs">{isLoading ? "Loading verified supplier risks…" : error !== null ? "Supplier risk data unavailable." : "No supplier-risk relationships were returned."}</div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
