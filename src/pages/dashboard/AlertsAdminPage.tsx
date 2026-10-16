import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { SeverityBadge } from "@/features/alerts/components"
import { SEVERITY_META, formatAlertDate, slugify, type AlertSeverity } from "@/features/alerts/types"
import {
  useAlertsAdmin,
  useDeleteAlert,
  useSaveAlert,
  useSetAlertPublished,
  type AlertInput,
} from "@/features/dashboard/api"
import type { DashboardAlert } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { useToast } from "@/hooks/use-toast"
import { errorMessage, validationMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Filter = "all" | "published" | "draft"

type Draft = {
  id?: string
  title: string
  slug: string
  summary: string
  description: string
  category: string
  severity: AlertSeverity
  signs: string
  prevention: string
  if_affected: string
  is_published: boolean
}

const EMPTY_DRAFT: Draft = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  category: "",
  severity: "medium",
  signs: "",
  prevention: "",
  if_affected: "",
  is_published: false,
}

const toLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean)

function toDraft(alert: DashboardAlert): Draft {
  return {
    ...alert,
    signs: alert.signs.join("\n"),
    prevention: alert.prevention.join("\n"),
    if_affected: alert.if_affected.join("\n"),
  }
}

function toInput(draft: Draft): AlertInput {
  return {
    title: draft.title.trim(),
    slug: draft.slug || slugify(draft.title),
    summary: draft.summary.trim(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    severity: draft.severity,
    signs: toLines(draft.signs),
    prevention: toLines(draft.prevention),
    if_affected: toLines(draft.if_affected),
    is_published: draft.is_published,
  }
}

function AlertEditor({ initial, categories, onDone }: { initial: Draft; categories: string[]; onDone: () => void }) {
  const { toast } = useToast()
  const save = useSaveAlert()
  const [draft, setDraft] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    save.mutate(
      { id: draft.id, data: toInput(draft) },
      {
        onSuccess: () => {
          toast({ title: draft.is_published ? "Alert published ✅" : "Draft saved" })
          onDone()
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: "Could not save",
            description: validationMessage(error) ?? errorMessage(error, "Please try again."),
          }),
      },
    )
  }

  const listField = (key: "signs" | "prevention" | "if_affected", label: string, hint: string) => (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <span className="block text-xs text-foreground/50 mb-1.5">{hint} · one per line</span>
      <textarea rows={4} value={draft[key]} onChange={(e) => set(key, e.target.value)} className={cn(inputClass, "text-sm resize-y")} />
      <span className="block text-xs text-foreground/40 mt-1">{toLines(draft[key]).length} items</span>
    </label>
  )

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Title *</span>
        <input
          required
          minLength={3}
          maxLength={200}
          value={draft.title}
          placeholder="E.g. The &quot;Send it to this number&quot; SMS"
          onChange={(e) => {
            set("title", e.target.value)
            if (!slugTouched) set("slug", slugify(e.target.value))
          }}
          className={inputClass}
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Risk level *</span>
          <select value={draft.severity} onChange={(e) => set("severity", e.target.value as AlertSeverity)} className={inputClass}>
            {(Object.keys(SEVERITY_META) as AlertSeverity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_META[s].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Category *</span>
          <input
            required
            list="alert-categories"
            maxLength={60}
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Mobile Money"
            className={inputClass}
          />
          <datalist id="alert-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Summary *</span>
        <span className="block text-xs text-foreground/50 mb-1.5">Shown on cards and in WhatsApp shares</span>
        <textarea
          required
          minLength={10}
          maxLength={500}
          rows={3}
          value={draft.summary}
          onChange={(e) => set("summary", e.target.value)}
          className={cn(inputClass, "resize-y")}
        />
        <span className={cn("block text-xs mt-1 text-right", draft.summary.length > 450 ? "text-amber-500" : "text-foreground/40")}>
          {draft.summary.length}/500
        </span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">How the scam works</span>
        <span className="block text-xs text-foreground/50 mb-1.5">Leave a blank line between paragraphs</span>
        <textarea rows={6} value={draft.description} onChange={(e) => set("description", e.target.value)} className={cn(inputClass, "resize-y")} />
      </label>

      {listField("signs", "Warning signs", "What helps the reader recognise the scam")}
      {listField("prevention", "How to protect yourself", "Steps to take beforehand")}
      {listField("if_affected", "If you are affected", "Steps in order")}

      <details className="rounded-xl border border-foreground/10 px-4 py-3">
        <summary className="text-sm font-medium cursor-pointer">Link settings</summary>
        <label className="block mt-3">
          <span className="block text-xs text-foreground/60 mb-1.5">rynexnative.com/#/alerts/</span>
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set("slug", slugify(e.target.value))
            }}
            className={cn(inputClass, "font-mono text-sm")}
          />
        </label>
      </details>

      <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-4 bg-background/95 backdrop-blur border-t border-foreground/10 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <Switch checked={draft.is_published} onCheckedChange={(v) => set("is_published", v)} />
          <span className="text-sm font-medium">{draft.is_published ? "Published (visible to everyone)" : "Draft (hidden)"}</span>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onDone} className="h-11 px-4 rounded-xl glass font-medium">
            Cancel
          </button>
          <button type="submit" disabled={save.isPending} className={buttonPrimary}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {draft.is_published ? "Publish" : "Save draft"}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function AlertsAdminPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: alerts = [], isLoading, isError, refetch } = useAlertsAdmin()
  const setPublished = useSetAlertPublished()
  const remove = useDeleteAlert()
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const [editing, setEditing] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<DashboardAlert | null>(null)

  // /admin/alerts?new=1 opens the editor straight away (from the overview button)
  useEffect(() => {
    if (searchParams.get("new")) {
      setEditing(EMPTY_DRAFT)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const categories = useMemo(() => Array.from(new Set(alerts.map((a) => a.category))).sort(), [alerts])
  const visible = alerts.filter(
    (a) =>
      (filter === "all" || (filter === "published") === a.is_published) &&
      (!q.trim() || `${a.title} ${a.category}`.toLowerCase().includes(q.trim().toLowerCase())),
  )
  const drafts = alerts.filter((a) => !a.is_published).length

  const togglePublished = (alert: DashboardAlert) =>
    setPublished.mutate(
      { id: alert.id, published: !alert.is_published },
      {
        onSuccess: () => toast({ title: alert.is_published ? "Unpublished" : "Published ✅" }),
        onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: errorMessage(error, "Please try again.") }),
      },
    )

  return (
    <>
      <PageHeader
        title="Security alerts"
        subtitle="Write and publish online safety alerts."
        action={
          <button type="button" onClick={() => setEditing(EMPTY_DRAFT)} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            New alert
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: `All (${alerts.length})` },
            { id: "published", label: `Live (${alerts.length - drafts})` },
            { id: "draft", label: `Drafts (${drafts})` },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search alerts..." />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={alerts.length ? "Nothing matches" : "No alerts yet"}
          action={
            !alerts.length && (
              <button type="button" onClick={() => setEditing(EMPTY_DRAFT)} className={buttonPrimary}>
                <Plus className="h-4 w-4" />
                Write the first one
              </button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((alert) => (
            <li key={alert.id} className="glass rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
              <button type="button" onClick={() => setEditing(toDraft(alert))} className="flex-1 min-w-0 text-left group">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <SeverityBadge severity={alert.severity} />
                  {alert.is_published ? (
                    <Pill className="bg-primary/15 text-primary border-primary/30">Live</Pill>
                  ) : (
                    <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Draft</Pill>
                  )}
                  <span className="text-xs text-foreground/50">{alert.category}</span>
                </div>
                <p className="font-semibold group-hover:text-primary transition-colors">{alert.title}</p>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {alert.is_published ? `Published ${formatAlertDate(alert.published_at)}` : `Edited ${formatAlertDate(alert.updated_at)}`}
                </p>
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => togglePublished(alert)}
                  disabled={setPublished.isPending}
                  className={buttonGhost}
                  title={alert.is_published ? "Unpublish" : "Publish"}
                >
                  {alert.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {alert.is_published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" onClick={() => setEditing(toDraft(alert))} className={buttonGhost}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {alert.is_published && (
                  <Link to={`/alerts/${alert.slug}`} target="_blank" className={buttonGhost} aria-label="View on website">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <button type="button" onClick={() => setDeleting(alert)} className={cn(buttonGhost, "hover:text-red-500")} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{editing?.id ? "Edit alert" : "New alert"}</SheetTitle>
            <SheetDescription>Write in simple, clear language. Most readers are on a phone.</SheetDescription>
          </SheetHeader>
          {editing && (
            <AlertEditor key={editing.id ?? "new"} initial={editing} categories={categories} onDone={() => setEditing(null)} />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this alert?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" will be deleted permanently and its shared links will stop working. To just hide it,
              use "Unpublish" instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast({ title: "Alert deleted" }),
                  onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: errorMessage(error, "Please try again.") }),
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
