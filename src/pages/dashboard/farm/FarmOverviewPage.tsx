import { Link } from "react-router-dom"
import { AlertTriangle, Bird, HandCoins, Receipt, Skull, TrendingUp } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { useFarmSummary } from "@/features/farm/api"
import { BatchCard, Bars, FARM, Stat } from "@/features/farm/ui"
import { HEALTH_KINDS, num, shortDate, tzs, tzsShort } from "@/features/farm/types"
import { farmButton } from "@/features/farm/form"

export default function FarmOverviewPage() {
  const { data, isLoading, isError, refetch } = useFarmSummary()
  const { can } = usePermissions()
  const month = new Date().toLocaleDateString("en-GB", { month: "long" })

  if (isLoading) return <ListSkeleton rows={4} />
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        title="Chicken Point"
        subtitle="Birds on the farm, money in and out, and what needs attention."
        action={
          can("cp_flocks.manage") && (
            <Link to={`${FARM}/batches?new=1`} className={farmButton}>
              <Bird className="h-4 w-4" />
              New batch of chicks
            </Link>
          )
        }
      />

      {data.warnings && data.warnings.length > 0 && (
        <ul className="mb-6 space-y-2">
          {data.warnings.map((w, i) => (
            <li key={i}>
              <Link to={`${FARM}/batches/${w.batch}`} className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm hover:bg-amber-500/15">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                {w.text}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {data.birds_alive !== undefined && <Stat label="Birds alive" icon={<Bird className="h-3.5 w-3.5" />} value={num(data.birds_alive)} sub={`${data.batches?.length ?? 0} open batch${data.batches?.length === 1 ? "" : "es"}`} />}
        {data.deaths_week !== undefined && <Stat label="Deaths, 7 days" icon={<Skull className="h-3.5 w-3.5" />} value={num(data.deaths_week)} tone={data.deaths_week ? "bad" : undefined} />}
        {data.sales_month !== undefined && (
          <Stat label={`Sales in ${month}`} icon={<HandCoins className="h-3.5 w-3.5" />} value={tzsShort(data.sales_month)} sub={`${num(data.birds_sold_month)} birds · received ${tzsShort(data.collected_month)}`} />
        )}
        {data.costs_month !== undefined && (
          <Stat label={`Costs in ${month}`} icon={<Receipt className="h-3.5 w-3.5" />} value={tzsShort(data.costs_month)} sub={Number(data.unpaid_bills) ? `${tzsShort(data.unpaid_bills)} still owed to suppliers` : undefined} />
        )}
        {data.profit_month !== undefined && (
          <Stat
            label={`Profit in ${month}`}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            value={tzsShort(data.profit_month)}
            tone={Number(data.profit_month) >= 0 ? "good" : "bad"}
            sub="Sales minus all costs this month"
          />
        )}
        {data.owed_total !== undefined && <Stat label="Customers owe" value={tzsShort(data.owed_total)} tone={Number(data.owed_total) ? "bad" : undefined} />}
      </div>

      {data.batches && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Open batches</h2>
            <Link to={`${FARM}/batches`} className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              All batches →
            </Link>
          </div>
          {data.batches.length === 0 ? (
            <EmptyState title="No batches on the farm" text="Start a batch when the chicks arrive." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.batches.map((b) => (
                <BatchCard key={b.id} id={b.id} code={b.code} house={b.house} breed={b.breed} status={b.status} chicks_count={b.chicks_count} figures={b} />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {data.recent_health && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Latest health records</h2>
            {data.recent_health.length === 0 ? (
              <p className="text-sm text-foreground/55">Nothing recorded yet.</p>
            ) : (
              <ul className="glass rounded-2xl divide-y divide-border">
                {data.recent_health.map((e) => (
                  <li key={e.id} className="p-3 flex gap-3 items-center text-sm">
                    <Pill className={HEALTH_KINDS[e.kind].className}>{HEALTH_KINDS[e.kind].label}</Pill>
                    <span className="flex-1 min-w-0 truncate">
                      {e.batch_code}
                      {e.count ? ` · ${e.count} birds` : ""}
                      {e.disease ? ` · ${e.disease}` : ""}
                    </span>
                    <span className="text-xs text-foreground/50 whitespace-nowrap">{shortDate(e.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <div className="space-y-6">
          {data.costs_month_by_category && data.costs_month_by_category.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Where the money went in {month}</h2>
              <div className="glass rounded-2xl p-4">
                <Bars rows={data.costs_month_by_category.map((c) => ({ label: c.label, value: Number(c.amount) }))} format={tzs} />
              </div>
            </section>
          )}
          {data.owed && data.owed.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Who owes us</h2>
              <ul className="glass rounded-2xl divide-y divide-border">
                {data.owed.map((o) => (
                  <li key={o.name} className="p-3 flex justify-between text-sm">
                    <span>
                      {o.name} <span className="text-foreground/50">· {o.sales} sale{o.sales === 1 ? "" : "s"}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-red-600">{tzs(o.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
