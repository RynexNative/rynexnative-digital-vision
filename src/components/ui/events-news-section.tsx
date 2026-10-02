import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react"
import { useEvents } from "@/features/events/api"
import { EventCard } from "@/features/events/components"
import { useNewsList } from "@/features/news/api"
import { NewsCard } from "@/features/news/components"

/** Upcoming events and latest news on the home page. Hidden while there is nothing to show. */
export function EventsNewsSection() {
  const { data: events = [] } = useEvents("upcoming")
  const { data: news = [] } = useNewsList()
  if (events.length === 0 && news.length === 0) return null

  return (
    <section id="matukio" className="py-20 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {events.length > 0 && (
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4">
                  <CalendarDays className="h-4 w-4" />
                  Matukio yajayo
                </p>
                <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-3">
                  Jifunze{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">pamoja nasi</span>
                </h2>
                <p className="text-lg text-foreground/80">Mafunzo, warsha na webinars. Jisajili na upate tiketi yako mtandaoni.</p>
              </div>
              <Link to="/matukio" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl glass font-semibold hover:text-primary self-start md:self-auto">
                Matukio yote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-4">
                  <Newspaper className="h-4 w-4" />
                  Habari mpya
                </p>
                <h2 className="text-3xl md:text-4xl font-bold font-poppins">Kinachoendelea RynexNative</h2>
              </div>
              <Link to="/habari" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl glass font-semibold hover:text-primary self-start md:self-auto">
                Habari zote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.slice(0, 3).map((post) => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
