import type { AlertSeverity } from "@/features/alerts/types"

export type DashboardUser = { username: string; email: string; name: string; is_superuser: boolean }

export type DashboardAlert = {
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
  created_at: string
  updated_at: string
}

export type EstimateStatus = "new" | "contacted" | "won" | "lost"

export type DashboardEstimate = {
  id: string
  reference: string
  name: string
  phone: string
  email: string
  company: string
  notes: string
  project_type: string
  selections: { scale?: string; features?: string[]; design?: string; timeline?: string }
  estimate_min: number
  estimate_max: number
  weeks_min: number
  weeks_max: number
  status: EstimateStatus
  created_at: string
}

export type MessageStatus = "new" | "replied" | "archived"

export type DashboardMessage = {
  id: string
  name: string
  email: string
  company: string
  message: string
  status: MessageStatus
  created_at: string
}

export type DashboardSubscriber = { id: string; email: string; created_at: string }

export type DashboardStats = {
  estimates: { total: number; new: number; this_week: number; won: number }
  messages: { total: number; new: number }
  alerts: { total: number; published: number; drafts: number }
  subscribers: { total: number; this_week: number }
  recent_estimates: DashboardEstimate[]
  recent_messages: DashboardMessage[]
}

export const ESTIMATE_STATUS: Record<EstimateStatus, { label: string; className: string }> = {
  new: { label: "Mpya", className: "bg-primary/15 text-primary border-primary/30" },
  contacted: { label: "Tumewasiliana", className: "bg-accent/15 text-accent border-accent/30" },
  won: { label: "Tumepata kazi", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  lost: { label: "Haikufanikiwa", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

export const MESSAGE_STATUS: Record<MessageStatus, { label: string; className: string }> = {
  new: { label: "Mpya", className: "bg-primary/15 text-primary border-primary/30" },
  replied: { label: "Imejibiwa", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  archived: { label: "Kumbukumbu", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

const dateTime = new Intl.DateTimeFormat("sw-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export function formatWhen(iso: string) {
  const date = new Date(iso)
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return "Sasa hivi"
  if (minutes < 60) return `Dakika ${minutes} zilizopita`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Saa ${hours} zilizopita`
  return dateTime.format(date)
}

/** "0712 345 678" -> "255712345678" for wa.me links */
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("0") ? `255${digits.slice(1)}` : digits
}
