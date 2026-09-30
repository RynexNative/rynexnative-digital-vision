import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, dashboardRequest, setCsrfToken } from "@/lib/api"
import type {
  DashboardAlert,
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
