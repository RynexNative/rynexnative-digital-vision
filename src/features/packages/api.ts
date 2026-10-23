import { useMutation, useQuery } from "@tanstack/react-query"
import { apiGet, apiPost } from "@/lib/api"
import { attribution } from "@/lib/track"
import type { InquiryInput, ServicePackage } from "./types"

export function usePackages({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["packages", "list"],
    queryFn: () => apiGet<ServicePackage[]>("/api/packages/"),
    enabled,
    staleTime: 60 * 1000,
  })
}

export function usePackage(slug: string | undefined) {
  return useQuery({
    queryKey: ["packages", "detail", slug],
    queryFn: () => apiGet<ServicePackage>(`/api/packages/${slug}/`),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
    retry: (count, error) => !(error && "status" in error && (error as { status: number }).status === 404) && count < 2,
  })
}

export function useRequestPackage(slug: string) {
  return useMutation({
    mutationFn: (data: InquiryInput) => apiPost<{ status: string }>(`/api/packages/${slug}/inquire/`, { ...data, attribution: attribution() }),
  })
}
