export type EventType = "training" | "workshop" | "webinar" | "meetup"
export type EventMode = "physical" | "online" | "hybrid"

export type EventSummary = {
  id: string
  slug: string
  title: string
  summary: string
  cover_image: string
  event_type: EventType
  mode: EventMode
  venue: string
  starts_at: string
  ends_at: string | null
  price: number
  capacity: number | null
  seats_left: number | null
  registration_open: boolean
}

export type EventDetail = EventSummary & {
  description: string
  registration_deadline: string | null
  registration_closed_reason: string
}

export type RegistrationStatus = "pending_payment" | "payment_submitted" | "confirmed" | "cancelled"

export type Ticket = {
  id: string
  name: string
  status: RegistrationStatus
  ticket_code: string
  amount: number
  payment_reference: string
  checked_in: boolean
  created_at: string
  event: Pick<EventSummary, "slug" | "title" | "cover_image" | "event_type" | "mode" | "venue" | "starts_at" | "ends_at" | "price">
  payment: {
    method: "manual"
    network: string
    number: string
    account_name: string
    amount: number
    reference: string
    configured: boolean
  } | null
  online_link: string
}

export const EVENT_TYPES: Record<EventType, string> = {
  training: "Mafunzo",
  workshop: "Warsha",
  webinar: "Webinar",
  meetup: "Mkutano",
}

export const EVENT_MODES: Record<EventMode, string> = {
  physical: "Ana kwa ana",
  online: "Mtandaoni",
  hybrid: "Ana kwa ana + Mtandaoni",
}

export const REGISTRATION_STATUS: Record<RegistrationStatus, { label: string; className: string }> = {
  pending_payment: { label: "Inasubiri malipo", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  payment_submitted: { label: "Malipo yanakaguliwa", className: "bg-accent/15 text-accent border-accent/30" },
  confirmed: { label: "Imethibitishwa", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  cancelled: { label: "Imeghairiwa", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

const day = new Intl.DateTimeFormat("sw-TZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
const time = new Intl.DateTimeFormat("sw-TZ", { hour: "2-digit", minute: "2-digit" })
const short = new Intl.DateTimeFormat("sw-TZ", { day: "numeric", month: "short" })

export function formatEventDay(iso: string) {
  return day.format(new Date(iso))
}

export function formatEventTime(start: string, end: string | null) {
  const s = new Date(start)
  if (!end) return time.format(s)
  const e = new Date(end)
  const sameDay = s.toDateString() === e.toDateString()
  return sameDay ? `${time.format(s)} – ${time.format(e)}` : `${time.format(s)} – ${short.format(e)} ${time.format(e)}`
}

/** Big calendar-style date badge: { day: "12", month: "Okt" } */
export function dateBadge(iso: string) {
  const d = new Date(iso)
  return { day: String(d.getDate()), month: short.format(d).replace(/[\d\s.]/g, "").slice(0, 3) }
}

export function formatPrice(price: number) {
  return price === 0 ? "Bure" : `TZS ${new Intl.NumberFormat("en-US").format(price)}`
}

export function eventUrl(slug: string) {
  return `${window.location.origin}/#/matukio/${slug}`
}

export function ticketUrl(id: string) {
  return `${window.location.origin}/#/tiketi/${id}`
}

/** Text encoded in the ticket QR code (read by the dashboard scanner) */
export function ticketQrValue(code: string) {
  return `RYNEX-TICKET:${code}`
}
