"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockDocumentsData } from "@/data/mockData";
import { documentsApi } from "@/lib/api/services";
import type { DocumentRecord } from "@/lib/api/types";
import { ApiEmpty, ApiLoading, ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";

type CitationContext = {
  page: string | null;
  chunkId: string | null;
  excerpt: string | null;
};

export default function DocumentsPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [docs, setDocs] = useState<typeof mockDocumentsData>(demoEnabled ? mockDocumentsData : []);
  const [isLoading, setIsLoading] = useState(!demoEnabled);
  const [error, setError] = useState<unknown>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [citationContext, setCitationContext] = useState<CitationContext | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const citationEvidenceRef = useRef<HTMLDivElement>(null);

  const loadDocuments = useCallback(async () => {
    if (demoEnabled) {
      setDocs(mockDocumentsData);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await documentsApi.list();
      setDocs(result.map((doc: DocumentRecord) => ({
        id: doc.document_id,
        name: doc.title,
        category: doc.file_type.toUpperCase(),
        size: "—",
        uploadedBy: "API",
        updatedAt: doc.updated_at || doc.created_at,
        status: doc.status,
        type: doc.file_type.toLowerCase(),
      })) as typeof mockDocumentsData);
    } catch (requestError) { setError(requestError); }
    finally { setIsLoading(false); }
  }, [demoEnabled]);

  useEffect(() => { void Promise.resolve().then(loadDocuments); }, [loadDocuments]);

  useEffect(() => {
    if (demoEnabled) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      const params = new URLSearchParams(window.location.search);
      const documentId = params.get("document")?.trim();
      if (!documentId) return;

      const page = params.get("page");
      const chunkId = params.get("chunk");
      const excerpt = params.get("excerpt");
      setCitationContext(page || chunkId || excerpt ? { page, chunkId, excerpt } : null);
      setDetailLoading(true);
      setError(null);
      try {
        const document = await documentsApi.get(documentId);
        if (!cancelled) setSelectedDocument(document);
      } catch (requestError) {
        if (!cancelled) setError(requestError);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [demoEnabled]);

  useEffect(() => {
    if (!citationContext || detailLoading) return;
    const frame = window.requestAnimationFrame(() => {
      citationEvidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [citationContext, detailLoading]);

  const handleUpload = async (file?: File) => {
    if (!file || demoEnabled) return;
    setUploading(true); setError(null);
    try {
      await documentsApi.upload(file, { title: file.name });
      await loadDocuments();
    } catch (requestError) { setError(requestError); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (demoEnabled) return;
    setError(null);
    try { await documentsApi.remove(id); setDocs((current) => current.filter((doc) => doc.id !== id)); }
    catch (requestError) { setError(requestError); }
  };

  const handleDetail = async (id: string) => {
    if (demoEnabled) return;
    setCitationContext(null);
    setDetailLoading(true); setError(null);
    try { setSelectedDocument(await documentsApi.get(id)); }
    catch (requestError) { setError(requestError); }
    finally { setDetailLoading(false); }
  };

  const filteredDocs = docs.filter((doc) => {
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
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="Technical Documents & SOP Library"
        description="Centralized document store for engineering manuals, safety inspection logs, and sensor baselines."
        badge={<Badge variant={demoEnabled ? "Info" : "Healthy"} dot>{demoEnabled ? "Sample Documents" : `${docs.length} Documents`}</Badge>}
        actions={
          <Button variant="primary" size="sm" isLoading={uploading} disabled={demoEnabled} onClick={() => fileInput.current?.click()} icon={<UploadCloud className="w-4 h-4" />} title={demoEnabled ? "Switch to API mode to upload and index documents" : undefined}>
            Upload Document
          </Button>
        }
      />

      {/* Drag & Drop Upload Placeholder Area */}
      <input ref={fileInput} type="file" className="hidden" disabled={demoEnabled} onChange={(event) => { void handleUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} aria-label="Choose document to upload" />
      {error !== null && <ApiUnavailable error={error} onRetry={() => void loadDocuments()} />}
      {isLoading ? <ApiLoading label="Loading documents from the API…" /> : docs.length === 0 ? <ApiEmpty label="No documents are available from the API." /> : null}
      <div role={demoEnabled ? undefined : "button"} aria-disabled={demoEnabled} tabIndex={demoEnabled ? -1 : 0} onClick={() => { if (!demoEnabled) fileInput.current?.click(); }} onKeyDown={(event) => { if (!demoEnabled && (event.key === "Enter" || event.key === " ")) fileInput.current?.click(); }} className={`border-2 border-dashed border-slate-700/80 bg-[#0b1220]/60 rounded-2xl p-8 text-center transition-all group ${demoEnabled ? "cursor-not-allowed opacity-70" : "hover:border-cyan-500/50 cursor-pointer"}`}>
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          {demoEnabled ? "Sample document processing is shown in the local fixture" : "Click or drag files here to upload"}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {demoEnabled ? "Switch to API mode and sign in to upload, extract, and index a document." : "Supports PDF manuals, plain text, and CSV records up to 50MB."}
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
                    <button disabled={demoEnabled} onClick={() => void handleDetail(doc.id)} className="truncate max-w-xs text-left hover:text-cyan-300 disabled:cursor-default disabled:hover:text-white" title={demoEnabled ? "Sample fixture document" : "View document details"}>{doc.name}</button>
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
                      variant={doc.status.toLowerCase() === "processed" ? "Resolved" : doc.status.toLowerCase() === "failed" ? "Critical" : doc.status.toLowerCase() === "processing" ? "Pending" : "Info"}
                      size="sm"
                      dot
                    >
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => void handleDelete(doc.id)}
                        disabled={demoEnabled}
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
      <Card className="bg-[#0b1220]/90 border-slate-800">
        <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold text-slate-100">Document Details</div>
        <div className="p-5 text-xs text-slate-300">
          {detailLoading ? <ApiLoading label="Loading document details…" /> : selectedDocument ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-[10px] uppercase text-slate-500">Title</dt><dd className="mt-1 text-white">{selectedDocument.title}</dd></div>
              <div><dt className="text-[10px] uppercase text-slate-500">Document ID</dt><dd className="mt-1 font-mono text-cyan-300">{selectedDocument.document_id}</dd></div>
              <div><dt className="text-[10px] uppercase text-slate-500">File type</dt><dd className="mt-1">{selectedDocument.file_type}</dd></div>
              <div><dt className="text-[10px] uppercase text-slate-500">Processing status</dt><dd className="mt-1">{selectedDocument.status}</dd></div>
              <div><dt className="text-[10px] uppercase text-slate-500">Created</dt><dd className="mt-1">{selectedDocument.created_at}</dd></div>
              <div><dt className="text-[10px] uppercase text-slate-500">Updated</dt><dd className="mt-1">{selectedDocument.updated_at || "—"}</dd></div>
            </dl>
          ) : <ApiEmpty label="Select a document to inspect its metadata and processing status." />}
          <div ref={citationEvidenceRef} id="citation-evidence" className="scroll-mt-24">
            {citationContext && (
              <section aria-labelledby="citation-evidence-title" className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="citation-evidence-title" className="text-xs font-semibold text-cyan-200">Cited evidence</h3>
                {citationContext.page && <span className="text-[10px] text-slate-400">Page {citationContext.page}</span>}
              </div>
              {citationContext.excerpt ? (
                <blockquote className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-200">{citationContext.excerpt}</blockquote>
              ) : (
                <p className="mt-2 text-slate-400">No excerpt was included with this citation.</p>
              )}
              {citationContext.chunkId && <p className="mt-3 font-mono text-[10px] text-slate-500">Chunk {citationContext.chunkId}</p>}
              </section>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
