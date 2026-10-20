import type { Field, Values } from "./form-values"
import {
  BILLING_CYCLES,
  CLIENT_KINDS,
  CLIENT_STATUS,
  COST_STATUS,
  CURRENCIES,
  DOMAIN_STATUS,
  DOMAIN_STOP_REASONS,
  END_REASONS,
  SERVER_KINDS,
  SERVICE_STATUS,
  SERVICE_TYPES,
  SUBSCRIPTION_CATEGORIES,
  options,
} from "./types"

const labels = (record: Record<string, { label: string }>) => options(Object.fromEntries(Object.entries(record).map(([k, v]) => [k, v.label])))
const notes: Field = { name: "notes", label: "Notes", type: "textarea", rows: 3 }

export const clientFields: Field[] = [
  { name: "name", label: "Name", type: "text", required: true, wide: true, placeholder: "E.g. Mwatano Secondary School" },
  { name: "kind", label: "Type", type: "select", options: options(CLIENT_KINDS) },
  { name: "status", label: "Relationship", type: "select", options: labels(CLIENT_STATUS) },
  { name: "sector", label: "Sector", type: "text", placeholder: "Education, Finance, Health..." },
  { name: "location", label: "Location", type: "text", placeholder: "Dodoma" },
  { name: "contact_name", label: "Contact person", type: "text" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "website", label: "Website", type: "text" },
  notes,
]
export const clientDefaults: Values = { kind: "company", status: "active" }

export const serviceFields: Field[] = [
  { name: "client", label: "Client", type: "client", required: true },
  { name: "service_type", label: "Service", type: "select", options: options(SERVICE_TYPES) },
  { name: "title", label: "What we deliver", type: "text", required: true, wide: true, placeholder: "E.g. School management system" },
  { name: "status", label: "Support", type: "select", options: labels(SERVICE_STATUS) },
  {
    name: "end_reason",
    label: "Why support ended",
    type: "select",
    options: options(END_REASONS),
    allowEmpty: "Choose a reason",
    required: true,
    showIf: (v) => v.status === "ended",
  },
  { name: "started_on", label: "Started", type: "date" },
  { name: "support_until", label: "Support until", type: "date", hint: "We remind you 30 days before" },
  { name: "fee", label: "Fee", type: "number" },
  { name: "currency", label: "Currency", type: "select", options: CURRENCIES },
  { name: "billing_cycle", label: "Billed", type: "select", options: options(BILLING_CYCLES) },
  { name: "next_billing_on", label: "Next invoice", type: "date", showIf: (v) => v.billing_cycle !== "one_time" },
  notes,
]
export const serviceDefaults: Values = { service_type: "website", status: "active", currency: "TZS", billing_cycle: "one_time" }

export const domainFields: Field[] = [
  { name: "name", label: "Domain", type: "text", required: true, placeholder: "example.co.tz" },
  { name: "client", label: "Owner", type: "client" },
  { name: "status", label: "Status", type: "select", options: labels(DOMAIN_STATUS) },
  {
    name: "stop_reason",
    label: "Why we stopped",
    type: "select",
    options: options(DOMAIN_STOP_REASONS),
    allowEmpty: "Choose a reason",
    required: true,
    showIf: (v) => v.status === "not_managed",
  },
  { name: "expires_on", label: "Expires on", type: "date", hint: "We remind you 30 days before" },
  { name: "registered_on", label: "Registered on", type: "date" },
  { name: "registrar", label: "Registrar", type: "text", placeholder: "Cloudflare, Namecheap, local .tz registrar..." },
  { name: "dns_provider", label: "DNS", type: "text", placeholder: "Cloudflare" },
  { name: "renewal_cost", label: "Renewal cost", type: "number" },
  { name: "currency", label: "Currency", type: "select", options: CURRENCIES },
  { name: "auto_renew", label: "Auto-renew on", type: "switch" },
  { name: "paid_by_client", label: "Client pays the renewal", type: "switch" },
  notes,
]
export const domainDefaults: Values = { status: "managed", currency: "TZS", auto_renew: false, paid_by_client: false }

const recurring = (statusHint: string): Field[] => [
  { name: "status", label: "Status", type: "select", options: labels(COST_STATUS) },
  {
    name: "status_reason",
    label: "Why",
    type: "text",
    hint: statusHint,
    showIf: (v) => v.status === "not_needed" || v.status === "cancelled",
  },
  { name: "cost", label: "Cost", type: "number" },
  { name: "currency", label: "Currency", type: "select", options: CURRENCIES },
  { name: "billing_cycle", label: "Billed", type: "select", options: options(BILLING_CYCLES) },
  { name: "next_payment_on", label: "Next payment", type: "date", hint: "We remind you 14 days before" },
  { name: "auto_renew", label: "Renews automatically", type: "switch" },
  { name: "paid_by_client", label: "Client pays this bill", type: "switch" },
]

export const serverFields: Field[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "E.g. Production VPS" },
  { name: "provider", label: "Provider", type: "text", placeholder: "Render, Contabo, DigitalOcean..." },
  { name: "kind", label: "Type", type: "select", options: options(SERVER_KINDS) },
  { name: "region", label: "Region", type: "text", placeholder: "Frankfurt" },
  { name: "address", label: "IP or dashboard link", type: "text", wide: true },
  ...recurring("E.g. Systems moved to another server"),
  { name: "hosted_systems", label: "Systems hosted here", type: "lines", hint: "One per line. A running server with nothing listed is flagged as possibly not needed." },
  { name: "clients", label: "Clients on this server", type: "clients" },
  notes,
]
export const serverDefaults: Values = { kind: "vps", status: "active", currency: "USD", billing_cycle: "monthly", auto_renew: true, paid_by_client: false }

export const subscriptionFields: Field[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "E.g. Cloudinary Plus" },
  { name: "provider", label: "Vendor", type: "text" },
  { name: "category", label: "Category", type: "select", options: options(SUBSCRIPTION_CATEGORIES) },
  { name: "client", label: "For", type: "client" },
  { name: "used_for", label: "Used for", type: "text", wide: true, placeholder: "E.g. Image uploads on rynexnative.com" },
  { name: "account", label: "Account", type: "text", hint: "Login email or account name. Never store passwords here." },
  ...recurring("E.g. Replaced by another tool"),
  notes,
]
export const subscriptionDefaults: Values = { category: "software", status: "active", currency: "USD", billing_cycle: "monthly", auto_renew: true, paid_by_client: false }
