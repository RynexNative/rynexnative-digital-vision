import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Copy, FileSpreadsheet, Loader2, Plus, Printer, UserRoundPlus } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { buttonGhost, inputClass } from "@/features/dashboard/styles"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, SearchInput } from "@/features/dashboard/ui"
import { downloadCustomers, useCustomerList } from "@/features/farm/api"
import { CopyNumbersDialog, CustomerCard } from "@/features/farm/customers"
import { FarmSheet } from "@/features/farm/FarmSheet"
import { customerDefaults, customerFields } from "@/features/farm/fields"
import { farmButton, query } from "@/features/farm/form"
import { SEGMENT_HELP, type Segment } from "@/features/farm/types"
import { FARM } from "@/features/farm/ui"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const { can } = usePermissions()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const [segment, setSegment] = useState<Segment | "">("")
  const [owes, setOwes] = useState(false)
  const [sort, setSort] = useState("name")
  const [adding, setAdding] = useState(false)
  const [copying, setCopying] = useState(false)
  const [downloading, setDownloading] = useState<"csv" | "vcf" | null>(null)
  const search = useDebouncedValue(q, 300)
  const params = useMemo(() => ({ q: search, segment, owes: owes ? "1" : "", sort }), [search, segment, owes, sort])
  const { data, isLoading, isError, refetch } = useCustomerList(params)
  const customers = data?.results ?? []
  const total = data?.segments.reduce((n, s) => n + s.count, 0) ?? 0

  const download = async (as: "csv" | "vcf") => {
    setDownloading(as)
    try {
      await downloadCustomers(as, params)
    } catch (error) {
      toast({ variant: "destructive", title: "Not downloaded", description: serverMessage(error, "Please try again.") })
    } finally {
      setDownloading(null)
    }
  }
  const chip = (on: boolean) =>
    cn("h-9 px-3 rounded-full border text-sm whitespace-nowrap transition-colors", on ? "bg-amber-500 text-white border-amber-500" : "border-foreground/15 hover:border-amber-500/50")

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Who buys, how often, and who to call. Exports and contacts use the filters you choose."
        action={
          can("cp_sales.manage") && (
            <button type="button" onClick={() => setAdding(true)} className={farmButton}>
              <Plus className="h-4 w-4" />
              Add customer
            </button>
          )
        }
      />

      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Segment">
        <button type="button" className={chip(!segment)} onClick={() => setSegment("")}>
          All · {total}
        </button>
        {data?.segments.map((s) => (
          <button key={s.key} type="button" className={chip(segment === s.key)} onClick={() => setSegment(s.key)} title={SEGMENT_HELP[s.key]}>
            {s.label} · {s.count}
          </button>
        ))}
        <button type="button" className={chip(owes)} onClick={() => setOwes(!owes)}>
          Owes money
        </button>
      </div>
      {segment && <p className="text-sm text-foreground/60 mb-3">{SEGMENT_HELP[segment]}</p>}

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, place..." />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={cn(inputClass, "h-11 py-0 text-sm sm:w-52")} aria-label="Sort">
          <option value="name">Sort: name</option>
          <option value="last">Sort: bought most recently</option>
          <option value="purchases">Sort: buys most often</option>
          <option value="bought">Sort: spent the most</option>
          <option value="owes">Sort: owes the most</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button type="button" onClick={() => download("csv")} disabled={!customers.length || downloading !== null} className={buttonGhost}>
          {downloading === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Excel (.csv)
        </button>
        <button type="button" onClick={() => download("vcf")} disabled={!customers.length || downloading !== null} className={buttonGhost} title="Open the file on your phone to add everyone to your contacts">
          {downloading === "vcf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
          Phone contacts (.vcf)
        </button>
        <button type="button" onClick={() => setCopying(true)} disabled={!customers.length} className={buttonGhost}>
          <Copy className="h-4 w-4" />
          Copy numbers
        </button>
        <button type="button" onClick={() => navigate(`${FARM}/customers/print${query(params)}`)} disabled={!customers.length} className={buttonGhost}>
          <Printer className="h-4 w-4" />
          Print list
        </button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !customers.length ? (
        <EmptyState title="No customers found" text={total ? "Try another filter." : "Add hotels, restaurants, shops and regular buyers."} />
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))}
        </ul>
      )}

      {adding && (
        <FarmSheet resource="customers" title="Add customer" fields={customerFields} initial={customerDefaults()} onClose={() => setAdding(false)} />
      )}
      {copying && <CopyNumbersDialog customers={customers} onClose={() => setCopying(false)} />}
    </div>
  )
}
