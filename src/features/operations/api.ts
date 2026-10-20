import { useMutation } from "@tanstack/react-query"
import { query, useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { dashboardRequest } from "@/lib/api"
import type { OpsSummary } from "./types"

export type OpsResource = "clients" | "services" | "domains" | "servers" | "subscriptions"

export const useOpsSummary = () => useDashboardQuery<OpsSummary>(["dashboard", "ops", "summary"], "/ops/summary/")

export function useOpsList<T>(resource: OpsResource, params: Record<string, string> = {}, enabled = true) {
  return useDashboardQuery<T[]>(["dashboard", "ops", resource, params], `/ops/${resource}/${query(params)}`, enabled)
}

function useOpsInvalidate() {
  const invalidate = useInvalidate()
  // Lists, the summary and the sidebar badge all depend on each other
  return () => invalidate("ops", "stats")
}

export function useSaveRecord<T>(resource: OpsResource) {
  const done = useOpsInvalidate()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Record<string, unknown> }) =>
      id
        ? dashboardRequest<T>(`/ops/${resource}/${id}/`, { method: "PATCH", body: data })
        : dashboardRequest<T>(`/ops/${resource}/`, { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useDeleteRecord(resource: OpsResource) {
  const done = useOpsInvalidate()
  return useMutation({
    mutationFn: (id: string) => dashboardRequest<void>(`/ops/${resource}/${id}/`, { method: "DELETE" }),
    onSuccess: done,
  })
}
