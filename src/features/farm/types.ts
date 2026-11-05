import type { Person } from "@/features/accounts/types"

export type BatchStatus = "active" | "selling" | "closed"

export type BatchFigures = {
  age_days: number
  days_to_target: number
  deaths: number
  sold: number
  alive: number
  mortality_pct: number
  kg_sold: string
  /** Money appears only for roles allowed to see it */
  costs?: string
  feed_cost?: string
  cost_per_chick?: string
  revenue?: string
  avg_price_per_kg?: string | null
  profit?: string
}

export type Batch = {
  id: number
  code: string
  house: string
  breed: string
  supplier: string
  started_on: string
  chicks_count: number
  target_age_days: number
  status: BatchStatus
  closed_on: string | null
  notes: string
  figures: BatchFigures
  created_by: Person | null
  created_at: string
}

export type HealthKind = "death" | "sickness" | "treatment" | "vaccination" | "weighing" | "note"

export type HealthEvent = {
  id: number
  batch: number
  batch_code: string
  date: string
  kind: HealthKind
  count: number
  disease: string
  medicine: string
  avg_weight_kg: string | null
  notes: string
  created_by: Person | null
  created_at: string
}

export type Expense = {
  id: number
  date: string
  batch: number | null
  batch_code: string | null
  category: string
  category_label: string
  description: string
  quantity: string | null
  unit: string
  amount: string
  paid_to: string
  payment_method: string
  receipt_url: string
  receipt_name: string
  created_by: Person | null
  created_at: string
}

export type CategoryTotal = { category: string; label: string; amount: string }
export type ExpenseList = { total: string; by_category: CategoryTotal[]; results: Expense[] }

export type Segment = "regular" | "new" | "quiet" | "once" | "none"

export type CustomerStats = {
  purchases: number
  first_purchase: string | null
  last_purchase: string | null
  days_since: number | null
  /** How many days usually pass between two purchases */
  usual_gap_days: number | null
  next_expected: string | null
  bought: string
  birds_bought: number
  paid: string
  /** Negative: we owe them (a credit) */
  owes: string
  open_orders: number
  deposits_held: string
  segment: Segment
  segment_label: string
}

export type Customer = {
  id: number
  name: string
  kind: string
  contact_person: string
  phone: string
  phone2: string
  whatsapp: string
  email: string
  location: string
  notes: string
  is_active: boolean
  stats: CustomerStats
  created_by: Person | null
  created_at: string
}

export type CustomerList = { segments: { key: Segment; label: string; count: number }[]; results: Customer[] }

export type NoteKind = "call" | "whatsapp" | "visit" | "complaint" | "note"

export type CustomerNote = {
  id: number
  customer: number
  customer_name: string
  customer_phone: string
  date: string
  kind: NoteKind
  text: string
  follow_up_on: string | null
  follow_up_done: boolean
  created_by: Person | null
  created_at: string
}

export type SalePayment = {
  id: number
  kind: "payment" | "refund"
  date: string
  amount: string
  method: string
  reference: string
  /** Paid as a deposit on this order before delivery */
  from_order: number | null
  created_by: Person | null
  created_at: string
}

export type OrderStatus = "open" | "ready" | "delivered" | "cancelled"

export type Order = {
  id: number
  customer: number | null
  customer_name: string
  customer_phone: string
  customer_kind: string
  buyer: string
  phone: string
  ordered_on: string
  wanted_on: string | null
  birds: number
  pricing: "per_kg" | "per_bird"
  unit_price: string | null
  est_weight_kg: string | null
  batch: number | null
  batch_code: string | null
  status: OrderStatus
  sale: number | null
  cancel_reason: string
  notes: string
  payments: SalePayment[]
  paid: string
  expected_total: string | null
  to_pay: string | null
  created_by: Person | null
  created_at: string
}

export type TrashItem = {
  kind: string
  kind_label: string
  id: number
  label: string
  deleted_at: string
  deleted_by: Person | null
  reason: string
  can_restore: boolean
  /** Records deleted together with this batch (they come back with it) */
  records_with_it: number
  /** Owners can erase a deleted batch for good */
  can_erase: boolean
}

export type Sale = {
  id: number
  batch: number
  batch_code: string
  customer: number | null
  customer_name: string
  customer_kind: string
  buyer: string
  date: string
  birds: number
  weight_kg: string | null
  pricing: "per_kg" | "per_bird"
  unit_price: string
  total: string
  paid: string
  balance: string
  payments: SalePayment[]
  order: number | null
  notes: string
  created_by: Person | null
  created_at: string
}

export type SummaryBatch = BatchFigures & { id: number; code: string; house: string; breed: string; status: BatchStatus; chicks_count: number }

export type FarmSummary = {
  today: string
  batches?: SummaryBatch[]
  birds_alive?: number
  deaths_week?: number
  recent_health?: HealthEvent[]
  warnings?: { batch: number | null; text: string }[]
  costs_month?: string
  costs_month_by_category?: CategoryTotal[]
  unpaid_bills?: string
  sales_month?: string
  birds_sold_month?: number
  collected_month?: string
  owed_total?: string
  owed?: { name: string; customer: number | null; amount: string; sales: number }[]
  profit_month?: string
  birds_promised?: number
  orders_due?: Order[]
  deposits_held?: string
  refunds_due_total?: string
  refunds_due?: { name: string; customer: number | null; amount: string; order: number | null; sale: number | null; why: string }[]
  follow_ups_due?: CustomerNote[]
  quiet_customers?: { id: number; name: string; phone: string; purchases: number; last_purchase: string | null; usual_gap_days: number | null }[]
}

export type MonthRow = { month: string; revenue: string; costs: string; profit: string; collected: string }

export type FarmReport = {
  year: number
  years: number[]
  totals: { revenue: string; costs: string; profit: string; collected: string; general_costs: string; margin_pct: number | null }
  months: MonthRow[]
  costs_by_category: CategoryTotal[]
  batches: (BatchFigures & { id: number; code: string; status: BatchStatus; started_on: string; closed_on: string | null; chicks_count: number })[]
  customers: { customer: number | null; name: string; kind: string; total: string; birds: number; sales: number }[]
}

export const BATCH_STATUS: Record<BatchStatus, { label: string; className: string }> = {
  active: { label: "Growing", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  selling: { label: "Selling", className: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300" },
  closed: { label: "Closed", className: "bg-foreground/5 text-foreground/60 border-foreground/15" },
}

export const HEALTH_KINDS: Record<HealthKind, { label: string; className: string }> = {
  death: { label: "Deaths", className: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300" },
  sickness: { label: "Sickness", className: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300" },
  treatment: { label: "Treatment", className: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300" },
  vaccination: { label: "Vaccination", className: "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-300" },
  weighing: { label: "Weighing", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  note: { label: "Note", className: "bg-foreground/5 text-foreground/60 border-foreground/15" },
}

export const EXPENSE_CATEGORIES: Record<string, string> = {
  chicks: "Chicks",
  feed: "Feed",
  medicine: "Medicine & vaccines",
  electricity: "Electricity",
  charcoal: "Charcoal & heating",
  shavings: "Wood shavings (maranda)",
  transport: "Transport & fares (nauli)",
  labour: "Labour & wages",
  water: "Water",
  processing: "Slaughter & packing",
  equipment: "Equipment & repairs",
  rent: "Rent",
  other: "Other",
}

export const PAYMENT_METHODS: Record<string, string> = { cash: "Cash", mobile: "Mobile money", bank: "Bank", credit: "Not paid yet (credit)" }

export const CUSTOMER_KINDS: Record<string, string> = { hotel: "Hotel", restaurant: "Restaurant", shop: "Shop / butcher", individual: "Individual", other: "Other" }

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

/** TZS 1,250,000 */
export const tzs = (value: string | number | null | undefined) => `TZS ${money.format(Number(value ?? 0))}`
/** 1.3M / 250K for tight spaces */
export const tzsShort = (value: string | number | null | undefined) => {
  const n = Number(value ?? 0)
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`
  return money.format(n)
}
export const num = (value: string | number | null | undefined) => money.format(Number(value ?? 0))

export const shortDate = (value: string | null | undefined) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const isPdf = (url: string) => /\.pdf($|\?)/i.test(url)

export const SEGMENT_STYLE: Record<Segment, string> = {
  regular: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  new: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300",
  quiet: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300",
  once: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300",
  none: "bg-foreground/5 text-foreground/60 border-foreground/15",
}

export const SEGMENT_HELP: Record<Segment, string> = {
  regular: "Buys again and again",
  new: "First bought in the last 30 days",
  quiet: "Used to buy but has not for a while: call them",
  once: "Bought once, more than a month ago",
  none: "In the list, nothing bought yet",
}

export const NOTE_KINDS: Record<NoteKind, string> = { call: "Phone call", whatsapp: "WhatsApp / SMS", visit: "Visit", complaint: "Complaint", note: "Note" }

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  open: { label: "Waiting", className: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300" },
  ready: { label: "Ready to deliver", className: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300" },
  delivered: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  cancelled: { label: "Cancelled", className: "bg-foreground/5 text-foreground/60 border-foreground/15" },
}

/** "0712 345 678" -> "+255712345678" (Tanzanian numbers); others as typed, digits only */
export function intlPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("255") && digits.length === 12) return `+${digits}`
  if (digits.startsWith("0") && digits.length === 10) return `+255${digits.slice(1)}`
  if (digits.length === 9 && /^[67]/.test(digits)) return `+255${digits}`
  return (phone ?? "").trim().startsWith("+") ? `+${digits}` : digits
}

/** "+255712345678" -> "0712345678" */
export const localPhone = (phone: string | null | undefined) => {
  const intl = intlPhone(phone)
  return intl.startsWith("+255") ? `0${intl.slice(4)}` : intl
}

/** "0712345678" -> "0712 345 678", for reading */
export const prettyPhone = (phone: string | null | undefined) => {
  const local = localPhone(phone)
  return /^0\d{9}$/.test(local) ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local
}

export const waLink = (phone: string, text = "") => `https://wa.me/${intlPhone(phone).replace("+", "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`

/** "today", "yesterday", "12 days ago" */
export function daysAgo(days: number | null | undefined) {
  if (days === null || days === undefined) return "never"
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days} days ago`
}
