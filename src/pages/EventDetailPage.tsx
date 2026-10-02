import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, ChevronRight, Clock, Loader2, MapPin, Monitor, Ticket as TicketIcon, Users } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { ShareButtons } from "@/components/share-buttons"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useToast } from "@/hooks/use-toast"
import { RichText } from "@/features/content/RichText"
import { useEvent, useRegister, type RegistrationInput } from "@/features/events/api"
import { SeatsInfo } from "@/features/events/components"
import { savedTicketFor, saveTicket } from "@/features/events/my-tickets"
import { EVENT_MODES, EVENT_TYPES, eventUrl, formatEventDay, formatEventTime, formatPrice } from "@/features/events/types"
import { ApiError, errorMessage, validationMessage } from "@/lib/api"
import { imageUrl } from "@/lib/media"

const inputClass =
  "w-full h-11 px-4 rounded-xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"

const EMPTY: RegistrationInput = { name: "", phone: "", email: "", organization: "", website: "" }

function RegisterForm({ slug, price }: { slug: string; price: number }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const register = useRegister(slug)
  const [form, setForm] = useState(EMPTY)
  const set = (key: keyof RegistrationInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    register.mutate(
      { ...form, name: form.name.trim(), email: form.email.trim(), organization: form.organization.trim() },
      {
        onSuccess: (ticket) => {
          if (!ticket?.id) return // honeypot response
          saveTicket(slug, ticket.id)
          navigate(`/tiketi/${ticket.id}`)
        },
        onError: (error) => {
          const detail = error instanceof ApiError ? (error.data as { detail?: string } | null)?.detail : undefined
          toast({
            variant: "destructive",
            title: "Usajili haukukamilika",
            description: detail ?? validationMessage(error) ?? errorMessage(error, "Jaribu tena baada ya muda mfupi."),
          })
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Jina kamili *</span>
        <input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={set("name")} className={inputClass} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Simu / WhatsApp *</span>
        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="07XX XXX XXX"
          value={form.phone}
          onChange={set("phone")}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">
          Email <span className="text-foreground/50 font-normal">(tutakutumia tiketi)</span>
        </span>
        <input type="email" autoComplete="email" maxLength={254} value={form.email} onChange={set("email")} className={inputClass} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Chuo / Kampuni</span>
        <input autoComplete="organization" maxLength={100} value={form.organization} onChange={set("organization")} className={inputClass} />
      </label>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set("website")} className="hidden" />
      <button
        type="submit"
        disabled={register.isPending}
        className="w-full h-12 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
      >
        {register.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <TicketIcon className="h-5 w-5" />}
        {price === 0 ? "Jisajili bure" : `Jisajili · ${formatPrice(price)}`}
      </button>
      {price > 0 && (
        <p className="text-xs text-foreground/60 text-center">Baada ya kujisajili utaona maelekezo ya kulipa kwa simu.</p>
      )}
    </form>
  )
}

export default function EventDetailPage() {
  const { slug = "" } = useParams()
  const { data: event, isLoading, isError } = useEvent(slug)
  useDocumentTitle(event?.title ?? "Matukio")
  const existingTicket = savedTicketFor(slug)

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse" aria-busy="true">
          <div className="h-72 rounded-3xl bg-foreground/10 mb-8" />
          <div className="h-10 w-2/3 bg-foreground/10 rounded" />
        </div>
      </SiteLayout>
    )
  }

  if (isError || !event) {
    return (
      <SiteLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <CalendarDays className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-poppins mb-3">Tukio halikupatikana</h1>
          <Link to="/matukio" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Matukio yote
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const facts = [
    { icon: <CalendarDays className="h-5 w-5" />, label: formatEventDay(event.starts_at) },
    { icon: <Clock className="h-5 w-5" />, label: formatEventTime(event.starts_at, event.ends_at) },
    event.mode !== "online" && { icon: <MapPin className="h-5 w-5" />, label: event.venue },
    event.mode !== "physical" && { icon: <Monitor className="h-5 w-5" />, label: "Link ya kujiunga inatumwa kwa waliothibitishwa" },
    event.capacity !== null && { icon: <Users className="h-5 w-5" />, label: <SeatsInfo event={event} showIcon={false} /> },
  ].filter(Boolean) as { icon: React.ReactNode; label: React.ReactNode }[]

  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-foreground/10" style={{ background: "var(--gradient-hero)" }}>
        {event.cover_image && (
          <img src={imageUrl(event.cover_image, 1600)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-primary">Nyumbani</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/matukio" className="hover:text-primary">Matukio</Link>
          </nav>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-semibold">{EVENT_TYPES[event.event_type]}</span>
            <span className="px-3 py-1 rounded-full bg-foreground/10 text-foreground/80 text-sm">{EVENT_MODES[event.mode]}</span>
            <span className="px-3 py-1 rounded-full bg-foreground/10 text-foreground font-bold text-sm">{formatPrice(event.price)}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-poppins text-foreground leading-tight max-w-3xl mb-4">{event.title}</h1>
          <p className="text-lg md:text-xl text-foreground/75 max-w-3xl">{event.summary}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 grid lg:grid-cols-[1fr,380px] gap-10 items-start">
        <div className="min-w-0">
          <ul className="grid sm:grid-cols-2 gap-3 mb-10">
            {facts.map((fact, i) => (
              <li key={i} className="glass rounded-2xl p-4 flex items-center gap-3 text-sm">
                <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">{fact.icon}</span>
                <span className="font-medium">{fact.label}</span>
              </li>
            ))}
          </ul>
          {event.description && (
            <>
              <h2 className="text-2xl font-bold font-poppins mb-2">Kuhusu tukio hili</h2>
              <RichText text={event.description} className="text-lg leading-relaxed text-foreground/85" />
            </>
          )}
          <div className="mt-10 pt-8 border-t border-foreground/10">
            <p className="font-semibold mb-3">Mwalike rafiki</p>
            <ShareButtons
              title={event.title}
              text={`${event.summary}\n📅 ${formatEventDay(event.starts_at)}`}
              url={eventUrl(event.slug)}
            />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 glass rounded-3xl p-6" id="jisajili">
          {existingTicket ? (
            <div className="text-center">
              <TicketIcon className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold font-poppins mb-1">Umeshajisajili</h2>
              <p className="text-sm text-foreground/70 mb-5">Tiketi yako imehifadhiwa kwenye kifaa hiki.</p>
              <Link
                to={`/tiketi/${existingTicket}`}
                className="w-full h-12 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2"
              >
                Fungua tiketi yangu
              </Link>
            </div>
          ) : event.registration_open ? (
            <>
              <h2 className="text-xl font-bold font-poppins mb-1">Jisajili sasa</h2>
              <p className="text-sm text-foreground/70 mb-5">Utapata tiketi yenye QR code mara moja.</p>
              <RegisterForm slug={event.slug} price={event.price} />
            </>
          ) : (
            <div className="text-center py-4">
              <CalendarDays className="h-10 w-10 text-foreground/30 mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-1">Usajili haupo wazi</h2>
              <p className="text-sm text-foreground/70">{event.registration_closed_reason}</p>
              <Link to="/matukio" className="inline-block mt-4 text-primary font-semibold text-sm hover:underline">
                Angalia matukio mengine
              </Link>
            </div>
          )}
        </aside>
      </div>
    </SiteLayout>
  )
}
