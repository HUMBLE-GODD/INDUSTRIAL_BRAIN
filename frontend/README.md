# Industrial Brain — Intelligent Operations Platform

## Phase 1 → M5: Web Frontend Skeleton

Welcome to the **Industrial Brain** frontend platform. This repository contains the Next.js dark-themed operations dashboard with comprehensive UI components, responsive layout, and placeholder screens for all 8 core modules.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The application will be accessible at:
[http://localhost:3000](http://localhost:3000)

### 3. Run Production Build & Linting
```bash
npm run lint
npm run build
```

---

## 🧭 Routes & Modules

| Route | Module | Purpose |
|---|---|---|
| `/dashboard` | **Dashboard** | Main industrial operations dashboard with KPI stat cards, equipment health overview, alerts, timeline, and maintenance donut chart |
| `/ai-query` | **AI Query** | Natural language assistant for technical queries and telemetry lookups |
| `/knowledge-graph` | **Knowledge Graph** | Multi-hop asset, sensor, regulation, and team relation topology explorer |
| `/documents` | **Documents** | Technical documentation, SOPs, and inspection reports registry |
| `/maintenance` | **Maintenance** | Preventive and corrective maintenance pipelines and work order dispatcher |
| `/rca` | **RCA** | Root Cause Analysis causal decomposition (5-Whys) and prescriptive actions |
| `/compliance` | **Compliance** | ISO 45001, OSHA 1910, ISO 14001, and IEC 61508 compliance tracking |
| `/analytics` | **Analytics** | Industrial telemetry, OEE, MTBF/MTTR metrics, and failure trends |

---

## 🧩 Reusable Core UI Components

1. **`Sidebar`** (`src/components/Sidebar.tsx`): Responsive sidebar navigation with active highlight, categorized links, and system status waveform card.
2. **`Header`** (`src/components/Header.tsx`): Top bar with search input, ⌘K shortcut, quick alert count, user profile, and horizontal navigation tabs.
3. **`Button`** (`src/components/ui/Button.tsx`): Multi-variant buttons (`primary`, `secondary`, `ghost`, `danger`, `purple`, `outline`).
4. **`Card`** (`src/components/ui/Card.tsx`): Glassmorphism card container with sub-components (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
5. **`Badge`** (`src/components/ui/Badge.tsx`): Status badges (`Critical`, `Warning`, `Resolved`, `Healthy`, `Pending`, `Info`, `Scheduled`).
6. **`Modal`** (`src/components/ui/Modal.tsx`): Accessible dialog modal with backdrop blur and keyboard escape listener.
7. **`PageHeader`** (`src/components/ui/PageHeader.tsx`): Standardized page header with title, subtitle, and action buttons.
8. **`StatCard`** (`src/components/ui/StatCard.tsx`): KPI card with circular icon badge, delta indicator, 3-dots menu, and glowing wave sparkline.
9. **`Sparkline`** (`src/components/ui/Sparkline.tsx`): Dynamic SVG cubic bezier sparkline with glowing gradient drop-shadows.
10. **`ProgressBar`** (`src/components/ui/ProgressBar.tsx`): Glowing neon progress meter for equipment status and metrics.
11. **`DonutChart`** (`src/components/ui/DonutChart.tsx`): SVG ring chart with dynamic segments and interactive legend.
