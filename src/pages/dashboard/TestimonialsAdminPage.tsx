import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, Loader2, Pencil, Plus, ShieldCheck, Star, Trash2 } from "lucide-react"
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
import { usePermissions } from "@/features/dashboard/access"
import { useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { ImageField } from "@/features/dashboard/ImageField"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import type { AdminTestimonial } from "@/features/sitecontent/types"
import { useToast } from "@/hooks/use-toast"
import { dashboardRequest, serverMessage } from "@/lib/api"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

type Draft = Omit<AdminTestimonial, "id" | "created_at" | "updated_at" | "sort_order"> & { id?: number; sort_order: string }

const EMPTY: Draft = {
  name: "",
  role: "",
  organisation: "",
  photo: "",
  headline: "",
  quote: "",
  service: "",
  result: "",
  is_featured: false,
  consent: false,
  is_published: false,
  sort_order: "0",
}

function useDone() {
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  return () => {
    invalidate("testimonials")
    queryClient.invalidateQueries({ queryKey: ["content", "testimonials"] })
  }
}

function Field({ label, hint, count, max, children }: { label: string; hint?: string; count?: number; max?: number; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        {max !== undefined && <span className={cn("text-xs tabular-nums", (count ?? 0) > max * 0.9 ? "text-amber-700" : "text-foreground/45")}>{count ?? 0}/{max}</span>}
      </span>
      {hint && <span className="block text-xs text-foreground/50 -mt-1 mb-1.5">{hint}</span>}
      {children}
    </label>
  )
}

function Editor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const { toast } = useToast()
  const done = useDone()
  const [draft, setDraft] = useState(initial)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const text = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value as never)
  const save = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      draft.id ? dashboardRequest(`/testimonials/${draft.id}/`, { method: "PATCH", body: data }) : dashboardRequest("/testimonials/", { method: "POST", body: data }),
    onSuccess: done,
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const data: Record<string, unknown> = { ...draft, sort_order: Number(draft.sort_order || 0) }
        delete data.id
        save.mutate(data, {
          onSuccess: () => {
            toast({ title: draft.is_published ? "Published ✅" : "Saved as draft" })
            onDone()
          },
          onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
        })
      }}
      className="space-y-4 pb-4"
    >
      <ImageField value={draft.photo} onChange={(url) => set("photo", url)} label="Photo of the person (optional; initials are shown without one)" />
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Name *">
          <input required maxLength={80} value={draft.name} onChange={text("name")} className={inputClass} />
        </Field>
        <Field label="Role">
          <input maxLength={80} value={draft.role} onChange={text("role")} placeholder="CEO" className={inputClass} />
        </Field>
        <Field label="Organisation">
          <input maxLength={100} value={draft.organisation} onChange={text("organisation")} className={inputClass} />
        </Field>
      </div>
      <Field label="The line that stays with the reader *" hint="Shown large. Their own words, not ours" count={draft.headline.length} max={140}>
        <input required maxLength={140} value={draft.headline} onChange={text("headline")} className={inputClass} />
      </Field>
      <Field label="What they said *" hint="As they said it. Edit only for spelling, never for meaning" count={draft.quote.length} max={700}>
        <textarea required rows={5} maxLength={700} value={draft.quote} onChange={text("quote")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="What we did for them" count={draft.service.length} max={60}>
          <input maxLength={60} value={draft.service} onChange={text("service")} placeholder="Mobile app" className={inputClass} />
        </Field>
        <Field label="A result they mention (optional)" count={draft.result.length} max={80}>
          <input maxLength={80} value={draft.result} onChange={text("result")} placeholder="Launched in six weeks" className={inputClass} />
        </Field>
      </div>

      <label className={cn("flex items-start gap-3 rounded-2xl border p-4 cursor-pointer", draft.consent ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5")}>
        <input type="checkbox" checked={draft.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" />
        <span className="text-sm">
          <b className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            The client agreed to be quoted
          </b>
          <span className="block text-foreground/65 mt-0.5">
            They said yes to their name, these words{draft.photo ? " and photo" : ""} on our website. Without this the story cannot be published.
          </span>
        </span>
      </label>

      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <label className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 h-[46px] cursor-pointer">
          <span className="text-sm font-medium">Show first</span>
          <Switch checked={draft.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
        </label>
        <Field label="Order" hint="Lower numbers show first">
          <input type="number" min={0} value={draft.sort_order} onChange={text("sort_order")} className={inputClass} />
        </Field>
      </div>

      <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-4 bg-background/95 backdrop-blur border-t border-foreground/10 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
        <label className={cn("flex items-center gap-3", draft.consent ? "cursor-pointer" : "opacity-50")}>
          <Switch checked={draft.is_published} disabled={!draft.consent} onCheckedChange={(v) => set("is_published", v)} />
          <span className="text-sm font-medium">{draft.is_published ? "Published (on the website)" : "Draft (hidden)"}</span>
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

export default function TestimonialsAdminPage() {
  const { toast } = useToast()
  const { can } = usePermissions()
  const manage = can("content.manage")
  const done = useDone()
  const { data: items = [], isLoading, isError, refetch } = useDashboardQuery<AdminTestimonial[]>(["dashboard", "testimonials"], "/testimonials/")
  const [editing, setEditing] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<AdminTestimonial | null>(null)
  const publish = useMutation({
    mutationFn: ({ id, on }: { id: number; on: boolean }) => dashboardRequest(`/testimonials/${id}/${on ? "publish" : "unpublish"}/`, { method: "POST" }),
    onSuccess: done,
  })
  const remove = useMutation({ mutationFn: (id: number) => dashboardRequest(`/testimonials/${id}/`, { method: "DELETE" }), onSuccess: done })

  return (
    <>
      <PageHeader
        title="Testimonials"
        subtitle="What clients say about working with us. Real words from real people, published only with their permission."
        action={
          manage && (
            <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              Add a story
            </button>
          )
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No stories yet" text="Ask a happy client if you may share what they said, then add it here." />
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id} className="glass rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
              {t.photo ? (
                <img src={imageUrl(t.photo, 96)} alt="" className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="h-12 w-12 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center flex-shrink-0">{t.name.slice(0, 1)}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {t.is_published ? (
                    <Pill className="bg-primary/15 text-primary border-primary/30">Live</Pill>
                  ) : (
                    <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Draft</Pill>
                  )}
                  {!t.consent && <Pill className="bg-amber-500/15 text-amber-800 border-amber-500/30">Waiting for permission</Pill>}
                  {t.is_featured && (
                    <Pill className="bg-accent/15 text-accent border-accent/30">
                      <Star className="h-3 w-3 mr-1" />
                      First
                    </Pill>
                  )}
                </div>
                <p className="font-semibold">
                  {t.name}
                  {t.organisation && <span className="font-normal text-foreground/60"> · {t.organisation}</span>}
                </p>
                <p className="text-sm text-foreground/65 line-clamp-1">“{t.headline}”</p>
              </div>
              {manage && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={publish.isPending || (!t.is_published && !t.consent)}
                    title={!t.consent ? "Needs the client's permission first" : undefined}
                    onClick={() =>
                      publish.mutate(
                        { id: t.id, on: !t.is_published },
                        {
                          onSuccess: () => toast({ title: t.is_published ? "Hidden from the website" : "Published ✅" }),
                          onError: (error) => toast({ variant: "destructive", title: "Not changed", description: serverMessage(error, "Please try again.") }),
                        },
                      )
                    }
                    className={buttonGhost}
                  >
                    {t.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {t.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" onClick={() => setEditing({ ...t, sort_order: String(t.sort_order) })} className={buttonGhost}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button type="button" onClick={() => setDeleting(t)} className={cn(buttonGhost, "hover:text-red-600")} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{editing?.id ? "Edit story" : "Add a story"}</SheetTitle>
            <SheetDescription>Their words build more trust than ours. Keep them as they said them.</SheetDescription>
          </SheetHeader>
          {editing && <Editor key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.headline}” by {deleting?.name} will be deleted. To just hide it, use Unpublish.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleting && remove.mutate(deleting.id, { onSuccess: () => toast({ title: "Deleted" }) })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
