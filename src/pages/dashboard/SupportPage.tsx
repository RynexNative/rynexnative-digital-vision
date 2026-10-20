import { OpsListPage, CardHead, Due } from "@/features/operations/OpsListPage"
import { serviceDefaults, serviceFields } from "@/features/operations/fields"
import { BILLING_CYCLES, END_REASONS, SERVICE_STATUS, SERVICE_TYPES, formatDate, formatMoney, type OpsService } from "@/features/operations/types"

export default function SupportPage() {
  return (
    <OpsListPage<OpsService>
      resource="services"
      title="Support"
      subtitle="What we deliver to each client, which services we still support, and why the others ended."
      addLabel="Add service"
      emptyText="No services here yet"
      tabs={[
        { id: "active", label: "Supported", params: { status: "active" } },
        { id: "paused", label: "Paused", params: { status: "paused" } },
        { id: "ended", label: "Ended", params: { status: "ended" } },
        { id: "all", label: "All", params: {} },
      ]}
      fields={serviceFields}
      defaults={serviceDefaults}
      recordTitle={(s) => (s ? `${s.client.name} · ${s.title}` : "Add service")}
      card={(s) => (
        <>
          <CardHead title={s.title} pill={SERVICE_STATUS[s.status]} sub={`${s.client.name} · ${SERVICE_TYPES[s.service_type]}`} />
          {s.status === "ended" ? (
            <p className="text-sm text-foreground/70">Why: {END_REASONS[s.end_reason] ?? "—"}</p>
          ) : (
            s.support_until && <Due label="Support until" date={formatDate(s.support_until)} days={s.days_left} soon={30} />
          )}
          {s.fee !== null && (
            <p className="text-xs text-foreground/55 mt-2">
              {formatMoney(s.fee, s.currency)} · {BILLING_CYCLES[s.billing_cycle]}
            </p>
          )}
        </>
      )}
    />
  )
}
