export type IsoDateTime = string;

export type UserRole = 'admin' | 'technician' | 'manager' | 'viewer';

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  created_at: IsoDateTime;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserResponse;
}

export interface EquipmentResponse {
  id: string;
  name: string;
  type: string;
  model: string | null;
  manufacturer: string | null;
  status: string;
  criticality: string;
  location: string;
  install_date: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface EquipmentPage {
  items: EquipmentResponse[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export type EquipmentHistoryEventType = 'maintenance' | 'failure' | 'alert' | 'metric' | 'field_observation';

export interface EquipmentHistoryEvent {
  id: string;
  event_type: EquipmentHistoryEventType;
  occurred_at: IsoDateTime;
  title: string;
  description: string;
  severity: string | null;
  status?: string | null;
  metadata: Record<string, unknown>;
}

export interface EquipmentHistoryPage {
  items: EquipmentHistoryEvent[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface EquipmentRiskSupplier {
  supplier_id?: string | null;
  name?: string | null;
  rating?: number | null;
  country?: string | null;
}

export interface EquipmentRiskFailureMode {
  failure_mode_id?: string | null;
  name?: string | null;
  severity?: string | null;
  description?: string | null;
}

export interface EquipmentRiskPath {
  component_id?: string | null;
  component_name?: string | null;
  component_type?: string | null;
  supplier?: EquipmentRiskSupplier | null;
  risk_links: EquipmentRiskFailureMode[];
}

export interface EquipmentRcaResponse {
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  equipment_status: string;
  equipment_criticality: string;
  location?: Record<string, unknown> | null;
  evidence_note: string;
  component_risk_paths: EquipmentRiskPath[];
}

export interface ComplianceGap {
  equipment_id: string;
  equipment_name: string;
  regulation: string;
  status: string;
  gap_description: string | null;
  due_date: IsoDateTime | null;
  days_overdue: number | null;
  risk_level: string;
  recommended_action: string;
  rule_applied: string;
}

export interface ComplianceGapResponse {
  gaps: ComplianceGap[];
  summary: {
    total_checked: number;
    compliant_count: number;
    non_compliant_count: number;
    pending_audit_count: number;
  };
  generated_at: IsoDateTime;
  method: string;
  note: string | null;
}

export type ObservationSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ObservationCreate {
  equipment_id: string;
  category: string;
  severity: ObservationSeverity;
  note: string;
}

export interface ObservationResponse extends ObservationCreate {
  id: string;
  reported_by: string;
  status: string;
  created_at: IsoDateTime;
}

export interface AiQueryRequest {
  question: string;
  top_k?: number;
  include_graph_evidence?: boolean;
}

export interface AiCitation {
  document_id: string;
  title: string;
  chunk_id: string;
  excerpt: string;
  page: string | null;
  relevance_score: number | null;
}

export interface AiQueryResponse {
  question: string;
  answer: string;
  source_mode: string;
  retrieved_facts: string[];
  citations: AiCitation[];
  graph_evidence: Array<Record<string, unknown>>;
  recommendations: string[];
  confidence: number | null;
  processing_time_ms: number;
  disclaimer: string | null;
}
