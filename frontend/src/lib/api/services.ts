import {
  apiRequest,
  clearAccessToken,
  setAccessToken,
} from "@/lib/api/client";
import type {
  AiQueryRequest,
  AiQueryResponse,
  AuthTokenResponse,
  ComplianceData,
  DocumentDetail,
  DocumentListItem,
  DocumentSearchResponse,
  DocumentUploadResponse,
  EquipmentHistoryPage,
  EquipmentPage,
  EquipmentResponse,
  GraphSummary,
  GraphVisualization,
  GraphVisualizationResponse,
  LoginRequest,
  MaintenanceData,
  ObservationCreate,
  ObservationResponse,
  RegisterRequest,
  RcaResult,
  SupplierRisksResponse,
} from "@/lib/api/types";

type QueryValue = string | number | boolean | undefined;

function queryString(values: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

async function authenticate(payload: LoginRequest | RegisterRequest, endpoint: "login" | "register"): Promise<AuthTokenResponse> {
  const result = await apiRequest<AuthTokenResponse>(`/auth/${endpoint}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAccessToken(result.access_token);
  return result;
}

/** Authenticate with email/password and persist the returned bearer token. */
export function login(email: string, password: string): Promise<AuthTokenResponse> {
  return authenticate({ email, password }, "login");
}

/** Create an account and persist the returned bearer token. */
export function register(email: string, password: string): Promise<AuthTokenResponse> {
  return authenticate({ email, password }, "register");
}

/** Clear the locally stored bearer token. The API has no logout endpoint. */
export function logout(): void {
  clearAccessToken();
}

export const authApi = { login, register, logout };

/** Authenticated inventory operations. The client adds the saved bearer token. */
export const equipmentApi = {
  list(options: { page?: number; page_size?: number } = {}): Promise<EquipmentPage> {
    return apiRequest<EquipmentPage>(`/equipment${queryString({ page: options.page, page_size: options.page_size })}`);
  },

  get(equipmentId: string): Promise<EquipmentResponse> {
    return apiRequest<EquipmentResponse>(`/equipment/${encodeURIComponent(equipmentId)}`);
  },

  history(equipmentId: string, options: { page?: number; page_size?: number } = {}): Promise<EquipmentHistoryPage> {
    return apiRequest<EquipmentHistoryPage>(
      `/equipment/${encodeURIComponent(equipmentId)}/history${queryString({ page: options.page, page_size: options.page_size })}`,
    );
  },

  submitObservation(payload: ObservationCreate): Promise<ObservationResponse> {
    return apiRequest<ObservationResponse>("/observations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export const maintenanceApi = {
  predictions(equipmentId?: string): Promise<MaintenanceData> {
    return apiRequest<MaintenanceData>(`/maintenance/predictions${queryString({ equipment_id: equipmentId })}`);
  },
};

export const complianceApi = {
  gaps(equipmentId?: string): Promise<ComplianceData> {
    return apiRequest<ComplianceData>(`/compliance/gaps${queryString({ equipment_id: equipmentId })}`);
  },
};

export const aiApi = {
  query(question: string, options: Omit<AiQueryRequest, "question"> = {}): Promise<AiQueryResponse> {
    return apiRequest<AiQueryResponse>("/query", {
      method: "POST",
      body: JSON.stringify({ question, ...options }),
    });
  },
};

export const rcaApi = {
  analyze(equipmentId: string): Promise<RcaResult> {
    return apiRequest<RcaResult>(`/rca/${encodeURIComponent(equipmentId)}`);
  },
};

function asDisplayString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function domainIdProperty(properties: Record<string, unknown>, type: string): string | undefined {
  const normalizedType = type.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const preferredKeys = [
    ...(normalizedType ? [`${normalizedType}_id`, `${normalizedType}_code`, `${normalizedType}_key`] : []),
    "equipment_id",
    "asset_id",
    "asset_tag",
    "component_id",
    "supplier_id",
    "failure_mode_id",
    "location_id",
    "sensor_id",
    "technician_id",
    "maintenance_record_id",
    "record_id",
    "inspection_id",
    "document_id",
    "regulation_id",
    "external_id",
    "business_id",
    "code",
    "tag",
    "identifier",
  ];

  for (const key of preferredKeys) {
    const match = Object.keys(properties).find((propertyKey) => propertyKey.toLowerCase() === key);
    if (match) {
      const value = asDisplayString(properties[match]);
      if (value) return value;
    }
  }

  const genericDomainIdKey = Object.keys(properties).sort().find((key) => {
    const normalizedKey = key.toLowerCase();
    return normalizedKey !== "id"
      && normalizedKey !== "element_id"
      && normalizedKey !== "neo4j_id"
      && /(?:_id|_key|_code|_tag|_identifier)$/.test(normalizedKey);
  });
  return genericDomainIdKey ? asDisplayString(properties[genericDomainIdKey]) : undefined;
}

function normalizeGraphVisualization(response: GraphVisualizationResponse): GraphVisualization {
  return {
    nodes: response.nodes.map((record) => {
      const properties = record.properties ?? {};
      const type = asDisplayString(record.type)
        ?? record.labels?.map(asDisplayString).find((label): label is string => Boolean(label))
        ?? asDisplayString(properties.type)
        ?? "Node";
      const label = asDisplayString(record.label)
        ?? asDisplayString(properties.name)
        ?? domainIdProperty(properties, type)
        ?? asDisplayString(record.domain_id)
        ?? record.id;
      const domainId = asDisplayString(record.domain_id) ?? domainIdProperty(properties, type) ?? null;
      return { id: record.id, domainId, type, label, properties };
    }),
    edges: response.edges.map((record) => ({
      id: record.id,
      source: record.source,
      target: record.target,
      type: asDisplayString(record.type) ?? asDisplayString(record.properties?.type) ?? "RELATED_TO",
      ...(record.properties ? { properties: record.properties } : {}),
    })),
  };
}

export const graphApi = {
  visualization(): Promise<GraphVisualization> {
    return apiRequest<GraphVisualizationResponse>("/graph/visualization").then(normalizeGraphVisualization);
  },

  summary(): Promise<GraphSummary> {
    return apiRequest<GraphSummary>("/graph/summary");
  },

  supplierRisks(): Promise<SupplierRisksResponse> {
    return apiRequest<SupplierRisksResponse>("/graph/supplier-risks");
  },

  equipmentContext(equipmentId: string): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>(`/graph/equipment/${encodeURIComponent(equipmentId)}/context`);
  },
};

export interface DocumentUploadOptions {
  title?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

export const documentsApi = {
  list(): Promise<DocumentListItem[]> {
    return apiRequest<DocumentListItem[]>("/documents");
  },

  get(documentId: string): Promise<DocumentDetail> {
    return apiRequest<DocumentDetail>(`/documents/${encodeURIComponent(documentId)}`);
  },

  upload(file: File, options: DocumentUploadOptions = {}): Promise<DocumentUploadResponse> {
    const form = new FormData();
    form.set("file", file, file.name);
    if (options.title !== undefined) form.set("title", options.title);
    if (options.chunk_size !== undefined) form.set("chunk_size", String(options.chunk_size));
    if (options.chunk_overlap !== undefined) form.set("chunk_overlap", String(options.chunk_overlap));
    return apiRequest<DocumentUploadResponse>("/documents/upload", {
      method: "POST",
      body: form,
    });
  },

  remove(documentId: string): Promise<void> {
    return apiRequest<void>(`/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
  },

  search(query: string, limit = 10): Promise<DocumentSearchResponse> {
    return apiRequest<DocumentSearchResponse>(`/documents/search${queryString({ q: query, limit })}`);
  },
};
