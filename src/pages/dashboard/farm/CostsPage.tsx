import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { inputClass } from "@/features/dashboard/styles"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, SearchInput } from "@/features/dashboard/ui"
import { useBatches, useExpenses } from "@/features/farm/api"
import { FarmSheet } from "@/features/farm/FarmSheet"
import { farmButton, toValues, type Values } from "@/features/farm/form"
import { expenseDefaults, expenseFields } from "@/features/farm/fields"
import { ExpenseRows } from "@/features/farm/lists"
import { EXPENSE_CATEGORIES, tzs, type Expense } from "@/features/farm/types"
import { Bars } from "@/features/farm/ui"
import { cn } from "@/lib/utils"

/** "2026-11" -> first and last day of that month */
function monthRange(month: string) {
  if (!month) return { since: "", until: "" }
  const [y, m] = month.split("-").map(Number)
  const last = new Date(y, m, 0).getDate()
  return { since: `${month}-01`, until: `${month}-${String(last).padStart(2, "0")}` }
}

export default function CostsPage() {
  const { can } = usePermissions()
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  const [category, setCategory] = useState("")
  const [batch, setBatch] = useState("")
  const [q, setQ] = useState("")
  const params = useMemo(() => ({ ...monthRange(month), category, batch, q }), [month, category, batch, q])
  const { data, isLoading, isError, refetch } = useExpenses(params)
  const { data: batches = [] } = useBatches()
  const [editing, setEditing] = useState<Expense | "new" | null>(null)
  const manage = can("cp_costs.manage")
  const fields = expenseFields(true)
  const select = cn(inputClass, "h-11 py-0 text-sm")

  return (
    <div>
      <PageHeader
        title="Costs & receipts"
        subtitle="Everything spent on the farm, down to the fares (nauli), with the receipt when there is one."
        action={
          manage && (
            <button type="button" onClick={() => setEditing("new")} className={farmButton}>
              <Plus className="h-4 w-4" />
              Add cost
            </button>
          )
        }
      />
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-5">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={cn(select, "sm:w-44")} aria-label="Month" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(select, "sm:w-52")} aria-label="Kind of cost">
          <option value="">Every kind</option>
          {Object.entries(EXPENSE_CATEGORIES).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select value={batch} onChange={(e) => setBatch(e.target.value)} className={cn(select, "sm:w-52")} aria-label="Batch">
          <option value="">Every batch</option>
          <option value="none">Shared (no batch)</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code}
            </option>
          ))}
        </select>
        <SearchInput value={q} onChange={setQ} placeholder="Search details or payee" />
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <div>
            <p className="text-sm text-foreground/60 mb-3">
              {data.results.length} record{data.results.length === 1 ? "" : "s"} · total <span className="font-semibold text-foreground">{tzs(data.total)}</span>
              {month ? "" : " (all time)"}
            </p>
            {data.results.length === 0 ? (
              <EmptyState title="No costs found" text={month ? "Nothing recorded for this month with these filters." : undefined} />
            ) : (
              <ExpenseRows items={data.results} showBatch onOpen={manage ? setEditing : undefined} />
            )}
          </div>
          {data.by_category.length > 0 && (
            <aside className="glass rounded-2xl p-4 lg:sticky lg:top-6">
              <h2 className="font-semibold mb-3">By kind</h2>
              <Bars rows={data.by_category.map((c) => ({ label: c.label, value: Number(c.amount) }))} format={tzs} />
            </aside>
          )}
        </div>
      )}

      {editing && (
        <FarmSheet
          resource="expenses"
          title={editing === "new" ? "Add a cost" : "Edit cost"}
          description="A cost without a batch (e.g. rent, electricity for the whole farm) counts in the month's profit."
          fields={fields}
          initial={editing === "new" ? { ...expenseDefaults(), batch: batch && batch !== "none" ? batch : "" } : toValues(fields, editing as unknown as Values)}
          recordId={editing === "new" ? undefined : editing.id}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
