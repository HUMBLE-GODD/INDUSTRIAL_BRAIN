"use client";

import React, { useState } from "react";
import { Send, Bot, User, ArrowUpRight, HelpCircle, History } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockAiQueryData } from "@/data/mockData";
import { aiApi } from "@/lib/api/services";
import { ApiUnavailable, DemoDataNotice } from "@/components/ui/ApiState";
import type { AiCitation } from "@/lib/api/types";

type ConversationMessage = { role: "user" | "assistant"; content: string; timestamp: string; relatedAssets?: string[]; citations?: AiCitation[]; disclaimer?: string | null; sourceMode?: string };

export default function AiQueryPage() {
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>(
    process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true" ? mockAiQueryData.sampleConversation as ConversationMessage[] : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    const userMsg = {
      role: "user" as const,
      content: q,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);
    setError(null);
    if (demoEnabled) {
      const normalized = q.toLowerCase();
      let content = "No matching example is in the local fixture. Try a question about EQ-001, EpsilonValves, bearing overheating, or the seeded equipment links.";
      let relatedAssets: string[] = [];

      if (normalized.includes("epsilon") || normalized.includes("supplier") || normalized.includes("risk")) {
        content = "The synthetic graph fixture links low-rated supplier EpsilonValves Ltd (SUP-005) to three assets: EQ-002 (Heat Exchanger HX-202), EQ-003 (Compressor C-305), and EQ-005 (Boiler BLR-501). Its linked components include Shell Gasket, Inlet Valve, and Safety Relief Valve; the fixture has high and critical failure-mode links. This is graph seed data, not a live plant finding.";
        relatedAssets = ["SUP-005 · EpsilonValves Ltd", "EQ-002", "EQ-003", "EQ-005"];
      } else if (normalized.includes("bearing")) {
        content = "The synthetic graph links Bearing Overheating (FM-002) to CMP-002 on EQ-001 and CMP-010 on EQ-004. The fixture marks this failure mode as critical; check the source records before using it operationally.";
        relatedAssets = ["FM-002 · Bearing Overheating", "CMP-002 · EQ-001", "CMP-010 · EQ-004"];
      } else if (normalized.includes("boiler") || normalized.includes("eq-005")) {
        content = "The seeded graph links Boiler BLR-501 (EQ-005) to Safety Relief Valve (CMP-011) and Water Pump (CMP-012). CMP-011 is linked to the Pressure Buildup failure mode (FM-005), marked critical in the fixture.";
        relatedAssets = ["EQ-005 · Boiler BLR-501", "CMP-011 · Safety Relief Valve", "FM-005 · Pressure Buildup"];
      } else if (normalized.includes("similar")) {
        content = "The local graph fixture marks EQ-001 ↔ EQ-005 and EQ-002 ↔ EQ-003 as SIMILAR_TO pairs. These are sample graph links, not similarity-model results.";
        relatedAssets = ["EQ-001 ↔ EQ-005", "EQ-002 ↔ EQ-003"];
      } else if (normalized.includes("pump") || normalized.includes("eq-001")) {
        content = "Local seed data links Pump P-101 (EQ-001) to Mechanical Seal (CMP-001), Drive Shaft Bearing (CMP-002), and Impeller (CMP-003). The API and graph demo seeds use the same canonical equipment ID.";
        relatedAssets = ["EQ-001 · Pump P-101", "CMP-001 · Mechanical Seal", "CMP-002 · Drive Shaft Bearing", "CMP-003 · Impeller"];
      }

      setMessages((prev) => [...prev, {
        role: "assistant",
        content,
        timestamp: "Just now",
        relatedAssets,
        sourceMode: "local synthetic fixture",
        disclaimer: "Demo answer from local sample records; no API, document retrieval, or language model was called.",
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const result = await aiApi.query(q);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer || "The API returned an empty answer.",
          timestamp: "Just now",
          relatedAssets: result.citations?.map((citation) => citation.title) || [],
          citations: result.citations,
          disclaimer: result.disclaimer,
          sourceMode: result.source_mode,
        },
      ]);
    } catch (requestError) {
      setError(requestError);
      if (requestError instanceof Error && "isUnauthorized" in requestError) setQuery(q);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {demoEnabled && <DemoDataNotice />}
      <PageHeader
        title="AI Query Assistant"
        description={demoEnabled ? "Explore example answers from the local synthetic equipment and graph fixture." : "Query indexed documents and equipment risk evidence from the connected API."}
        badge={<Badge variant={demoEnabled ? "Info" : "Pending"} dot>{demoEnabled ? "Local Fixture Demo" : "API Query"}</Badge>}
        actions={
          <Button variant="secondary" size="sm" icon={<History className="w-4 h-4" />}>
            Query History
          </Button>
        }
      />
      {error !== null && <ApiUnavailable error={error} />}

      {/* Suggested Questions Grid */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          Suggested Questions
        </span>
        <div className="flex flex-wrap gap-2">
          {mockAiQueryData.suggestedQuestions.map((question, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(question);
                handleAsk(question);
              }}
              className="text-xs bg-[#0f172a] hover:bg-[#162035] text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 rounded-xl px-3 py-2 transition-all flex items-center gap-1.5 group text-left"
            >
              <span>{question}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Conversation / Query Area */}
      <Card className="bg-[#0b1220]/90 border-slate-800 flex flex-col min-h-[480px]">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            Operations Intelligence Dialogue
          </CardTitle>
        </CardHeader>

        {/* Message Stream */}
        <CardContent className="flex-1 space-y-4 overflow-y-auto max-h-[500px] p-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-950/40 border border-purple-800/60 text-slate-100 rounded-tr-sm"
                    : "bg-[#0f182c] border border-slate-700/80 text-slate-200 rounded-tl-sm"
                }`}
              >
                <div className="whitespace-pre-line font-sans">{msg.content}</div>

                {msg.sourceMode && <div className="mt-2 text-[10px] text-slate-400">Source mode: <span className="text-cyan-300">{msg.sourceMode}</span></div>}
                {msg.disclaimer && <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-950/20 px-2 py-1.5 text-[10px] text-amber-200">{msg.disclaimer}</div>}
                {(msg.relatedAssets || msg.citations) && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Citations & References:
                    </span>
                    {msg.citations?.map((citation) => {
                      const params = new URLSearchParams({ document: citation.document_id });
                      if (citation.page) params.set("page", citation.page);
                      if (citation.chunk_id) params.set("chunk", citation.chunk_id);
                      if (citation.excerpt) params.set("excerpt", citation.excerpt);
                      return (
                        <a
                          key={`${citation.document_id}-${citation.chunk_id}`}
                          href={`/documents?${params.toString()}#citation-evidence`}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 border border-slate-700 hover:border-cyan-400"
                          aria-label={`Open ${citation.title}${citation.page ? `, page ${citation.page}` : ""} citation`}
                        >
                          {citation.title}{citation.page ? ` · p. ${citation.page}` : ""}
                        </a>
                      );
                    })}
                    {!msg.citations && msg.relatedAssets?.map((asset, aIdx) => <span key={aIdx} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 border border-slate-700">{asset}</span>)}
                  </div>
                )}

                <div className="text-[10px] text-slate-500 mt-2 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0f182c] border border-slate-700/80 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {demoEnabled ? "Looking up local fixture records…" : "Retrieving indexed evidence…"}
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-[#090e1b] rounded-b-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about equipment, past RCA, SOPs, or failure risks..."
              className="flex-1 bg-[#11192d] text-slate-200 placeholder-slate-500 text-xs rounded-xl px-4 py-3 border border-slate-700/80 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Send className="w-4 h-4" />}
              disabled={!query.trim() || isLoading}
            >
              Ask AI
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
