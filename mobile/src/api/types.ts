export type UserRole = 'admin' | 'technician' | 'manager' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type EquipmentStatus = 'operational' | 'maintenance' | 'critical' | 'degraded';
export type EquipmentCriticality = 'low' | 'medium' | 'high' | 'critical';

export interface EquipmentSummary {
  id: string; // e.g., 'EQ-001'
  name: string; // e.g., 'Centrifugal Pump P-101'
  type: string; // e.g., 'Pump'
  location: string; // e.g., 'Plant A — Floor 1'
  status: EquipmentStatus;
  criticality: EquipmentCriticality;
  health_score: number; // 0-100
  manufacturer?: string;
  model?: string;
  install_date?: string;
}

export interface SensorData {
  vibration_mm_s?: number;
  temperature_c?: number;
  pressure_psi?: number;
  flow_rate_gpm?: number;
  power_kw?: number;
  rpm?: number;
  [key: string]: any;
}

export interface EquipmentMetric {
  timestamp: string;
  sensor_data: SensorData;
  anomaly_score?: number;
}

export interface EquipmentComponent {
  name: string;
  supplier: string;
  supplier_id?: string;
  status: 'normal' | 'wear_detected' | 'critical';
}

export interface LinkedSupplierRisk {
  supplier: string;
  supplier_id?: string;
  rating?: number;
  failure_mode: string;
  severity: EquipmentCriticality;
  details: string;
  relationship_path?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  date: string;
  type: 'preventive' | 'corrective' | 'inspection' | 'overhaul';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  technician?: string;
  parts_used?: string;
  duration_hours?: number;
  downtime_hours?: number;
  cost?: number;
}

export interface RegulationCompliance {
  regulation_name: string;
  status: 'compliant' | 'non_compliant' | 'pending_audit';
  last_audit_date?: string;
  due_date?: string;
  gaps?: string;
}

export interface ComplianceSummary {
  compliant: boolean;
  score: number; // 0-100
  regulations: RegulationCompliance[];
}

export interface EquipmentDetail extends EquipmentSummary {
  model: string;
  manufacturer: string;
  install_date: string;
  rul_cycles: number;
  metrics: EquipmentMetric[];
  components: EquipmentComponent[];
  linked_risks: LinkedSupplierRisk[];
  maintenance_history: MaintenanceRecord[];
  compliance_summary: ComplianceSummary;
}

export type ObservationCategory =
  | 'vibration'
  | 'leak'
  | 'thermal'
  | 'electrical'
  | 'mechanical'
  | 'noise'
  | 'corrosion'
  | 'other';

export type ObservationSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CreateObservationRequest {
  equipment_id: string;
  category: ObservationCategory;
  severity: ObservationSeverity;
  note: string;
}

export interface ObservationResponse {
  id: string;
  equipment_id: string;
  category: ObservationCategory;
  severity: ObservationSeverity;
  note: string;
  status: 'recorded' | 'under_review' | 'acknowledged';
  created_at: string;
  technician_name?: string;
}

export interface QueryRequest {
  question: string;
  top_k?: number;
  include_graph_evidence?: boolean;
}

export interface Citation {
  document_id: string;
  title: string;
  chunk_id: string;
  excerpt: string;
  page?: string;
  relevance_score?: number;
}

export interface GraphEvidence {
  supplier: string;
  rating?: number;
  affected_equipment: string[];
  components: string[];
  failure_modes: Array<Record<string, any>>;
  relationship_path: string;
}

export interface QueryResponse {
  question: string;
  answer: string;
  source_mode: 'gemini' | 'groq' | 'deterministic';
  retrieved_facts: string[];
  citations: Citation[];
  graph_evidence: GraphEvidence[];
  recommendations: string[];
  confidence?: number;
  processing_time_ms: number;
  disclaimer?: string;
}

export interface ApiErrorResponse {
  detail: string;
  status_code?: number;
  error_type?: string;
}
