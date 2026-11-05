import { Link } from "react-router-dom"
import { AlertTriangle, BellRing, Bird, HandCoins, PhoneCall, Receipt, Skull, TrendingUp, Truck } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { useFarmSummary } from "@/features/farm/api"
import { BatchCard, Bars, FARM, Stat } from "@/features/farm/ui"
import { HEALTH_KINDS, num, shortDate, tzs, tzsShort, waLink } from "@/features/farm/types"
import { DepositStatus } from "@/features/farm/orders"
import { cn } from "@/lib/utils"
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
              <Link to={w.batch ? `${FARM}/batches/${w.batch}` : `${FARM}/orders`} className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm hover:bg-amber-500/15">
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
        {data.deposits_held !== undefined && (Number(data.deposits_held) > 0 || Number(data.birds_promised) > 0) && (
          <Stat label="Deposits held" value={tzsShort(data.deposits_held)} sub={`for ${num(data.birds_promised)} birds ordered, not delivered yet`} />
        )}
        {data.refunds_due_total !== undefined && Number(data.refunds_due_total) > 0 && (
          <Stat label="To refund" value={tzsShort(data.refunds_due_total)} tone="bad" sub={data.refunds_due?.map((r) => r.name).slice(0, 2).join(", ")} />
        )}
      </div>

      {(data.orders_due?.length || data.follow_ups_due?.length || data.quiet_customers?.length) ? (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {data.orders_due && data.orders_due.length > 0 && (
            <section className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-600" />
                  Orders to deliver soon
                </h2>
                <Link to={`${FARM}/orders`} className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  All →
                </Link>
              </div>
              <ul className="divide-y divide-border text-sm">
                {data.orders_due.map((o) => (
                  <li key={o.id} className="py-2">
                    <p className="flex justify-between gap-2">
                      <span className="font-medium truncate">{o.buyer}</span>
                      <span className={cn("text-xs whitespace-nowrap", o.wanted_on && o.wanted_on <= data.today ? "text-red-600 font-semibold" : "text-foreground/55")}>
                        {o.wanted_on ? shortDate(o.wanted_on) : "No date"}
                      </span>
                    </p>
                    <div className="flex justify-between gap-2 text-xs text-foreground/60">
                      <span>{num(o.birds)} birds</span>
                      <DepositStatus order={o} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.follow_ups_due && data.follow_ups_due.length > 0 && (
            <section className="glass rounded-2xl p-4">
              <h2 className="font-semibold flex items-center gap-2 mb-2">
                <BellRing className="h-4 w-4 text-amber-600" />
                Get back to them today
              </h2>
              <ul className="divide-y divide-border text-sm">
                {data.follow_ups_due.map((n) => (
                  <li key={n.id} className="py-2">
                    <Link to={`${FARM}/customers/${n.customer}`} className="font-medium hover:text-amber-700">
                      {n.customer_name}
                    </Link>
                    <p className="text-xs text-foreground/60 line-clamp-2">{n.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.quiet_customers && data.quiet_customers.length > 0 && (
            <section className="glass rounded-2xl p-4">
              <h2 className="font-semibold flex items-center gap-2 mb-1">
                <PhoneCall className="h-4 w-4 text-amber-600" />
                Regulars gone quiet
              </h2>
              <p className="text-xs text-foreground/55 mb-2">They used to buy and have not for a while. A call can bring them back.</p>
              <ul className="divide-y divide-border text-sm">
                {data.quiet_customers.map((c) => (
                  <li key={c.id} className="py-2 flex items-center justify-between gap-2">
                    <Link to={`${FARM}/customers/${c.id}`} className="min-w-0 hover:text-amber-700">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-foreground/55">
                        {c.purchases} purchases · last {c.last_purchase ? shortDate(c.last_purchase) : "—"}
                      </p>
                    </Link>
                    {c.phone && (
                      <a href={waLink(c.phone, `Habari ${c.name}, `)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                        WhatsApp
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : null}

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
