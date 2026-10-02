import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, dashboardRequest, setCsrfToken } from "@/lib/api"
import type { RegistrationStatus } from "@/features/events/types"
import type {
  CheckInResult,
  DashboardAlert,
  DashboardEvent,
  DashboardNews,
  DashboardRegistration,
  DashboardEstimate,
  DashboardMessage,
  DashboardStats,
  DashboardSubscriber,
  DashboardUser,
  EstimateStatus,
  MessageStatus,
} from "./types"

export const dashboardKeys = {
  me: ["dashboard", "me"] as const,
  stats: ["dashboard", "stats"] as const,
  alerts: ["dashboard", "alerts"] as const,
  estimates: (status: string, q: string) => ["dashboard", "estimates", status, q] as const,
  messages: (status: string, q: string) => ["dashboard", "messages", status, q] as const,
  subscribers: (q: string) => ["dashboard", "subscribers", q] as const,
}

function query(params: Record<string, string>) {
  const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v))
  const text = search.toString()
  return text ? `?${text}` : ""
}

/* ---------------- Auth ---------------- */

export function useCurrentUser() {
  return useQuery({
    queryKey: dashboardKeys.me,
    queryFn: async () => {
      try {
        const { user } = await dashboardRequest<{ user: DashboardUser }>("/auth/me/")
        return user
      } catch (error) {
        // 401/403 simply means "not logged in"
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      dashboardRequest<{ user: DashboardUser; csrfToken: string }>("/auth/login/", { method: "POST", body: credentials }),
    onSuccess: ({ user, csrfToken }) => {
      setCsrfToken(csrfToken)
      queryClient.setQueryData(dashboardKeys.me, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => dashboardRequest<void>("/auth/logout/", { method: "POST" }),
    onSettled: () => {
      setCsrfToken(null)
      // Flip "me" first so the login screen shows, then drop the private data.
      // "me" itself stays in the cache: removing it would detach the component watching it.
      queryClient.setQueryData(dashboardKeys.me, null)
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === "dashboard" && q.queryKey[1] !== "me" })
    },
  })
}

/** If the session expired while working, send the user back to the login screen. */
function useSessionGuard() {
  const queryClient = useQueryClient()
  return (error: unknown) => {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      const detail = (error.data as { detail?: string } | null)?.detail ?? ""
      if (!detail.toLowerCase().includes("csrf")) queryClient.setQueryData(dashboardKeys.me, null)
    }
  }
}

const isAuthError = (error: unknown) => error instanceof ApiError && (error.status === 401 || error.status === 403)

function useDashboardQuery<T>(key: readonly unknown[], path: string) {
  const onAuthError = useSessionGuard()
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        return await dashboardRequest<T>(path)
      } catch (error) {
        onAuthError(error)
        throw error
      }
    },
    staleTime: 30 * 1000,
    // Retry network hiccups, but not "you are logged out"
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 2,
  })
}

/* ---------------- Data ---------------- */

export const useStats = () => useDashboardQuery<DashboardStats>(dashboardKeys.stats, "/stats/")
export const useAlertsAdmin = () => useDashboardQuery<DashboardAlert[]>(dashboardKeys.alerts, "/alerts/")
export const useEstimatesAdmin = (status: string, q: string) =>
  useDashboardQuery<DashboardEstimate[]>(dashboardKeys.estimates(status, q), `/estimates/${query({ status, q })}`)
export const useMessagesAdmin = (status: string, q: string) =>
  useDashboardQuery<DashboardMessage[]>(dashboardKeys.messages(status, q), `/messages/${query({ status, q })}`)
export const useSubscribersAdmin = (q: string) =>
  useDashboardQuery<DashboardSubscriber[]>(dashboardKeys.subscribers(q), `/subscribers/${query({ q })}`)

export type AlertInput = Omit<DashboardAlert, "id" | "published_at" | "created_at" | "updated_at">

function useInvalidate() {
  const queryClient = useQueryClient()
  return (...prefixes: string[]) => {
    for (const prefix of prefixes) queryClient.invalidateQueries({ queryKey: ["dashboard", prefix] })
    // Public alert pages read a different cache
    if (prefixes.includes("alerts")) queryClient.invalidateQueries({ queryKey: ["security-alerts"] })
  }
}

export function useSaveAlert() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: AlertInput }) =>
      id
        ? dashboardRequest<DashboardAlert>(`/alerts/${id}/`, { method: "PATCH", body: data })
        : dashboardRequest<DashboardAlert>("/alerts/", { method: "POST", body: data }),
    onSuccess: () => invalidate("alerts", "stats"),
  })
}

export function useSetAlertPublished() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      dashboardRequest<DashboardAlert>(`/alerts/${id}/${published ? "publish" : "unpublish"}/`, { method: "POST" }),
    onSuccess: () => invalidate("alerts", "stats"),
  })
}

export function useDeleteAlert() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => dashboardRequest<void>(`/alerts/${id}/`, { method: "DELETE" }),
    onSuccess: () => invalidate("alerts", "stats"),
  })
}

export function useSetEstimateStatus() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EstimateStatus }) =>
      dashboardRequest<DashboardEstimate>(`/estimates/${id}/`, { method: "PATCH", body: { status } }),
    onSuccess: () => invalidate("estimates", "stats"),
  })
}

export function useSetMessageStatus() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MessageStatus }) =>
      dashboardRequest<DashboardMessage>(`/messages/${id}/`, { method: "PATCH", body: { status } }),
    onSuccess: () => invalidate("messages", "stats"),
  })
}

export function useDeleteSubscriber() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => dashboardRequest<void>(`/subscribers/${id}/`, { method: "DELETE" }),
    onSuccess: () => invalidate("subscribers", "stats"),
  })
}

/* ---------------- News ---------------- */

export type NewsInput = Omit<DashboardNews, "id" | "published_at" | "created_at" | "updated_at">

export const useNewsAdmin = () => useDashboardQuery<DashboardNews[]>(["dashboard", "news"], "/news/")

export function useSaveNews() {
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: NewsInput }) =>
      id
        ? dashboardRequest<DashboardNews>(`/news/${id}/`, { method: "PATCH", body: data })
        : dashboardRequest<DashboardNews>("/news/", { method: "POST", body: data }),
    onSuccess: () => {
      invalidate("news", "stats")
      queryClient.invalidateQueries({ queryKey: ["news"] })
    },
  })
}

export function useSetNewsPublished() {
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      dashboardRequest<DashboardNews>(`/news/${id}/${published ? "publish" : "unpublish"}/`, { method: "POST" }),
    onSuccess: () => {
      invalidate("news", "stats")
      queryClient.invalidateQueries({ queryKey: ["news"] })
    },
  })
}

export function useDeleteNews() {
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dashboardRequest<void>(`/news/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate("news", "stats")
      queryClient.invalidateQueries({ queryKey: ["news"] })
    },
  })
}

/* ---------------- Events ---------------- */

export type EventInput = Omit<DashboardEvent, "id" | "published_at" | "created_at" | "updated_at" | "counts">

export const useEventsAdmin = () => useDashboardQuery<DashboardEvent[]>(["dashboard", "events"], "/events/")
export const useEventAdmin = (id: string) => useDashboardQuery<DashboardEvent>(["dashboard", "events", id], `/events/${id}/`)

function useEventInvalidate() {
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  return () => {
    invalidate("events", "registrations", "stats")
    queryClient.invalidateQueries({ queryKey: ["events"] })
  }
}

export function useSaveEvent() {
  const done = useEventInvalidate()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: EventInput }) =>
      id
        ? dashboardRequest<DashboardEvent>(`/events/${id}/`, { method: "PATCH", body: data })
        : dashboardRequest<DashboardEvent>("/events/", { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useSetEventPublished() {
  const done = useEventInvalidate()
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      dashboardRequest<DashboardEvent>(`/events/${id}/${published ? "publish" : "unpublish"}/`, { method: "POST" }),
    onSuccess: done,
  })
}

export function useDeleteEvent() {
  const done = useEventInvalidate()
  return useMutation({
    mutationFn: (id: string) => dashboardRequest<void>(`/events/${id}/`, { method: "DELETE" }),
    onSuccess: done,
  })
}

export const useRegistrationsAdmin = (eventId: string, status: string, q: string) =>
  useDashboardQuery<DashboardRegistration[]>(
    ["dashboard", "registrations", eventId, status, q],
    `/registrations/${query({ event: eventId, status, q })}`,
  )

export function useSetRegistrationStatus() {
  const done = useEventInvalidate()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RegistrationStatus }) =>
      dashboardRequest<DashboardRegistration>(`/registrations/${id}/`, { method: "PATCH", body: { status } }),
    onSuccess: done,
  })
}

export function useCheckIn() {
  const done = useEventInvalidate()
  return useMutation({
    mutationFn: async (code: string): Promise<CheckInResult> => {
      try {
        return await dashboardRequest<CheckInResult>("/checkin/", { method: "POST", body: { code } })
      } catch (error) {
        // 404/409 carry a normal result body ("not found", "not paid yet")
        if (error instanceof ApiError && (error.status === 404 || error.status === 409) && error.data) {
          return error.data as CheckInResult
        }
        throw error
      }
    },
    onSuccess: done,
  })
}

/* ---------------- Image uploads (Cloudinary) ---------------- */

type UploadSignature = {
  cloud_name: string
  api_key: string
  folder: string
  timestamp: number
  signature: string
  upload_url: string
}

/** Uploads an image straight from the browser to Cloudinary and returns its https URL. */
export async function uploadImage(file: File): Promise<string> {
  const sig = await dashboardRequest<UploadSignature>("/uploads/signature/", { method: "POST" })
  const form = new FormData()
  form.append("file", file)
  form.append("api_key", sig.api_key)
  form.append("timestamp", String(sig.timestamp))
  form.append("folder", sig.folder)
  form.append("signature", sig.signature)
  const response = await fetch(sig.upload_url, { method: "POST", body: form })
  const data = (await response.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null
  if (!response.ok || !data?.secure_url) throw new Error(data?.error?.message ?? "Upload failed")
  return data.secure_url
}
