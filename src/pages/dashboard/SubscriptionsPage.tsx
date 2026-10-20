import { OpsListPage, CardHead, Due } from "@/features/operations/OpsListPage"
import { subscriptionDefaults, subscriptionFields } from "@/features/operations/fields"
import { BILLING_CYCLES, COST_STATUS, SUBSCRIPTION_CATEGORIES, formatDate, formatMoney, type OpsSubscription } from "@/features/operations/types"

export default function SubscriptionsPage() {
  return (
    <OpsListPage<OpsSubscription>
      resource="subscriptions"
      title="Subscriptions"
      subtitle="Tools and services we pay for again and again, what they are for and when they renew."
      addLabel="Add subscription"
      emptyText="No subscriptions here yet"
      tabs={[
        { id: "active", label: "Active", params: { status: "active" } },
        { id: "trial", label: "Trial", params: { status: "trial" } },
        { id: "not_needed", label: "Not needed", params: { status: "not_needed" } },
        { id: "cancelled", label: "Cancelled", params: { status: "cancelled" } },
        { id: "all", label: "All", params: {} },
      ]}
      fields={subscriptionFields}
      defaults={subscriptionDefaults}
      recordTitle={(s) => (s ? s.name : "Add subscription")}
      card={(s) => (
        <>
          <CardHead
            title={s.name}
            pill={COST_STATUS[s.status]}
            sub={[s.provider, SUBSCRIPTION_CATEGORIES[s.category], s.client?.name].filter(Boolean).join(" · ")}
          />
          <p className="text-sm mb-1">
            <span className="font-semibold">{formatMoney(s.cost, s.currency)}</span>
            <span className="text-foreground/55"> · {BILLING_CYCLES[s.billing_cycle]}</span>
            {s.paid_by_client && <span className="text-foreground/55"> · client pays</span>}
          </p>
          {s.status === "active" || s.status === "trial" ? (
            <Due label="Renews" date={formatDate(s.next_payment_on)} days={s.days_left} />
          ) : (
            s.status_reason && <p className="text-sm text-foreground/70">Why: {s.status_reason}</p>
          )}
          {s.used_for && <p className="text-xs text-foreground/55 mt-2 line-clamp-2">{s.used_for}</p>}
        </>
      )}
    />
  )
}
