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
      id: "P-101",
      name: "Pump P-101",
      metric: "Pressure • Normal",
      health: 92,
      status: "normal",
      color: "cyan",
      sparkline: [88, 90, 89, 93, 91, 92],
    },
    {
      id: "M-204",
      name: "Motor M-204",
      metric: "Temperature • Elevated",
      health: 81,
      status: "normal",
      color: "cyan",
      sparkline: [75, 78, 80, 79, 82, 81],
    },
    {
      id: "C-01",
      name: "Compressor C-01",
      metric: "Vibration • Monitor",
      health: 65,
      status: "warning",
      color: "amber",
      sparkline: [78, 74, 70, 68, 66, 65],
    },
    {
      id: "V-033",
      name: "Valve V-033",
      metric: "Flow • Normal",
      health: 89,
      status: "normal",
      color: "cyan",
      sparkline: [85, 87, 86, 88, 90, 89],
    },
    {
      id: "T-501",
      name: "Turbine T-501",
      metric: "Speed • Normal",
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
      equipmentId: "Pump P-101",
    },
    {
      id: "alt-2",
      severity: "Warning",
      title: "Motor M-204 temperature elevated",
      time: "46 min ago",
      equipmentId: "Motor M-204",
    },
    {
      id: "alt-3",
      severity: "Resolved",
      title: "Compressor C-01 maintenance completed",
      time: "2 hr ago",
      equipmentId: "Compressor C-01",
    },
    {
      id: "alt-4",
      severity: "Warning",
      title: "High vibration detected in Turbine T-501",
      time: "3 hr ago",
      equipmentId: "Turbine T-501",
    },
    {
      id: "alt-5",
      severity: "Info",
      title: "Valve V-033 flow rate normal",
      time: "5 hr ago",
      equipmentId: "Valve V-033",
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
      title: "Inspection report uploaded for Pump P-101",
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
      title: "New equipment added: Valve V-033",
      time: "2 days ago",
      type: "equipment",
      color: "#06B6D4",
    },
    {
      id: "act-5",
      title: "Maintenance scheduled for Motor M-204",
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
    "When was Pump P-101 last serviced?",
    "Which equipment has the highest failure risk?",
    "Which supplier has the most component failures?",
    "Summarize ISO 45001 compliance gaps for Q2",
    "What is the root cause for Motor M-204 overheating?",
  ],
  sampleConversation: [
    {
      role: "user",
      content: "When was Pump P-101 last serviced?",
      timestamp: "10:14 AM",
    },
    {
      role: "assistant",
      content:
        "**Pump P-101** underwent comprehensive preventive maintenance on **14 April 2025** by Field Team A. \n\nKey actions taken:\n- Replaced mechanical seal assembly (Part #MS-882)\n- Re-lubricated bearing housing with ISO VG 46 synthetic oil\n- Vibration spectral analysis verified within normal limits (< 1.8 mm/s RMS)\n\nNext scheduled major overhaul: **15 October 2025** (in 180 days).",
      timestamp: "10:14 AM",
      relatedAssets: ["Pump P-101", "Work Order WO-1892", "ISO VG 46 Spec"],
    },
  ],
};

// Knowledge Graph Mock Data
export const mockGraphData = {
  nodes: [
    { id: "1", label: "Pump P-101", type: "Equipment", status: "Critical", group: "pumps" },
    { id: "2", label: "Motor M-204", type: "Component", status: "Warning", group: "motors" },
    { id: "3", label: "Turbine T-501", type: "Equipment", status: "Healthy", group: "turbines" },
    { id: "4", label: "Sensor S-109 (Vibration)", type: "Sensor", status: "Healthy", group: "sensors" },
    { id: "5", label: "Sensor S-220 (Temp)", type: "Sensor", status: "Warning", group: "sensors" },
    { id: "6", label: "ISO 45001 Standard", type: "Regulation", status: "Healthy", group: "compliance" },
    { id: "7", label: "Field Team Alpha", type: "Team", status: "Healthy", group: "teams" },
    { id: "8", label: "Siemens AG", type: "Supplier", status: "Healthy", group: "suppliers" },
  ],
  links: [
    { source: "1", target: "2", label: "DRIVES" },
    { source: "1", target: "4", label: "MONITORED_BY" },
    { source: "2", target: "5", label: "MONITORED_BY" },
    { source: "1", target: "7", label: "MAINTAINED_BY" },
    { source: "1", target: "8", label: "SUPPLIED_BY" },
    { source: "1", target: "6", label: "GOVERNED_BY" },
    { source: "3", target: "6", label: "GOVERNED_BY" },
  ],
  stats: {
    totalEntities: 1420,
    totalRelationships: 3890,
    equipmentClusters: 14,
    lastSynchronized: "10 minutes ago",
  },
};

// Documents Mock Data
export const mockDocumentsData = [
  {
    id: "doc-1",
    name: "Maintenance Manual - Pump P-101 Series.pdf",
    category: "Technical Manual",
    size: "4.8 MB",
    uploadedBy: "Admin User",
    updatedAt: "2025-05-18",
    status: "Indexed",
    type: "pdf",
  },
  {
    id: "doc-2",
    name: "Motor M-204 Thermal Inspection Report.pdf",
    category: "Inspection Report",
    size: "2.1 MB",
    uploadedBy: "Field Team A",
    updatedAt: "2025-05-20",
    status: "Indexed",
    type: "pdf",
  },
  {
    id: "doc-3",
    name: "Equipment Specification Sheet - C-01.pdf",
    category: "Specification",
    size: "1.4 MB",
    uploadedBy: "Procurement",
    updatedAt: "2025-05-10",
    status: "Indexed",
    type: "pdf",
  },
  {
    id: "doc-4",
    name: "Plant Safety Checklist & OSHA Protocols.pdf",
    category: "Safety & Compliance",
    size: "890 KB",
    uploadedBy: "Safety Officer",
    updatedAt: "2025-05-15",
    status: "Indexed",
    type: "pdf",
  },
  {
    id: "doc-5",
    name: "Turbine T-501 Vibration Baseline.csv",
    category: "Telemetry Log",
    size: "12.4 MB",
    uploadedBy: "IoT Gateway",
    updatedAt: "2025-05-21",
    status: "Processing",
    type: "csv",
  },
];

// Maintenance Mock Data
export const mockMaintenanceData = {
  urgencyCards: [
    {
      category: "Immediate Action Required",
      badge: "Critical",
      count: 3,
      items: ["Pump P-101 Seal Leakage", "Bearing Overheating on Motor M-204", "Hydraulic Line 4 Pressure Drop"],
      color: "rose",
    },
    {
      category: "Due This Week",
      badge: "Warning",
      count: 7,
      items: ["Compressor C-01 Filter Swap", "Turbine T-501 Lube Analysis", "Valve V-033 Calibration"],
      color: "amber",
    },
    {
      category: "Scheduled Routine",
      badge: "Scheduled",
      count: 18,
      items: ["Plant-wide Electrical Safety Audit", "Boiler B-12 Descaling", "Substation Relay Calibration"],
      color: "cyan",
    },
  ],
  tasks: [
    {
      id: "WO-3021",
      title: "Replace Mechanical Seal on Pump P-101",
      equipment: "Pump P-101",
      urgency: "Immediate",
      assignedTo: "Field Team A",
      dueDate: "Today, 17:00",
      status: "In Progress",
    },
    {
      id: "WO-3022",
      title: "Inspect Thermal Dissipation on Motor M-204",
      equipment: "Motor M-204",
      urgency: "This Week",
      assignedTo: "Electrical Crew 2",
      dueDate: "23 May 2025",
      status: "Pending",
    },
    {
      id: "WO-3023",
      title: "Dynamic Balancing on Compressor C-01",
      equipment: "Compressor C-01",
      urgency: "This Week",
      assignedTo: "Vibration Specialist",
      dueDate: "24 May 2025",
      status: "Scheduled",
    },
    {
      id: "WO-3024",
      title: "Ultrasonic Flow Check on Valve V-033",
      equipment: "Valve V-033",
      urgency: "Scheduled",
      assignedTo: "Instrumentation",
      dueDate: "28 May 2025",
      status: "Scheduled",
    },
  ],
};

// RCA Mock Data
export const mockRcaData = {
  equipmentList: ["Pump P-101", "Motor M-204", "Compressor C-01", "Turbine T-501", "Valve V-033"],
  sampleRca: {
    incidentId: "INC-2025-089",
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
      description: "Compressor C-01 pressure relief valve inspection certificate expired 3 days ago.",
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
      description: "Hearing protection signage faded near Turbine T-501 acoustic enclosure.",
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
