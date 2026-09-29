import { Link, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, ChevronRight, LifeBuoy, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSectionNav } from "@/hooks/use-section-nav"
import { usePublishedAlerts } from "@/features/alerts/api"
import { AlertCard, SeverityBadge, ShareBar } from "@/features/alerts/components"
import { formatAlertDate } from "@/features/alerts/types"
import { cn } from "@/lib/utils"

function InfoBlock({
  icon,
  title,
  items,
  tone,
  ordered = false,
}: {
  icon: ReactNode
  title: string
  items: string[]
  tone: "danger" | "safe" | "action"
  ordered?: boolean
}) {
  if (items.length === 0) return null
  const toneClass = {
    danger: "border-red-500/25 bg-red-500/[0.06]",
    safe: "border-emerald-500/25 bg-emerald-500/[0.06]",
    action: "border-primary/25 bg-primary/[0.06]",
  }[tone]
  const iconClass = { danger: "text-red-500", safe: "text-emerald-500", action: "text-primary" }[tone]
  const List = ordered ? "ol" : "ul"

  return (
    <section className={cn("rounded-3xl border p-6 md:p-8", toneClass)}>
      <h2 className="flex items-center gap-3 text-xl md:text-2xl font-bold font-poppins mb-5">
        <span className={iconClass}>{icon}</span>
        {title}
      </h2>
      <List className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-foreground/85 leading-relaxed">
            {ordered ? (
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
            ) : (
              <span className={cn("flex-shrink-0 mt-2 h-2 w-2 rounded-full", tone === "danger" ? "bg-red-500" : "bg-emerald-500")} />
            )}
            <span>{item}</span>
          </li>
        ))}
      </List>
    </section>
  )
}

export default function AlertDetailPage() {
  const { slug } = useParams()
  const goToSection = useSectionNav()
  const { data, isLoading } = usePublishedAlerts()
  const alerts = data?.alerts ?? []
  const alert = alerts.find((a) => a.slug === slug)
  useDocumentTitle(alert ? alert.title : "Tahadhari")

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse" aria-busy="true">
          <div className="h-4 w-40 bg-foreground/10 rounded mb-8" />
          <div className="h-10 w-4/5 bg-foreground/10 rounded mb-4" />
          <div className="h-5 w-full bg-foreground/10 rounded mb-2" />
          <div className="h-5 w-2/3 bg-foreground/10 rounded" />
        </div>
      </SiteLayout>
    )
  }

  if (!alert) {
    return (
      <SiteLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <AlertTriangle className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-poppins mb-3">Tahadhari haikupatikana</h1>
          <p className="text-foreground/70 mb-8">Huenda imeondolewa au link si sahihi.</p>
          <Link to="/tahadhari" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Rudi kwenye tahadhari zote
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const related = alerts.filter((a) => a.id !== alert.id).slice(0, 3)
  const paragraphs = alert.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <SiteLayout>
      <article>
        <header className="relative overflow-hidden border-b border-foreground/10" style={{ background: "var(--gradient-hero)" }}>
          <div
            className={cn(
              "absolute -top-32 right-0 h-80 w-80 rounded-full blur-3xl",
              alert.severity === "high" ? "bg-red-500/15" : alert.severity === "medium" ? "bg-amber-500/10" : "bg-emerald-500/10",
            )}
            aria-hidden="true"
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-400 mb-8">
              <Link to="/" className="hover:text-primary">Nyumbani</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/tahadhari" className="hover:text-primary">Tahadhari</Link>
            </nav>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <SeverityBadge severity={alert.severity} />
              <span className="text-sm text-slate-400">{alert.category}</span>
              <span className="text-slate-600" aria-hidden="true">•</span>
              <time dateTime={alert.published_at ?? undefined} className="text-sm text-slate-400">
                {formatAlertDate(alert.published_at)}
              </time>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-poppins text-white leading-tight mb-5">{alert.title}</h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8">{alert.summary}</p>
            <ShareBar alert={alert} />
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-8">
          {paragraphs.length > 0 && (
            <section>
              <h2 className="text-xl md:text-2xl font-bold font-poppins mb-4">Jinsi utapeli huu unavyofanyika</h2>
              <div className="space-y-4 text-foreground/85 text-lg leading-relaxed">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            </section>
          )}

          <InfoBlock tone="danger" icon={<AlertTriangle className="h-6 w-6" />} title="Dalili za kutambua" items={alert.signs} />
          <InfoBlock tone="safe" icon={<ShieldCheck className="h-6 w-6" />} title="Jinsi ya kujikinga" items={alert.prevention} />
          <InfoBlock tone="action" icon={<LifeBuoy className="h-6 w-6" />} title="Kama umeathirika, fanya hivi" items={alert.if_affected} ordered />

          {/* Share again at the end, when the reader is most convinced */}
          <div className="glass rounded-3xl p-6 md:p-8 text-center">
            <h2 className="text-xl font-bold font-poppins mb-2">Linda unaowapenda</h2>
            <p className="text-foreground/70 mb-5">Share tahadhari hii kwenye group za familia na marafiki. Inaweza kumwokoa mtu leo.</p>
            <ShareBar alert={alert} className="justify-center" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-foreground/10 pt-8">
            <Link to="/tahadhari" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Tahadhari zote
            </Link>
            <button type="button" onClick={() => goToSection("contact")} className="text-sm text-foreground/70 hover:text-primary">
              Unahitaji msaada? Wasiliana na RynexNative →
            </button>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-foreground/10 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <h2 className="text-2xl font-bold font-poppins mb-8">Tahadhari nyingine</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((a) => (
                <AlertCard key={a.id} alert={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  )
}
