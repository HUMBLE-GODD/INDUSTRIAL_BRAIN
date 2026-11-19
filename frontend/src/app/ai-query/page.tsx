"use client";

import React, { useState } from "react";
import { Send, Bot, User, ArrowUpRight, HelpCircle, History } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockAiQueryData } from "@/data/mockData";

export default function AiQueryPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState(mockAiQueryData.sampleConversation);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    const userMsg = {
      role: "user",
      content: q,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    // Mock response simulation
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Analysis for "${q}": Based on connected telemetry logs and historical maintenance records, no critical anomalies are currently blocking operations, but regular inspection is advised.`,
          timestamp: "Just now",
          relatedAssets: ["Equipment Telemetry", "Log Index #4092"],
        },
      ]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="AI Query Assistant"
        description="Natural language queries across equipment telemetry, maintenance logs, and compliance standards."
        badge={<Badge variant="Pending" dot>AI Operations Ready</Badge>}
        actions={
          <Button variant="secondary" size="sm" icon={<History className="w-4 h-4" />}>
            Query History
          </Button>
        }
      />

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

                {msg.relatedAssets && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Citations & References:
                    </span>
                    {msg.relatedAssets.map((asset, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 border border-slate-700"
                      >
                        {asset}
                      </span>
                    ))}
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
                Synthesizing multi-modal knowledge graph...
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
