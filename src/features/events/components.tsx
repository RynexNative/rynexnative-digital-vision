import { Link } from "react-router-dom"
import { CalendarDays, Clock, MapPin, Monitor, Users } from "lucide-react"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import { EVENT_TYPES, dateBadge, formatEventDay, formatEventTime, formatPrice, type EventSummary } from "./types"

export function DateBadge({ iso, className }: { iso: string; className?: string }) {
  const { day, month } = dateBadge(iso)
  return (
    <div className={cn("w-14 rounded-2xl bg-background/90 backdrop-blur text-center py-2 shadow-lg border border-foreground/10", className)}>
      <p className="text-[11px] font-bold uppercase text-primary leading-none">{month}</p>
      <p className="text-2xl font-bold font-poppins leading-tight">{day}</p>
    </div>
  )
}

export function SeatsInfo({
  event,
  showIcon = true,
}: {
  event: Pick<EventSummary, "seats_left" | "capacity" | "registration_open">
  showIcon?: boolean
}) {
  if (event.seats_left === null || event.capacity === null) return null
  const low = event.seats_left > 0 && event.seats_left <= Math.max(5, event.capacity * 0.15)
  if (event.seats_left === 0) return <span className="text-red-500 font-semibold">Nafasi zimejaa</span>
  return (
    <span className={cn("inline-flex items-center gap-1.5", low ? "text-amber-500 font-semibold" : "text-foreground/60")}>
      {showIcon && <Users className="h-4 w-4" />}
      {low ? `Zimebaki nafasi ${event.seats_left} tu!` : `Nafasi ${event.seats_left} zimebaki`}
    </span>
  )
}

export function EventCard({ event, past = false }: { event: EventSummary; past?: boolean }) {
  return (
    <Link
      to={`/matukio/${event.slug}`}
      className={cn(
        "group glass rounded-3xl overflow-hidden flex flex-col hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        past && "opacity-80",
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {event.cover_image ? (
          <img
            src={imageUrl(event.cover_image, 700)}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn("absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500", past && "grayscale")}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-tech-purple/25 flex items-center justify-center">
            <CalendarDays className="h-12 w-12 text-foreground/30" aria-hidden="true" />
          </div>
        )}
        <DateBadge iso={event.starts_at} className="absolute top-4 left-4" />
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-background/90 backdrop-blur border border-foreground/10">
          {formatPrice(event.price)}
        </span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{EVENT_TYPES[event.event_type]}</p>
        <h3 className="text-lg font-bold font-poppins group-hover:text-primary transition-colors mb-2">{event.title}</h3>
        <p className="text-sm text-foreground/70 line-clamp-2 mb-4">{event.summary}</p>
        <div className="mt-auto space-y-1.5 text-sm text-foreground/70">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate">
              {formatEventDay(event.starts_at)} · {formatEventTime(event.starts_at, event.ends_at)}
            </span>
          </p>
          <p className="flex items-center gap-2">
            {event.mode === "online" ? <Monitor className="h-4 w-4 text-primary flex-shrink-0" /> : <MapPin className="h-4 w-4 text-primary flex-shrink-0" />}
            <span className="truncate">{event.mode === "online" ? "Mtandaoni" : event.venue}</span>
          </p>
          {!past && (
            <p className="text-sm pt-1">
              <SeatsInfo event={event} />
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-3xl overflow-hidden animate-pulse" aria-hidden="true">
      <div className="aspect-[16/9] bg-foreground/10" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-20 bg-foreground/10 rounded" />
        <div className="h-5 w-4/5 bg-foreground/10 rounded" />
        <div className="h-3 w-full bg-foreground/10 rounded" />
        <div className="h-3 w-2/3 bg-foreground/10 rounded" />
      </div>
    </div>
  )
}
