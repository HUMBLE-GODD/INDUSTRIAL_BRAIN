import React from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { ApiError } from "@/lib/api/client";

export function ApiLoading({ label = "Loading live data…" }: { label?: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b1220]/70 px-4 py-3 text-xs text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin text-cyan-400" />{label}</div>;
}

export function ApiUnavailable({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const requiresSignIn = error instanceof ApiError && error.status === 401;
  const message = error instanceof ApiError
    ? error.status === 401
      ? error.code === "authentication_required"
        ? "Sign in from the header to load live data."
        : "Your session expired. Sign in again to load live data."
      : error.status === 0
        ? "The API cannot be reached. Check the configured API URL and network connection."
        : "This live service is unavailable in the current environment."
    : "This live service is unavailable in the current environment.";
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-200"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" />{message}</span>{onRetry && !requiresSignIn && <button onClick={onRetry} className="rounded-lg border border-amber-500/40 px-3 py-1.5 font-medium hover:bg-amber-500/10">Retry</button>}</div>;
}

export function ApiEmpty({ label = "No live data is available yet." }: { label?: string }) {
  return <div className="rounded-xl border border-slate-800 bg-[#0b1220]/60 px-4 py-8 text-center text-xs text-slate-500">{label}</div>;
}

export function ApiPending({ feature }: { feature: string }) {
  return <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-6 text-center text-xs text-amber-200">{feature} is waiting for its verified backend API contract. Demo data is hidden until demo mode is explicitly enabled.</div>;
}

export function DemoDataNotice() {
  return <div role="status" className="rounded-xl border border-purple-500/30 bg-purple-950/20 px-4 py-2.5 text-[11px] font-medium text-purple-200">DEMO DATA — values shown here are local previews and are not live operational data.</div>;
}
