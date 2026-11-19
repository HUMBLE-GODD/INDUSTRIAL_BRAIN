import React from "react";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DonutChartProps {
  total: number;
  totalLabel?: string;
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function DonutChart({
  total,
  totalLabel = "Total",
  segments,
  size = 170,
  strokeWidth = 16,
  className,
}: DonutChartProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-6",
        className
      )}
    >
      {/* SVG Donut Circle */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
        >
          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {segments.map((segment, index) => {
            const strokeDasharray = `${
              (segment.percentage / 100) * circumference
            } ${circumference}`;
            const strokeDashoffset = -(
              (accumulatedPercent / 100) *
              circumference
            );
            accumulatedPercent += segment.percentage;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 hover:opacity-90"
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-3xl font-bold text-white tracking-tight leading-none">
            {total}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend on the right */}
      <div className="flex flex-col justify-center gap-2.5 w-full max-w-[210px]">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-xs py-0.5 group cursor-default"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                {segment.count} {segment.label}
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {segment.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
