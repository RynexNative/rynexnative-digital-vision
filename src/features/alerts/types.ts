export type AlertSeverity = "high" | "medium" | "low"

export type SecurityAlert = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  category: string
  severity: AlertSeverity
  signs: string[]
  prevention: string[]
  if_affected: string[]
  is_published: boolean
  published_at: string | null
}

export const SEVERITY_META: Record<AlertSeverity, { label: string; shortLabel: string; className: string; dotClassName: string }> = {
  high: {
    label: "High risk",
    shortLabel: "High",
    className: "bg-red-500/15 text-red-500 border-red-500/30",
    dotClassName: "bg-red-500",
  },
  medium: {
    label: "Medium risk",
    shortLabel: "Medium",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    dotClassName: "bg-amber-500",
  },
  low: {
    label: "Low risk",
    shortLabel: "Low",
    className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    dotClassName: "bg-emerald-500",
  },
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })

export function formatAlertDate(iso: string | null) {
  if (!iso) return ""
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date)
}

/** Public, shareable URL of an alert (the site uses hash routing). */
export function alertUrl(slug: string) {
  return `${window.location.origin}/alerts/${slug}/`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}
