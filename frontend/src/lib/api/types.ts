/** Frontend types matching the FastAPI request and response models. */

export type IsoDateTime = string;

export type UserRole = "admin" | "technician" | "manager" | "viewer";

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  created_at: IsoDateTime;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type RegisterRequest = LoginRequest;

/** Exact backend response model for an equipment record. */
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

/** Compact equipment view used by the registry page and its demo fixture. */
export interface Equipment {
  id: string;
  name?: string;
  status?: string;
  /** Demo fixture fields; these are not present in EquipmentResponse. */
  health?: number;
  metric?: string;
}

export interface EquipmentPage {
  items: EquipmentResponse[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export type EquipmentHistoryEventType = "maintenance" | "failure" | "alert" | "metric" | "field_observation";

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

export type ObservationSeverity = "low" | "medium" | "high" | "critical";

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

export interface MaintenancePrediction {
  equipment_id: string;
  equipment_name: string;
  risk_level: string;
  prediction_type: string;
  rule_applied: string;
  factors: string[];
  recommended_action: string;
  next_maintenance_window: string | null;
  disclaimer: string;
}

export interface MaintenanceData {
  predictions: MaintenancePrediction[];
  total_equipment: number;
  generated_at: IsoDateTime;
  method: string;
  note: string | null;
}

export interface ComplianceGap {
  equipment_id: string;
  equipment_name: string;
  regulation: string;
  status: string;
  gap_description: string | null;
  due_date: string | null;
  days_overdue: number | null;
  risk_level: string;
  recommended_action: string;
  rule_applied: string;
}

export interface ComplianceSummary {
  total_checked: number;
  compliant_count: number;
  non_compliant_count: number;
  pending_audit_count: number;
}

export interface ComplianceData {
  gaps: ComplianceGap[];
  summary: ComplianceSummary;
  generated_at: IsoDateTime;
  method: string;
  note: string | null;
}

export interface AiCitation {
  document_id: string;
  title: string;
  chunk_id: string;
  excerpt: string;
  page: string | null;
  relevance_score: number | null;
}

export interface AiGraphEvidence {
  supplier: string;
  rating: number | null;
  affected_equipment: string[];
  components: string[];
  failure_modes: Array<Record<string, unknown>>;
  relationship_path: string;
}

export interface AiQueryRequest {
  question: string;
  top_k?: number;
  include_graph_evidence?: boolean;
}

export interface AiQueryResponse {
  question: string;
  answer: string;
  source_mode: string;
  retrieved_facts: string[];
  citations: AiCitation[];
  graph_evidence: AiGraphEvidence[];
  recommendations: string[];
  confidence: number | null;
  processing_time_ms: number;
  disclaimer: string | null;
}

export interface GraphSummary {
  total_nodes: number;
  total_relationships: number;
  by_label: Record<string, number>;
}

/** Complete node and relationship payload used by the graph explorer. */
export interface GraphVisualizationNode {
  id: string;
  domainId: string | null;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphVisualizationEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, unknown>;
}

export interface GraphVisualization {
  nodes: GraphVisualizationNode[];
  edges: GraphVisualizationEdge[];
}

/** Raw graph API node; type and label are optional for older label-based responses. */
export interface GraphVisualizationNodeRecord {
  id: string;
  domain_id?: string | null;
  type?: string;
  label?: string;
  labels?: string[];
  properties?: Record<string, unknown>;
}

/** Raw graph API edge, including optional backend metadata. */
export interface GraphVisualizationEdgeRecord {
  id: string;
  source: string;
  target: string;
  type?: string;
  properties?: Record<string, unknown>;
}

export interface GraphVisualizationResponse {
  nodes: GraphVisualizationNodeRecord[];
  edges: GraphVisualizationEdgeRecord[];
}

export interface SupplierRisk {
  supplier_id: string;
  supplier_name: string;
  supplier_rating: number | null;
  supplier_country: string | null;
  affected_equipment_count: number;
  affected_equipment_ids: string[];
  affected_equipment_names: string[];
  affected_component_ids: string[];
  affected_component_names: string[];
  failure_mode_ids: string[];
  failure_mode_names: string[];
  severity_breakdown: Record<string, number>;
  failure_link_count: number;
}

export interface SupplierRisksResponse {
  supplier_risks: SupplierRisk[];
  count: number;
}

export interface RcaSupplier {
  supplier_id: string;
  name: string;
  rating: number | null;
  country: string | null;
}

export interface RcaRiskLink {
  failure_mode_id: string;
  name: string;
  severity: string | null;
  description: string | null;
}

export interface RcaComponentRiskPath {
  component_id: string;
  component_name: string;
  component_type: string | null;
  supplier: RcaSupplier | null;
  risk_links: RcaRiskLink[];
}

export interface RcaResult {
  equipment_id: string;
  equipment_name: string;
  equipment_type: string | null;
  equipment_status: string | null;
  equipment_criticality: string | null;
  location: Record<string, unknown> | null;
  evidence_note: string;
  component_risk_paths: RcaComponentRiskPath[];
}

/** Exact document list/detail response fields. */
export interface DocumentListItem {
  document_id: string;
  title: string;
  file_type: string;
  status: string;
  created_at: IsoDateTime;
}

export type DocumentUploadResponse = DocumentListItem;

export interface DocumentDetail extends DocumentListItem {
  file_path: string;
  updated_at: IsoDateTime;
}

/** Union-shaped view for list and detail records consumed by the documents page. */
export interface DocumentRecord extends DocumentListItem {
  file_path?: string;
  updated_at?: IsoDateTime | null;
}

export interface ChunkSearchResult {
  chunk_id: string;
  document_id: string;
  title: string;
  page: number;
  chunk_index: number;
  text: string;
  score: number;
}

export interface DocumentSearchResponse {
  results: ChunkSearchResult[];
  total: number;
}
