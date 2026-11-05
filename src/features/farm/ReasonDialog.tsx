import { useState, type ReactNode } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/**
 * "Are you sure?" with a required reason. Used before anything is deleted, a payment removed
 * or an order cancelled: the reason is kept with the record and in the activity log.
 */
export function ReasonDialog({
  title,
  description,
  details,
  confirmLabel,
  keepLabel = "Cancel",
  placeholder = "e.g. Entered twice by mistake",
  pending,
  onConfirm,
  onClose,
}: {
  title: string
  description: ReactNode
  details?: ReactNode
  confirmLabel: string
  keepLabel?: string
  placeholder?: string
  pending?: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const ready = reason.trim().length >= 5
  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (ready) onConfirm(reason.trim())
          }}
          className="space-y-4"
        >
          {details && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm">{details}</div>}
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Why? *</span>
            <textarea
              required
              rows={3}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 rounded-xl bg-card/60 border border-foreground/15 text-sm resize-y"
            />
            <span className="block text-xs text-foreground/50 mt-1">Kept with the record and in the activity log, with your name and the time.</span>
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} disabled={pending} className="h-11 px-4 rounded-xl glass font-medium">
              {keepLabel}
            </button>
            <button
              type="submit"
              disabled={!ready || pending}
              className="h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
