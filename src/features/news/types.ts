export type NewsCategory = "announcement" | "project" | "article" | "event-recap"

export type NewsPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  body?: string
  cover_image: string
  category: NewsCategory
  published_at: string | null
}

export const NEWS_CATEGORIES: Record<NewsCategory, string> = {
  announcement: "Tangazo",
  project: "Project mpya",
  article: "Makala",
  "event-recap": "Matukio",
}

const dateFormatter = new Intl.DateTimeFormat("sw-TZ", { day: "numeric", month: "long", year: "numeric" })

export function formatNewsDate(iso: string | null) {
  if (!iso) return ""
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date)
}

export function newsUrl(slug: string) {
  return `${window.location.origin}/#/habari/${slug}`
}
