import { useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus } from "lucide-react"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { SearchInput } from "@/features/dashboard/ui"
import { buttonPrimary } from "@/features/dashboard/styles"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { useOpsList, type OpsResource } from "./api"
import { RecordSheet } from "./RecordSheet"
import { toFormValues, type Field, type Values } from "./form-values"
import { dueLabel } from "./types"

export type Tab = { id: string; label: string; params: Record<string, string> }

/** The list + search + filter tabs + editor that every operations page shares. */
export function OpsListPage<T extends { id: string }>({
  resource,
  title,
  subtitle,
  addLabel,
  tabs,
  fields,
  defaults,
  card,
  recordTitle,
  emptyText,
  deleteText,
  onOpen,
  headerExtra,
}: {
  resource: OpsResource
  title: string
  subtitle: string
  addLabel: string
  tabs: Tab[]
  fields: Field[]
  defaults: Values
  card: (record: T) => ReactNode
  recordTitle: (record: T | null) => string
  emptyText: string
  deleteText?: string
  /** Open something other than the editor when a card is clicked */
  onOpen?: (record: T) => void
  headerExtra?: ReactNode
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get("tab") ?? tabs[0].id)
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const active = tabs.find((t) => t.id === tab) ?? tabs[0]
  const { data = [], isLoading, isError, refetch } = useOpsList<T>(resource, { ...active.params, q: search })
  const [editing, setEditing] = useState<{ record: T | null } | null>(null)

  // ?new=1 opens an empty form straight away (links from the Operations page)
  useEffect(() => {
    if (searchParams.get("new")) {
      setEditing({ record: null })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex gap-2">
            {headerExtra}
            <button type="button" onClick={() => setEditing({ record: null })} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              {addLabel}
            </button>
          </div>
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs value={tab} onChange={setTab} options={tabs.map((t) => ({ id: t.id, label: t.label }))} />
        <SearchInput value={q} onChange={setQ} placeholder="Search..." />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          title={search ? "Nothing matches" : emptyText}
          action={
            !search && (
              <button type="button" onClick={() => setEditing({ record: null })} className={buttonPrimary}>
                <Plus className="h-4 w-4" />
                {addLabel}
              </button>
            )
          }
        />
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {data.map((record) => (
            <li key={record.id}>
              <button
                type="button"
                onClick={() => (onOpen ? onOpen(record) : setEditing({ record }))}
                className="w-full h-full text-left glass rounded-2xl p-5 hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {card(record)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <RecordSheet
          key={editing.record?.id ?? "new"}
          resource={resource}
          open
          onClose={() => setEditing(null)}
          title={recordTitle(editing.record)}
          fields={fields}
          initial={toFormValues(fields, editing.record as Values | null, defaults)}
          recordId={editing.record?.id}
          deleteText={deleteText}
        />
      )}
    </>
  )
}

/** Small building blocks for the record cards */
export function CardHead({ title, pill, sub }: { title: string; pill?: { label: string; className: string }; sub?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="min-w-0">
        <p className="font-semibold leading-tight truncate">{title}</p>
        {sub && <p className="text-xs text-foreground/55 mt-0.5 truncate">{sub}</p>}
      </div>
      {pill && <Pill className={pill.className}>{pill.label}</Pill>}
    </div>
  )
}

export function Due({ label, date, days, soon }: { label: string; date: string; days: number | null; soon?: number }) {
  const due = dueLabel(days, soon)
  return (
    <p className="text-sm">
      <span className="text-foreground/55">{label}: </span>
      <span className="font-medium">{date}</span>
      {due && <span className={cn("ml-1.5 font-semibold", due.className)}>({due.text})</span>}
    </p>
  )
}
