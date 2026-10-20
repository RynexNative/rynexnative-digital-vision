import { OpsListPage, CardHead, Due } from "@/features/operations/OpsListPage"
import { serverDefaults, serverFields } from "@/features/operations/fields"
import { BILLING_CYCLES, COST_STATUS, SERVER_KINDS, formatDate, formatMoney, type OpsServer } from "@/features/operations/types"

export default function ServersPage() {
  return (
    <OpsListPage<OpsServer>
      resource="servers"
      title="Servers"
      subtitle="Where our systems are hosted, what each costs and when it must be paid, and what we no longer need."
      addLabel="Add server"
      emptyText="No servers here yet"
      tabs={[
        { id: "active", label: "Running", params: { status: "active" } },
        { id: "not_needed", label: "Not needed", params: { status: "not_needed" } },
        { id: "cancelled", label: "Cancelled", params: { status: "cancelled" } },
        { id: "all", label: "All", params: {} },
      ]}
      fields={serverFields}
      defaults={serverDefaults}
      recordTitle={(s) => (s ? s.name : "Add server")}
      card={(s) => (
        <>
          <CardHead title={s.name} pill={COST_STATUS[s.status]} sub={[s.provider, SERVER_KINDS[s.kind], s.region].filter(Boolean).join(" · ")} />
          <p className="text-sm mb-1">
            <span className="font-semibold">{formatMoney(s.cost, s.currency)}</span>
            <span className="text-foreground/55"> · {BILLING_CYCLES[s.billing_cycle]}</span>
            {s.paid_by_client && <span className="text-foreground/55"> · client pays</span>}
          </p>
          {s.status === "active" || s.status === "trial" ? (
            <Due label="Next payment" date={formatDate(s.next_payment_on)} days={s.days_left} />
          ) : (
            s.status_reason && <p className="text-sm text-foreground/70">Why: {s.status_reason}</p>
          )}
          <p className="text-xs text-foreground/55 mt-2 line-clamp-2">
            {s.hosted_systems.length ? `Hosts: ${s.hosted_systems.join(", ")}` : "Nothing listed as hosted"}
            {s.clients.length > 0 && ` · ${s.clients.map((c) => c.name).join(", ")}`}
          </p>
        </>
      )}
    />
  )
}
