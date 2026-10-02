import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Calculator, CalendarDays, Hourglass, Mail, Plus, Trophy, Users } from "lucide-react"
import { useCurrentUser, useStats } from "@/features/dashboard/api"
import { ESTIMATE_STATUS, MESSAGE_STATUS, formatWhen } from "@/features/dashboard/types"
import { EmptyState, ErrorState, PageHeader, Pill } from "@/features/dashboard/ui"
import { buttonPrimary } from "@/features/dashboard/styles"
import { formatCompactTZS } from "@/features/estimator/calculate"
import { PROJECT_TYPES } from "@/features/estimator/pricing"

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Habari za asubuhi"
  if (hour < 16) return "Habari za mchana"
  return "Habari za jioni"
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
        subtitle="Haya ndiyo yanayoendelea kwenye website yako."
        action={
          <Link to="/admin/tahadhari?new=1" className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            Tahadhari mpya
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard
          to="/admin/maombi"
          icon={<Calculator className="h-5 w-5" />}
          label="Maombi mapya"
          value={stats?.estimates.new}
          hint={isLoading ? "…" : `${stats?.estimates.this_week ?? 0} wiki hii`}
          highlight={Boolean(stats?.estimates.new)}
        />
        <StatCard
          to="/admin/ujumbe"
          icon={<Mail className="h-5 w-5" />}
          label="Ujumbe mpya"
          value={stats?.messages.new}
          hint={isLoading ? "…" : `${stats?.messages.total ?? 0} jumla`}
          highlight={Boolean(stats?.messages.new)}
        />
        <StatCard
          to="/admin/matukio"
          icon={<CalendarDays className="h-5 w-5" />}
          label="Matukio yajayo"
          value={stats?.events.upcoming}
          hint={isLoading ? "…" : `${stats?.events.registrations_week ?? 0} wamejisajili wiki hii`}
        />
        <StatCard
          to="/admin/wanachama"
          icon={<Users className="h-5 w-5" />}
          label="Wanachama"
          value={stats?.subscribers.total}
          hint={isLoading ? "…" : `+${stats?.subscribers.this_week ?? 0} wiki hii`}
        />
      </div>

      {Boolean(stats?.events.to_verify) && (
        <Link
          to="/admin/matukio"
          className="glass rounded-2xl p-4 mb-4 flex items-center gap-3 border-accent/40 hover:bg-accent/5 transition-colors"
        >
          <Hourglass className="h-5 w-5 text-accent flex-shrink-0" />
          <p className="text-sm flex-1">
            Malipo <strong>{stats?.events.to_verify}</strong> ya matukio yanasubiri uthibitisho wako.
          </p>
          <ArrowRight className="h-4 w-4 text-accent" />
        </Link>
      )}

      {Boolean(stats?.estimates.won) && (
        <div className="glass rounded-2xl p-4 mb-8 flex items-center gap-3 border-emerald-500/20">
          <Trophy className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm">
            Mmepata kazi <strong>{stats?.estimates.won}</strong> kutoka kwa maombi {stats?.estimates.total} ya kikokotoo.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Maombi ya karibuni</h2>
            <Link to="/admin/maombi" className="text-sm text-primary hover:underline">Yote</Link>
          </div>
          {isLoading ? (
            <div className="glass rounded-2xl h-48 animate-pulse" />
          ) : stats?.recent_estimates.length ? (
            <ul className="glass rounded-2xl divide-y divide-foreground/10">
              {stats.recent_estimates.map((e) => (
                <li key={e.id}>
                  <Link to="/admin/maombi" className="flex items-center gap-3 p-4 hover:bg-foreground/5 transition-colors">
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
            <EmptyState title="Bado hakuna maombi" text="Maombi kutoka kwenye kikokotoo cha bei yataonekana hapa." />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Ujumbe wa karibuni</h2>
            <Link to="/admin/ujumbe" className="text-sm text-primary hover:underline">Yote</Link>
          </div>
          {isLoading ? (
            <div className="glass rounded-2xl h-48 animate-pulse" />
          ) : stats?.recent_messages.length ? (
            <ul className="glass rounded-2xl divide-y divide-foreground/10">
              {stats.recent_messages.map((m) => (
                <li key={m.id}>
                  <Link to="/admin/ujumbe" className="flex items-start gap-3 p-4 hover:bg-foreground/5 transition-colors">
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
            <EmptyState title="Bado hakuna ujumbe" text="Ujumbe kutoka fomu ya Contact utaonekana hapa." />
          )}
        </section>
      </div>
    </>
  )
}
