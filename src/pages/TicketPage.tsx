import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Hourglass,
  Loader2,
  MapPin,
  Smartphone,
  Ticket as TicketIcon,
  XCircle,
} from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useToast } from "@/hooks/use-toast"
import { useSubmitPayment, useTicket } from "@/features/events/api"
import {
  REGISTRATION_STATUS,
  formatEventDay,
  formatEventTime,
  formatPrice,
  ticketQrValue,
  ticketUrl,
  type Ticket,
} from "@/features/events/types"
import { saveTicket } from "@/features/events/my-tickets"
import { ApiError, errorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

function useQrDataUrl(value: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!value) return
    let cancelled = false
    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(value, { width: 480, margin: 2, errorCorrectionLevel: "M" }))
      .then((dataUrl) => {
        if (!cancelled) setUrl(dataUrl)
      })
      .catch(() => setUrl(null))
    return () => {
      cancelled = true
    }
  }, [value])
  return url
}

function icsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function downloadCalendar(ticket: Ticket) {
  const start = ticket.event.starts_at
  const end = ticket.event.ends_at ?? new Date(new Date(start).getTime() + 2 * 3600_000).toISOString()
  const location = ticket.event.mode === "online" ? "Mtandaoni" : ticket.event.venue
  const escape = (text: string) => text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n")
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RynexNative//Matukio//SW",
    "BEGIN:VEVENT",
    `UID:${ticket.id}@rynexnative.com`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escape(ticket.event.title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(`Tiketi: ${ticket.ticket_code}\n${ticketUrl(ticket.id)}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })),
    download: `${ticket.event.title}.ics`,
  })
  link.click()
  URL.revokeObjectURL(link.href)
}

function PaymentSection({ ticket }: { ticket: Ticket }) {
  const { toast } = useToast()
  const submit = useSubmitPayment(ticket.id)
  const [reference, setReference] = useState(ticket.payment_reference)
  const payment = ticket.payment
  if (!payment) return null
  const submitted = ticket.status === "payment_submitted"

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Imenakiliwa" })
    } catch {
      // Clipboard unavailable; the value is visible on screen anyway
    }
  }

  return (
    <section className="glass rounded-3xl p-6 md:p-8">
      {submitted ? (
        <div className="flex items-start gap-3 mb-6 rounded-2xl bg-accent/10 border border-accent/25 p-4">
          <Hourglass className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Tunakagua malipo yako</p>
            <p className="text-foreground/70">
              Namba ya muamala <strong>{ticket.payment_reference}</strong> imepokelewa. Tiketi yako itathibitishwa punde, na ukurasa huu
              utajisasisha wenyewe.
            </p>
          </div>
        </div>
      ) : (
        <h2 className="text-xl font-bold font-poppins mb-1">Kamilisha malipo</h2>
      )}

      {!payment.configured ? (
        <p className="text-sm text-foreground/70">Maelekezo ya malipo yatatumwa kwako kwa simu. Kwa msaada wasiliana nasi: +255 687 544 999.</p>
      ) : (
        <>
          <p className="text-sm text-foreground/70 mb-5">Fuata hatua hizi kwenye simu yako:</p>
          <ol className="space-y-3 mb-6">
            {[
              <>
                Fungua <strong>{payment.network}</strong> kwenye simu yako
              </>,
              <>
                Lipa{" "}
                <button type="button" onClick={() => copy(payment.number)} className="font-mono font-bold text-primary underline decoration-dotted">
                  {payment.number}
                </button>{" "}
                ({payment.account_name})
              </>,
              <>
                Kiasi: <strong>{formatPrice(payment.amount)}</strong>
              </>,
              <>
                Kumbukumbu / reference:{" "}
                <button type="button" onClick={() => copy(payment.reference)} className="font-mono font-bold text-primary underline decoration-dotted">
                  {payment.reference}
                </button>
              </>,
              <>Weka namba ya muamala (transaction ID) uliyopokea kwenye SMS hapa chini</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit.mutate(reference, {
            onSuccess: () => toast({ title: "Asante! Tumepokea namba ya muamala" }),
            onError: (error) =>
              toast({
                variant: "destructive",
                title: "Haikutumwa",
                description:
                  (error instanceof ApiError ? (error.data as { detail?: string } | null)?.detail : undefined) ??
                  errorMessage(error, "Jaribu tena."),
              }),
          })
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <label className="sr-only" htmlFor="tx-ref">
          Namba ya muamala
        </label>
        <input
          id="tx-ref"
          required
          minLength={4}
          maxLength={60}
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          placeholder="Mf. QK72HSD91L"
          className="flex-1 h-12 px-4 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono uppercase"
        />
        <button
          type="submit"
          disabled={submit.isPending}
          className="h-12 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitted ? "Badilisha" : "Nimelipa"}
        </button>
      </form>
    </section>
  )
}

export default function TicketPage() {
  const { id = "" } = useParams()
  const { toast } = useToast()
  const { data: ticket, isLoading, isError } = useTicket(id)
  const confirmed = ticket?.status === "confirmed"
  const qr = useQrDataUrl(confirmed ? ticketQrValue(ticket.ticket_code) : null)
  useDocumentTitle(ticket ? `Tiketi · ${ticket.event.title}` : "Tiketi")

  // Opening a ticket link on another device also remembers it there
  useEffect(() => {
    if (ticket) saveTicket(ticket.event.slug, ticket.id)
  }, [ticket])

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="py-32 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    )
  }

  if (isError || !ticket) {
    return (
      <SiteLayout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <TicketIcon className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-poppins mb-2">Tiketi haikupatikana</h1>
          <p className="text-foreground/70 mb-6">Hakikisha umefungua link kamili uliyotumiwa.</p>
          <Link to="/matukio" className="text-primary font-semibold hover:underline">
            Matukio yote
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const status = REGISTRATION_STATUS[ticket.status]
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl(ticket.id))
      toast({ title: "Link ya tiketi imenakiliwa", description: "Ihifadhi mahali salama." })
    } catch {
      window.prompt("Nakili link ya tiketi yako:", ticketUrl(ticket.id))
    }
  }

  return (
    <SiteLayout>
      <div className="max-w-xl mx-auto px-4 py-10 md:py-14 space-y-6">
        <div className="text-center">
          <p className="text-sm text-foreground/60 mb-1">Habari {ticket.name.split(" ")[0]} 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins">Tiketi yako</h1>
        </div>

        {/* The ticket */}
        <section className="relative glass rounded-3xl overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent">
            <div className="flex items-start justify-between gap-3 mb-4">
              <span className={cn("inline-flex px-3 py-1 rounded-full border text-xs font-bold", status.className)}>{status.label}</span>
              <span className="font-mono text-sm font-bold tracking-widest">{ticket.ticket_code}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-poppins mb-3">{ticket.event.title}</h2>
            <div className="space-y-1.5 text-sm text-foreground/75">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {formatEventDay(ticket.event.starts_at)} · {formatEventTime(ticket.event.starts_at, ticket.event.ends_at)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {ticket.event.mode === "online" ? "Mtandaoni" : ticket.event.venue}
              </p>
            </div>
          </div>

          {/* Perforation */}
          <div className="relative h-0 border-t-2 border-dashed border-foreground/15">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
          </div>

          <div className="p-6 md:p-8 text-center">
            {confirmed ? (
              <>
                {qr ? (
                  <img src={qr} alt={`QR code ya tiketi ${ticket.ticket_code}`} className="mx-auto w-56 h-56 rounded-2xl bg-white p-2" />
                ) : (
                  <div className="mx-auto w-56 h-56 rounded-2xl bg-foreground/10 animate-pulse" />
                )}
                <p className="mt-4 text-sm text-foreground/70 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {ticket.checked_in ? "Umeshaingia kwenye tukio. Karibu!" : "Onyesha QR hii mlangoni siku ya tukio"}
                </p>
                {ticket.online_link && (
                  <a
                    href={ticket.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 w-full h-12 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Jiunge mtandaoni
                  </a>
                )}
              </>
            ) : ticket.status === "cancelled" ? (
              <div className="py-4">
                <XCircle className="h-10 w-10 text-foreground/40 mx-auto mb-2" />
                <p className="font-semibold">Tiketi hii imeghairiwa</p>
                <p className="text-sm text-foreground/60 mt-1">Kwa maswali wasiliana nasi: +255 687 544 999</p>
              </div>
            ) : (
              <div className="py-4">
                <Smartphone className="h-10 w-10 text-primary mx-auto mb-2" />
                <p className="font-semibold">QR code itaonekana malipo yakithibitishwa</p>
                <p className="text-sm text-foreground/60 mt-1">Kiasi: {formatPrice(ticket.amount)}</p>
              </div>
            )}
          </div>
        </section>

        <PaymentSection ticket={ticket} />

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={copyLink} className="h-11 rounded-xl glass text-sm font-medium inline-flex items-center justify-center gap-2 hover:text-primary">
            <Copy className="h-4 w-4" />
            Nakili link
          </button>
          {confirmed ? (
            qr && (
              <a
                href={qr}
                download={`tiketi-${ticket.ticket_code}.png`}
                className="h-11 rounded-xl glass text-sm font-medium inline-flex items-center justify-center gap-2 hover:text-primary"
              >
                <Download className="h-4 w-4" />
                Pakua QR
              </a>
            )
          ) : (
            <Link
              to={`/matukio/${ticket.event.slug}`}
              className="h-11 rounded-xl glass text-sm font-medium inline-flex items-center justify-center gap-2 hover:text-primary"
            >
              Kuhusu tukio
            </Link>
          )}
          {ticket.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => downloadCalendar(ticket)}
              className="col-span-2 h-11 rounded-xl glass text-sm font-medium inline-flex items-center justify-center gap-2 hover:text-primary"
            >
              <CalendarPlus className="h-4 w-4" />
              Weka kwenye kalenda
            </button>
          )}
        </div>
        <p className="text-xs text-center text-foreground/50">
          Link ya ukurasa huu ndiyo tiketi yako. Usiishiriki na watu wengine.
        </p>
      </div>
    </SiteLayout>
  )
}
