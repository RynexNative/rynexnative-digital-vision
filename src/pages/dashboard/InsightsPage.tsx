import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Eye, Info, MousePointerClick, Target, Users } from "lucide-react"
import { useDashboardQuery } from "@/features/dashboard/api"
import { ErrorState, FilterTabs, ListSkeleton, PageHeader } from "@/features/dashboard/ui"
import { moneyMap } from "@/features/billing/types"
import { cn } from "@/lib/utils"

type Insights = {
  range: { start: string; end: string; days: number }
  totals: { visits: number; views: number; leads: number; conversion_rate: number | null; leads_by_kind: { kind: string; label: string; count: number }[] }
  daily: { date: string; visits: number; views: number; leads: number }[]
  sources: { source: string; visits: number; leads: number; rate: number | null }[]
  pages: { path: string; views: number; landings: number; leads: number; rate: number | null }[]
  packages: { id: string; name: string; slug: string; views: number; requests: number; quotes: number; won: number; rate: number | null }[]
  funnel: { step: string; count: number }[]
  sales: { quoted: Record<string, number>; invoiced: Record<string, number>; paid: Record<string, number> }
}

const RANGES = [
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
] as const

const number = (n: number) => new Intl.NumberFormat("en-US").format(n)
const pct = (n: number | null) => (n === null ? "—" : `${n}%`)
const day = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00`))

function Tile({ icon, label, value, sub }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-sm text-foreground/60 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="text-2xl font-bold font-poppins mt-1">{value}</p>
      {sub && <p className="text-xs text-foreground/55 mt-0.5">{sub}</p>}
    </div>
  )
}

/** Visits per day as thin bars; hovering a day shows visits, page views and requests. */
function DailyChart({ daily }: { daily: Insights["daily"] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...daily.map((d) => d.visits))
  const shown = active === null ? null : daily[active]
  const labelEvery = Math.ceil(daily.length / 6)
  return (
    <section className="glass rounded-2xl p-5 mb-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="font-semibold">Visits per day</h2>
        <p className="text-sm text-foreground/60 text-right min-h-[2.5rem]" aria-live="polite">
          {shown ? (
            <>
              <b className="text-foreground">{day(shown.date)}</b>: {number(shown.visits)} visits · {number(shown.views)} page views ·{" "}
              {number(shown.leads)} request(s)
            </>
          ) : (
            "Hover a day for details"
          )}
        </p>
      </div>
      <div className="flex items-end gap-[2px] h-40 border-b border-border" onMouseLeave={() => setActive(null)}>
        {daily.map((d, i) => (
          <button
            key={d.date}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-label={`${day(d.date)}: ${d.visits} visits, ${d.leads} requests`}
            className="flex-1 h-full flex flex-col justify-end items-center group focus:outline-none"
          >
            {d.leads > 0 && <span className="mb-1 h-1.5 w-1.5 rounded-full bg-foreground/70" aria-hidden="true" />}
            <span
              className={cn("w-full max-w-6 rounded-t-[4px] bg-primary/70 transition-colors", active === i ? "bg-primary" : "group-hover:bg-primary/90")}
              style={{ height: `${(d.visits / max) * 100}%`, minHeight: d.visits ? 2 : 0 }}
            />
          </button>
        ))}
      </div>
      <div className="flex gap-[2px] mt-1.5 text-[11px] text-foreground/50">
        {daily.map((d, i) => (
          <span key={d.date} className="flex-1 text-center whitespace-nowrap overflow-visible">
            {i % labelEvery === 0 ? day(d.date) : ""}
          </span>
        ))}
      </div>
      <p className="text-xs text-foreground/50 mt-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" /> a day with at least one request
      </p>
    </section>
  )
}

function Table<T>({ title, empty, rows, columns, note }: { title: string; empty: string; rows: T[]; columns: { label: string; cell: (row: T) => ReactNode; bar?: (row: T) => number; align?: "right" }[]; note?: string }) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="font-semibold mb-1">{title}</h2>
      {note && <p className="text-xs text-foreground/55 mb-3">{note}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-foreground/55 mt-3">{empty}</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-foreground/50">
                {columns.map((c) => (
                  <th key={c.label} className={cn("font-semibold py-2 px-1", c.align === "right" && "text-right")}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.label} className={cn("py-2 px-1 align-middle", c.align === "right" && "text-right tabular-nums")}>
                      {c.cell(row)}
                      {c.bar && (
                        <span className="block h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                          <span className="block h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, c.bar(row) * 100)}%` }} />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Funnel({ steps }: { steps: Insights["funnel"] }) {
  const max = Math.max(1, ...steps.map((s) => s.count))
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="font-semibold mb-4">From visit to sale</h2>
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const previous = i > 0 ? steps[i - 1].count : null
          return (
            <li key={step.step}>
              <div className="flex justify-between text-sm mb-1">
                <span>{step.step}</span>
                <span>
                  <b>{number(step.count)}</b>
                  {previous ? <span className="text-foreground/50"> · {Math.round((100 * step.count) / previous)}% of previous</span> : null}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(step.count ? 1.5 : 0, (step.count / max) * 100)}%` }} />
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default function InsightsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]["id"]>("30")
  const { data, isLoading, isError, refetch } = useDashboardQuery<Insights>(["dashboard", "insights", days], `/insights/?days=${days}`)

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle="Which sources, pages and packages bring requests, and how requests turn into sales."
        action={<FilterTabs value={days} onChange={setDays} options={RANGES.map((r) => ({ id: r.id, label: r.label }))} />}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Tile icon={<Users className="h-4 w-4" />} label="Visits" value={number(data.totals.visits)} />
            <Tile icon={<Eye className="h-4 w-4" />} label="Page views" value={number(data.totals.views)} />
            <Tile
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Requests"
              value={number(data.totals.leads)}
              sub={data.totals.leads_by_kind.filter((k) => k.count).map((k) => `${k.count} ${k.label.toLowerCase()}`).join(" · ") || "None yet"}
            />
            <Tile icon={<Target className="h-4 w-4" />} label="Conversion" value={pct(data.totals.conversion_rate)} sub="Requests per 100 visits" />
          </div>

          <DailyChart daily={data.daily} />

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Table
              title="Where visitors come from"
              empty="No visits recorded yet."
              note="“Direct” means typed in, a bookmark, or an app that hides the link (WhatsApp often does: share links with ?utm_source=whatsapp)."
              rows={data.sources}
              columns={[
                { label: "Source", cell: (r) => r.source, bar: (r) => r.visits / Math.max(1, ...data.sources.map((s) => s.visits)) },
                { label: "Visits", cell: (r) => number(r.visits), align: "right" },
                { label: "Requests", cell: (r) => number(r.leads), align: "right" },
                { label: "Rate", cell: (r) => pct(r.rate), align: "right" },
              ]}
            />
            <Funnel steps={data.funnel} />
          </div>

          <div className="mb-4">
            <Table
              title="Packages"
              empty="No package activity yet."
              note="Rate = requests per 100 views of the package page."
              rows={data.packages}
              columns={[
                {
                  label: "Package",
                  cell: (r) => (
                    <Link to={`/packages/${r.slug}`} target="_blank" className="font-medium hover:text-primary">
                      {r.name}
                    </Link>
                  ),
                },
                { label: "Views", cell: (r) => number(r.views), align: "right" },
                { label: "Requests", cell: (r) => number(r.requests), align: "right" },
                { label: "Quotes", cell: (r) => number(r.quotes), align: "right" },
                { label: "Won", cell: (r) => number(r.won), align: "right" },
                { label: "Rate", cell: (r) => pct(r.rate), align: "right" },
              ]}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Table
              title="Pages"
              empty="No page views recorded yet."
              note="Landings = visits that started on the page. Requests are counted for the page the visit started on."
              rows={data.pages}
              columns={[
                { label: "Page", cell: (r) => <span className="break-all">{r.path}</span>, bar: (r) => r.views / Math.max(1, ...data.pages.map((p) => p.views)) },
                { label: "Views", cell: (r) => number(r.views), align: "right" },
                { label: "Landings", cell: (r) => number(r.landings), align: "right" },
                { label: "Requests", cell: (r) => number(r.leads), align: "right" },
              ]}
            />
            <section className="glass rounded-2xl p-5">
              <h2 className="font-semibold mb-4">Sales in this period</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground/60">Quoted (sent)</dt>
                  <dd className="font-semibold text-right">{moneyMap(data.sales.quoted)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground/60">Invoiced</dt>
                  <dd className="font-semibold text-right">{moneyMap(data.sales.invoiced)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground/60">Paid</dt>
                  <dd className="font-semibold text-right text-emerald-700">{moneyMap(data.sales.paid)}</dd>
                </div>
              </dl>
              <Link to="/admin/billing" className="inline-block mt-4 text-sm text-primary font-medium">
                Quotes & invoices →
              </Link>
            </section>
          </div>

          <p className="text-xs text-foreground/50 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            Counted without cookies: only daily totals are kept, never who visited. Visitors with Do Not Track, bots and the team’s own browsers
            are not counted, so the numbers are slightly lower than reality.
          </p>
        </>
      )}
    </>
  )
}
