import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import type { NewsPost } from "./types"

export function useNewsList() {
  return useQuery({
    queryKey: ["news", "list"],
    queryFn: () => apiGet<NewsPost[]>("/api/news/"),
    staleTime: 60 * 1000,
  })
}

export function useNewsPost(slug: string | undefined) {
  return useQuery({
    queryKey: ["news", "detail", slug],
    queryFn: () => apiGet<NewsPost>(`/api/news/${slug}/`),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
    retry: (count, error) => !(error && "status" in error && (error as { status: number }).status === 404) && count < 2,
  })
}
