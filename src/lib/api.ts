// Client for the RynexNative Django API (separate repository: rynexnative-backend).
// The base URL comes from VITE_API_URL (see .env.production / .env.development).

export const API_URL = (import.meta.env.VITE_API_URL ?? "https://api.rynexnative.com").replace(/\/+$/, "")

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`API request failed with status ${status}`)
    this.status = status
    this.data = data
  }

  /** The visitor sent too many requests in a short time */
  get isRateLimited() {
    return this.status === 429
  }
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    })
    const data = response.status === 204 ? null : await response.json().catch(() => null)
    if (!response.ok) throw new ApiError(response.status, data)
    return data as T
  } finally {
    window.clearTimeout(timer)
  }
}

export function apiGet<T>(path: string) {
  return request<T>(path)
}

export function apiPost<T>(path: string, body: unknown) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) })
}

/** A short, friendly message for toasts */
export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.isRateLimited) {
    return "Too many attempts. Please wait a little and try again."
  }
  return fallback
}

/* ------------------------------------------------------------------ */
/* Dashboard (team only): session cookie + CSRF token                  */
/* ------------------------------------------------------------------ */

let csrfToken: string | null = null

export function setCsrfToken(token: string | null) {
  csrfToken = token
}

async function getCsrfToken() {
  if (!csrfToken) {
    const data = await request<{ csrfToken: string }>("/api/dashboard/auth/csrf/", { credentials: "include" })
    csrfToken = data.csrfToken
  }
  return csrfToken
}

function isCsrfFailure(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 403) return false
  const detail = (error.data as { detail?: string } | null)?.detail ?? ""
  return detail.toLowerCase().includes("csrf")
}

type DashboardInit = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown }

/** Calls /api/dashboard/<path> with the login cookie; unsafe methods send the CSRF token. */
export async function dashboardRequest<T>(path: string, { method = "GET", body }: DashboardInit = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== "GET") headers["X-CSRFToken"] = await getCsrfToken()
  try {
    return await request<T>(`/api/dashboard${path}`, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // The token rotates on login/logout; fetch a fresh one and retry once
    if (!retried && method !== "GET" && isCsrfFailure(error)) {
      csrfToken = null
      return dashboardRequest<T>(path, { method, body }, true)
    }
    throw error
  }
}

/** First validation message from a DRF 400 response, if any */
export function validationMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 400 || !error.data || typeof error.data !== "object") return null
  for (const [field, value] of Object.entries(error.data as Record<string, unknown>)) {
    const message = Array.isArray(value) ? value[0] : value
    if (typeof message === "string") return field === "detail" || field === "non_field_errors" ? message : `${field}: ${message}`
  }
  return null
}
