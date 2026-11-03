import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { buttonGhost } from "@/features/dashboard/styles"
import { ErrorState, FilterTabs, ListSkeleton, Pill } from "@/features/dashboard/ui"
import { useBatch } from "@/features/farm/api"
import { FarmSheet } from "@/features/farm/FarmSheet"
import { toValues, type Values } from "@/features/farm/form"
import { batchFields } from "@/features/farm/fields"
import { ExpenseList, HealthList, SaleList } from "@/features/farm/lists"
import { BATCH_STATUS, num, shortDate, tzs } from "@/features/farm/types"
import { FARM, Stat } from "@/features/farm/ui"

type Tab = "health" | "costs" | "sales"

export default function BatchDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { data: batch, isLoading, isError, refetch } = useBatch(id)
  const tabs = [
    { id: "health" as const, label: "Health log", perm: "cp_flocks.view" },
    { id: "costs" as const, label: "Costs", perm: "cp_costs.view" },
    { id: "sales" as const, label: "Sales", perm: "cp_sales.view" },
  ].filter((t) => can(t.perm))
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? "health")
  const [editing, setEditing] = useState(false)

  if (isLoading) return <ListSkeleton rows={3} />
  if (isError || !batch) return <ErrorState onRetry={() => refetch()} />
  const f = batch.figures
  const fields = batchFields(false, false)

  return (
    <div>
      <Link to={`${FARM}/batches`} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Batches
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold font-poppins">{batch.code}</h1>
            <Pill className={BATCH_STATUS[batch.status].className}>{BATCH_STATUS[batch.status].label}</Pill>
          </div>
          <p className="text-foreground/60 mt-1">
            {[batch.house, batch.breed, batch.supplier && `from ${batch.supplier}`].filter(Boolean).join(" · ")}
            {batch.house || batch.breed || batch.supplier ? " · " : ""}
            {num(batch.chicks_count)} chicks on {shortDate(batch.started_on)}
            {batch.closed_on && ` · closed ${shortDate(batch.closed_on)}`}
          </p>
        </div>
        {can("cp_flocks.manage") && (
          <button type="button" onClick={() => setEditing(true)} className={buttonGhost}>
            <Pencil className="h-4 w-4" />
            Edit / close
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Alive" value={num(f.alive)} sub={`of ${num(batch.chicks_count)}`} />
        <Stat label="Age" value={`${f.age_days} days`} sub={batch.status === "closed" ? "when closed" : f.days_to_target >= 0 ? `${f.days_to_target} days to target` : `${-f.days_to_target} days past target`} />
        <Stat label="Died" value={num(f.deaths)} sub={`${f.mortality_pct}% mortality`} tone={f.mortality_pct >= 5 ? "bad" : undefined} />
        <Stat label="Sold" value={num(f.sold)} sub={Number(f.kg_sold) ? `${num(f.kg_sold)} kg${f.avg_price_per_kg ? ` · avg ${tzs(f.avg_price_per_kg)}/kg` : ""}` : undefined} />
        {f.costs !== undefined && <Stat label="Costs" value={tzs(f.costs)} sub={`${tzs(f.cost_per_chick)} per chick · feed ${tzs(f.feed_cost)}`} />}
        {f.revenue !== undefined && <Stat label="Sales" value={tzs(f.revenue)} />}
        {f.profit !== undefined && <Stat label="Profit so far" value={tzs(f.profit)} tone={Number(f.profit) >= 0 ? "good" : "bad"} sub="Sales minus this batch's costs" />}
      </div>

      {batch.notes && <p className="glass rounded-2xl p-4 text-sm text-foreground/75 whitespace-pre-line mb-6">{batch.notes}</p>}

      {tabs.length > 1 && (
        <div className="mb-4">
          <FilterTabs value={tab} onChange={setTab} options={tabs} />
        </div>
      )}
      {tab === "health" && <HealthList batch={batch.id} />}
      {tab === "costs" && <ExpenseList batch={batch.id} />}
      {tab === "sales" && <SaleList batch={batch.id} />}

      {editing && (
        <FarmSheet
          resource="batches"
          title={`Edit ${batch.code}`}
          description="Close the batch when the last bird is sold. A batch with records cannot be deleted."
          fields={fields}
          initial={toValues(fields, batch as unknown as Values)}
          recordId={batch.id}
          onClose={() => setEditing(false)}
          deleteText="Only a batch with no health records, costs or sales can be deleted."
          onDeleted={() => navigate(`${FARM}/batches`, { replace: true })}
        />
      )}
    </div>
  )
}
