// Local demo records mirror the equipment identities seeded by
// Knowledge Graph Setup/seed.py. These values are not fetched from an API.
export const mockEquipmentCatalog = [
  { id: "EQ-001", name: "Pump P-101", type: "Pump", status: "operational", criticality: "high" },
  { id: "EQ-002", name: "Heat Exchanger HX-202", type: "Heat Exchanger", status: "operational", criticality: "medium" },
  { id: "EQ-003", name: "Compressor C-305", type: "Compressor", status: "maintenance", criticality: "high" },
  { id: "EQ-004", name: "Conveyor CB-410", type: "Conveyor", status: "operational", criticality: "low" },
  { id: "EQ-005", name: "Boiler BLR-501", type: "Boiler", status: "operational", criticality: "critical" },
] as const;

export interface EquipmentItem {
  id: string;
  name: string;
  metric: string;
  health: number;
  status: "normal" | "warning" | "critical";
  color: "cyan" | "amber" | "rose";
  sparkline: number[];
}

export interface AlertItem {
  id: string;
  severity: "Critical" | "Warning" | "Resolved" | "Info";
  title: string;
  time: string;
  equipmentId?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  type: "work_order" | "report" | "compliance" | "equipment" | "maintenance";
  color: string;
}

export interface MaintenanceSegment {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export const mockDashboardData = {
  stats: [
    {
      title: "EQUIPMENT HEALTH",
      value: "94%",
      change: "▲ 2.4% from yesterday",
      changeType: "positive" as const,
      color: "cyan" as const,
      icon: "activity",
      sparkline: [82, 85, 84, 88, 87, 91, 94],
    },
    {
      title: "ACTIVE ALERTS",
      value: "12",
      change: "▲ 3 new alerts",
      changeType: "alert" as const,
      color: "purple" as const,
      icon: "bell",
      sparkline: [6, 8, 7, 9, 10, 11, 12],
    },
    {
      title: "CRITICAL EQUIPMENT",
      value: "3",
      change: "View critical assets",
      changeType: "neutral" as const,
      color: "rose" as const,
      icon: "alertTriangle",
      sparkline: [5, 4, 4, 3, 4, 3, 3],
    },
    {
      title: "COMPLIANCE SCORE",
      value: "91%",
      change: "▲ 1.8% from last week",
      changeType: "positive" as const,
      color: "amber" as const,
      icon: "shield",
      sparkline: [86, 87, 88, 89, 90, 90, 91],
    },
  ],

  equipmentHealth: [
    {
      id: "EQ-001",
      name: "Pump P-101",
      metric: "Pressure • Normal",
      health: 92,
      status: "normal",
      color: "cyan",
      sparkline: [88, 90, 89, 93, 91, 92],
    },
    {
      id: "EQ-002",
      name: "Heat Exchanger HX-202",
      metric: "Thermal Transfer • Normal",
      health: 81,
      status: "normal",
      color: "cyan",
      sparkline: [75, 78, 80, 79, 82, 81],
    },
    {
      id: "EQ-003",
      name: "Compressor C-305",
      metric: "Maintenance • In Progress",
      health: 65,
      status: "warning",
      color: "amber",
      sparkline: [78, 74, 70, 68, 66, 65],
    },
    {
      id: "EQ-004",
      name: "Conveyor CB-410",
      metric: "Belt • Normal",
      health: 89,
      status: "normal",
      color: "cyan",
      sparkline: [85, 87, 86, 88, 90, 89],
    },
    {
      id: "EQ-005",
      name: "Boiler BLR-501",
      metric: "Pressure • Normal",
      health: 95,
      status: "normal",
      color: "cyan",
      sparkline: [92, 93, 94, 95, 94, 95],
    },
  ] as EquipmentItem[],

  recentAlerts: [
    {
      id: "alt-1",
      severity: "Critical",
      title: "Pump P-101 requires inspection",
      time: "12 min ago",
      equipmentId: "EQ-001",
    },
    {
      id: "alt-2",
      severity: "Warning",
      title: "Heat Exchanger HX-202 thermal performance review",
      time: "46 min ago",
      equipmentId: "EQ-002",
    },
    {
      id: "alt-3",
      severity: "Resolved",
      title: "Compressor C-305 maintenance in progress",
      time: "2 hr ago",
      equipmentId: "EQ-003",
    },
    {
      id: "alt-4",
      severity: "Warning",
      title: "Conveyor CB-410 belt inspection due",
      time: "3 hr ago",
      equipmentId: "EQ-004",
    },
    {
      id: "alt-5",
      severity: "Info",
      title: "Boiler BLR-501 safety valve review due",
      time: "5 hr ago",
      equipmentId: "EQ-005",
    },
  ] as AlertItem[],

  recentActivity: [
    {
      id: "act-1",
      title: "Work order WO-2048 assigned to Field Team A",
      time: "08:42 AM",
      type: "work_order",
      color: "#3B82F6",
    },
    {
      id: "act-2",
      title: "Inspection report uploaded for Pump P-101 (EQ-001)",
      time: "Yesterday",
      type: "report",
      color: "#10B981",
    },
    {
      id: "act-3",
      title: "Compliance review completed for ISO 45001",
      time: "Yesterday",
      type: "compliance",
      color: "#8B5CF6",
    },
    {
      id: "act-4",
      title: "Equipment review opened: Compressor C-305 (EQ-003)",
      time: "2 days ago",
      type: "equipment",
      color: "#06B6D4",
    },
    {
      id: "act-5",
      title: "Maintenance scheduled for Conveyor CB-410 (EQ-004)",
      time: "2 days ago",
      type: "maintenance",
      color: "#F59E0B",
    },
  ] as ActivityItem[],

  maintenanceOverview: {
    total: 28,
    segments: [
      { label: "Overdue", count: 8, percentage: 29, color: "#F43F5E" },
      { label: "Due This Week", count: 7, percentage: 25, color: "#F59E0B" },
      { label: "Due This Month", count: 6, percentage: 21, color: "#3B82F6" },
      { label: "Scheduled", count: 7, percentage: 25, color: "#10B981" },
    ] as MaintenanceSegment[],
  },
};

// AI Query Mock Data
export const mockAiQueryData = {
  suggestedQuestions: [
    "Which components belong to Pump P-101 (EQ-001)?",
    "Which seeded assets use parts from EpsilonValves Ltd?",
    "Which components are linked to Bearing Overheating?",
    "Which equipment pairs are marked SIMILAR_TO in the seed data?",
    "Which components belong to Boiler BLR-501 (EQ-005)?",
  ],
  sampleConversation: [
    {
      role: "user",
      content: "Which components belong to Pump P-101 (EQ-001)?",
      timestamp: "10:14 AM",
    },
    {
      role: "assistant",
      content:
        "Local seed data links **Pump P-101 (EQ-001)** to three components:\n- Mechanical Seal (CMP-001), supplied by AlphaSeals Ltd\n- Drive Shaft Bearing (CMP-002), supplied by BetaBearings Inc\n- Impeller (CMP-003), supplied by GammaFluids Co\n\nThis sample answer uses graph-fixture relationships only; it does not query live maintenance records or documents.",
      timestamp: "10:14 AM",
      relatedAssets: ["EQ-001 · Pump P-101", "CMP-001 · Mechanical Seal", "CMP-002 · Drive Shaft Bearing", "CMP-003 · Impeller"],
    },
  ],
};

// Local graph sample mirrors the node and relationship records in seed.py.
export const mockGraphData = {
  nodes: [
    { id: "EQ-001", label: "Pump P-101", type: "Equipment", status: "operational", group: "equipment" },
    { id: "EQ-002", label: "Heat Exchanger HX-202", type: "Equipment", status: "operational", group: "equipment" },
    { id: "EQ-003", label: "Compressor C-305", type: "Equipment", status: "maintenance", group: "equipment" },
    { id: "EQ-004", label: "Conveyor CB-410", type: "Equipment", status: "operational", group: "equipment" },
    { id: "EQ-005", label: "Boiler BLR-501", type: "Equipment", status: "operational", group: "equipment" },
    { id: "CMP-001", label: "Mechanical Seal", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-002", label: "Drive Shaft Bearing", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-003", label: "Impeller", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-004", label: "Tube Bundle", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-005", label: "Shell Gasket", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-006", label: "Inlet Valve", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-007", label: "Rotor Assembly", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-008", label: "Piston Ring", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-009", label: "Drive Belt", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-010", label: "Roller Bearing", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-011", label: "Safety Relief Valve", type: "Component", status: "seeded", group: "components" },
    { id: "CMP-012", label: "Water Pump", type: "Component", status: "seeded", group: "components" },
    { id: "SUP-001", label: "AlphaSeals Ltd", type: "Supplier", status: "seeded", group: "suppliers" },
    { id: "SUP-002", label: "BetaBearings Inc", type: "Supplier", status: "seeded", group: "suppliers" },
    { id: "SUP-003", label: "GammaFluids Co", type: "Supplier", status: "seeded", group: "suppliers" },
    { id: "SUP-004", label: "DeltaMotors GmbH", type: "Supplier", status: "seeded", group: "suppliers" },
    { id: "SUP-005", label: "EpsilonValves Ltd", type: "Supplier", status: "seeded", group: "suppliers" },
    { id: "LOC-001", label: "Plant A — Floor 1", type: "Location", status: "seeded", group: "locations" },
    { id: "LOC-002", label: "Plant A — Floor 2", type: "Location", status: "seeded", group: "locations" },
    { id: "LOC-003", label: "Plant B — Outdoor", type: "Location", status: "seeded", group: "locations" },
    { id: "FM-001", label: "Seal Leakage", type: "Failure Mode", status: "high severity", group: "failure-modes" },
    { id: "FM-002", label: "Bearing Overheating", type: "Failure Mode", status: "critical severity", group: "failure-modes" },
    { id: "FM-003", label: "Valve Sticking", type: "Failure Mode", status: "medium severity", group: "failure-modes" },
    { id: "FM-004", label: "Belt Slippage", type: "Failure Mode", status: "low severity", group: "failure-modes" },
    { id: "FM-005", label: "Pressure Buildup", type: "Failure Mode", status: "critical severity", group: "failure-modes" },
  ],
  links: [
    { source: "EQ-001", target: "LOC-001", label: "LOCATED_AT" },
    { source: "EQ-002", target: "LOC-001", label: "LOCATED_AT" },
    { source: "EQ-003", target: "LOC-002", label: "LOCATED_AT" },
    { source: "EQ-004", target: "LOC-003", label: "LOCATED_AT" },
    { source: "EQ-005", target: "LOC-002", label: "LOCATED_AT" },
    { source: "EQ-001", target: "CMP-001", label: "HAS_COMPONENT" },
    { source: "EQ-001", target: "CMP-002", label: "HAS_COMPONENT" },
    { source: "EQ-001", target: "CMP-003", label: "HAS_COMPONENT" },
    { source: "EQ-002", target: "CMP-004", label: "HAS_COMPONENT" },
    { source: "EQ-002", target: "CMP-005", label: "HAS_COMPONENT" },
    { source: "EQ-003", target: "CMP-006", label: "HAS_COMPONENT" },
    { source: "EQ-003", target: "CMP-007", label: "HAS_COMPONENT" },
    { source: "EQ-003", target: "CMP-008", label: "HAS_COMPONENT" },
    { source: "EQ-004", target: "CMP-009", label: "HAS_COMPONENT" },
    { source: "EQ-004", target: "CMP-010", label: "HAS_COMPONENT" },
    { source: "EQ-005", target: "CMP-011", label: "HAS_COMPONENT" },
    { source: "EQ-005", target: "CMP-012", label: "HAS_COMPONENT" },
    { source: "CMP-001", target: "SUP-001", label: "SUPPLIED_BY" },
    { source: "CMP-002", target: "SUP-002", label: "SUPPLIED_BY" },
    { source: "CMP-003", target: "SUP-003", label: "SUPPLIED_BY" },
    { source: "CMP-004", target: "SUP-003", label: "SUPPLIED_BY" },
    { source: "CMP-005", target: "SUP-005", label: "SUPPLIED_BY" },
    { source: "CMP-006", target: "SUP-005", label: "SUPPLIED_BY" },
    { source: "CMP-007", target: "SUP-004", label: "SUPPLIED_BY" },
    { source: "CMP-008", target: "SUP-002", label: "SUPPLIED_BY" },
    { source: "CMP-009", target: "SUP-001", label: "SUPPLIED_BY" },
    { source: "CMP-010", target: "SUP-002", label: "SUPPLIED_BY" },
    { source: "CMP-011", target: "SUP-005", label: "SUPPLIED_BY" },
    { source: "CMP-012", target: "SUP-001", label: "SUPPLIED_BY" },
    { source: "CMP-005", target: "FM-001", label: "PRONE_TO" },
    { source: "CMP-001", target: "FM-001", label: "PRONE_TO" },
    { source: "CMP-002", target: "FM-002", label: "PRONE_TO" },
    { source: "CMP-006", target: "FM-003", label: "PRONE_TO" },
    { source: "CMP-009", target: "FM-004", label: "PRONE_TO" },
    { source: "CMP-011", target: "FM-005", label: "PRONE_TO" },
    { source: "CMP-010", target: "FM-002", label: "PRONE_TO" },
    { source: "CMP-008", target: "FM-003", label: "PRONE_TO" },
    { source: "EQ-001", target: "EQ-005", label: "SIMILAR_TO" },
    { source: "EQ-002", target: "EQ-003", label: "SIMILAR_TO" },
  ],
  stats: {
    totalEntities: 30,
    totalRelationships: 39,
    equipmentCount: 5,
    dataSource: "Local seed",
  },
};

// Documents Mock Data
export const mockDocumentsData = [
  {
    id: "doc-1",
    name: "Maintenance Manual - Pump P-101 (EQ-001).pdf",
    category: "Technical Manual",
    size: "4.8 MB",
    uploadedBy: "Local Demo",
    updatedAt: "2025-05-18",
    status: "Local Sample",
    type: "pdf",
  },
  {
    id: "doc-2",
    name: "Heat Exchanger HX-202 (EQ-002) Inspection Report.pdf",
    category: "Inspection Report",
    size: "2.1 MB",
    uploadedBy: "Local Demo",
    updatedAt: "2025-05-20",
    status: "Local Sample",
    type: "pdf",
  },
  {
    id: "doc-3",
    name: "Compressor C-305 (EQ-003) Specification Sheet.pdf",
    category: "Specification",
    size: "1.4 MB",
    uploadedBy: "Local Demo",
    updatedAt: "2025-05-10",
    status: "Local Sample",
    type: "pdf",
  },
  {
    id: "doc-4",
    name: "Plant Safety Checklist & OSHA Protocols.pdf",
    category: "Safety & Compliance",
    size: "890 KB",
    uploadedBy: "Local Demo",
    updatedAt: "2025-05-15",
    status: "Local Sample",
    type: "pdf",
  },
  {
    id: "doc-5",
    name: "Conveyor CB-410 (EQ-004) Belt Inspection Sample.csv",
    category: "Telemetry Log",
    size: "12.4 MB",
    uploadedBy: "Local Demo",
    updatedAt: "2025-05-21",
    status: "Local Sample",
    type: "csv",
  },
];

// Maintenance Mock Data: illustrative local work orders for seeded equipment.
export const mockMaintenanceData = {
  urgencyCards: [
    {
      category: "Immediate Action Required",
      badge: "Critical",
      count: 2,
      items: ["Pump P-101 (EQ-001) · Seal Leakage", "Boiler BLR-501 (EQ-005) · Pressure Buildup"],
      color: "rose",
    },
    {
      category: "Due This Week",
      badge: "Warning",
      count: 2,
      items: ["Heat Exchanger HX-202 (EQ-002) · Gasket Review", "Compressor C-305 (EQ-003) · Inlet Valve Check"],
      color: "amber",
    },
    {
      category: "Scheduled Routine",
      badge: "Scheduled",
      count: 1,
      items: ["Conveyor CB-410 (EQ-004) · Belt Inspection"],
      color: "cyan",
    },
  ],
  tasks: [
    {
      id: "WO-3021",
      title: "Replace Mechanical Seal on Pump P-101",
      equipmentId: "EQ-001",
      equipment: "Pump P-101",
      urgency: "Immediate",
      assignedTo: "Field Team A",
      dueDate: "Today, 17:00",
      status: "In Progress",
    },
    {
      id: "WO-3022",
      title: "Inspect Shell Gasket on Heat Exchanger HX-202",
      equipmentId: "EQ-002",
      equipment: "Heat Exchanger HX-202",
      urgency: "This Week",
      assignedTo: "Electrical Crew 2",
      dueDate: "23 May 2025",
      status: "Pending",
    },
    {
      id: "WO-3023",
      title: "Inspect Inlet Valve on Compressor C-305",
      equipmentId: "EQ-003",
      equipment: "Compressor C-305",
      urgency: "This Week",
      assignedTo: "Vibration Specialist",
      dueDate: "24 May 2025",
      status: "Scheduled",
    },
    {
      id: "WO-3024",
      title: "Inspect Drive Belt on Conveyor CB-410",
      equipmentId: "EQ-004",
      equipment: "Conveyor CB-410",
      urgency: "Scheduled",
      assignedTo: "Instrumentation",
      dueDate: "28 May 2025",
      status: "Scheduled",
    },
    {
      id: "WO-3025",
      title: "Review Safety Relief Valve on Boiler BLR-501",
      equipmentId: "EQ-005",
      equipment: "Boiler BLR-501",
      urgency: "Immediate",
      assignedTo: "Safety Maintenance Team",
      dueDate: "Today, 16:00",
      status: "Pending",
    },
  ],
};

// RCA Mock Data
export const mockRcaData = {
  equipmentList: mockEquipmentCatalog,
  sampleRca: {
    incidentId: "INC-2025-089",
    targetEquipmentId: "EQ-001",
    targetEquipment: "Pump P-101",
    timestamp: "21 May 2025, 06:30 AM",
    title: "Cavitation & Seal Degradation Event in Booster Pump P-101",
    summary:
      "Telemetry telemetry registered anomalous suction pressure drops followed by a 4.2x spike in high-frequency vibration signals, indicating fluid vaporization and impeller cavitation.",
    rootCauses: [
      {
        level: 1,
        title: "Mechanical Seal Rupture",
        description: "Primary elastomer O-ring experienced severe thermal degradation due to insufficient seal flush flow.",
      },
      {
        level: 2,
        title: "Suction Strainer Clogging",
        description: "Debris accumulation at inlet mesh restricted inflow, dropping NPSHa below NPSHr.",
      },
      {
        level: 3,
        title: "Delayed Preventative Flush Cycle",
        description: "Upstream filtration bypass valve remained locked in semi-closed state following line cleaning on May 12.",
      },
    ],
    recommendations: [
      "Immediate replacement of mechanical seal with Viton high-temp elastomer kit.",
      "Install differential pressure transmitter across suction strainer with automated alert threshold at 0.35 bar.",
      "Update digital SOP checklist for line flushing verification before startup.",
    ],
    confidenceScore: "94.8%",
  },
};

// Compliance Mock Data
export const mockComplianceData = {
  overallScore: 91,
  regulations: [
    {
      code: "ISO 45001:2018",
      name: "Occupational Health & Safety",
      score: 96,
      status: "Compliant",
      lastAudit: "12 May 2025",
      findings: 0,
    },
    {
      code: "OSHA 1910.119",
      name: "Process Safety Management (PSM)",
      score: 88,
      status: "Warning",
      lastAudit: "04 May 2025",
      findings: 2,
    },
    {
      code: "ISO 14001:2015",
      name: "Environmental Management",
      score: 94,
      status: "Compliant",
      lastAudit: "19 Apr 2025",
      findings: 0,
    },
    {
      code: "IEC 61508 / 61511",
      name: "Functional Safety of SIS",
      score: 85,
      status: "Warning",
      lastAudit: "28 Apr 2025",
      findings: 3,
    },
  ],
  gaps: [
    {
      id: "GAP-104",
      standard: "OSHA 1910.119",
      description: "Compressor C-305 (EQ-003) inlet valve review is due in the local compliance sample.",
      severity: "High",
      dueDate: "24 May 2025",
      owner: "Safety Compliance Dept",
    },
    {
      id: "GAP-105",
      standard: "IEC 61511",
      description: "Emergency shutdown valve proof-testing documentation missing signature for Line 3.",
      severity: "Medium",
      dueDate: "30 May 2025",
      owner: "Instrumentation Lead",
    },
    {
      id: "GAP-106",
      standard: "ISO 45001",
      description: "Boiler BLR-501 (EQ-005) safety relief valve review is due in the local compliance sample.",
      severity: "Low",
      dueDate: "05 Jun 2025",
      owner: "Facility Services",
    },
  ],
};

// Analytics Mock Data
export const mockAnalyticsData = {
  kpis: [
    { label: "Overall Equipment Effectiveness (OEE)", value: "87.4%", delta: "+3.1%", color: "cyan" },
    { label: "Mean Time Between Failures (MTBF)", value: "482 hrs", delta: "+14.2 hrs", color: "purple" },
    { label: "Mean Time to Repair (MTTR)", value: "2.4 hrs", delta: "-0.6 hrs", color: "emerald" },
    { label: "Energy Consumption Efficiency", value: "93.8%", delta: "+1.2%", color: "amber" },
  ],
  failureTrends: [
    { month: "Jan", mechanical: 14, electrical: 8, sensor: 5 },
    { month: "Feb", mechanical: 11, electrical: 9, sensor: 4 },
    { month: "Mar", mechanical: 15, electrical: 7, sensor: 6 },
    { month: "Apr", mechanical: 9, electrical: 5, sensor: 3 },
    { month: "May", mechanical: 6, electrical: 4, sensor: 2 },
  ],
};
