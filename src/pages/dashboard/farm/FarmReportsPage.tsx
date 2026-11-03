import { useState } from "react"
import { Link } from "react-router-dom"
import { inputClass } from "@/features/dashboard/styles"
import { ErrorState, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { useFarmReport } from "@/features/farm/api"
import { BATCH_STATUS, CUSTOMER_KINDS, num, tzs, tzsShort, type MonthRow } from "@/features/farm/types"
import { Bars, FARM, Stat } from "@/features/farm/ui"
import { cn } from "@/lib/utils"

const SALES = "bg-amber-500"
const COSTS = "bg-slate-400 dark:bg-slate-500"

function monthName(month: string) {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" })
}

/** Every month of the year so far (or all twelve for a past year), empty ones included, so the chart reads as a timeline. */
function allMonths(year: number, months: MonthRow[]): MonthRow[] {
  const now = new Date()
  const last = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const byMonth = new Map(months.map((m) => [m.month, m]))
  return Array.from({ length: last }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`
    return byMonth.get(key) ?? { month: key, revenue: "0", costs: "0", profit: "0", collected: "0" }
  })
}

/** Sales and costs side by side for each month, on one scale. */
function MonthChart({ months }: { months: MonthRow[] }) {
  const max = Math.max(...months.flatMap((m) => [Number(m.revenue), Number(m.costs)]), 1)
  return (
    <div>
      <div className="flex gap-4 text-xs text-foreground/70 mb-3" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", SALES)} /> Sales
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", COSTS)} /> Costs
        </span>
      </div>
      <div className="h-48 flex items-end gap-1 sm:gap-2 border-b border-foreground/15" role="img" aria-label="Sales and costs by month; the table below has the numbers">
        {months.map((m) => (
          <div key={m.month} className="flex-1 h-full flex items-end justify-center gap-0.5" title={`${monthName(m.month)}: sales ${tzs(m.revenue)} · costs ${tzs(m.costs)} · profit ${tzs(m.profit)}`}>
            <div className={cn("w-full max-w-4 rounded-t-[4px]", SALES)} style={{ height: `${(Number(m.revenue) / max) * 100}%` }} />
            <div className={cn("w-full max-w-4 rounded-t-[4px]", COSTS)} style={{ height: `${(Number(m.costs) / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 sm:gap-2 mt-1.5">
        {months.map((m) => (
          <span key={m.month} className="flex-1 text-center text-[11px] text-foreground/50">
            {monthName(m.month)}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function FarmReportsPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const { data, isLoading, isError, refetch } = useFarmReport(year)

  return (
    <div>
      <PageHeader
        title="Profit & reports"
        subtitle="Money in, money out and what is left, by month and by batch."
        action={
          data && (
            <select value={year} onChange={(e) => setYear(e.target.value)} className={cn(inputClass, "h-11 py-0 w-32")} aria-label="Year">
              {data.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )
        }
      />
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Sales" value={tzsShort(data.totals.revenue)} sub={`Received ${tzsShort(data.totals.collected)}`} />
            <Stat label="Costs" value={tzsShort(data.totals.costs)} sub={`${tzsShort(data.totals.general_costs)} shared by all batches`} />
            <Stat label="Profit" value={tzsShort(data.totals.profit)} tone={Number(data.totals.profit) >= 0 ? "good" : "bad"} sub={data.totals.margin_pct !== null ? `${data.totals.margin_pct}% of sales` : undefined} />
            <Stat label="Still to collect" value={tzsShort(Number(data.totals.revenue) - Number(data.totals.collected))} />
          </div>

          {data.months.length > 0 ? (
            <section className="glass rounded-2xl p-4 sm:p-5">
              <h2 className="font-semibold mb-4">Month by month</h2>
              <MonthChart months={allMonths(data.year, data.months)} />
              <div className="overflow-x-auto mt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-foreground/50">
                      <th className="py-2 pr-3 font-semibold">Month</th>
                      <th className="py-2 px-3 font-semibold text-right">Sales</th>
                      <th className="py-2 px-3 font-semibold text-right">Costs</th>
                      <th className="py-2 px-3 font-semibold text-right">Profit</th>
                      <th className="py-2 pl-3 font-semibold text-right">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {data.months.map((m) => (
                      <tr key={m.month}>
                        <td className="py-2 pr-3">{monthName(m.month)}</td>
                        <td className="py-2 px-3 text-right">{num(m.revenue)}</td>
                        <td className="py-2 px-3 text-right">{num(m.costs)}</td>
                        <td className={cn("py-2 px-3 text-right font-semibold", Number(m.profit) < 0 && "text-red-600")}>{num(m.profit)}</td>
                        <td className="py-2 pl-3 text-right text-foreground/70">{num(m.collected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-foreground/50 mt-2">Amounts in TZS.</p>
              </div>
            </section>
          ) : (
            <p className="glass rounded-2xl p-6 text-center text-foreground/60">Nothing recorded in {data.year} yet.</p>
          )}

          {data.batches.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">By batch</h2>
              <div className="glass rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-foreground/50 border-b border-border">
                      <th className="p-3 font-semibold">Batch</th>
                      <th className="p-3 font-semibold text-right">Chicks</th>
                      <th className="p-3 font-semibold text-right">Died</th>
                      <th className="p-3 font-semibold text-right">Sold</th>
                      <th className="p-3 font-semibold text-right">Costs</th>
                      <th className="p-3 font-semibold text-right">Sales</th>
                      <th className="p-3 font-semibold text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {data.batches.map((b) => (
                      <tr key={b.id}>
                        <td className="p-3">
                          <Link to={`${FARM}/batches/${b.id}`} className="font-semibold hover:text-amber-700">
                            {b.code}
                          </Link>{" "}
                          <Pill className={BATCH_STATUS[b.status].className}>{BATCH_STATUS[b.status].label}</Pill>
                        </td>
                        <td className="p-3 text-right">{num(b.chicks_count)}</td>
                        <td className="p-3 text-right">
                          {num(b.deaths)} <span className="text-foreground/50">({b.mortality_pct}%)</span>
                        </td>
                        <td className="p-3 text-right">{num(b.sold)}</td>
                        <td className="p-3 text-right">{num(b.costs)}</td>
                        <td className="p-3 text-right">{num(b.revenue)}</td>
                        <td className={cn("p-3 text-right font-semibold", Number(b.profit) < 0 && "text-red-600")}>{num(b.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-foreground/50 mt-2">Amounts in TZS. Costs shared by all batches (rent, the farm's electricity...) are in the monthly figures only.</p>
            </section>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {data.costs_by_category.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Costs by kind</h2>
                <div className="glass rounded-2xl p-4">
                  <Bars rows={data.costs_by_category.map((c) => ({ label: c.label, value: Number(c.amount) }))} format={tzs} />
                </div>
              </section>
            )}
            {data.customers.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Best customers</h2>
                <ul className="glass rounded-2xl divide-y divide-border">
                  {data.customers.map((c) => (
                    <li key={c.customer ?? c.name} className="p-3 flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        {c.name}
                        <span className="text-foreground/50">
                          {c.kind && ` · ${CUSTOMER_KINDS[c.kind]}`} · {num(c.birds)} birds
                        </span>
                      </span>
                      <span className="font-semibold tabular-nums whitespace-nowrap">{tzs(c.total)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
