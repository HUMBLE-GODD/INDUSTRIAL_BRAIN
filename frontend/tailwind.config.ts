import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: {
          DEFAULT: "#0f1523",
          card: "#111827",
          panel: "#151d30",
          hover: "#1c263d",
          elevated: "#1e293b",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          DEFAULT: "#1e293b",
          highlight: "rgba(6, 182, 212, 0.3)",
        },
        cyber: {
          cyan: "#00E5FF",
          teal: "#06B6D4",
          purple: "#8B5CF6",
          purpleDark: "#6D28D9",
          rose: "#F43F5E",
          amber: "#F59E0B",
          emerald: "#10B981",
          blue: "#3B82F6",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B",
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.25)',
        'glow-purple': '0 0 20px -5px rgba(139, 92, 246, 0.25)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.25)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.25)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
