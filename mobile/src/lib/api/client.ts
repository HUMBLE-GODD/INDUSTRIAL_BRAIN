import type {
  AiQueryRequest,
  AiQueryResponse,
  AuthTokenResponse,
  ComplianceGapResponse,
  EquipmentRcaResponse,
  EquipmentHistoryPage,
  EquipmentPage,
  EquipmentResponse,
  ObservationCreate,
  ObservationResponse,
} from './types';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ?? '';

/** Set EXPO_PUBLIC_API_URL to the API origin or its /api/v1 root to enable live sync. */
export const API_IS_CONFIGURED = configuredApiUrl.length > 0;
export const API_BASE_URL = API_IS_CONFIGURED
  ? /\/api\/v1$/i.test(configuredApiUrl)
    ? configuredApiUrl
    : `${configuredApiUrl}/api/v1`
  : null;

/** Kept in sync with the web client's localStorage key. */
export const AUTH_TOKEN_STORAGE_KEY = 'industrial-brain-access-token';
export const AUTH_USER_STORAGE_KEY = 'industrial-brain-auth-user';

let accessToken: string | null = null;
let authExpiredHandler: (() => void) | null = null;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly isUnauthorized: boolean;

  constructor(message: string, status: number, options: { code?: string; details?: unknown } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    this.isUnauthorized = status === 401;
  }
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setAuthExpiredHandler(handler: (() => void) | null): void {
  authExpiredHandler = handler;
}

function fallbackErrorMessage(status: number): string {
  if (status === 0) return 'The API could not be reached. Check the API URL and your network connection.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested record could not be found.';
  if (status === 422) return 'Some of the submitted information is invalid.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'The service is temporarily unavailable. Please try again.';
  return 'The request could not be completed. Please try again.';
}

function validationMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const messages = details.map((detail) => {
    if (!detail || typeof detail !== 'object') return undefined;
    const value = detail as { loc?: unknown[]; msg?: unknown };
    if (typeof value.msg !== 'string') return undefined;
    const field = Array.isArray(value.loc)
      ? value.loc.filter((part) => typeof part === 'string' || typeof part === 'number').slice(-1)[0]
      : undefined;
    return field === undefined ? value.msg : `${String(field)}: ${value.msg}`;
  }).filter((message): message is string => Boolean(message));
  return messages.length ? messages.join('; ') : undefined;
}

function apiErrorFromResponse(status: number, payload: unknown): ApiError {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const nested = root.error && typeof root.error === 'object'
    ? root.error as Record<string, unknown>
    : undefined;
  const detail = root.detail;
  const details = nested?.details ?? detail;
  const message = validationMessage(nested?.details) || validationMessage(detail)
    || (typeof nested?.message === 'string' ? nested.message : undefined)
    || (typeof detail === 'string' ? detail : undefined)
    || fallbackErrorMessage(status);
  return new ApiError(message, status, {
    code: typeof nested?.code === 'string' ? nested.code : undefined,
    details,
  });
}

/** Fetch wrapper shared by mobile API services; bearer tokens match the web API contract. */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('Live API mode is off. Set EXPO_PUBLIC_API_URL to connect to the shared API.', 0);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined && init.body !== null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, { ...init, headers });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    const message = error instanceof Error && error.message
      ? `The API could not be reached: ${error.message}`
      : fallbackErrorMessage(0);
    throw new ApiError(message, 0);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  let payload: unknown;
  if (contentType.includes('json')) {
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
  } else {
    payload = (await response.text()) || undefined;
  }

  if (!response.ok) {
    if (response.status === 401 && accessToken) {
      setAccessToken(null);
      authExpiredHandler?.();
    }
    throw apiErrorFromResponse(response.status, typeof payload === 'string' ? { detail: payload } : payload);
  }
  return payload as T;
}

type QueryValue = string | number | undefined;

function queryString(values: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

async function authenticate(endpoint: 'login' | 'register', email: string, password: string): Promise<AuthTokenResponse> {
  const response = await apiRequest<AuthTokenResponse>(`/auth/${endpoint}`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return response;
}

export const authApi = {
  login: (email: string, password: string) => authenticate('login', email, password),
  register: (email: string, password: string) => authenticate('register', email, password),
};

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
    return apiRequest<ObservationResponse>('/observations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const graphApi = {
  equipmentRca(equipmentId: string): Promise<EquipmentRcaResponse> {
    return apiRequest<EquipmentRcaResponse>(`/rca/${encodeURIComponent(equipmentId)}`);
  },
};

export const complianceApi = {
  gaps(equipmentId: string): Promise<ComplianceGapResponse> {
    return apiRequest<ComplianceGapResponse>(`/compliance/gaps${queryString({ equipment_id: equipmentId })}`);
  },
};

export const aiApi = {
  query(payload: AiQueryRequest): Promise<AiQueryResponse> {
    return apiRequest<AiQueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
