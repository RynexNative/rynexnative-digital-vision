import { useState } from "react"
import { BellRing, CheckCircle2, Plus } from "lucide-react"
import { usePermissions } from "@/features/dashboard/access"
import { buttonGhost } from "@/features/dashboard/styles"
import { EmptyState, ErrorState, ListSkeleton, Pill } from "@/features/dashboard/ui"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useCustomerNotes, useSaveFarm } from "./api"
import { FarmSheet } from "./FarmSheet"
import { farmButton, toValues, type Values } from "./form"
import { noteDefaults, noteFields } from "./fields"
import { NOTE_KINDS, shortDate, today, type CustomerNote } from "./types"

/** Calls, visits and messages with one customer, and when to get back to them. */
export function NoteList({ customer }: { customer: number }) {
  const { can } = usePermissions()
  const { toast } = useToast()
  const { data, isLoading, isError, refetch } = useCustomerNotes({ customer: String(customer) })
  const save = useSaveFarm<CustomerNote>("customer-notes")
  const [editing, setEditing] = useState<CustomerNote | "new" | null>(null)
  const manage = can("cp_sales.manage")
  return (
    <section>
      {manage && (
        <div className="flex justify-end mb-3">
          <button type="button" onClick={() => setEditing("new")} className={farmButton}>
            <Plus className="h-4 w-4" />
            Log a call, visit or message
          </button>
        </div>
      )}
      {isLoading ? (
        <ListSkeleton rows={2} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState title="Nothing logged yet" text="Write down what you agree on each call or visit, and set a day to get back to them." />
      ) : (
        <ul className="space-y-2">
          {data.map((n) => {
            const due = n.follow_up_on && !n.follow_up_done && n.follow_up_on <= today()
            return (
              <li key={n.id} className={cn("glass rounded-xl p-3", due && "border-amber-500/50")}>
                <div className="flex flex-wrap items-start gap-2">
                  <button type="button" disabled={!manage} onClick={() => setEditing(n)} className="min-w-0 flex-1 text-left enabled:hover:text-amber-700">
                    <p className="text-sm">
                      <Pill className="bg-foreground/5 text-foreground/70 border-foreground/15 mr-2">{NOTE_KINDS[n.kind]}</Pill>
                      <span className="whitespace-pre-line">{n.text}</span>
                    </p>
                    <p className="text-xs text-foreground/50 mt-1">
                      {shortDate(n.date)}
                      {n.created_by && ` · ${n.created_by.name}`}
                    </p>
                  </button>
                  {n.follow_up_on && (
                    <div className="text-right">
                      {n.follow_up_done ? (
                        <p className="text-xs text-emerald-600 font-semibold">Followed up ✓</p>
                      ) : (
                        <>
                          <p className={cn("text-xs font-semibold inline-flex items-center gap-1", due ? "text-amber-700" : "text-foreground/60")}>
                            <BellRing className="h-3.5 w-3.5" />
                            {due ? "Follow up now" : `Follow up ${shortDate(n.follow_up_on)}`}
                          </p>
                          {manage && (
                            <button
                              type="button"
                              className={cn(buttonGhost, "mt-1")}
                              onClick={() =>
                                save.mutate(
                                  { id: n.id, data: { follow_up_done: true } },
                                  {
                                    onSuccess: () => toast({ title: "Marked as done" }),
                                    onError: (error) => toast({ variant: "destructive", title: serverMessage(error, "Not changed") }),
                                  },
                                )
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Done
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <FarmSheet
          resource="customer-notes"
          title={editing === "new" ? "Log a call, visit or message" : "Edit note"}
          fields={noteFields}
          initial={editing === "new" ? noteDefaults() : toValues(noteFields, editing as unknown as Values)}
          recordId={editing === "new" ? undefined : editing.id}
          extra={{ customer }}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
