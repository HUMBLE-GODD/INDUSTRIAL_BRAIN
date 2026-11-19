"use client";

import React, { useState } from "react";
import {
  Network,
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Cpu,
  Shield,
  Users,
  Building,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockGraphData } from "@/data/mockData";

export default function KnowledgeGraphPage() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<typeof mockGraphData.nodes[0] | null>(
    mockGraphData.nodes[0]
  );

  const filteredNodes = mockGraphData.nodes.filter((n) => {
    const matchesSearch = n.label.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === "all" || n.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const getGroupIcon = (type: string) => {
    switch (type) {
      case "Equipment":
      case "Component":
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case "Regulation":
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case "Team":
        return <Users className="w-4 h-4 text-purple-400" />;
      case "Supplier":
        return <Building className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Knowledge Graph Explorer"
        description="Explore multi-hop relationships between industrial assets, maintenance teams, telemetry sensors, and compliance policies."
        badge={<Badge variant="Healthy" dot>Graph Topology Active</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Sync Graph
            </Button>
            <Button variant="outline" size="sm" icon={<Maximize2 className="w-3.5 h-3.5" />}>
              Fullscreen
            </Button>
          </div>
        }
      />

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Entities</div>
          <div className="text-xl font-bold text-white mt-1">1,420</div>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Relationships</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">3,890</div>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Asset Clusters</div>
          <div className="text-xl font-bold text-purple-400 mt-1">14</div>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Graph Latency</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">12 ms</div>
        </div>
      </div>

      {/* Main Graph Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Canvas Visualizer */}
        <div className="lg:col-span-2 space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1220] p-3 rounded-xl border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes (e.g. Pump P-101)..."
                className="w-full bg-[#11192d] text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-700/80 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {["all", "pumps", "motors", "sensors", "compliance"].map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                    selectedGroup === grp
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200 bg-slate-800/40"
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button className="p-1.5 bg-slate-800/60 rounded-lg text-slate-400 hover:text-white">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button className="p-1.5 bg-slate-800/60 rounded-lg text-slate-400 hover:text-white">
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Graph Canvas Placeholder */}
          <div className="relative h-[480px] bg-[#070b14] rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-6">
            {/* Background Grid Lines */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#06b6d4 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                backgroundPosition: "0 0, 16px 16px",
              }}
            />

            {/* Center Graph Node Elements */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl w-full">
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 flex items-center gap-3 ${
                      isSelected
                        ? "bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105"
                        : "bg-[#0f172a]/90 border-slate-700/80 hover:border-slate-500 hover:bg-[#151f38]"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                      {getGroupIcon(node.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {node.type}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Entity Inspector Side Panel */}
        <Card className="bg-[#0b1220]/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Entity Inspector
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    Node ID: #{selectedNode.id}
                  </div>
                  <div className="text-base font-bold text-white">
                    {selectedNode.label}
                  </div>
                  <Badge
                    variant={
                      selectedNode.status === "Critical"
                        ? "Critical"
                        : selectedNode.status === "Warning"
                        ? "Warning"
                        : "Healthy"
                    }
                    size="sm"
                  >
                    Status: {selectedNode.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold text-[11px] uppercase">
                    Connected Relationships
                  </span>
                  <div className="space-y-1.5">
                    {mockGraphData.links
                      .filter(
                        (l) =>
                          l.source === selectedNode.id ||
                          l.target === selectedNode.id
                      )
                      .map((link, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#0f172a] border border-slate-800 text-[11px]"
                        >
                          <span className="text-slate-300 font-mono">
                            {link.label}
                          </span>
                          <span className="text-cyan-400">
                            Node #{link.source === selectedNode.id ? link.target : link.source}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <Button variant="primary" size="sm" className="w-full mt-4">
                  Run GraphRAG Diagnostics
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a node from the canvas to inspect entity properties and sub-graphs.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
