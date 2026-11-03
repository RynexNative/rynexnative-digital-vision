import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader } from "@/features/dashboard/ui"
import { useBatches } from "@/features/farm/api"
import { FarmSheet } from "@/features/farm/FarmSheet"
import { farmButton } from "@/features/farm/form"
import { batchDefaults, batchFields } from "@/features/farm/fields"
import { BatchCard } from "@/features/farm/ui"

type Filter = "open" | "closed" | ""

export default function BatchesPage() {
  const { can } = usePermissions()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>("open")
  const { data, isLoading, isError, refetch } = useBatches({ status: filter })
  const adding = params.get("new") === "1"
  const close = () => setParams({}, { replace: true })

  return (
    <div>
      <PageHeader
        title="Batches"
        subtitle="Each lot of chicks, from the day they arrive until the last one is sold."
        action={
          can("cp_flocks.manage") && (
            <button type="button" onClick={() => setParams({ new: "1" })} className={farmButton}>
              <Plus className="h-4 w-4" />
              New batch
            </button>
          )
        }
      />
      <div className="mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "open", label: "On the farm" },
            { id: "closed", label: "Closed" },
            { id: "", label: "All" },
          ]}
        />
      </div>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState title={filter === "closed" ? "No closed batches yet" : "No batches on the farm"} text="Start a batch when the chicks arrive." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((b) => (
            <BatchCard key={b.id} {...b} />
          ))}
        </div>
      )}
      {adding && can("cp_flocks.manage") && (
        <FarmSheet
          resource="batches"
          title="New batch of chicks"
          description="The batch gets its number (e.g. CP-2026-03) automatically."
          fields={batchFields(true, can("cp_costs.manage"))}
          initial={batchDefaults()}
          onClose={close}
        />
      )}
    </div>
  )
}
