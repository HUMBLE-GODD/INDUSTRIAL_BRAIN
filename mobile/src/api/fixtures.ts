import {
  EquipmentDetail,
  EquipmentSummary,
  MaintenanceRecord,
  ObservationResponse,
  QueryResponse,
  User,
} from './types';

export const DEMO_USER: User = {
  id: 'usr-tech-01',
  email: 'surbhi.field@industrialbrain.io',
  role: 'technician',
  name: 'Surbhi (Lead Field Tech)',
};

export const FIXTURE_EQUIPMENT_LIST: EquipmentSummary[] = [
  {
    id: 'EQ-001',
    name: 'Centrifugal Pump P-101',
    type: 'Pump',
    model: 'CP-3500X',
    manufacturer: 'FlowTech',
    location: 'Plant A — Floor 1 (LOC-001)',
    status: 'operational',
    criticality: 'high',
    health_score: 42,
    install_date: '2020-03-15',
  },
  {
    id: 'EQ-002',
    name: 'Heat Exchanger HX-202',
    type: 'Heat Exchanger',
    model: 'HX-2000',
    manufacturer: 'ThermoCore',
    location: 'Plant A — Floor 1 (LOC-001)',
    status: 'operational',
    criticality: 'medium',
    health_score: 79,
    install_date: '2019-07-22',
  },
  {
    id: 'EQ-003',
    name: 'Compressor C-305',
    type: 'Compressor',
    model: 'RC-750',
    manufacturer: 'AirForce Industrial',
    location: 'Plant A — Floor 2 (LOC-002)',
    status: 'maintenance',
    criticality: 'high',
    health_score: 51,
    install_date: '2021-01-10',
  },
  {
    id: 'EQ-004',
    name: 'Conveyor Belt CB-410',
    type: 'Conveyor',
    model: 'CB-MAX',
    manufacturer: 'BeltMaster',
    location: 'Plant B — Outdoor (LOC-003)',
    status: 'operational',
    criticality: 'low',
    health_score: 92,
    install_date: '2018-11-03',
  },
  {
    id: 'EQ-005',
    name: 'Boiler BLR-501',
    type: 'Boiler',
    model: 'SB-1200',
    manufacturer: 'SteamPro',
    location: 'Plant A — Floor 2 (LOC-002)',
    status: 'operational',
    criticality: 'critical',
    health_score: 68,
    install_date: '2017-06-18',
  },
];

export const FIXTURE_EQUIPMENT_DETAILS: Record<string, EquipmentDetail> = {
  'EQ-001': {
    id: 'EQ-001',
    name: 'Centrifugal Pump P-101',
    type: 'Pump',
    model: 'CP-3500X',
    manufacturer: 'FlowTech',
    location: 'Plant A — Floor 1 (LOC-001)',
    status: 'operational',
    criticality: 'high',
    health_score: 42,
    install_date: '2020-03-15',
    rul_cycles: 18,
    metrics: [
      {
        timestamp: '2026-11-25T18:00:00Z',
        sensor_data: {
          vibration_mm_s: 4.82,
          temperature_c: 78.4,
          flow_rate_gpm: 325,
          pressure_psi: 44.8,
          rpm: 3480,
        },
        anomaly_score: 0.72,
      },
      {
        timestamp: '2026-11-25T12:00:00Z',
        sensor_data: {
          vibration_mm_s: 4.41,
          temperature_c: 76.1,
          flow_rate_gpm: 330,
          pressure_psi: 45.2,
          rpm: 3500,
        },
        anomaly_score: 0.65,
      },
    ],
    components: [
      {
        name: 'Mechanical Seal',
        supplier: 'AlphaSeals Ltd',
        supplier_id: 'SUP-001',
        status: 'wear_detected',
      },
      {
        name: 'Bearings (Drive End)',
        supplier: 'BetaBearings Inc',
        supplier_id: 'SUP-002',
        status: 'critical',
      },
      {
        name: 'Impeller Assembly',
        supplier: 'AlphaSeals Ltd',
        supplier_id: 'SUP-001',
        status: 'normal',
      },
      {
        name: 'Coupling Elastomer',
        supplier: 'DeltaMotors GmbH',
        supplier_id: 'SUP-004',
        status: 'normal',
      },
    ],
    linked_risks: [
      {
        supplier: 'BetaBearings Inc',
        supplier_id: 'SUP-002',
        rating: 3.8,
        failure_mode: 'Bearing Overheating & Friction Failure',
        severity: 'critical',
        details:
          'Elevated vibration of 4.8 mm/s indicates inner race wear. Component supplied by BetaBearings Inc (Rating: 3.8). Risk of catastrophic lockup if unaddressed.',
        relationship_path:
          '(:Equipment {id: "EQ-001"})-[:HAS_COMPONENT]->(:Component {name: "Bearings"})-[:SUPPLIED_BY]->(:Supplier {name: "BetaBearings Inc"})',
      },
      {
        supplier: 'AlphaSeals Ltd',
        supplier_id: 'SUP-001',
        rating: 4.5,
        failure_mode: 'Mechanical Seal Degradation',
        severity: 'high',
        details:
          'Secondary seal face degradation risk under thermal cycling. Periodic leakage previously logged in maintenance records.',
        relationship_path:
          '(:Equipment {id: "EQ-001"})-[:HAS_COMPONENT]->(:Component {name: "Mechanical Seal"})-[:SUPPLIED_BY]->(:Supplier {name: "AlphaSeals Ltd"})',
      },
    ],
    maintenance_history: [
      {
        id: 'MNT-2026-101',
        equipment_id: 'EQ-001',
        date: '2026-10-14',
        type: 'corrective',
        description:
          'Replaced outboard seal cartridge following fluid seepage observation. Flushed casing.',
        status: 'completed',
        technician: 'Surbhi (Lead Field Tech)',
        parts_used: 'AlphaSeals Cartridge Seal AS-400',
        duration_hours: 4.5,
        downtime_hours: 6.5,
        cost: 1450,
      },
      {
        id: 'MNT-2026-082',
        equipment_id: 'EQ-001',
        date: '2026-08-02',
        type: 'preventive',
        description:
          'Quarterly vibration analysis and bearing re-greasing with synthetic high-temp lubricant.',
        status: 'completed',
        technician: 'Marcus Vance',
        parts_used: 'Mobil Polyrex EM Grease',
        duration_hours: 1.5,
        downtime_hours: 1.5,
        cost: 220,
      },
      {
        id: 'MNT-2026-041',
        equipment_id: 'EQ-001',
        date: '2026-04-18',
        type: 'inspection',
        description: 'Annual casing pressure test and shaft runout verification.',
        status: 'completed',
        technician: 'Elena Rostova',
        duration_hours: 3.0,
        downtime_hours: 4.0,
        cost: 600,
      },
    ],
    compliance_summary: {
      compliant: true,
      score: 94,
      regulations: [
        {
          regulation_name: 'ISO 14224 (Petroleum & Natural Gas Reliability Data)',
          status: 'compliant',
          last_audit_date: '2026-09-15',
          due_date: '2027-09-15',
        },
        {
          regulation_name: 'OSHA 1910.119 (Process Safety Management of High Hazardous Chemicals)',
          status: 'compliant',
          last_audit_date: '2026-06-10',
          due_date: '2027-06-10',
        },
        {
          regulation_name: 'EPA Clean Air Act Title V Fugitive Emissions Standard',
          status: 'compliant',
          last_audit_date: '2026-10-20',
          due_date: '2027-04-20',
        },
      ],
    },
  },

  'EQ-002': {
    id: 'EQ-002',
    name: 'Heat Exchanger HX-202',
    type: 'Heat Exchanger',
    model: 'HX-2000',
    manufacturer: 'ThermoCore',
    location: 'Plant A — Floor 1 (LOC-001)',
    status: 'operational',
    criticality: 'medium',
    health_score: 79,
    install_date: '2019-07-22',
    rul_cycles: 145,
    metrics: [
      {
        timestamp: '2026-11-25T18:00:00Z',
        sensor_data: {
          temperature_c: 94.2,
          pressure_psi: 82.0,
          flow_rate_gpm: 450,
        },
        anomaly_score: 0.15,
      },
    ],
    components: [
      {
        name: 'Gasket Pack',
        supplier: 'EpsilonValves Ltd',
        supplier_id: 'SUP-005',
        status: 'wear_detected',
      },
      {
        name: 'Tube Bundle',
        supplier: 'ThermoCore',
        status: 'normal',
      },
    ],
    linked_risks: [
      {
        supplier: 'EpsilonValves Ltd',
        supplier_id: 'SUP-005',
        rating: 2.9,
        failure_mode: 'Gasket Embrittlement & Seep',
        severity: 'medium',
        details:
          'Supplier rating 2.9 indicates elevated material variability. Periodic torque check recommended.',
      },
    ],
    maintenance_history: [
      {
        id: 'MNT-2026-090',
        equipment_id: 'EQ-002',
        date: '2026-09-01',
        type: 'preventive',
        description: 'Hydrostatic pressure test and gasket inspection.',
        status: 'completed',
        technician: 'Marcus Vance',
      },
    ],
    compliance_summary: {
      compliant: true,
      score: 96,
      regulations: [
        {
          regulation_name: 'ASME Section VIII Boiler & Pressure Vessel Code',
          status: 'compliant',
          last_audit_date: '2026-05-11',
        },
      ],
    },
  },

  'EQ-003': {
    id: 'EQ-003',
    name: 'Compressor C-305',
    type: 'Compressor',
    model: 'RC-750',
    manufacturer: 'AirForce Industrial',
    location: 'Plant A — Floor 2 (LOC-002)',
    status: 'maintenance',
    criticality: 'high',
    health_score: 51,
    install_date: '2021-01-10',
    rul_cycles: 32,
    metrics: [
      {
        timestamp: '2026-11-25T18:00:00Z',
        sensor_data: {
          vibration_mm_s: 3.9,
          temperature_c: 88.0,
          pressure_psi: 115.0,
        },
        anomaly_score: 0.58,
      },
    ],
    components: [
      {
        name: 'Intake Valve',
        supplier: 'DeltaMotors GmbH',
        supplier_id: 'SUP-004',
        status: 'wear_detected',
      },
    ],
    linked_risks: [
      {
        supplier: 'DeltaMotors GmbH',
        supplier_id: 'SUP-004',
        rating: 4.7,
        failure_mode: 'Intake Valve Seat Flutter',
        severity: 'medium',
        details: 'High cycle wear on intake assembly; scheduled for valve kit replacement.',
      },
    ],
    maintenance_history: [
      {
        id: 'MNT-2026-077',
        equipment_id: 'EQ-003',
        date: '2026-07-19',
        type: 'corrective',
        description: 'Intake filter replacement and oil separator drain.',
        status: 'completed',
      },
    ],
    compliance_summary: {
      compliant: false,
      score: 82,
      regulations: [
        {
          regulation_name: 'ISO 8573 Compressed Air Purity Standard',
          status: 'pending_audit',
          gaps: 'Oil aerosol concentration audit due next week.',
        },
      ],
    },
  },

  'EQ-004': {
    id: 'EQ-004',
    name: 'Conveyor Belt CB-410',
    type: 'Conveyor',
    model: 'CB-MAX',
    manufacturer: 'BeltMaster',
    location: 'Plant B — Outdoor (LOC-003)',
    status: 'operational',
    criticality: 'low',
    health_score: 92,
    install_date: '2018-11-03',
    rul_cycles: 210,
    metrics: [
      {
        timestamp: '2026-11-25T18:00:00Z',
        sensor_data: {
          temperature_c: 42.0,
          power_kw: 18.5,
          rpm: 120,
        },
        anomaly_score: 0.05,
      },
    ],
    components: [
      {
        name: 'Drive Pulley',
        supplier: 'BeltMaster',
        status: 'normal',
      },
    ],
    linked_risks: [],
    maintenance_history: [
      {
        id: 'MNT-2026-050',
        equipment_id: 'EQ-004',
        date: '2026-05-20',
        type: 'preventive',
        description: 'Tension calibration and splice check.',
        status: 'completed',
      },
    ],
    compliance_summary: {
      compliant: true,
      score: 98,
      regulations: [
        {
          regulation_name: 'OSHA 1926.555 Conveyor Guarding Standard',
          status: 'compliant',
        },
      ],
    },
  },

  'EQ-005': {
    id: 'EQ-005',
    name: 'Boiler BLR-501',
    type: 'Boiler',
    model: 'SB-1200',
    manufacturer: 'SteamPro',
    location: 'Plant A — Floor 2 (LOC-002)',
    status: 'operational',
    criticality: 'critical',
    health_score: 68,
    install_date: '2017-06-18',
    rul_cycles: 58,
    metrics: [
      {
        timestamp: '2026-11-25T18:00:00Z',
        sensor_data: {
          temperature_c: 195.0,
          pressure_psi: 210.0,
        },
        anomaly_score: 0.35,
      },
    ],
    components: [
      {
        name: 'Safety Relief Valve',
        supplier: 'EpsilonValves Ltd',
        supplier_id: 'SUP-005',
        status: 'wear_detected',
      },
    ],
    linked_risks: [
      {
        supplier: 'EpsilonValves Ltd',
        supplier_id: 'SUP-005',
        rating: 2.9,
        failure_mode: 'Relief Valve Seat Weepage',
        severity: 'critical',
        details:
          'Supplier rating 2.9. High-pressure steam safety valve requires bi-monthly bench calibration.',
        relationship_path:
          '(:Equipment {id: "EQ-005"})-[:HAS_COMPONENT]->(:Component {name: "Safety Relief Valve"})-[:SUPPLIED_BY]->(:Supplier {name: "EpsilonValves Ltd"})',
      },
    ],
    maintenance_history: [
      {
        id: 'MNT-2026-105',
        equipment_id: 'EQ-005',
        date: '2026-10-25',
        type: 'inspection',
        description: 'Burner combustion efficiency tune-up and flue gas analysis.',
        status: 'completed',
      },
    ],
    compliance_summary: {
      compliant: true,
      score: 92,
      regulations: [
        {
          regulation_name: 'National Board Inspection Code (NBIC) Part 2',
          status: 'compliant',
        },
      ],
    },
  },
};

// Mutable observation list for offline/mock demo sessions
export const FIXTURE_OBSERVATIONS: ObservationResponse[] = [
  {
    id: 'OBS-2026-001',
    equipment_id: 'EQ-001',
    category: 'vibration',
    severity: 'high',
    note: 'Technician observed noticeable high-frequency hum and casing vibration at drive end bearing housing during 3500 RPM full load cycle.',
    status: 'under_review',
    created_at: '2026-11-24T14:30:00Z',
    technician_name: 'Surbhi (Lead Field Tech)',
  },
  {
    id: 'OBS-2026-002',
    equipment_id: 'EQ-002',
    category: 'leak',
    severity: 'medium',
    note: 'Minor flange weeping noted near EpsilonValves gasket pack on cold startup.',
    status: 'recorded',
    created_at: '2026-11-23T09:15:00Z',
    technician_name: 'Marcus Vance',
  },
];

export const FIXTURE_QUERY_RESPONSES: Record<string, QueryResponse> = {
  default: {
    question:
      'Which supplier provides components linked to high or critical failure risks across several assets, and what evidence supports that?',
    answer:
      'Based on the Knowledge Graph relationship paths and maintenance records, EpsilonValves Ltd (Rating: 2.9) and BetaBearings Inc (Rating: 3.8) are identified with elevated failure risks across multiple assets.\n\n• EpsilonValves Ltd supplies critical components (Gaskets and Safety Relief Valves) to Heat Exchanger HX-202 (EQ-002) and Boiler BLR-501 (EQ-005) that have documented risks of gasket embrittlement and safety valve weeping.\n• BetaBearings Inc supplies the drive-end bearing assembly to Centrifugal Pump P-101 (EQ-001), currently operating with a 4.8 mm/s vibration anomaly and linked to high-risk bearing overheating.',
    source_mode: 'deterministic',
    retrieved_facts: [
      'EpsilonValves Ltd has the lowest supplier rating (2.9) and provides components to both EQ-002 and EQ-005.',
      'Centrifugal Pump P-101 (EQ-001) bearing housing exhibits 4.8 mm/s vibration (anomaly score 0.72) with BetaBearings Inc components.',
      'Documented maintenance incident MNT-2026-101 confirms previous seal cartridge replacement on EQ-001.',
    ],
    citations: [
      {
        document_id: "DOC-2026-MNT-01",
        title: "Q3 Maintenance & Reliability Audit Report",
        chunk_id: "chunk-mnt-014",
        excerpt:
          "Centrifugal Pump P-101 (EQ-001) experienced repeated bearing temperature spikes above 78°C, attributed to supplier lot SUP-002 tolerance drift under continuous 3500 RPM operation.",
        page: "Page 14, Section 3.2",
        relevance_score: 0.94,
      },
      {
        document_id: "DOC-2026-SUP-08",
        title: "Supplier Quality & Audit Review 2026",
        chunk_id: "chunk-sup-088",
        excerpt:
          "EpsilonValves Ltd (SUP-005) scored 2.9 on reliability audits with elevated failure rates in elastomeric gasket batches installed on heat transfer and boiler units.",
        page: "Page 8, Table 2",
        relevance_score: 0.89,
      },
    ],
    graph_evidence: [
      {
        supplier: "BetaBearings Inc",
        rating: 3.8,
        affected_equipment: ["EQ-001"],
        components: ["Bearings (Drive End)"],
        failure_modes: [
          { mode: "Bearing Overheating & Friction Failure", severity: "critical" },
        ],
        relationship_path:
          "(:Equipment {id: 'EQ-001'})-[:HAS_COMPONENT]->(:Component {name: 'Bearings'})-[:SUPPLIED_BY]->(:Supplier {name: 'BetaBearings Inc'})",
      },
      {
        supplier: "EpsilonValves Ltd",
        rating: 2.9,
        affected_equipment: ["EQ-002", "EQ-005"],
        components: ["Gasket Pack", "Safety Relief Valve"],
        failure_modes: [
          { mode: "Gasket Embrittlement & Seep", severity: "medium" },
          { mode: "Relief Valve Seat Weepage", severity: "critical" },
        ],
        relationship_path:
          "(:Equipment {id: 'EQ-005'})-[:HAS_COMPONENT]->(:Component)-[:SUPPLIED_BY]->(:Supplier {name: 'EpsilonValves Ltd'})",
      },
    ],
    recommendations: [
      "Field inspection of Centrifugal Pump P-101 (EQ-001) bearing temperature and vibration spectrum.",
      "Submit a field observation documenting current acoustic profile and temperature reading.",
      "Schedule preventive replacement of EpsilonValves gasket pack during next planned shutdown.",
    ],
    confidence: 0.92,
    processing_time_ms: 184.2,
    disclaimer:
      "Deterministic evidence summary synthesized from local Knowledge Graph relationships and indexed maintenance documents.",
  },
};
