import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, ArrowRight, Bird, ChevronLeft, ChevronRight, ExternalLink, HandCoins, Receipt, Skull, TrendingUp } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Pill } from "@/features/dashboard/ui"
import { cn } from "@/lib/utils"
import { Bars, FARM } from "./ui"
import { BATCH_STATUS, PAYMENT_METHODS, monthName, num, tzs, tzsShort, type FarmMonth, type MonthBatch } from "./types"

/* ------------------------------------------------------------------ helpers */

const dayMonth = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })

const money = (value: string | undefined) => Number(value ?? 0)

/** "from 20 Sep", "arrived 18 Oct": when this batch came, in words */
function arrival(b: MonthBatch) {
  return b.from_earlier_month ? `Since ${dayMonth(b.started_on)}` : `Arrived ${dayMonth(b.started_on)}`
}

/** What happens to the batch at the end of the month */
function ending(b: MonthBatch, data: FarmMonth) {
  if (b.closed_this_month && b.closed_on) return `Closed ${dayMonth(b.closed_on)}`
  if (!b.continues) return b.at_end === 0 ? "No birds left" : ""
  return data.is_current ? "Still on the farm" : `Into ${monthName(nextMonth(data.month), "short").split(" ")[0]}`
}

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`
}

/* ------------------------------------------------------------------ month switcher */

export function MonthSwitcher({ data, onChange }: { data: FarmMonth; onChange: (month: string) => void }) {
  const button = "h-11 w-11 rounded-full border border-border flex items-center justify-center hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent"
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={button} disabled={!data.previous} onClick={() => data.previous && onChange(data.previous)} aria-label="Previous month">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="min-w-[9.5rem] text-center">
        <p className="font-bold font-poppins text-lg leading-tight">{monthName(data.month)}</p>
        <p className="text-xs text-foreground/55">
          {dayMonth(data.start)} – {dayMonth(data.end)}
          {data.is_current && " · this month"}
        </p>
      </div>
      <button type="button" className={button} disabled={!data.next} onClick={() => data.next && onChange(data.next)} aria-label="Next month">
        <ChevronRight className="h-5 w-5" />
      </button>
      {!data.is_current && (
        <button type="button" onClick={() => onChange("")} className="text-sm font-medium text-amber-700 dark:text-amber-400 px-2 py-2.5">
          This month
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ cards */

export type Detail = "birds" | "deaths" | "sales" | "costs" | "profit"

/** A month card: the total, a line per batch, and a tap for every record behind it */
function Card({
  label,
  icon,
  value,
  tone,
  sub,
  lines,
  onOpen,
}: {
  label: string
  icon: ReactNode
  value: ReactNode
  tone?: "good" | "bad"
  sub?: ReactNode
  lines?: { key: string | number; label: string; value: ReactNode }[]
  onOpen: () => void
}) {
  const shown = lines?.slice(0, 3) ?? []
  const more = (lines?.length ?? 0) - shown.length
  return (
    <button type="button" onClick={onOpen} className="glass rounded-2xl p-4 text-left flex flex-col hover:border-amber-500/50 transition-colors group min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "text-xl sm:text-2xl font-bold font-poppins mt-1 tabular-nums break-words",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "bad" && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-foreground/60 mt-0.5">{sub}</p>}
      {shown.length > 0 && (
        <ul className="mt-3 pt-2.5 border-t border-border space-y-1 text-xs">
          {shown.map((line) => (
            <li key={line.key} className="flex justify-between gap-2">
              <span className="truncate text-foreground/65">{line.label}</span>
              <span className="font-semibold tabular-nums whitespace-nowrap">{line.value}</span>
            </li>
          ))}
          {more > 0 && <li className="text-foreground/50">+{more} more</li>}
        </ul>
      )}
      <span className="mt-auto pt-3 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
        Details <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </button>
  )
}

export function MonthCards({ data, open }: { data: FarmMonth; open: (detail: Detail) => void }) {
  const t = data.totals
  const cards: ReactNode[] = []
  if (t.at_end !== undefined) {
    cards.push(
      <Card
        key="birds"
        label={data.is_current ? "Birds now" : "Birds at month end"}
        icon={<Bird className="h-3.5 w-3.5" />}
        value={num(t.at_end)}
        sub={
          <>
            {num(t.at_start)} at start
            {t.arrived ? ` · +${num(t.arrived)} arrived` : ""} · −{num(t.deaths)} died · −{num(t.sold)} sold
          </>
        }
        onOpen={() => open("birds")}
      />,
    )
    cards.push(
      <Card
        key="deaths"
        label="Deaths"
        icon={<Skull className="h-3.5 w-3.5" />}
        value={num(t.deaths)}
        tone={t.deaths ? "bad" : undefined}
        sub={`${t.mortality_pct}% of the birds this month`}
        onOpen={() => open("deaths")}
      />,
    )
  }
  if (t.revenue !== undefined) {
    cards.push(
      <Card
        key="sales"
        label="Sales"
        icon={<HandCoins className="h-3.5 w-3.5" />}
        value={tzsShort(t.revenue)}
        sub={`${num(t.birds_sold)} birds · received ${tzsShort(t.collected)}`}
        lines={data.batches
          .filter((b) => money(b.revenue))
          .map((b) => ({
            key: b.id,
            label: b.code,
            value: tzsShort(b.revenue),
          }))}
        onOpen={() => open("sales")}
      />,
    )
  }
  if (t.costs !== undefined) {
    cards.push(
      <Card
        key="costs"
        label="Costs"
        icon={<Receipt className="h-3.5 w-3.5" />}
        value={tzsShort(t.costs)}
        sub={`${data.costs?.length ?? 0} record${data.costs?.length === 1 ? "" : "s"}`}
        lines={[
          ...data.batches
            .filter((b) => money(b.costs))
            .map((b) => ({
              key: b.id,
              label: b.code,
              value: tzsShort(b.costs),
            })),
          ...(money(t.general_costs)
            ? [
                {
                  key: "general",
                  label: "General (whole farm)",
                  value: tzsShort(t.general_costs),
                },
              ]
            : []),
        ]}
        onOpen={() => open("costs")}
      />,
    )
  }
  if (t.profit !== undefined) {
    cards.push(
      <Card
        key="profit"
        label="Profit"
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        value={tzsShort(t.profit)}
        tone={money(t.profit) >= 0 ? "good" : "bad"}
        sub="Sales minus all costs this month"
        lines={data.batches
          .filter((b) => b.profit !== undefined && (money(b.revenue) || money(b.costs)))
          .map((b) => ({
            key: b.id,
            label: b.code,
            value: <span className={cn(money(b.profit) < 0 && "text-red-600")}>{tzsShort(b.profit)}</span>,
          }))}
        onOpen={() => open("profit")}
      />,
    )
  }
  return <div className={cn("grid grid-cols-1 min-[420px]:grid-cols-2 gap-3", cards.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>{cards}</div>
}

/* ------------------------------------------------------------------ timeline */

/** "day 13 of 35": red when an open batch is past its selling age (the warning above says how many birds are left) */
function Age({ b, current }: { b: MonthBatch; current: boolean }) {
  const late = current && b.status !== "closed" && b.age_at_end > b.target_age_days
  return (
    <span className={cn(late && "text-red-600 font-semibold")}>
      day {b.age_at_end}
      {b.status !== "closed" && ` of ${b.target_age_days}`}
    </span>
  )
}

/** Each batch as a bar across the month's days: when it came, when it went, and its numbers */
export function BatchTimeline({ data }: { data: FarmMonth }) {
  const bars = data.batches.filter((b) => b.first_day && b.last_day)
  if (bars.length === 0) return <p className="glass rounded-2xl p-6 text-sm text-foreground/60 text-center">No batch was on the farm in {monthName(data.month)}.</p>
  const pos = (day: number) => ((day - 1) / data.days) * 100
  const ticks = [1, 8, 15, 22, data.days]
  return (
    <div className="glass rounded-2xl p-3 sm:p-4">
      {/* Day ruler */}
      <div className="relative h-5 ml-0 md:ml-56 text-[10px] text-foreground/45 tabular-nums" aria-hidden="true">
        {ticks.map((d) => (
          <span key={d} className="absolute -translate-x-1/2" style={{ left: `${pos(d) + 100 / data.days / 2}%` }}>
            {d}
          </span>
        ))}
      </div>
      <ul className="divide-y divide-border">
        {bars.map((b) => {
          const left = pos(b.first_day!)
          const width = ((b.last_day! - b.first_day! + 1) / data.days) * 100
          const end = ending(b, data)
          return (
            <li key={b.id} className="py-3 md:flex md:items-center md:gap-4">
              <Link to={`${FARM}/batches/${b.id}`} className="block md:w-52 flex-shrink-0 mb-2 md:mb-0 min-w-0 group">
                <span className="flex items-center gap-2">
                  <span className="font-bold font-poppins group-hover:text-amber-700">{b.code}</span>
                  <Pill className={BATCH_STATUS[b.status].className}>{BATCH_STATUS[b.status].label}</Pill>
                </span>
                <span className="block text-xs text-foreground/55 truncate">
                  {[b.house, `${num(b.chicks_count)} chicks`].filter(Boolean).join(" · ")}
                  {" · "}
                  <Age b={b} current={data.is_current} />
                </span>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="relative h-7 rounded-md bg-foreground/[0.04]">
                  {data.today_day && (
                    <span
                      className="absolute inset-y-0 w-px bg-amber-600/60"
                      style={{
                        left: `${pos(data.today_day) + 100 / data.days / 2}%`,
                      }}
                      title="Today"
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={cn(
                      "absolute inset-y-1 flex items-center justify-between px-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 shadow-sm",
                      b.from_earlier_month ? "rounded-l-none" : "rounded-l-md",
                      b.continues && !b.closed_this_month ? "rounded-r-none" : "rounded-r-md",
                      b.status === "closed" && !b.continues && "from-foreground/35 to-foreground/45",
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {b.from_earlier_month && <ArrowLeft className="h-3 w-3 flex-shrink-0" aria-label="From the month before" />}
                    <span className="flex-1" />
                    {b.continues && !b.closed_this_month && <ArrowRight className="h-3 w-3 flex-shrink-0" aria-label="Carries on" />}
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs text-foreground/60">
                  <span>
                    {arrival(b)}
                    {end && ` · ${end}`}
                  </span>
                  {b.at_end !== undefined && (
                    <span className="tabular-nums">
                      {num(b.at_start! + b.arrived!)} → <span className="font-semibold text-foreground">{num(b.at_end)}</span>
                      {b.deaths ? <span className="text-red-600"> · {num(b.deaths)} died</span> : null}
                      {b.sold ? ` · ${num(b.sold)} sold` : ""}
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px] text-foreground/50 flex flex-wrap gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> came from the month before
        </span>
        <span className="inline-flex items-center gap-1">
          <ArrowRight className="h-3 w-3" /> carries on after this month
        </span>
        {data.today_day && (
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-px bg-amber-600" /> today
          </span>
        )}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ detail sheets */

/** A table from small tablets up; on phones each row becomes a small card, so nothing is squeezed */
function Table({ head, rows, foot }: { head: ReactNode[]; rows: ReactNode[][]; foot?: ReactNode[] }) {
  const cell = (i: number) => (i === 0 ? "text-left pr-2" : "text-right px-1.5 whitespace-nowrap")
  const card = (row: ReactNode[], key: number | string, total = false) => (
    <li key={key} className={cn("py-2.5", total && "border-t-2 border-border font-bold")}>
      <div className="mb-1">{row[0]}</div>
      <dl className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm tabular-nums">
        {row.slice(1).map((value, i) => (
          <div key={i} className="min-w-0">
            <dt className="text-[10px] uppercase tracking-wider text-foreground/50 font-semibold">{head[i + 1]}</dt>
            <dd className="whitespace-nowrap">{value}</dd>
          </div>
        ))}
      </dl>
    </li>
  )
  return (
    <>
      <ul className="sm:hidden divide-y divide-border">
        {rows.map((row, r) => card(row, r))}
        {foot && card(foot, "total", true)}
      </ul>
      <table className="hidden sm:table w-full text-sm tabular-nums">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-foreground/50">
            {head.map((h, i) => (
              <th key={i} className={cn("pb-2 font-semibold whitespace-nowrap", cell(i))}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((value, i) => (
                <td key={i} className={cn("py-2", cell(i))}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr className="border-t-2 border-border font-bold">
              {foot.map((value, i) => (
                <td key={i} className={cn("pt-2", cell(i))}>
                  {value}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </>
  )
}

/** The full amount from small tablets up, 1.3M on phones */
const amount = (value: string | number | undefined) => (
  <>
    <span className="sm:hidden">{tzsShort(value)}</span>
    <span className="hidden sm:inline">{num(value)}</span>
  </>
)

const batchCell = (b: { id: number; code: string }, sub?: string) => (
  <Link to={`${FARM}/batches/${b.id}`} className="font-semibold whitespace-nowrap hover:text-amber-700">
    {b.code}
    {sub && <span className="block text-[11px] font-normal text-foreground/55">{sub}</span>}
  </Link>
)

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </section>
  )
}

function BirdsDetail({ data }: { data: FarmMonth }) {
  const t = data.totals
  const rows = data.batches.filter((b) => b.at_start !== undefined)
  return (
    <Section title="Birds, batch by batch">
      <Table
        head={["Batch", "Start", "Came", "Died", "Sold", "End"]}
        rows={rows.map((b) => [
          batchCell(b, arrival(b)),
          num(b.at_start),
          b.arrived ? `+${num(b.arrived)}` : "—",
          b.deaths ? <span className="text-red-600">−{num(b.deaths)}</span> : "—",
          b.sold ? `−${num(b.sold)}` : "—",
          <span className="font-semibold">{num(b.at_end)}</span>,
        ])}
        foot={["All", num(t.at_start), `+${num(t.arrived)}`, `−${num(t.deaths)}`, `−${num(t.sold)}`, num(t.at_end)]}
      />
      <p className="text-xs text-foreground/55 mt-3">
        “Start” is what was alive on {dayMonth(data.start)}; “End” is what is left on {data.is_current ? "the farm now" : dayMonth(data.end)}. Batches that arrived earlier start
        with what they had left.
      </p>
    </Section>
  )
}

function DeathsDetail({ data }: { data: FarmMonth }) {
  const rows = data.batches.filter((b) => b.at_start !== undefined && (b.at_start || b.arrived))
  return (
    <>
      <Section title="By batch">
        <Table
          head={["Batch", "Birds", "Died", "Rate"]}
          rows={rows.map((b) => [
            batchCell(b),
            num(b.at_start! + b.arrived!),
            <span className={cn(b.deaths && "text-red-600 font-semibold")}>{num(b.deaths)}</span>,
            <span className={cn((b.mortality_pct ?? 0) >= 5 && "text-red-600 font-semibold")}>{b.mortality_pct}%</span>,
          ])}
          foot={["All", num((data.totals.at_start ?? 0) + (data.totals.arrived ?? 0)), num(data.totals.deaths), `${data.totals.mortality_pct}%`]}
        />
      </Section>
      <Section title={`Every death recorded (${data.deaths?.length ?? 0})`}>
        {!data.deaths?.length ? (
          <p className="text-sm text-foreground/55">No deaths recorded this month.</p>
        ) : (
          <ul className="glass rounded-xl divide-y divide-border">
            {data.deaths.map((d) => (
              <li key={d.id} className="p-3 flex items-start gap-3 text-sm">
                <span className="text-xs text-foreground/55 w-14 flex-shrink-0 pt-0.5">{dayMonth(d.date)}</span>
                <span className="flex-1 min-w-0">
                  <span className="font-semibold">{d.batch_code}</span>
                  {(d.disease || d.notes) && <span className="block text-xs text-foreground/60 break-words">{[d.disease, d.notes].filter(Boolean).join(" · ")}</span>}
                </span>
                <span className="font-semibold text-red-600 tabular-nums whitespace-nowrap">{num(d.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

function SalesDetail({ data }: { data: FarmMonth }) {
  const t = data.totals
  const rows = data.batches.filter((b) => b.birds_sold || (b.at_start ?? 0) + (b.arrived ?? 0))
  const birds = rows.some((b) => b.at_end !== undefined)
  return (
    <>
      <div className="glass rounded-2xl p-3 grid grid-cols-3 gap-2 text-center mb-6">
        <div className="min-w-0">
          <p className="text-xs text-foreground/55">Sold for</p>
          <p className="font-semibold tabular-nums whitespace-nowrap">{amount(t.revenue)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-foreground/55">Received</p>
          <p className="font-semibold tabular-nums whitespace-nowrap text-emerald-600">{amount(t.collected)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-foreground/55">Still owed</p>
          <p className={cn("font-semibold tabular-nums whitespace-nowrap", money(t.unpaid_sales) > 0 && "text-red-600")}>{amount(t.unpaid_sales)}</p>
        </div>
        <p className="col-span-3 text-[11px] text-foreground/50">TZS · “received” counts every payment dated this month, including for earlier sales</p>
      </div>
      <Section title="By batch">
        <Table
          head={birds ? ["Batch", "Had", "Sold", "Left", "TZS"] : ["Batch", "Sold", "Kg", "TZS"]}
          rows={rows.map((b) =>
            birds
              ? [batchCell(b, arrival(b)), num(b.at_start! + b.arrived!), <span className="font-semibold">{num(b.birds_sold)}</span>, num(b.at_end), amount(b.revenue)]
              : [batchCell(b), num(b.birds_sold), num(b.kg_sold), amount(b.revenue)],
          )}
          foot={
            birds
              ? ["All", num((t.at_start ?? 0) + (t.arrived ?? 0)), num(t.birds_sold), num(t.at_end), amount(t.revenue)]
              : ["All", num(t.birds_sold), num(t.kg_sold), amount(t.revenue)]
          }
        />
        {birds && (
          <p className="text-xs text-foreground/55 mt-2">“Had” is the birds at the start of the month plus any that arrived; “Left” is what was not sold or lost by the end.</p>
        )}
      </Section>
      <Section title={`Every sale (${data.sales?.length ?? 0})`}>
        {!data.sales?.length ? (
          <p className="text-sm text-foreground/55">No sales this month.</p>
        ) : (
          <ul className="glass rounded-xl divide-y divide-border">
            {data.sales.map((s) => (
              <li key={s.id} className="p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium min-w-0 truncate">{s.buyer}</span>
                  <span className="font-semibold tabular-nums whitespace-nowrap">{tzs(s.total)}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-foreground/60">
                  <span>
                    {dayMonth(s.date)} · {s.batch_code} · {num(s.birds)} birds
                    {s.weight_kg ? ` · ${num(s.weight_kg)} kg` : ""}
                  </span>
                  {money(s.balance) > 0 ? <span className="text-red-600 whitespace-nowrap">owes {tzsShort(s.balance)}</span> : <span className="text-emerald-600">paid</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link to={`${FARM}/sales`} className="mt-2 inline-flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400 font-medium py-2">
          Open sales <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </Section>
    </>
  )
}

function CostsDetail({ data }: { data: FarmMonth }) {
  const [filter, setFilter] = useState<string>("all")
  const costs = data.costs ?? []
  const shown = costs.filter((c) => filter === "all" || (filter === "general" ? c.batch === null : String(c.batch) === filter))
  const total = shown.reduce((s, c) => s + Number(c.amount), 0)
  const batches = data.batches.filter((b) => money(b.costs))
  const chip = (key: string, label: string, amount: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      aria-pressed={filter === key}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap",
        filter === key ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300" : "border-border hover:bg-foreground/5",
      )}
    >
      {label} · {tzsShort(amount)}
    </button>
  )
  return (
    <>
      {data.costs_by_category && data.costs_by_category.length > 0 && (
        <Section title="Where the money went">
          <div className="glass rounded-xl p-3">
            <Bars
              rows={data.costs_by_category.map((c) => ({
                label: c.label,
                value: Number(c.amount),
              }))}
              format={tzs}
            />
          </div>
        </Section>
      )}
      <Section title="Every cost this month">
        <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Show costs for">
          {chip("all", "All", money(data.totals.costs))}
          {batches.map((b) => chip(String(b.id), b.code, money(b.costs)))}
          {money(data.totals.general_costs) > 0 && chip("general", "General", money(data.totals.general_costs))}
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-foreground/55">No costs recorded{filter === "all" ? " this month" : " here"}.</p>
        ) : (
          <ul className="glass rounded-xl divide-y divide-border">
            {shown.map((c) => (
              <li key={c.id} className="p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium min-w-0">
                    {c.category_label}
                    {c.description && <span className="font-normal text-foreground/65"> · {c.description}</span>}
                  </span>
                  <span className="font-semibold tabular-nums whitespace-nowrap">{tzs(c.amount)}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 text-xs text-foreground/60">
                  <span>
                    {dayMonth(c.date)} · {c.batch_code ?? "General"}
                    {c.quantity ? ` · ${num(c.quantity)} ${c.unit}` : ""}
                    {c.paid_to ? ` · ${c.paid_to}` : ""}
                  </span>
                  <span className={cn(c.payment_method === "credit" && "text-red-600 font-medium")}>
                    {PAYMENT_METHODS[c.payment_method] ?? c.payment_method}
                    {c.receipt_url && (
                      <a href={c.receipt_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-amber-700 dark:text-amber-400 underline">
                        receipt
                      </a>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 flex justify-between text-sm font-bold">
          <span>Total{filter === "all" ? "" : " shown"}</span>
          <span className="tabular-nums">{tzs(total)}</span>
        </p>
        <Link to={`${FARM}/costs`} className="mt-1 inline-flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400 font-medium py-2">
          Open costs <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </Section>
    </>
  )
}

function ProfitDetail({ data }: { data: FarmMonth }) {
  const t = data.totals
  const rows = data.batches.filter((b) => money(b.revenue) || money(b.costs))
  const longer = data.batches.filter((b) => b.whole)
  const signed = (value: string | undefined) => <span className={cn("font-semibold", money(value) < 0 ? "text-red-600" : "text-emerald-600")}>{amount(value)}</span>
  return (
    <>
      <Section title="Sales − costs, batch by batch">
        <Table
          head={["Batch", "Sales", "Costs", "Profit"]}
          rows={[
            ...rows.map((b) => [batchCell(b, arrival(b)), amount(b.revenue), amount(b.costs), signed(b.profit)]),
            ...(money(t.general_costs)
              ? [
                  [
                    <span className="font-semibold">
                      General
                      <span className="block text-[11px] font-normal text-foreground/55">Not tied to a batch</span>
                    </span>,
                    "—",
                    amount(t.general_costs),
                    signed(String(-money(t.general_costs))),
                  ],
                ]
              : []),
          ]}
          foot={["This month", amount(t.revenue), amount(t.costs), signed(t.profit)]}
        />
        <p className="text-xs text-foreground/55 mt-3">
          Amounts in TZS. A sale counts in the month it was made, even if the money comes later
          {t.collected !== undefined ? ` (received this month: ${tzs(t.collected)})` : ""}.
        </p>
      </Section>
      {longer.length > 0 && (
        <Section title="Batches that run over more than one month">
          <p className="text-xs text-foreground/55 -mt-1 mb-2">
            Above is only the part that fell in {monthName(data.month)}. Here is each one's result over all its months, to date: chicks, feed and every sale.
          </p>
          <Table
            head={["Batch", "Sales", "Costs", "Profit"]}
            rows={longer.map((b) => [
              batchCell(b, b.closed_on ? `${dayMonth(b.started_on)} – ${dayMonth(b.closed_on)}` : `Since ${dayMonth(b.started_on)}, still open`),
              amount(b.whole!.revenue),
              amount(b.whole!.costs),
              signed(b.whole!.profit),
            ])}
          />
        </Section>
      )}
    </>
  )
}

const TITLES: Record<Detail, string> = {
  birds: "Birds",
  deaths: "Deaths",
  sales: "Sales",
  costs: "Costs",
  profit: "Profit",
}

export function MonthDetailSheet({ data, detail, onClose }: { data: FarmMonth; detail: Detail | null; onClose: () => void }) {
  return (
    <Sheet open={detail !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {detail && (
          <>
            <SheetHeader className="mb-5 text-left">
              <SheetTitle>
                {TITLES[detail]} · {monthName(data.month)}
              </SheetTitle>
              <SheetDescription>
                Only what happened from {dayMonth(data.start)} to {dayMonth(data.end)}, for every batch on the farm in that time.
              </SheetDescription>
            </SheetHeader>
            {detail === "birds" && <BirdsDetail data={data} />}
            {detail === "deaths" && <DeathsDetail data={data} />}
            {detail === "sales" && <SalesDetail data={data} />}
            {detail === "costs" && <CostsDetail data={data} />}
            {detail === "profit" && <ProfitDetail data={data} />}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
