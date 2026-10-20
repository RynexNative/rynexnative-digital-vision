export type Option = { value: string; label: string }
export type ClientRef = { id: string; name: string }

const options = (record: Record<string, string>): Option[] => Object.entries(record).map(([value, label]) => ({ value, label }))

export const CURRENCIES = options({ TZS: "TZS", USD: "USD" })

export const BILLING_CYCLES: Record<string, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

export const CLIENT_KINDS: Record<string, string> = {
  company: "Company",
  institution: "Institution",
  organization: "Organization / NGO",
  government: "Government",
  school: "School / university",
  individual: "Individual",
}

export const CLIENT_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Active client", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  prospect: { label: "Prospect", className: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
  former: { label: "Former client", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

export const SERVICE_TYPES: Record<string, string> = {
  website: "Website",
  software: "Software / web system",
  mobile_app: "Mobile app",
  cybersecurity: "Cybersecurity",
  ai: "AI & machine learning",
  cloud: "Cloud & DevOps",
  iot: "IoT",
  hosting: "Hosting",
  domain_email: "Domain & email",
  maintenance: "Maintenance & support",
  training: "Training",
  consulting: "Consulting",
  other: "Other",
}

export const SERVICE_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Supported", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  paused: { label: "Paused", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  ended: { label: "Ended", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

export const END_REASONS: Record<string, string> = {
  contract_ended: "Contract ended",
  project_completed: "Project completed, no support plan",
  not_paid: "Not paid",
  client_cancelled: "Client cancelled",
  moved_provider: "Moved to another provider",
  client_closed: "Client closed or inactive",
  other: "Other",
}

export const DOMAIN_STATUS: Record<string, { label: string; className: string }> = {
  managed: { label: "Managed", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  not_managed: { label: "Not managed", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

export const DOMAIN_STOP_REASONS: Record<string, string> = {
  expired: "Expired, not renewed",
  support_ended: "Support ended",
  transferred_client: "Transferred to the client",
  transferred_other: "Moved to another provider",
  client_request: "Client request",
  other: "Other",
}

export const COST_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  trial: { label: "Trial", className: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
  not_needed: { label: "Not needed", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  cancelled: { label: "Cancelled", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

export const SERVER_KINDS: Record<string, string> = {
  vps: "VPS / virtual server",
  shared: "Shared hosting",
  paas: "Platform (Render, Vercel...)",
  database: "Database",
  storage: "Storage / CDN",
  email: "Email hosting",
  other: "Other",
}

export const SUBSCRIPTION_CATEGORIES: Record<string, string> = {
  software: "Software / tools",
  cloud: "Cloud service / API",
  email: "Email & workspace",
  sms: "SMS & messaging",
  payments: "Payments",
  design: "Design",
  security: "Security",
  domain: "Domains & DNS",
  other: "Other",
}

export { options }

type Stamped = { id: string; notes: string; created_at: string; updated_at: string }

export type OpsClient = Stamped & {
  name: string
  kind: string
  sector: string
  status: string
  contact_name: string
  phone: string
  email: string
  location: string
  website: string
  supported_services: number
  total_services: number
  domains_managed: number
}

export type OpsService = Stamped & {
  client: ClientRef
  service_type: string
  title: string
  status: string
  started_on: string | null
  support_until: string | null
  end_reason: string
  fee: number | null
  currency: string
  billing_cycle: string
  next_billing_on: string | null
  days_left: number | null
}

export type OpsDomain = Stamped & {
  name: string
  client: ClientRef | null
  status: string
  stop_reason: string
  registrar: string
  dns_provider: string
  registered_on: string | null
  expires_on: string | null
  auto_renew: boolean
  renewal_cost: number | null
  currency: string
  paid_by_client: boolean
  days_left: number | null
}

type Recurring = Stamped & {
  name: string
  provider: string
  status: string
  status_reason: string
  cost: number | null
  currency: string
  billing_cycle: string
  next_payment_on: string | null
  auto_renew: boolean
  paid_by_client: boolean
  days_left: number | null
}

export type OpsServer = Recurring & {
  kind: string
  address: string
  region: string
  hosted_systems: string[]
  clients: ClientRef[]
}

export type OpsSubscription = Recurring & {
  category: string
  used_for: string
  account: string
  client: ClientRef | null
}

export type CountRow = { key: string; label: string; count: number }

export type AttentionItem = {
  kind: "domain" | "server" | "subscription" | "service"
  id: string
  title: string
  detail: string
  due_on: string | null
  days: number | null
  severity: "high" | "medium" | "low"
}

export type OpsSummary = {
  clients: { total: number; active: number; prospects: number; former: number; supported: number; not_supported: number; by_kind: CountRow[] }
  support: { active_services: number; paused_services: number; ended_services: number; by_type: CountRow[]; ended_by_reason: CountRow[] }
  domains: { total: number; managed: number; not_managed: number; expiring_soon: number; expired: number; not_managed_by_reason: CountRow[] }
  servers: { total: number; running: number; not_needed: number; cancelled: number; due_soon: number; monthly_cost: Record<string, number> }
  subscriptions: { total: number; running: number; stopped: number; due_soon: number; monthly_cost: Record<string, number> }
  attention: AttentionItem[]
  attention_count: number
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })

export function formatDate(iso: string | null) {
  return iso ? dateFormat.format(new Date(`${iso}T00:00:00`)) : "—"
}

export function formatMoney(amount: number | null, currency: string) {
  return amount === null || amount === undefined ? "—" : `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`
}

/** "in 5 days", "today", "3 days ago" with a colour for urgency */
export function dueLabel(days: number | null, soon = 14): { text: string; className: string } | null {
  if (days === null || days === undefined) return null
  const text = days === 0 ? "today" : days > 0 ? `in ${days} day${days === 1 ? "" : "s"}` : `${-days} day${days === -1 ? "" : "s"} ago`
  const className = days < 0 ? "text-red-600" : days <= 7 ? "text-red-600" : days <= soon ? "text-amber-600" : "text-foreground/60"
  return { text, className }
}
