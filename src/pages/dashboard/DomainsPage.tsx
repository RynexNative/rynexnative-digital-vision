import { RefreshCw } from "lucide-react"
import { OpsListPage, CardHead, Due } from "@/features/operations/OpsListPage"
import { domainDefaults, domainFields } from "@/features/operations/fields"
import { DOMAIN_STATUS, DOMAIN_STOP_REASONS, formatDate, formatMoney, type OpsDomain } from "@/features/operations/types"

export default function DomainsPage() {
  return (
    <OpsListPage<OpsDomain>
      resource="domains"
      title="Domains"
      subtitle="Every domain we look after, when it expires, and the ones we no longer manage and why."
      addLabel="Add domain"
      emptyText="No domains here yet"
      tabs={[
        { id: "managed", label: "Managed", params: { status: "managed" } },
        { id: "not_managed", label: "Not managed", params: { status: "not_managed" } },
        { id: "all", label: "All", params: {} },
      ]}
      fields={domainFields}
      defaults={domainDefaults}
      recordTitle={(d) => (d ? d.name : "Add domain")}
      deleteText="The domain will be removed from the list. To keep its history, mark it as not managed instead."
      card={(d) => (
        <>
          <CardHead title={d.name} pill={DOMAIN_STATUS[d.status]} sub={d.client?.name ?? "RynexNative (our own)"} />
          {d.status === "managed" ? (
            <>
              <Due label="Expires" date={formatDate(d.expires_on)} days={d.days_left} soon={30} />
              <p className="text-xs text-foreground/55 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {d.registrar && <span>{d.registrar}</span>}
                {d.renewal_cost !== null && <span>{formatMoney(d.renewal_cost, d.currency)}/year</span>}
                {d.paid_by_client && <span>Client pays</span>}
                {d.auto_renew && (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <RefreshCw className="h-3 w-3" />
                    Auto-renew
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-foreground/70">Why: {DOMAIN_STOP_REASONS[d.stop_reason] ?? "—"}</p>
          )}
        </>
      )}
    />
  )
}
