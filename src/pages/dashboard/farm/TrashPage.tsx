import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { buttonGhost } from "@/features/dashboard/styles"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { useRestore, useTrash } from "@/features/farm/api"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"

const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

/** Nothing deleted at Chicken Point is lost: it waits here, with who deleted it and why. */
export default function TrashPage() {
  const { toast } = useToast()
  const { data = [], isLoading, isError, refetch } = useTrash()
  const restore = useRestore()
  const [kind, setKind] = useState("")
  const kinds = [...new Map(data.map((i) => [i.kind, i.kind_label])).entries()]
  const items = kind ? data.filter((i) => i.kind === kind) : data
  return (
    <div>
      <PageHeader title="Deleted items" subtitle="Deleted records are kept here with who deleted them and why, and can be brought back." />
      {kinds.length > 1 && (
        <div className="mb-5">
          <FilterTabs value={kind} onChange={setKind} options={[{ id: "", label: "All" }, ...kinds.map(([id, label]) => ({ id, label }))]} />
        </div>
      )}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items.length ? (
        <EmptyState title="Nothing deleted" />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="glass rounded-xl p-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium flex flex-wrap items-center gap-2">
                  <Pill className="bg-foreground/5 text-foreground/70 border-foreground/15">{item.kind_label}</Pill>
                  {item.label}
                </p>
                <p className="text-xs text-foreground/55 mt-1">
                  Deleted {when.format(new Date(item.deleted_at))}
                  {item.deleted_by && ` by ${item.deleted_by.name}`}
                  {item.reason && ` · “${item.reason}”`}
                </p>
              </div>
              {item.can_restore && (
                <button
                  type="button"
                  disabled={restore.isPending}
                  onClick={() =>
                    restore.mutate(
                      { kind: item.kind, id: item.id },
                      {
                        onSuccess: () => toast({ title: "Restored ✅", description: item.label }),
                        onError: (error) => toast({ variant: "destructive", title: "Not restored", description: serverMessage(error, "Please try again.") }),
                      },
                    )
                  }
                  className={buttonGhost}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
