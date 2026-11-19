"use client";

import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  Search,
  Download,
  Trash2,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockDocumentsData } from "@/data/mockData";

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredDocs = mockDocumentsData.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || doc.category.toLowerCase().includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-400" />;
      case "csv":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileCode className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Technical Documents & SOP Library"
        description="Centralized document store for engineering manuals, safety inspection logs, and sensor baselines."
        badge={<Badge variant="Healthy" dot>5 Documents Indexed</Badge>}
        actions={
          <Button variant="primary" size="sm" icon={<UploadCloud className="w-4 h-4" />}>
            Upload Document
          </Button>
        }
      />

      {/* Drag & Drop Upload Placeholder Area */}
      <div className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/50 bg-[#0b1220]/60 rounded-2xl p-8 text-center transition-all cursor-pointer group">
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          Click or drag files here to upload
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Supports PDF manuals, CAD specifications, CSV telemetry logs, and ISO audit checklists up to 50MB.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b1220] p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full bg-[#11192d] text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700/80 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          {["all", "manual", "inspection", "safety", "telemetry"].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
                selectedFilter === f
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 bg-slate-800/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <Card className="bg-[#0b1220]/90 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0f172a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4">Vector Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-medium text-white flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {getDocIcon(doc.type)}
                    </div>
                    <span className="truncate max-w-xs">{doc.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{doc.category}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {doc.size}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{doc.uploadedBy}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {doc.updatedAt}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={doc.status === "Indexed" ? "Resolved" : "Pending"}
                      size="sm"
                      dot
                    >
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
