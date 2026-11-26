/** Shared fetch client for the FastAPI v1 API. */

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
const apiOrigin = configuredApiUrl || "http://localhost:8000/api/v1";

/** The URL prefix used by all API services. Accepts either the API root or its origin. */
export const API_BASE_URL = /\/api\/v1$/i.test(apiOrigin)
  ? apiOrigin
  : `${apiOrigin}/api/v1`;

export const AUTH_TOKEN_STORAGE_KEY = "industrial-brain-access-token";
export const AUTH_STATE_CHANGED_EVENT = "industrial-brain-auth-changed";

let inMemoryAccessToken: string | null = null;

function notifyAuthStateChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
  }
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: unknown[];
}

/** An HTTP or network error returned by the API client. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly isUnauthorized: boolean;

  constructor(message: string, status: number, options: { code?: string; details?: unknown } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    this.isUnauthorized = status === 401;
  }
}

/** Read the saved bearer token. Safe to call during server rendering. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || inMemoryAccessToken;
  } catch {
    return inMemoryAccessToken;
  }
}

/** Save a bearer token returned by the login or registration endpoint. */
export function setAccessToken(token: string): void {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } catch {
      // Keep the session usable until reload when browser storage is unavailable.
    }
    notifyAuthStateChanged();
  }
}

/** Remove the saved bearer token on logout. */
export function clearAccessToken(): void {
  const hadAccessToken = getAccessToken() !== null;
  inMemoryAccessToken = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors so logout remains safe in restricted browser contexts.
  }
  if (hadAccessToken) notifyAuthStateChanged();
}

function validationMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const messages = details
    .map((detail) => {
      if (!detail || typeof detail !== "object") return undefined;
      const value = detail as { loc?: unknown[]; msg?: unknown };
      if (typeof value.msg !== "string") return undefined;
      const field = Array.isArray(value.loc)
        ? value.loc.filter((part) => typeof part === "string" || typeof part === "number").slice(-1)[0]
        : undefined;
      return field === undefined ? value.msg : `${String(field)}: ${value.msg}`;
    })
    .filter((message): message is string => Boolean(message));
  return messages.length > 0 ? messages.join("; ") : undefined;
}

function fallbackErrorMessage(status: number): string {
  if (status === 0) return "The API could not be reached. Check the API URL and your network connection.";
  if (status === 401) return "Sign in to continue.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested record could not be found.";
  if (status === 422) return "Some of the submitted information is invalid.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The service is temporarily unavailable. Please try again.";
  return "The request could not be completed. Please try again.";
}

function apiErrorFromResponse(status: number, payload: unknown): ApiError {
  const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const nested = root.error && typeof root.error === "object"
    ? root.error as Record<string, unknown>
    : undefined;
  const detail = root.detail;
  const code = typeof nested?.code === "string" ? nested.code : undefined;
  const details = nested?.details ?? detail;
  const fieldMessage = validationMessage(nested?.details) || validationMessage(detail);
  const message = status === 422 && fieldMessage
    ? fieldMessage
    : typeof nested?.message === "string"
      ? nested.message
    : typeof detail === "string"
      ? detail
      : fallbackErrorMessage(status);

  return new ApiError(message, status, { code, details });
}

/** Make an API request, adding the saved bearer token and parsing API errors. */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body !== undefined && init.body !== null && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, { ...init, headers });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    const message = error instanceof Error && error.message
      ? `The API could not be reached: ${error.message}`
      : fallbackErrorMessage(0);
    throw new ApiError(message, 0);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";
  let payload: unknown;
  if (contentType.includes("json")) {
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
  } else {
    const text = await response.text();
    payload = text || undefined;
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearAccessToken();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("industrial-brain-auth-expired"));
    }
    const errorPayload = typeof payload === "string" ? { detail: payload } : payload;
    throw apiErrorFromResponse(response.status, errorPayload);
  }

  return payload as T;
}
