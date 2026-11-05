import { useState } from "react"
import { Archive, Loader2, ShieldAlert, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { usePurgeBatch, usePurgePreview } from "./api"
import { tzs } from "./types"

const field = "w-full px-3 py-2.5 rounded-xl bg-card/60 border border-foreground/15 text-sm"

/**
 * Owners only. Shows everything the batch would take with it, then asks: Deleted items
 * (can be restored) or forever (needs the password). A reason and the batch number are required.
 */
export function PurgeBatchDialog({ batchId, foreverOnly, onClose, onDone }: { batchId: number; foreverOnly?: boolean; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast()
  const { data, isLoading, isError } = usePurgePreview(batchId)
  const purge = usePurgeBatch()
  const [mode, setMode] = useState<"trash" | "permanent">(foreverOnly ? "permanent" : "trash")
  const [reason, setReason] = useState("")
  const [confirm, setConfirm] = useState("")
  const [password, setPassword] = useState("")
  const code = data?.batch.code ?? ""
  const ready = reason.trim().length >= 5 && confirm.trim().toUpperCase() === code.toUpperCase() && (mode === "trash" || password.length > 0)
  const total = data?.counts.reduce((n, c) => n + c.count, 0) ?? 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    purge.mutate(
      { id: batchId, data: { mode, reason: reason.trim(), confirm: confirm.trim(), ...(mode === "permanent" ? { password } : {}) } },
      {
        onSuccess: (result) => {
          toast({ title: mode === "trash" ? "Moved to Deleted items" : "Deleted forever", description: result.detail })
          onDone()
        },
        onError: (error) => toast({ variant: "destructive", title: "Not deleted", description: serverMessage(error, "Please try again.") }),
      },
    )
  }

  const option = (value: "trash" | "permanent", icon: React.ReactNode, title: string, text: string) => (
    <label
      className={cn(
        "flex gap-3 rounded-xl border p-3 cursor-pointer",
        mode === value ? (value === "permanent" ? "border-red-600 bg-red-500/10" : "border-amber-500 bg-amber-500/10") : "border-foreground/15",
      )}
    >
      <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1" />
      <span>
        <span className="font-semibold flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <span className="block text-xs text-foreground/65 mt-0.5">{text}</span>
      </span>
    </label>
  )

  return (
    <Dialog open onOpenChange={(o) => !o && !purge.isPending && onClose()}>
      <DialogContent className="max-w-lg max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
            Delete batch {code} and everything on it?
          </DialogTitle>
          <DialogDescription>Only owners can do this. Read what will go before you continue.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-red-600">Could not load what this batch holds. Try again.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm space-y-1">
              <p className="font-semibold">
                {code}: {data.batch.chicks_count} chicks{total ? `, with ${total} records:` : ", with no other records"}
              </p>
              <ul className="grid grid-cols-2 gap-x-4 text-foreground/75">
                {data.counts
                  .filter((c) => c.count)
                  .map((c) => (
                    <li key={c.key}>
                      {c.count} {c.label}
                    </li>
                  ))}
              </ul>
              <p className="text-foreground/75 pt-1">
                Costs {tzs(data.money.costs)} · sales {tzs(data.money.sales)} · money received {tzs(data.money.received)}
              </p>
              <p className="text-xs text-foreground/60">
                These figures leave the reports and customer balances.
                {data.planned_orders > 0 && ` ${data.planned_orders} order(s) still to deliver are kept, without this batch.`}
                {data.already_deleted > 0 && ` ${data.already_deleted} record(s) were already in Deleted items.`}
              </p>
            </div>

            {!foreverOnly &&
              option(
                "trash",
                <Archive className="h-4 w-4 text-amber-600" />,
                "Move to Deleted items",
                "Everything disappears from the lists and figures, but is kept. Restoring the batch brings it all back.",
              )}
            {option(
              "permanent",
              <Trash2 className="h-4 w-4 text-red-600" />,
              "Delete forever",
              "Erased from the database. It cannot be undone. Only a summary stays in the activity log.",
            )}

            <label className="block">
              <span className="block text-sm font-medium mb-1.5">Why? *</span>
              <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Practice data entered while testing" className={field} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">
                Type <span className="font-mono font-bold">{code}</span> to confirm *
              </span>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className={cn(field, "font-mono")} />
            </label>
            {mode === "permanent" && (
              <label className="block">
                <span className="block text-sm font-medium mb-1.5">Your password *</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={field} />
              </label>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} disabled={purge.isPending} className="h-11 px-4 rounded-xl glass font-medium">
                Keep the batch
              </button>
              <button
                type="submit"
                disabled={!ready || purge.isPending}
                className="h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-50"
              >
                {purge.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "trash" ? "Move to Deleted items" : "Delete forever"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
