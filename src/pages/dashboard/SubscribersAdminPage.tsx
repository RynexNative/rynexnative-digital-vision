import { useState } from "react"
import { Copy, Download, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeleteSubscriber, useSubscribersAdmin } from "@/features/dashboard/api"
import { formatWhen, type DashboardSubscriber } from "@/features/dashboard/types"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost } from "@/features/dashboard/styles"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { errorMessage } from "@/lib/api"

function downloadCsv(rows: DashboardSubscriber[]) {
  const lines = ["email,subscribed_at", ...rows.map((r) => `${r.email},${r.created_at}`)]
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement("a"), { href: url, download: `subscribers-${new Date().toISOString().slice(0, 10)}.csv` })
  link.click()
  URL.revokeObjectURL(url)
}

export default function SubscribersAdminPage() {
  const { toast } = useToast()
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const { data = [], isLoading, isError, refetch } = useSubscribersAdmin(search)
  const remove = useDeleteSubscriber()
  const [deleting, setDeleting] = useState<DashboardSubscriber | null>(null)

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(data.map((s) => s.email).join(", "))
      toast({ title: `${data.length} emails copied` })
    } catch {
      toast({ variant: "destructive", title: "Could not copy" })
    }
  }

  return (
    <>
      <PageHeader
        title="Subscribers"
        subtitle="People who signed up for the newsletter."
        action={
          data.length > 0 && (
            <div className="flex gap-2">
              <button type="button" onClick={copyAll} className={buttonGhost}>
                <Copy className="h-4 w-4" />
                Copy all emails
              </button>
              <button type="button" onClick={() => downloadCsv(data)} className={buttonGhost}>
                <Download className="h-4 w-4" />
                CSV
              </button>
            </div>
          )
        }
      />
      <div className="mb-5">
        <SearchInput value={q} onChange={setQ} placeholder="Search email..." />
      </div>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title={search ? "No matching email" : "No subscribers yet"} />
      ) : (
        <>
          <p className="text-sm text-foreground/60 mb-3">{data.length} subscribers</p>
          <ul className="glass rounded-2xl divide-y divide-foreground/10">
            {data.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.email}</p>
                  <p className="text-xs text-foreground/50">{formatWhen(s.created_at)}</p>
                </div>
                <button type="button" onClick={() => setDeleting(s)} className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-foreground/50 hover:text-red-500 hover:bg-red-500/10" aria-label={`Remove ${s.email}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscriber?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.email} will no longer receive your updates.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast({ title: "Removed" }),
                  onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: errorMessage(error, "Please try again.") }),
                })
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
