"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building,
  Cpu,
  Layers,
  Maximize2,
  Minimize2,
  Network,
  RefreshCw,
  Search,
  Shield,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import { graphApi } from "@/lib/api/services";
import { ApiError, AUTH_STATE_CHANGED_EVENT, getAccessToken } from "@/lib/api/client";
import type { GraphVisualization, GraphVisualizationEdge, GraphVisualizationNode, SupplierRisk } from "@/lib/api/types";
import { mockGraphData } from "@/data/mockData";

type Point = { x: number; y: number };
type CanvasDrag = {
  pointerId: number;
  start: Point;
  origin: Point;
};

const EMPTY_NODES: GraphVisualizationNode[] = [];
const EMPTY_EDGES: GraphVisualizationEdge[] = [];

function screenPointToViewBox(svg: SVGSVGElement, clientX: number, clientY: number): Point | null {
  const inverse = svg.getScreenCTM()?.inverse();
  if (!inverse) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const viewBoxPoint = point.matrixTransform(inverse);
  return { x: viewBoxPoint.x, y: viewBoxPoint.y };
}

const TYPE_COLORS: Record<string, string> = {
  equipment: "#a78bfa",
  component: "#22d3ee",
  supplier: "#fbbf24",
  location: "#34d399",
  "failure mode": "#fb7185",
  sensor: "#38bdf8",
  team: "#c084fc",
  regulation: "#4ade80",
  document: "#94a3b8",
};

const FALLBACK_COLORS = ["#2dd4bf", "#60a5fa", "#f472b6", "#facc15", "#818cf8", "#fb923c"];

function colorForType(type: string): string {
  const normalized = type.trim().toLowerCase();
  const knownColor = TYPE_COLORS[normalized];
  if (knownColor) return knownColor;
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function typeIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("equipment") || normalized.includes("component") || normalized.includes("sensor")) {
    return <Cpu className="h-4 w-4" />;
  }
  if (normalized.includes("supplier")) return <Building className="h-4 w-4" />;
  if (normalized.includes("regulation") || normalized.includes("compliance")) return <Shield className="h-4 w-4" />;
  if (normalized.includes("team")) return <Users className="h-4 w-4" />;
  return <Layers className="h-4 w-4" />;
}

function makeDemoGraph(): GraphVisualization {
  return {
    nodes: mockGraphData.nodes.map((node) => ({
      id: node.id,
      domainId: node.id,
      type: node.type,
      label: node.label,
      properties: { status: node.status, group: node.group },
    })),
    edges: mockGraphData.links.map((link, index) => ({
      id: `demo-edge-${index + 1}`,
      source: link.source,
      target: link.target,
      type: link.label,
    })),
  };
}

function getNodePositions(nodes: GraphVisualizationNode[]): Map<string, Point> {
  const ringByNode = new Map<string, number>();
  for (const node of nodes) {
    const normalized = node.type.trim().toLowerCase();
    ringByNode.set(node.id, normalized === "equipment" ? 0 : normalized === "component" ? 1 : 2);
  }

  const rings = new Map<number, GraphVisualizationNode[]>();
  for (const node of nodes) {
    const ring = ringByNode.get(node.id) ?? 2;
    const ringNodes = rings.get(ring) ?? [];
    ringNodes.push(node);
    rings.set(ring, ringNodes);
  }

  const positions = new Map<string, Point>();
  const centerX = 500;
  const centerY = 320;
  const baseRadii = { 0: 92, 1: 205, 2: 310 } as const;

  for (const [ring, ringNodes] of rings) {
    const orderedNodes = [...ringNodes].sort((left, right) => left.type.localeCompare(right.type) || left.label.localeCompare(right.label));
    const radiusX = Math.min(375, Math.max(baseRadii[ring as keyof typeof baseRadii], orderedNodes.length * 15));
    const radiusY = radiusX * 0.72;
    const offset = ring * 0.39;

    orderedNodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / orderedNodes.length - Math.PI / 2 + offset;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      });
    });
  }

  return positions;
}

function readableValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export default function KnowledgeGraphPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasDragRef = useRef<CanvasDrag | null>(null);
  const [graph, setGraph] = useState<GraphVisualization | null>(() => (demoEnabled ? makeDemoGraph() : null));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => (demoEnabled ? mockGraphData.nodes[0]?.id ?? null : null));
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isLoading, setIsLoading] = useState(!demoEnabled);
  const [error, setError] = useState<unknown>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supplierRisks, setSupplierRisks] = useState<SupplierRisk[]>([]);
  const [supplierRiskError, setSupplierRiskError] = useState<unknown>(null);
  const [isSupplierRiskLoading, setIsSupplierRiskLoading] = useState(!demoEnabled);

  const loadGraph = useCallback(async () => {
    if (demoEnabled) return;
    setIsLoading(true);
    setError(null);
    setIsSupplierRiskLoading(true);
    setSupplierRiskError(null);

    if (!getAccessToken()) {
      const authError = new ApiError("Sign in to load live data.", 401, { code: "authentication_required" });
      setGraph(null);
      setSelectedNodeId(null);
      setLatencyMs(null);
      setSupplierRisks([]);
      setError(authError);
      setSupplierRiskError(authError);
      setIsLoading(false);
      setIsSupplierRiskLoading(false);
      return;
    }

    const startedAt = performance.now();
    void graphApi.supplierRisks()
      .then((result) => setSupplierRisks(result.supplier_risks))
      .catch((requestError) => {
        setSupplierRisks([]);
        setSupplierRiskError(requestError);
      })
      .finally(() => setIsSupplierRiskLoading(false));
    try {
      const result = await graphApi.visualization();
      setGraph(result);
      setSelectedNodeId((current) => (result.nodes.some((node) => node.id === current) ? current : result.nodes[0]?.id ?? null));
      setLatencyMs(Math.max(1, Math.round(performance.now() - startedAt)));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, [demoEnabled]);

  useEffect(() => {
    if (demoEnabled) return;
    const handleAuthChange = () => { void loadGraph(); };
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
    void Promise.resolve().then(loadGraph);
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
  }, [demoEnabled, loadGraph]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === canvasRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const nodes = graph?.nodes ?? EMPTY_NODES;
  const edges = graph?.edges ?? EMPTY_EDGES;
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const positions = useMemo(() => getNodePositions(nodes), [nodes]);
  const degreeById = useMemo(() => {
    const degrees = new Map<string, number>();
    for (const edge of edges) {
      degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
    }
    return degrees;
  }, [edges]);
  const nodeTypes = useMemo(() => [...new Set(nodes.map((node) => node.type))].sort((left, right) => left.localeCompare(right)), [nodes]);
  const activeType = selectedType === "all" || nodeTypes.includes(selectedType) ? selectedType : "all";
  const matchingNodeIds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return new Set(nodes.filter((node) => {
      const matchesType = activeType === "all" || node.type === activeType;
      if (!matchesType) return false;
      if (!query) return true;
      const searchableText = `${node.id} ${node.domainId ?? ""} ${node.type} ${node.label} ${readableValue(node.properties)}`.toLowerCase();
      return searchableText.includes(query);
    }).map((node) => node.id));
  }, [activeType, nodes, search]);
  const hasActiveFilter = search.trim().length > 0 || activeType !== "all";
  const connectedEdges = useMemo(() => selectedNodeId
    ? edges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId)
    : [], [edges, selectedNodeId]);
  const connectedNodeIds = useMemo(() => new Set(connectedEdges.map((edge) => edge.source === selectedNodeId ? edge.target : edge.source)), [connectedEdges, selectedNodeId]);
  const equipmentCount = nodes.filter((node) => node.type.trim().toLowerCase() === "equipment").length;
  const emptyGraph = graph !== null && graph.nodes.length === 0;

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await canvasRef.current?.requestFullscreen();
      }
    } catch {
      // Keep graph navigation usable if fullscreen is blocked by the browser.
    }
  };

  const changeZoom = (delta: number) => setZoom((current) => Math.max(0.5, Math.min(2.5, Number((current + delta).toFixed(1)))));

  const handleCanvasPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("[data-graph-node='true']")) return;
    const start = screenPointToViewBox(event.currentTarget, event.clientX, event.clientY);
    if (!start) return;
    canvasDragRef.current = {
      pointerId: event.pointerId,
      start,
      origin: pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const handleGraphClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("[data-graph-node='true']")) return;

    const viewBoxPoint = screenPointToViewBox(event.currentTarget, event.clientX, event.clientY);
    if (!viewBoxPoint) return;
    const graphPoint = {
      x: 500 + (viewBoxPoint.x - pan.x - 500) / zoom,
      y: 320 + (viewBoxPoint.y - pan.y - 320) / zoom,
    };

    let nearestNodeId: string | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const node of nodes) {
      const point = positions.get(node.id);
      if (!point) continue;
      const distance = Math.hypot(point.x - graphPoint.x, point.y - graphPoint.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestNodeId = node.id;
      }
    }
    if (nearestNodeId) setSelectedNodeId(nearestNodeId);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = canvasDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = screenPointToViewBox(event.currentTarget, event.clientX, event.clientY);
    if (!current) return;
    setPan({
      x: drag.origin.x + current.x - drag.start.x,
      y: drag.origin.y + current.y - drag.start.y,
    });
  };

  const finishCanvasPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!canvasDragRef.current || canvasDragRef.current.pointerId !== event.pointerId) return;
    canvasDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setIsPanning(false);
  };

  const handleNodeKeyDown = (event: React.KeyboardEvent<SVGGElement>, nodeId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedNodeId(nodeId);
    }
  };

  const handleRelatedNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="Knowledge Graph Explorer"
        description="Explore the relationships between industrial assets, components, suppliers, and operational evidence."
        badge={<Badge variant={demoEnabled ? "Pending" : "Info"} dot>{demoEnabled ? "DEMO Graph Preview" : "Live Graph"}</Badge>}
        actions={(
          <>
            <button
              type="button"
              onClick={() => void loadGraph()}
              disabled={demoEnabled || isLoading}
              title={demoEnabled ? "Refresh is available in live mode" : "Reload graph visualization"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-[#151d30] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-[#1c263d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh graph
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 px-2.5 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:border-cyan-400 hover:bg-cyan-500/10"
              title={isFullscreen ? "Exit fullscreen" : "Expand graph canvas"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          </>
        )}
      />

      {error !== null && <ApiUnavailable error={error} onRetry={() => void loadGraph()} />}
      {isLoading && <ApiLoading label="Loading graph visualization…" />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Total entities</div>
          <div className="mt-1 text-xl font-bold text-white">{graph ? formatCount(nodes.length) : "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Relationships</div>
          <div className="mt-1 text-xl font-bold text-cyan-400">{graph ? formatCount(edges.length) : "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Equipment assets</div>
          <div className="mt-1 text-xl font-bold text-purple-400">{graph ? formatCount(equipmentCount) : "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-3.5">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Graph response</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">{latencyMs === null ? "—" : `${latencyMs} ms`}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-[#0b1220] p-3">
            <label className="relative min-w-[190px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={!graph || emptyGraph}
                aria-label="Search graph nodes and properties"
                placeholder="Search names, IDs, or properties…"
                className="w-full rounded-lg border border-slate-700/80 bg-[#11192d] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <span>Type</span>
              <select
                value={activeType}
                onChange={(event) => setSelectedType(event.target.value)}
                disabled={!graph || emptyGraph}
                aria-label="Filter graph by node type"
                className="max-w-[190px] rounded-lg border border-slate-700/80 bg-[#11192d] px-2.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="all">All types</option>
                {nodeTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => changeZoom(0.2)} disabled={!graph || emptyGraph || zoom >= 2.5} aria-label="Zoom in" title="Zoom in" className="rounded-lg bg-slate-800/70 p-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"><ZoomIn className="h-4 w-4" /></button>
              <button type="button" onClick={() => changeZoom(-0.2)} disabled={!graph || emptyGraph || zoom <= 0.5} aria-label="Zoom out" title="Zoom out" className="rounded-lg bg-slate-800/70 p-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"><ZoomOut className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} disabled={!graph || emptyGraph || (zoom === 1 && pan.x === 0 && pan.y === 0)} className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">Fit</button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className={`relative h-[500px] overflow-hidden rounded-2xl border border-slate-800 bg-[#070b14] ${isFullscreen ? "h-screen w-screen rounded-none p-6" : ""}`}
          >
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(#263449 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            {graph && !emptyGraph && (
              <>
                <svg
                  ref={svgRef}
                  className={`relative z-10 h-full w-full ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
                  viewBox="0 0 1000 640"
                  preserveAspectRatio="xMidYMid meet"
                  role="group"
                  aria-label={`Interactive knowledge graph containing ${nodes.length} nodes and ${edges.length} relationships`}
                  style={{ touchAction: "pan-y" }}
                  onClick={handleGraphClick}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={finishCanvasPointer}
                  onPointerCancel={finishCanvasPointer}
                >
                  <defs>
                    <marker id="graph-arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                    </marker>
                    <marker id="graph-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee" />
                    </marker>
                  </defs>
                  <g transform={`translate(${pan.x} ${pan.y}) translate(500 320) scale(${zoom}) translate(-500 -320)`}>
                    {edges.map((edge) => {
                      const source = positions.get(edge.source);
                      const target = positions.get(edge.target);
                      if (!source || !target) return null;
                      const deltaX = target.x - source.x;
                      const deltaY = target.y - source.y;
                      const length = Math.hypot(deltaX, deltaY) || 1;
                      const targetRadius = 6.5 + Math.min(4, Math.sqrt(degreeById.get(edge.target) ?? 0));
                      const endX = target.x - (deltaX / length) * targetRadius;
                      const endY = target.y - (deltaY / length) * targetRadius;
                      const isConnected = edge.source === selectedNodeId || edge.target === selectedNodeId;
                      const bothMatch = matchingNodeIds.has(edge.source) && matchingNodeIds.has(edge.target);
                      const opacity = hasActiveFilter ? (bothMatch ? 0.76 : 0.08) : selectedNodeId ? (isConnected ? 0.82 : 0.18) : 0.55;
                      const sourceNode = nodeById.get(edge.source);
                      const targetNode = nodeById.get(edge.target);
                      const showRelationshipLabel = isConnected && connectedEdges.length <= 28;
                      return (
                        <g key={edge.id}>
                          <line
                            x1={source.x}
                            y1={source.y}
                            x2={endX}
                            y2={endY}
                            stroke={isConnected ? "#22d3ee" : "#475569"}
                            strokeWidth={isConnected ? 1.8 : 1.1}
                            strokeOpacity={opacity}
                            markerEnd={isConnected ? "url(#graph-arrow-active)" : "url(#graph-arrow-default)"}
                            vectorEffect="non-scaling-stroke"
                          >
                            <title>{`${sourceNode?.label ?? edge.source} — ${edge.type} → ${targetNode?.label ?? edge.target}`}</title>
                          </line>
                          {showRelationshipLabel && (
                            <text
                              x={(source.x + target.x) / 2}
                              y={(source.y + target.y) / 2 - 5}
                              textAnchor="middle"
                              className="fill-cyan-200"
                              fontSize="9"
                              paintOrder="stroke"
                              stroke="#070b14"
                              strokeWidth="3"
                            >
                              {edge.type}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {nodes.map((node) => {
                      const point = positions.get(node.id);
                      if (!point) return null;
                      const isSelected = node.id === selectedNodeId;
                      const isMatched = matchingNodeIds.has(node.id);
                      const isNeighbor = connectedNodeIds.has(node.id);
                      const isFocused = node.id === focusedNodeId;
                      const highlighted = isSelected || isNeighbor || isMatched || isFocused;
                      const opacity = hasActiveFilter ? (highlighted ? 1 : 0.14) : 1;
                      const radius = 6.5 + Math.min(4, Math.sqrt(degreeById.get(node.id) ?? 0));
                      const shouldShowLabel = nodes.length <= 32 || isSelected || isFocused || (hasActiveFilter && isMatched);
                      const color = colorForType(node.type);
                      return (
                        <g
                          key={node.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${node.label}, ${node.type}${isSelected ? ", selected" : ""}`}
                          aria-pressed={isSelected}
                          onFocus={() => setFocusedNodeId(node.id)}
                          onBlur={() => setFocusedNodeId(null)}
                          onKeyDown={(event) => handleNodeKeyDown(event, node.id)}
                          data-graph-node="true"
                          className="group cursor-pointer outline-none"
                          opacity={opacity}
                        >
                          <title>{`${node.label} · ${node.type} · ${node.domainId ?? node.id}`}</title>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={radius}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="40"
                            pointerEvents="stroke"
                            vectorEffect="non-scaling-stroke"
                            aria-hidden="true"
                          />
                          {isSelected && <circle cx={point.x} cy={point.y} r={radius + 8} fill={color} fillOpacity="0.13" />}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={radius + 6}
                            fill="none"
                            stroke="#f8fafc"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
                            vectorEffect="non-scaling-stroke"
                          />
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={isSelected ? radius + 1.8 : radius}
                            fill={color}
                            fillOpacity={isSelected ? 1 : 0.88}
                            stroke={isSelected ? "#ecfeff" : "#070b14"}
                            strokeWidth={isSelected ? 2.5 : 2}
                            vectorEffect="non-scaling-stroke"
                          />
                          {shouldShowLabel && (
                            <text
                              x={point.x}
                              y={point.y + radius + 14}
                              textAnchor="middle"
                              className={isSelected ? "fill-white" : "fill-slate-300"}
                              fontSize={isSelected ? "11" : "9"}
                              fontWeight={isSelected ? "700" : "500"}
                              paintOrder="stroke"
                              stroke="#070b14"
                              strokeWidth="3"
                            >
                              {node.label.length > 27 ? `${node.label.slice(0, 25)}…` : node.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>
                <div className="absolute bottom-3 left-3 z-20 rounded-lg border border-slate-800/80 bg-[#0b1220]/90 px-3 py-2 text-[10px] text-slate-400 backdrop-blur">
                  {hasActiveFilter ? `${formatCount(matchingNodeIds.size)} matching nodes · others dimmed` : "Select a node to inspect · drag blank canvas to pan"}
                </div>
                <div className="absolute bottom-3 right-3 z-20 rounded-lg border border-slate-800/80 bg-[#0b1220]/90 px-2.5 py-1.5 text-[10px] text-slate-400 backdrop-blur">{Math.round(zoom * 100)}%</div>
              </>
            )}

            {isLoading && !graph && <div className="absolute inset-0 z-20 flex items-center justify-center"><ApiLoading label="Loading graph visualization…" /></div>}
            {isLoading && graph && <div className="absolute right-3 top-3 z-20 rounded-lg border border-cyan-500/30 bg-[#0b1220]/90 px-3 py-2 text-[10px] text-cyan-200">Refreshing graph…</div>}
            {emptyGraph && !isLoading && error === null && (
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
                <Network className="mb-3 h-8 w-8 text-slate-500" />
                <div className="text-sm font-semibold text-slate-200">No graph data yet</div>
                <div className="mt-1 max-w-sm text-xs text-slate-500">The visualization API returned no nodes or relationships.</div>
              </div>
            )}
            {!graph && !isLoading && error !== null && (
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
                <Network className="mb-3 h-8 w-8 text-amber-400" />
                <div className="text-sm font-semibold text-amber-200">Graph visualization unavailable</div>
                <div className="mt-1 max-w-sm text-xs text-amber-300/80">Retry to load nodes and relationships from the graph service.</div>
                <button type="button" onClick={() => void loadGraph()} className="mt-4 rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/10">Retry</button>
              </div>
            )}
          </div>

          {graph && nodes.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-800 bg-[#0b1220]/75 px-4 py-3">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Legend</span>
              {nodeTypes.map((type) => (
                <span key={type} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorForType(type), boxShadow: `0 0 8px ${colorForType(type)}55` }} />
                  {type}
                </span>
              ))}
              <span className="ml-auto text-[10px] text-slate-500">{formatCount(nodes.length)} nodes · {formatCount(edges.length)} edges</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-slate-800 bg-[#0b1220]/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100"><Network className="h-4 w-4 text-cyan-400" />Entity inspector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="flex items-center gap-2" style={{ color: colorForType(selectedNode.type) }}>
                    {typeIcon(selectedNode.type)}
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{selectedNode.type}</span>
                  </div>
                  <div className="break-words text-base font-bold text-white">{selectedNode.label}</div>
                  <div className="font-mono text-[10px] text-slate-500">{selectedNode.domainId ?? `Graph node ${selectedNode.id}`}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
                    <span>Connected relationships</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{connectedEdges.length}</span>
                  </div>
                  {connectedEdges.length > 0 ? (
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {connectedEdges.map((edge: GraphVisualizationEdge) => {
                        const neighborId = edge.source === selectedNode.id ? edge.target : edge.source;
                        const neighbor = nodeById.get(neighborId);
                        return (
                          <button
                            key={edge.id}
                            type="button"
                            onClick={() => handleRelatedNodeClick(neighborId)}
                            className="flex w-full items-start justify-between gap-2 rounded-lg border border-slate-800 bg-[#0f172a] p-2 text-left transition-colors hover:border-cyan-500/40"
                            title={`Inspect ${neighbor?.label ?? neighborId}`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-mono text-[10px] text-cyan-300">{edge.type}</span>
                              <span className="mt-0.5 block truncate text-[11px] text-slate-200">{neighbor?.label ?? neighborId}</span>
                            </span>
                            <span className="shrink-0 font-mono text-[9px] text-slate-500">{edge.source === selectedNode.id ? "→" : "←"}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-800 px-3 py-4 text-center text-[11px] text-slate-500">No relationships are connected to this node.</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-semibold uppercase text-slate-400">Properties</div>
                  {Object.keys(selectedNode.properties ?? {}).length > 0 ? (
                    <dl className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-slate-800 bg-[#0f172a] p-3">
                      {Object.entries(selectedNode.properties ?? {}).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 text-[10px]">
                          <dt className="break-words text-slate-500">{key.replaceAll("_", " ")}</dt>
                          <dd className="break-words text-right text-slate-200">{readableValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-800 px-3 py-4 text-center text-[11px] text-slate-500">No properties were returned for this node.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <Network className="mb-3 h-7 w-7 text-slate-600" />
                <div className="text-xs font-medium text-slate-300">Select a graph node</div>
                <div className="mt-1 max-w-[220px] text-[11px] text-slate-500">Click a node to see its details and connected relationships.</div>
              </div>
            )}
            </CardContent>
          </Card>

          {!demoEnabled && (
            <Card className="border-slate-800 bg-[#0b1220]/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Building className="h-4 w-4 text-amber-400" />Verified supplier risks
                  <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">{supplierRisks.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isSupplierRiskLoading ? (
                  <div className="py-6 text-center text-xs text-slate-500">Loading supplier risk findings…</div>
                ) : supplierRiskError !== null ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-4 text-center text-xs text-amber-200">Supplier risk findings are unavailable right now.</div>
                ) : supplierRisks.length > 0 ? (
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {supplierRisks.map((risk) => (
                      <div key={risk.supplier_id} className="rounded-xl border border-slate-800 bg-[#0f172a] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2 font-semibold text-white">
                            <Building className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            <span className="truncate">{risk.supplier_name}</span>
                          </span>
                          <Badge variant={risk.supplier_rating === null ? "Pending" : risk.supplier_rating < 3.5 ? "Warning" : "Healthy"} size="sm">
                            {risk.supplier_rating ?? "Not rated"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400">
                          {risk.affected_equipment_count} affected assets · {risk.failure_link_count} risk links
                        </div>
                        <div className="mt-1 text-[10px] text-slate-300">
                          {risk.failure_mode_names.join(", ") || "Failure modes unavailable"}
                        </div>
                        {Object.keys(risk.severity_breakdown).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(risk.severity_breakdown).map(([severity, count]) => (
                              <span key={severity} className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] capitalize text-slate-300">
                                {severity}: {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">No verified supplier risk findings were returned.</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
