import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, CreditCard, FileText, Globe, LifeBuoy, Receipt, Server as ServerIcon } from "lucide-react"
import { moneyMap } from "@/features/billing/types"
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/features/dashboard/ui"
import { useOpsSummary } from "@/features/operations/api"
import { formatDate, formatMoney, type AttentionItem, type CountRow } from "@/features/operations/types"
import { cn } from "@/lib/utils"

const KIND_LINK: Record<AttentionItem["kind"], { to: string; icon: ReactNode; label: string }> = {
  domain: { to: "/admin/domains", icon: <Globe className="h-4 w-4" />, label: "Domain" },
  server: { to: "/admin/servers", icon: <ServerIcon className="h-4 w-4" />, label: "Server" },
  subscription: { to: "/admin/subscriptions", icon: <CreditCard className="h-4 w-4" />, label: "Subscription" },
  service: { to: "/admin/support", icon: <LifeBuoy className="h-4 w-4" />, label: "Support" },
  invoice: { to: "/admin/billing", icon: <Receipt className="h-4 w-4" />, label: "Invoice" },
  quote: { to: "/admin/billing", icon: <FileText className="h-4 w-4" />, label: "Quote" },
}

const SEVERITY: Record<AttentionItem["severity"], string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-sky-500",
}

function costs(map: Record<string, number>) {
  const entries = Object.entries(map).filter(([, v]) => v > 0)
  return entries.length ? entries.map(([currency, value]) => formatMoney(value, currency)).join(" + ") : "—"
}

function Stat({ to, icon, title, main, lines }: { to: string; icon: ReactNode; title: string; main: ReactNode; lines: ReactNode[] }) {
  return (
    <Link to={to} className="glass rounded-2xl p-5 hover:border-primary/40 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className="h-10 w-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center">{icon}</span>
        <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition" />
      </div>
      <p className="text-sm text-foreground/60">{title}</p>
      <p className="text-3xl font-bold font-poppins mt-0.5 mb-2">{main}</p>
      <ul className="space-y-0.5 text-xs text-foreground/60">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </Link>
  )
}

function Bars({ title, rows, empty, tone = "bg-primary" }: { title: string; rows: CountRow[]; empty: string; tone?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-foreground/55">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex justify-between text-sm mb-1">
                <span>{row.label}</span>
                <span className="font-semibold">{row.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full", tone)} style={{ width: `${(row.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function OperationsPage() {
  const { data, isLoading, isError, refetch } = useOpsSummary()

  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <>
      <PageHeader title="Operations" subtitle="Clients, payments, support, domains, servers and subscriptions at a glance, and what needs action soon." />

      {isLoading || !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          {data.billing && (
            <Link
              to="/admin/billing?tab=invoices"
              className={cn(
                "glass rounded-2xl p-5 mb-4 grid sm:grid-cols-3 gap-4 hover:border-primary/40 transition-colors",
                data.billing.overdue_invoices > 0 && "border-red-500/40",
              )}
            >
              <span>
                <span className="block text-sm text-foreground/60">Clients owe us</span>
                <span className="block text-xl font-bold font-poppins">{moneyMap(data.billing.outstanding)}</span>
                <span className="block text-xs text-foreground/55">{data.billing.unpaid_invoices} unpaid invoice(s)</span>
              </span>
              <span>
                <span className="block text-sm text-foreground/60">Overdue</span>
                <span className={cn("block text-xl font-bold font-poppins", data.billing.overdue_invoices > 0 && "text-red-700")}>{moneyMap(data.billing.overdue)}</span>
                <span className="block text-xs text-foreground/55">{data.billing.overdue_invoices} invoice(s) past the due date</span>
              </span>
              <span>
                <span className="block text-sm text-foreground/60">Paid this month</span>
                <span className="block text-xl font-bold font-poppins text-emerald-700">{moneyMap(data.billing.paid_this_month)}</span>
                <span className="block text-xs text-foreground/55">{data.billing.open_quotes} quote(s) waiting for an answer</span>
              </span>
            </Link>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-8">
            <Stat
              to="/admin/clients"
              icon={<Building2 className="h-5 w-5" />}
              title="Clients we support"
              main={
                <>
                  {data.clients.supported}
                  <span className="text-base text-foreground/50 font-medium"> / {data.clients.supported + data.clients.not_supported}</span>
                </>
              }
              lines={[
                <span className={data.clients.not_supported ? "text-amber-600 font-semibold" : ""}>{data.clients.not_supported} without support</span>,
                `${data.clients.prospects} prospect(s) · ${data.clients.former} former`,
              ]}
            />
            <Stat
              to="/admin/domains"
              icon={<Globe className="h-5 w-5" />}
              title="Domains we manage"
              main={data.domains.managed}
              lines={[
                <span className={data.domains.expired || data.domains.expiring_soon ? "text-red-600 font-semibold" : ""}>
                  {data.domains.expired} expired · {data.domains.expiring_soon} expiring in 30 days
                </span>,
                `${data.domains.not_managed} no longer managed`,
              ]}
            />
            <Stat
              to="/admin/servers"
              icon={<ServerIcon className="h-5 w-5" />}
              title="Servers running"
              main={data.servers.running}
              lines={[
                <span className={data.servers.due_soon ? "text-amber-600 font-semibold" : ""}>{data.servers.due_soon} payment(s) due in 14 days</span>,
                `${costs(data.servers.monthly_cost)} per month`,
                `${data.servers.not_needed} not needed · ${data.servers.cancelled} cancelled`,
              ]}
            />
            <Stat
              to="/admin/subscriptions"
              icon={<CreditCard className="h-5 w-5" />}
              title="Active subscriptions"
              main={data.subscriptions.running}
              lines={[
                <span className={data.subscriptions.due_soon ? "text-amber-600 font-semibold" : ""}>{data.subscriptions.due_soon} renewal(s) in 14 days</span>,
                `${costs(data.subscriptions.monthly_cost)} per month`,
                `${data.subscriptions.stopped} stopped`,
              ]}
            />
          </div>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-lg">Needs attention</h2>
              {data.attention_count > 0 && <span className="text-sm text-foreground/55">({data.attention_count})</span>}
            </div>
            {data.attention.length === 0 ? (
              <div className="glass rounded-2xl p-6 flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Nothing is expiring or due in the coming days.
              </div>
            ) : (
              <ul className="space-y-2">
                {data.attention.map((item) => {
                  const kind = KIND_LINK[item.kind]
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        to={item.kind === "invoice" || item.kind === "quote" ? `/admin/billing/${item.id}` : kind.to}
                        className={cn("glass rounded-xl p-4 flex items-center gap-3 border-l-4 hover:bg-muted/50 transition-colors", SEVERITY[item.severity])}
                      >
                        <span className="h-9 w-9 rounded-lg bg-muted text-foreground/70 flex items-center justify-center flex-shrink-0">{kind.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium truncate">{item.title}</span>
                          <span className="block text-sm text-foreground/60">{item.detail}</span>
                        </span>
                        {item.due_on && <span className="hidden sm:block text-xs text-foreground/50 flex-shrink-0">{formatDate(item.due_on)}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {data.clients.total === 0 && data.domains.total === 0 && data.servers.total === 0 && data.subscriptions.total === 0 ? (
            <EmptyState
              title="Start by adding what you look after"
              text="Add your clients, their domains, the servers you host on and the subscriptions you pay for. This page then keeps track for you."
              action={
                <Link to="/admin/clients?new=1" className="h-11 px-5 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2">
                  Add the first client
                </Link>
              }
            />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              <Bars title="Support we give, by service" rows={data.support.by_type} empty="No supported services yet." />
              <Bars title="Why support ended" rows={data.support.ended_by_reason} empty="No support has ended." tone="bg-amber-500" />
              <Bars title="Why we stopped managing domains" rows={data.domains.not_managed_by_reason} empty="We still manage every domain." tone="bg-amber-500" />
              <Bars title="Clients by type" rows={data.clients.by_kind} empty="No clients yet." tone="bg-teal-500" />
            </div>
          )}
        </>
      )}
    </>
  )
}
