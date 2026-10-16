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
  training: "Training",
  workshop: "Workshop",
  webinar: "Webinar",
  meetup: "Meetup",
}

export const EVENT_MODES: Record<EventMode, string> = {
  physical: "In person",
  online: "Online",
  hybrid: "In person + Online",
}

export const REGISTRATION_STATUS: Record<RegistrationStatus, { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  payment_submitted: { label: "Payment under review", className: "bg-accent/15 text-accent border-accent/30" },
  confirmed: { label: "Confirmed", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  cancelled: { label: "Cancelled", className: "bg-foreground/10 text-foreground/60 border-foreground/15" },
}

const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" })
const short = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" })

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

/** Big calendar-style date badge: { day: "12", month: "Oct" } */
export function dateBadge(iso: string) {
  const d = new Date(iso)
  return { day: String(d.getDate()), month: short.format(d).replace(/[\d\s.]/g, "").slice(0, 3) }
}

export function formatPrice(price: number) {
  return price === 0 ? "Free" : `TZS ${new Intl.NumberFormat("en-US").format(price)}`
}

export function eventUrl(slug: string) {
  return `${window.location.origin}/#/events/${slug}`
}

export function ticketUrl(id: string) {
  return `${window.location.origin}/#/ticket/${id}`
}

/** Text encoded in the ticket QR code (read by the dashboard scanner) */
export function ticketQrValue(code: string) {
  return `RYNEX-TICKET:${code}`
}
