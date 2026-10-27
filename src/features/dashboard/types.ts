import type { AlertSeverity } from "@/features/alerts/types"
import type { NewsCategory } from "@/features/news/types"
import type { EventMode, EventType, RegistrationStatus } from "@/features/events/types"
import type { PreferredContact, ServicePackage } from "@/features/packages/types"

export type DashboardUser = {
  username: string
  email: string
  name: string
  is_superuser: boolean
  /** "Owner" for owners, otherwise the role's name ("" when none) */
  role: string
  /** What the role allows, e.g. "billing.view"; the server checks every request anyway */
  permissions: string[]
}

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
  // Optional: an older backend without events/news must not crash the dashboard
  events?: { upcoming: number; registrations_week: number; to_verify: number }
  news?: { published: number; drafts: number }
  packages?: { published?: number; inquiries_new?: number; inquiries_week?: number }
  operations?: { attention: number }
  // Each part is only sent when the person's role may see it
  estimates?: { total: number; new: number; this_week: number; won: number }
  messages?: { total: number; new: number }
  alerts?: { total: number; published: number; drafts: number }
  subscribers?: { total: number; this_week: number }
  recent_estimates?: DashboardEstimate[]
  recent_messages?: DashboardMessage[]
}

export const ESTIMATE_STATUS: Record<EstimateStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/15 text-primary border-primary/30" },
  contacted: { label: "Contacted", className: "bg-accent/15 text-accent border-accent/30" },
  won: { label: "Won", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  lost: { label: "Lost", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

export const MESSAGE_STATUS: Record<MessageStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/15 text-primary border-primary/30" },
  replied: { label: "Replied", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  archived: { label: "Archived", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export function formatWhen(iso: string) {
  const date = new Date(iso)
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return dateTime.format(date)
}

/** "0712 345 678" -> "255712345678" for wa.me links */
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("0") ? `255${digits.slice(1)}` : digits
}

/* ---------------- News & events ---------------- */


export type DashboardNews = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  cover_image: string
  category: NewsCategory
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type DashboardEvent = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  cover_image: string
  event_type: EventType
  mode: EventMode
  venue: string
  online_link: string
  starts_at: string
  ends_at: string | null
  capacity: number | null
  price: number
  registration_deadline: string | null
  registrations_open: boolean
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  counts: { confirmed: number; awaiting_payment: number; to_verify: number; checked_in: number }
}

export type DashboardRegistration = {
  id: string
  event: string
  event_title: string
  name: string
  phone: string
  email: string
  organization: string
  status: RegistrationStatus
  amount: number
  payment_reference: string
  payment_submitted_at: string | null
  confirmed_at: string | null
  ticket_code: string
  checked_in: boolean
  checked_in_at: string | null
  created_at: string
}

export type CheckInResult = {
  result: "ok" | "already" | "not_confirmed" | "not_found"
  detail: string
  registration?: DashboardRegistration
}

/* ---------------- Packages ---------------- */

export type DashboardPackage = Omit<ServicePackage, "bonus_ends_at"> & {
  bonus_ends_at: string | null
  sort_order: number
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  inquiries: number
}

export type InquiryStatus = EstimateStatus

export type DashboardInquiry = {
  id: string
  package: string | null
  package_slug: string
  package_name: string
  name: string
  phone: string
  email: string
  company: string
  message: string
  preferred_contact: PreferredContact
  status: InquiryStatus
  /** Where the visitor came from (Google, WhatsApp...) and the first page they opened */
  source: string
  landing_page: string
  /** The quote made from this request, if any */
  quote: { id: string; number: string } | null
  created_at: string
}

export const INQUIRY_STATUS = ESTIMATE_STATUS
