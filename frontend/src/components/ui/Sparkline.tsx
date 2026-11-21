import { useId } from "react";
import { cn } from "@/utils";

export interface SparklineProps {
  data: number[];
  color?: "cyan" | "purple" | "rose" | "amber" | "emerald" | "blue";
  height?: number;
  width?: number | string;
  className?: string;
  showFill?: boolean;
}

export function Sparkline({
  data,
  color = "cyan",
  height = 36,
  width = "100%",
  className,
  showFill = true,
}: SparklineProps) {
  const reactId = useId().replaceAll(":", "");
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const paddingY = 4;
  const effectiveHeight = height - paddingY * 2;
  const svgWidth = 140;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * svgWidth;
    const y =
      height -
      paddingY -
      ((val - min) / range) * effectiveHeight;
    return { x, y };
  });

  // Generate smooth cubic bezier SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  const fillPathD = `${pathD} L ${svgWidth} ${height} L 0 ${height} Z`;

  const colorConfig = {
    cyan: {
      stroke: "#06B6D4",
      glow: "rgba(6, 182, 212, 0.4)",
      gradStart: "rgba(6, 182, 212, 0.25)",
      gradEnd: "rgba(6, 182, 212, 0.0)",
    },
    purple: {
      stroke: "#A855F7",
      glow: "rgba(168, 85, 247, 0.4)",
      gradStart: "rgba(168, 85, 247, 0.25)",
      gradEnd: "rgba(168, 85, 247, 0.0)",
    },
    rose: {
      stroke: "#F43F5E",
      glow: "rgba(244, 63, 94, 0.4)",
      gradStart: "rgba(244, 63, 94, 0.25)",
      gradEnd: "rgba(244, 63, 94, 0.0)",
    },
    amber: {
      stroke: "#F59E0B",
      glow: "rgba(245, 158, 11, 0.4)",
      gradStart: "rgba(245, 158, 11, 0.25)",
      gradEnd: "rgba(245, 158, 11, 0.0)",
    },
    emerald: {
      stroke: "#10B981",
      glow: "rgba(16, 185, 129, 0.4)",
      gradStart: "rgba(16, 185, 129, 0.25)",
      gradEnd: "rgba(16, 185, 129, 0.0)",
    },
    blue: {
      stroke: "#3B82F6",
      glow: "rgba(59, 130, 246, 0.4)",
      gradStart: "rgba(59, 130, 246, 0.25)",
      gradEnd: "rgba(59, 130, 246, 0.0)",
    },
  };

  const theme = colorConfig[color];
  const gradientId = `sparkline-grad-${color}-${reactId}`;

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        style={{ width, height }}
        className="overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.gradStart} />
            <stop offset="100%" stopColor={theme.gradEnd} />
          </linearGradient>
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={theme.stroke} floodOpacity="0.6" />
          </filter>
        </defs>

        {showFill && <path d={fillPathD} fill={`url(#${gradientId})`} />}

        <path
          d={pathD}
          fill="none"
          stroke={theme.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${gradientId})`}
        />
      </svg>
    </div>
  );
}
