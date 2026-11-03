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

export type Customer = {
  id: number
  name: string
  kind: string
  contact_person: string
  phone: string
  location: string
  notes: string
  is_active: boolean
  sales_count: number
  bought: string
  paid: string
  owes: string
}

export type SalePayment = { id: number; date: string; amount: string; method: string; reference: string; created_at: string }

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
  warnings?: { batch: number; text: string }[]
  costs_month?: string
  costs_month_by_category?: CategoryTotal[]
  unpaid_bills?: string
  sales_month?: string
  birds_sold_month?: number
  collected_month?: string
  owed_total?: string
  owed?: { name: string; customer: number | null; amount: string; sales: number }[]
  profit_month?: string
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
