import React from "react";
import { cn } from "@/lib/utils";

interface BrainLogoProps {
  className?: string;
  size?: number;
}

export function BrainLogo({ className, size = 38 }: BrainLogoProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-950/60 to-[#0c1a2e] border border-cyan-500/40 p-2 shadow-[0_0_20px_-3px_rgba(6,182,212,0.5)] group-hover:border-cyan-400 group-hover:shadow-[0_0_25px_-2px_rgba(0,229,255,0.7)] transition-all shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-cyan-400 transition-transform group-hover:scale-105"
      >
        <defs>
          <linearGradient id="brain-glow-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <filter id="brain-neon-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#00E5FF" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Central Hemisphere Divider */}
        <path
          d="M24 6 V42"
          stroke="url(#brain-glow-grad)"
          strokeWidth="1.8"
          strokeDasharray="2 2"
          opacity="0.6"
        />

        {/* Left Hemisphere Circuits & Lobes */}
        <path
          d="M24 8 C18 7 12 11 10 16 C8 21 8 28 11 32 C13 36 18 40 24 41"
          stroke="url(#brain-glow-grad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#brain-neon-filter)"
        />
        <path
          d="M24 14 H16 C13 14 11 17 12 20 C13 22 16 23 18 23 H24"
          stroke="url(#brain-glow-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 28 H17 C14 28 12 31 14 34 C16 36 20 36 24 35"
          stroke="url(#brain-glow-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Hemisphere Circuits & Lobes */}
        <path
          d="M24 8 C30 7 36 11 38 16 C40 21 40 28 37 32 C35 36 30 40 24 41"
          stroke="url(#brain-glow-grad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#brain-neon-filter)"
        />
        <path
          d="M24 14 H32 C35 14 37 17 36 20 C35 22 32 23 30 23 H24"
          stroke="url(#brain-glow-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 28 H31 C34 28 36 31 34 34 C32 36 28 36 24 35"
          stroke="url(#brain-glow-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cyber Synapse Nodes (Glowing Dots) */}
        <circle cx="16" cy="14" r="2" fill="#00E5FF" />
        <circle cx="18" cy="23" r="2" fill="#00E5FF" />
        <circle cx="17" cy="28" r="2" fill="#00E5FF" />
        <circle cx="32" cy="14" r="2" fill="#00E5FF" />
        <circle cx="30" cy="23" r="2" fill="#00E5FF" />
        <circle cx="31" cy="28" r="2" fill="#00E5FF" />
        <circle cx="24" cy="8" r="2.2" fill="#FFFFFF" />
        <circle cx="24" cy="41" r="2.2" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
