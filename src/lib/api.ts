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
