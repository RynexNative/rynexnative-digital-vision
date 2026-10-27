import { useMutation, useQueryClient } from "@tanstack/react-query"
import { query, useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { dashboardRequest } from "@/lib/api"
import type { AuditPage, CatalogModule, Role, TeamUser } from "./types"

export const useTeam = (q: string, enabled = true) => useDashboardQuery<TeamUser[]>(["dashboard", "users", q], `/users/${query({ q })}`, enabled)
export const useRoles = (enabled = true) => useDashboardQuery<Role[]>(["dashboard", "roles"], "/roles/", enabled)
export const useCatalog = () => useDashboardQuery<CatalogModule[]>(["dashboard", "roles", "catalog"], "/roles/catalog/")

export function useAudit(params: Record<string, string>, offset: number) {
  return useDashboardQuery<AuditPage>(["dashboard", "audit", params, offset], `/audit/${query({ ...params, offset: String(offset), limit: "50" })}`)
}

function useTeamDone() {
  const invalidate = useInvalidate()
  return () => invalidate("users", "roles", "audit")
}

export function useSaveUser() {
  const done = useTeamDone()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Record<string, unknown> }) =>
      id ? dashboardRequest<TeamUser>(`/users/${id}/`, { method: "PATCH", body: data }) : dashboardRequest<TeamUser>("/users/", { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useSetPassword() {
  const done = useTeamDone()
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => dashboardRequest(`/users/${id}/set-password/`, { method: "POST", body: { password } }),
    onSuccess: done,
  })
}

export function useSaveRole() {
  const done = useTeamDone()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Partial<Role> }) =>
      id ? dashboardRequest<Role>(`/roles/${id}/`, { method: "PATCH", body: data }) : dashboardRequest<Role>("/roles/", { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useDeleteRole() {
  const done = useTeamDone()
  return useMutation({ mutationFn: (id: number) => dashboardRequest<void>(`/roles/${id}/`, { method: "DELETE" }), onSuccess: done })
}

export function useChangeOwnPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { current: string; new: string }) => dashboardRequest("/auth/password/", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard", "audit"] }),
  })
}
