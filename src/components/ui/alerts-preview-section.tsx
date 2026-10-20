import { Link } from "react-router-dom"
import { ArrowRight, ShieldAlert } from "lucide-react"
import { usePublishedAlerts } from "@/features/alerts/api"
import { AlertCard, AlertCardSkeleton } from "@/features/alerts/components"
import { useNearViewport } from "@/hooks/use-near-viewport"

export function AlertsPreviewSection() {
  const [ref, near] = useNearViewport<HTMLElement>()
  const { data, isLoading } = usePublishedAlerts({ enabled: near })
  const alerts = (data?.alerts ?? []).slice(0, 3)

  return (
    <section ref={ref} id="alerts" className="py-20 md:py-24 section-muted relative overflow-hidden">
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-red-500/5 blur-3xl" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold mb-4">
              <ShieldAlert className="h-4 w-4" />
              Security Alerts
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-4">
              Protect yourself from{" "}
              <span className="text-primary">online scams</span>
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Clear alerts about scams spreading in Tanzania: how to spot them and what to do. From our cybersecurity team.
            </p>
          </div>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl glass font-semibold hover:bg-primary/10 hover:text-primary transition-colors self-start md:self-auto"
          >
            See all alerts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading || !near
            ? Array.from({ length: 3 }, (_, i) => <AlertCardSkeleton key={i} />)
            : alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      </div>
    </section>
  )
}
