import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { LifeBuoy, Search, ShieldAlert, X } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSectionNav } from "@/hooks/use-section-nav"
import { usePublishedAlerts } from "@/features/alerts/api"
import { AlertCard, AlertCardSkeleton } from "@/features/alerts/components"
import { SEVERITY_META, type AlertSeverity } from "@/features/alerts/types"
import { cn } from "@/lib/utils"

type SeverityFilter = AlertSeverity | "all"

const severityFilters: { id: SeverityFilter; label: string }[] = [
  { id: "all", label: "Zote" },
  { id: "high", label: SEVERITY_META.high.label },
  { id: "medium", label: SEVERITY_META.medium.label },
  { id: "low", label: SEVERITY_META.low.label },
]

const chipClass = (active: boolean) =>
  cn(
    "px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    active
      ? "bg-primary text-primary-foreground border-primary"
      : "border-foreground/15 text-foreground/75 hover:border-primary/50 hover:text-primary",
  )

export default function AlertsPage() {
  useDocumentTitle("Tahadhari za Usalama Mtandaoni")
  const goToSection = useSectionNav()
  const { data, isLoading } = usePublishedAlerts()
  const [query, setQuery] = useState("")
  const [severity, setSeverity] = useState<SeverityFilter>("all")
  const [category, setCategory] = useState<string>("all")

  const alerts = useMemo(() => data?.alerts ?? [], [data])
  const categories = useMemo(() => Array.from(new Set(alerts.map((a) => a.category))).sort(), [alerts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return alerts.filter(
      (a) =>
        (severity === "all" || a.severity === severity) &&
        (category === "all" || a.category === category) &&
        (!q || `${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(q)),
    )
  }, [alerts, query, severity, category])

  const isFiltering = query.trim() !== "" || severity !== "all" || category !== "all"
  const [featured, ...rest] = filtered
  const showFeatured = !isFiltering && featured
  const listed = showFeatured ? rest : filtered
  const highCount = alerts.filter((a) => a.severity === "high").length

  const clearFilters = () => {
    setQuery("")
    setSeverity("all")
    setCategory("all")
  }

  return (
    <SiteLayout>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-foreground/10" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold mb-6">
              <ShieldAlert className="h-4 w-4" />
              {highCount > 0 ? `${highCount} tahadhari za hatari kubwa` : "Kituo cha tahadhari"}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-5 text-white">
              Tahadhari za{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Usalama Mtandaoni</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
              Utapeli mpya unaoenea Tanzania, jinsi ya kuutambua, na ufanye nini ukiathirika. Imeandaliwa na timu ya
              cybersecurity ya RynexNative. <strong className="text-white">Share kwa familia na marafiki.</strong>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tafuta: M-Pesa, WhatsApp, Instagram..."
              aria-label="Tafuta tahadhari"
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card/60 border border-foreground/15 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-foreground/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Kiwango cha hatari">
            {severityFilters.map((f) => (
              <button key={f.id} type="button" aria-pressed={severity === f.id} onClick={() => setSeverity(f.id)} className={chipClass(severity === f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Aina">
              <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")} className={chipClass(category === "all")}>
                Aina zote
              </button>
              {categories.map((c) => (
                <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chipClass(category === c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => <AlertCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center max-w-xl mx-auto">
            <Search className="h-10 w-10 text-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Hakuna tahadhari iliyopatikana</h2>
            <p className="text-foreground/70 mb-6">Jaribu neno lingine au ondoa filters.</p>
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
              <X className="h-4 w-4" />
              Ondoa filters
            </button>
          </div>
        ) : (
          <>
            {showFeatured && (
              <div className="mb-6">
                <AlertCard alert={featured} featured />
              </div>
            )}
            {listed.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listed.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Help CTA */}
        <div className="mt-16 glass rounded-3xl p-8 md:p-10 grid md:grid-cols-[auto,1fr,auto] gap-6 items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <LifeBuoy className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-poppins mb-1">Umetapeliwa au akaunti yako imeibiwa?</h2>
            <p className="text-foreground/75">
              Timu yetu inaweza kukusaidia kurejesha akaunti na kuimarisha usalama wa biashara yako.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => goToSection("contact")}
              className="h-11 px-5 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Wasiliana nasi
            </button>
            <Link
              to="/estimate?type=security-audit"
              className="h-11 px-5 rounded-xl glass inline-flex items-center justify-center font-semibold hover:bg-primary/10 transition-colors"
            >
              Security audit
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
