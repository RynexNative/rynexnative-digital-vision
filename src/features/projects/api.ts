import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import type { Project, TrackRecord } from "./types"

export function useProjects() {
  return useQuery({
    queryKey: ["projects", "list"],
    queryFn: () => apiGet<Project[]>("/api/projects/"),
    staleTime: 5 * 60 * 1000,
  })
}

export function useProject(slug: string | undefined) {
  return useQuery({
    queryKey: ["projects", "detail", slug],
    queryFn: () => apiGet<Project>(`/api/projects/${slug}/`),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => !(error && "status" in error && (error as { status: number }).status === 404) && count < 2,
  })
}

/** Honest totals counted from Operations, and whether projects are shown at all */
export function useTrackRecord() {
  return useQuery({
    queryKey: ["projects", "track-record"],
    queryFn: () => apiGet<TrackRecord>("/api/track-record/"),
    staleTime: 5 * 60 * 1000,
  })
}
