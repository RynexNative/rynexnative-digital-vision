import type { FarmField, Values } from "./form"
import { CUSTOMER_KINDS, EXPENSE_CATEGORIES, NOTE_KINDS, PAYMENT_METHODS, today } from "./types"

const HEALTH_OPTIONS = { death: "Deaths", sickness: "Sickness", treatment: "Treatment", vaccination: "Vaccination", weighing: "Weighing", note: "Note" }
const RECEIVED = { cash: "Cash", mobile: "Mobile money", bank: "Bank" }

export const batchFields = (isNew: boolean, canCost: boolean): FarmField[] => [
  { name: "chicks_count", label: "Number of chicks", type: "number", required: true, step: "1", placeholder: "500" },
  { name: "started_on", label: "Arrived on", type: "date", required: true },
  { name: "breed", label: "Breed", type: "text", placeholder: "Broiler Ross 308, Kuroiler..." },
  { name: "house", label: "House (banda)", type: "text", placeholder: "Banda A" },
  { name: "supplier", label: "Bought from", type: "text", placeholder: "Hatchery or seller" },
  { name: "target_age_days", label: "Sell at age (days)", type: "number", step: "1", hint: "Broilers usually 35–42 days" },
  ...(isNew
    ? []
    : [{ name: "status", label: "Status", type: "select", options: { active: "Growing", selling: "Selling", closed: "Closed (all sold)" } } as FarmField]),
  ...(isNew && canCost
    ? [
        { name: "chick_cost", label: "What the chicks cost (TZS)", type: "number", hint: "Recorded as this batch's first cost", wide: true } as FarmField,
      ]
    : []),
  { name: "notes", label: "Notes", type: "textarea" },
]
export const batchDefaults = (): Values => ({ started_on: today(), target_age_days: 35 })

export const healthFields = (withBatch: boolean): FarmField[] => [
  ...(withBatch ? [{ name: "batch", label: "Batch", type: "batch", required: true, wide: true } as FarmField] : []),
  { name: "kind", label: "What happened", type: "select", options: HEALTH_OPTIONS },
  { name: "date", label: "Date", type: "date", required: true },
  {
    name: "count",
    label: "Number of birds",
    type: "number",
    step: "1",
    required: true,
    showIf: (v) => ["death", "sickness", "treatment", "vaccination"].includes(String(v.kind)),
    hint: "Dead, sick or treated",
  },
  { name: "disease", label: "Disease or cause", type: "text", placeholder: "Coccidiosis, Newcastle, cold, heat...", showIf: (v) => ["death", "sickness", "treatment"].includes(String(v.kind)) },
  { name: "medicine", label: "Medicine / vaccine and dose", type: "text", showIf: (v) => ["treatment", "vaccination"].includes(String(v.kind)) },
  { name: "avg_weight_kg", label: "Average weight (kg)", type: "number", required: true, showIf: (v) => v.kind === "weighing", placeholder: "1.8" },
  { name: "notes", label: "Notes", type: "textarea" },
]
export const healthDefaults = (): Values => ({ kind: "death", date: today() })

export const expenseFields = (withBatch: boolean): FarmField[] => [
  { name: "category", label: "What for", type: "select", options: EXPENSE_CATEGORIES },
  { name: "amount", label: "Amount paid (TZS)", type: "number", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  ...(withBatch ? [{ name: "batch", label: "Batch", type: "batch", allowEmpty: "All batches (shared cost)" } as FarmField] : []),
  { name: "description", label: "Details", type: "text", wide: true, placeholder: "e.g. Starter feed, LUKU, bodaboda to the market" },
  { name: "quantity", label: "Quantity", type: "number" },
  { name: "unit", label: "Unit", type: "text", placeholder: "bags, kg, trips..." },
  { name: "paid_to", label: "Paid to", type: "text" },
  { name: "payment_method", label: "Paid by", type: "select", options: PAYMENT_METHODS },
  { name: "receipt", label: "Receipt", type: "receipt" },
]
export const expenseDefaults = (): Values => ({ category: "feed", date: today(), payment_method: "cash" })

export const customerFields: FarmField[] = [
  { name: "name", label: "Name", type: "text", required: true, wide: true, placeholder: "e.g. Serena Hotel" },
  { name: "kind", label: "Type", type: "select", options: CUSTOMER_KINDS },
  { name: "contact_person", label: "Contact person", type: "text", placeholder: "e.g. Chef Ali" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "0712 345 678" },
  { name: "phone2", label: "Other phone", type: "tel", hint: "Kitchen, accountant..." },
  { name: "whatsapp", label: "WhatsApp number", type: "tel", hint: "Only if different from the phone" },
  { name: "email", label: "Email", type: "text" },
  { name: "location", label: "Location", type: "text" },
  { name: "is_active", label: "Status", type: "select", options: { true: "Active", false: "No longer buying" } },
  { name: "notes", label: "Notes", type: "textarea" },
]
export const customerDefaults = (): Values => ({ kind: "hotel", is_active: "true" })

export const saleFields = (isNew: boolean, withBatch: boolean): FarmField[] => [
  ...(withBatch ? [{ name: "batch", label: "Batch", type: "batch", required: true, wide: true } as FarmField] : []),
  { name: "customer", label: "Customer", type: "customer", allowEmpty: "Someone not in the list" },
  { name: "customer_name", label: "Buyer's name", type: "text", required: true, showIf: (v) => !v.customer },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "birds", label: "Number of birds", type: "number", step: "1", required: true },
  { name: "pricing", label: "Sold by", type: "select", options: { per_kg: "Per kg", per_bird: "Per bird" } },
  { name: "weight_kg", label: "Total weight (kg)", type: "number", required: true, showIf: (v) => v.pricing === "per_kg" },
  { name: "unit_price", label: "Price (TZS)", type: "number", required: true, hint: "Per kg or per bird, as chosen" },
  ...(isNew
    ? [
        { name: "paid_now", label: "Paid now (TZS)", type: "number", hint: "Leave empty if they will pay later" } as FarmField,
        { name: "paid_method", label: "Paid by", type: "select", options: RECEIVED } as FarmField,
      ]
    : []),
  { name: "notes", label: "Notes", type: "text", wide: true },
]
export const saleDefaults = (): Values => ({ date: today(), pricing: "per_kg", paid_method: "cash" })

/** What the sale form adds up to, before saving */
export function saleTotal(v: Values) {
  const price = Number(v.unit_price || 0)
  const qty = v.pricing === "per_kg" ? Number(v.weight_kg || 0) : Number(v.birds || 0)
  return price * qty
}

export const orderFields = (isNew: boolean, withCustomer: boolean): FarmField[] => [
  ...(withCustomer
    ? [
        { name: "customer", label: "Customer", type: "customer", allowEmpty: "Someone not in the list" } as FarmField,
        { name: "customer_name", label: "Buyer's name", type: "text", required: true, showIf: (v: Values) => !v.customer } as FarmField,
        { name: "customer_phone", label: "Buyer's phone", type: "tel", showIf: (v: Values) => !v.customer } as FarmField,
      ]
    : []),
  { name: "birds", label: "Number of birds", type: "number", step: "1", required: true },
  { name: "wanted_on", label: "Wanted on", type: "date", hint: "When they want them" },
  { name: "pricing", label: "Sold by", type: "select", options: { per_kg: "Per kg", per_bird: "Per bird" } },
  { name: "unit_price", label: "Agreed price (TZS)", type: "number", hint: "Per kg or per bird; leave empty if not agreed yet" },
  { name: "est_weight_kg", label: "Expected total weight (kg)", type: "number", showIf: (v) => v.pricing === "per_kg", hint: "To work out what they owe" },
  { name: "batch", label: "From batch", type: "batch", allowEmpty: "Not decided yet" },
  ...(isNew
    ? [
        { name: "paid_now", label: "Deposit paid now (TZS)", type: "number", hint: "In full or in part; leave empty if nothing yet" } as FarmField,
        { name: "paid_method", label: "Paid by", type: "select", options: { cash: "Cash", mobile: "Mobile money", bank: "Bank" } } as FarmField,
        { name: "paid_reference", label: "Reference", type: "text", placeholder: "M-Pesa code, bank ref..." } as FarmField,
      ]
    : [{ name: "status", label: "Status", type: "select", options: { open: "Waiting", ready: "Ready to deliver" } } as FarmField]),
  { name: "notes", label: "Notes", type: "text", wide: true },
]
export const orderDefaults = (): Values => ({ pricing: "per_bird", paid_method: "cash", status: "open" })

export const noteFields: FarmField[] = [
  { name: "kind", label: "What", type: "select", options: NOTE_KINDS },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "text", label: "What was said or agreed", type: "textarea", required: true, placeholder: "e.g. Wants 50 birds every Friday; asks for a lower price above 100 birds" },
  { name: "follow_up_on", label: "Get back to them on", type: "date", hint: "A reminder appears on the overview that day" },
]
export const noteDefaults = (): Values => ({ kind: "call", date: today() })
