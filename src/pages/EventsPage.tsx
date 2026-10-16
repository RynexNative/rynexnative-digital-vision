import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useEvents } from "@/features/events/api"
import { CardSkeleton, EventCard } from "@/features/events/components"
import { cn } from "@/lib/utils"

export default function EventsPage() {
  useDocumentTitle("Events")
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming")
  const { data = [], isLoading, isError, refetch } = useEvents(when)

  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-foreground/10" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <CalendarDays className="h-4 w-4" />
            Training · Workshops · Webinars
          </p>
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-white mb-5">
            Events by{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">RynexNative</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl">
            Learn ethical hacking, full-stack development and cybersecurity from practitioners. Register online and get
            your ticket instantly.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div role="tablist" className="inline-flex gap-1 p-1 rounded-xl bg-card/60 border border-foreground/10 mb-8">
          {(
            [
              ["upcoming", "Upcoming"],
              ["past", "Past"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={when === id}
              onClick={() => setWhen(id)}
              className={cn(
                "px-5 h-10 rounded-lg text-sm font-medium transition-colors",
                when === id ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="glass rounded-3xl p-10 text-center max-w-lg mx-auto">
            <p className="font-semibold mb-2">Could not load the events</p>
            <button type="button" onClick={() => refetch()} className="text-primary font-semibold hover:underline">
              Try again
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center max-w-lg mx-auto">
            <CalendarDays className="h-10 w-10 text-foreground/30 mx-auto mb-3" />
            <p className="font-semibold">{when === "upcoming" ? "No events scheduled right now" : "No past events yet"}</p>
            {when === "upcoming" && (
              <p className="text-sm text-foreground/60 mt-1">Join the newsletter at the bottom of the page to hear about the next event.</p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((event) => (
              <EventCard key={event.id} event={event} past={when === "past"} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  )
}
