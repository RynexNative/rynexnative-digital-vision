import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowRight, Calculator, CalendarDays, Hourglass, Inbox, Mail, Plus, Trophy } from "lucide-react"
import { useCurrentUser, useStats } from "@/features/dashboard/api"
import { ESTIMATE_STATUS, MESSAGE_STATUS, formatWhen } from "@/features/dashboard/types"
import { EmptyState, ErrorState, PageHeader, Pill } from "@/features/dashboard/ui"
import { buttonPrimary } from "@/features/dashboard/styles"
import { formatCompactTZS } from "@/features/estimator/calculate"
import { PROJECT_TYPES } from "@/features/estimator/pricing"

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 16) return "Good afternoon"
  return "Good evening"
}

function StatCard({
  to,
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  to: string
  icon: ReactNode
  label: string
  value: number | undefined
  hint: string
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className="glass rounded-2xl p-5 hover:border-primary/40 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="h-10 w-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center">{icon}</span>
        <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition" />
      </div>
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="text-3xl font-bold font-poppins mt-0.5">{value ?? "–"}</p>
      <p className={highlight ? "text-xs font-semibold text-primary mt-1" : "text-xs text-foreground/50 mt-1"}>{hint}</p>
    </Link>
  )
}

export default function OverviewPage() {
  const { data: user } = useCurrentUser()
  const { data: stats, isLoading, isError, refetch } = useStats()

  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(" ")[0] ?? ""} 👋`}
        subtitle="Here is what is happening on your website."
        action={
          <Link to="/admin/packages?new=1" className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            New package
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {/* Package requests first: they are the warmest leads */}
        <StatCard
          to="/admin/requests"
          icon={<Inbox className="h-5 w-5" />}
          label="Package requests"
          value={stats?.packages?.inquiries_new}
          hint={isLoading ? "…" : `${stats?.packages?.inquiries_week ?? 0} this week`}
          highlight={Boolean(stats?.packages?.inquiries_new)}
        />
        <StatCard
          to="/admin/estimates"
          icon={<Calculator className="h-5 w-5" />}
          label="New estimates"
          value={stats?.estimates.new}
          hint={isLoading ? "…" : `${stats?.estimates.this_week ?? 0} this week`}
          highlight={Boolean(stats?.estimates.new)}
        />
        <StatCard
          to="/admin/messages"
          icon={<Mail className="h-5 w-5" />}
          label="New messages"
          value={stats?.messages.new}
          hint={isLoading ? "…" : `${stats?.messages.total ?? 0} in total`}
          highlight={Boolean(stats?.messages.new)}
        />
        <StatCard
          to="/admin/events"
          icon={<CalendarDays className="h-5 w-5" />}
          label="Upcoming events"
          value={stats?.events?.upcoming}
          hint={isLoading ? "…" : `${stats?.events?.registrations_week ?? 0} registrations this week`}
        />
      </div>

      {Boolean(stats?.operations?.attention) && (
        <Link
          to="/admin/operations"
          className="glass rounded-2xl p-4 mb-4 flex items-center gap-3 border-amber-500/40 hover:bg-amber-500/5 transition-colors"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm flex-1">
            <strong>{stats?.operations?.attention}</strong> item(s) in Operations need attention: renewals, payments or support ending soon.
          </p>
          <ArrowRight className="h-4 w-4 text-amber-500" />
        </Link>
      )}

      {Boolean(stats?.events?.to_verify) && (
        <Link
          to="/admin/events"
          className="glass rounded-2xl p-4 mb-4 flex items-center gap-3 border-accent/40 hover:bg-accent/5 transition-colors"
        >
          <Hourglass className="h-5 w-5 text-accent flex-shrink-0" />
          <p className="text-sm flex-1">
            <strong>{stats?.events?.to_verify}</strong> event payment(s) are waiting for your confirmation.
          </p>
          <ArrowRight className="h-4 w-4 text-accent" />
        </Link>
      )}

      {Boolean(stats?.estimates.won) && (
        <div className="glass rounded-2xl p-4 mb-8 flex items-center gap-3 border-emerald-500/20">
          <Trophy className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm">
            You won <strong>{stats?.estimates.won}</strong> project(s) from {stats?.estimates.total} estimator requests.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Recent estimates</h2>
            <Link to="/admin/estimates" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="glass rounded-2xl h-48 animate-pulse" />
          ) : stats?.recent_estimates.length ? (
            <ul className="glass rounded-2xl divide-y divide-foreground/10">
              {stats.recent_estimates.map((e) => (
                <li key={e.id}>
                  <Link to="/admin/estimates" className="flex items-center gap-3 p-4 hover:bg-foreground/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{e.name}</p>
                      <p className="text-xs text-foreground/60 truncate">
                        {PROJECT_TYPES.find((t) => t.id === e.project_type)?.label ?? e.project_type} · TZS{" "}
                        {formatCompactTZS(e.estimate_min)}–{formatCompactTZS(e.estimate_max)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Pill className={ESTIMATE_STATUS[e.status].className}>{ESTIMATE_STATUS[e.status].label}</Pill>
                      <p className="text-[11px] text-foreground/50 mt-1">{formatWhen(e.created_at)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No estimates yet" text="Requests from the price estimator will appear here." />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Recent messages</h2>
            <Link to="/admin/messages" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="glass rounded-2xl h-48 animate-pulse" />
          ) : stats?.recent_messages.length ? (
            <ul className="glass rounded-2xl divide-y divide-foreground/10">
              {stats.recent_messages.map((m) => (
                <li key={m.id}>
                  <Link to="/admin/messages" className="flex items-start gap-3 p-4 hover:bg-foreground/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{m.name}</p>
                      <p className="text-xs text-foreground/60 line-clamp-1">{m.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Pill className={MESSAGE_STATUS[m.status].className}>{MESSAGE_STATUS[m.status].label}</Pill>
                      <p className="text-[11px] text-foreground/50 mt-1">{formatWhen(m.created_at)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No messages yet" text="Messages from the contact form will appear here." />
          )}
        </section>
      </div>
    </>
  )
}
