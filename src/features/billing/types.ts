import type { ClientRef } from "@/features/operations/types"

export type DocumentKind = "quote" | "invoice"
export type DocumentStatus = "draft" | "sent" | "accepted" | "declined" | "void"
export type DocumentState = DocumentStatus | "expired" | "paid" | "partly_paid" | "overdue" | "unpaid"
export type PaymentMethod = "mobile_money" | "bank" | "cash" | "card" | "other"

export type DocumentItem = {
  id?: number
  description: string
  details: string
  quantity: string
  unit_price: string
  amount?: string
}

export type Payment = {
  id: string
  amount: string
  paid_on: string
  method: PaymentMethod
  reference: string
  notes: string
  created_at: string
}

export type BillingDocument = {
  id: string
  kind: DocumentKind
  number: string
  status: DocumentStatus
  state: DocumentState
  client: ClientRef | null
  bill_to_name: string
  bill_to_company: string
  bill_to_phone: string
  bill_to_email: string
  bill_to_address: string
  title: string
  issue_date: string
  valid_until: string | null
  due_date: string | null
  currency: "TZS" | "USD"
  apply_vat: boolean
  vat_rate: string
  notes: string
  terms: string
  inquiry: string | null
  package: string | null
  source_quote: { id: string; number: string } | null
  invoices: { id: string; number: string }[]
  items: DocumentItem[]
  payments: Payment[]
  subtotal: string
  vat_amount: string
  total: string
  amount_paid: string
  balance: string
  sent_at: string | null
  created_at: string
  updated_at: string
}

export type BusinessProfile = {
  name: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  tin: string
  vrn: string
  vat_rate: string
  vat_by_default: boolean
  payment_details: string
  quote_terms: string
  invoice_terms: string
  quote_valid_days: number
  invoice_due_days: number
}

const tone = {
  green: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  blue: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  amber: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  red: "bg-red-500/15 text-red-700 border-red-500/30",
  grey: "bg-foreground/10 text-foreground/60 border-foreground/15",
}

export const STATE_LABEL: Record<DocumentState, { label: string; className: string }> = {
  draft: { label: "Draft", className: tone.grey },
  sent: { label: "Sent", className: tone.blue },
  accepted: { label: "Accepted", className: tone.green },
  declined: { label: "Declined", className: tone.grey },
  void: { label: "Void", className: tone.grey },
  expired: { label: "Expired", className: tone.amber },
  unpaid: { label: "Unpaid", className: tone.blue },
  partly_paid: { label: "Partly paid", className: tone.amber },
  paid: { label: "Paid", className: tone.green },
  overdue: { label: "Overdue", className: tone.red },
}

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  mobile_money: "Mobile money",
  bank: "Bank transfer",
  cash: "Cash",
  card: "Card",
  other: "Other",
}

export const KIND_LABEL: Record<DocumentKind, string> = { quote: "Quotation", invoice: "Invoice" }

/** "TZS 1,500,000" (no cents for shillings) or "USD 1,250.00" */
export function money(value: string | number | null | undefined, currency: string) {
  const n = Number(value ?? 0)
  const digits = currency === "TZS" ? 0 : 2
  return `${currency} ${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)}`
}

/** Totals per currency, e.g. "TZS 2,000,000 + USD 300" */
export function moneyMap(map: Record<string, number> | undefined) {
  const entries = Object.entries(map ?? {}).filter(([, v]) => v > 0)
  return entries.length ? entries.map(([currency, value]) => money(value, currency)).join(" + ") : "—"
}
