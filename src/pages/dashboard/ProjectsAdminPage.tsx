import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Eye, EyeOff, Globe, Loader2, Lock, Pencil, Plus, Star, Trash2 } from "lucide-react"
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
import { useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { ImageField } from "@/features/dashboard/ImageField"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUS,
  type Project,
  type ProjectCategory,
  type ProjectStatus,
  type ProjectVisibility,
} from "@/features/projects/types"
import { useToast } from "@/hooks/use-toast"
import { dashboardRequest, serverMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type AdminProject = Project & { id: string; sort_order: number; is_published: boolean }

type Draft = Omit<AdminProject, "id" | "published_at" | "year" | "sort_order" | "gallery" | "results" | "tech" | "highlights"> & {
  id?: string
  year: string
  sort_order: string
  gallery: string
  results: string
  tech: string
  highlights: { value: string; label: string }[]
}

const EMPTY: Draft = {
  slug: "",
  title: "",
  visibility: "confidential",
  category: "system",
  status: "live",
  sector: "",
  location: "",
  year: String(new Date().getFullYear()),
  client_name: "",
  client_description: "",
  link: "",
  gallery: "",
  summary: "",
  challenge: "",
  solution: "",
  results: "",
  highlights: [],
  tech: "",
  testimonial: "",
  testimonial_author: "",
  cover_image: "",
  is_featured: false,
  sort_order: "1",
  is_published: false,
}

const toLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean)

function toDraft(p: AdminProject): Draft {
  return {
    ...p,
    year: p.year ? String(p.year) : "",
    sort_order: String(p.sort_order),
    gallery: p.gallery.join("\n"),
    results: p.results.join("\n"),
    tech: p.tech.join("\n"),
  }
}

function useProjectsAdmin() {
  return useDashboardQuery<AdminProject[]>(["dashboard", "projects"], "/projects/")
}

/** After a change: the dashboard list and the public project pages */
function useProjectsDone() {
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  return () => {
    invalidate("projects")
    queryClient.invalidateQueries({ queryKey: ["projects"] })
  }
}

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={cn("block", wide && "sm:col-span-2")}>
      <span className={cn("block text-sm font-medium", hint ? "mb-1" : "mb-1.5")}>{label}</span>
      {hint && <span className="block text-xs text-foreground/50 mb-1.5">{hint}</span>}
      {children}
    </label>
  )
}

const VISIBILITY: Record<ProjectVisibility, { icon: React.ReactNode; title: string; text: string }> = {
  confidential: {
    icon: <Lock className="h-5 w-5" />,
    title: "Confidential",
    text: "The client is not named. No link, no screenshots. Describe the type of client, the problem and the result.",
  },
  public: {
    icon: <Globe className="h-5 w-5" />,
    title: "Public",
    text: "Only when the client has agreed in writing: their name, live link and screenshots are shown.",
  },
}

function ProjectEditor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const { toast } = useToast()
  const done = useProjectsDone()
  const [draft, setDraft] = useState(initial)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const text = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(key, e.target.value as never)
  const isPublic = draft.visibility === "public"
  const highlights = [...draft.highlights, { value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }].slice(0, 3)

  const save = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      draft.id
        ? dashboardRequest<AdminProject>(`/projects/${draft.id}/`, { method: "PATCH", body: data })
        : dashboardRequest<AdminProject>("/projects/", { method: "POST", body: data }),
    onSuccess: done,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Record<string, unknown> = {
      ...draft,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      year: draft.year ? Number(draft.year) : null,
      sort_order: Number(draft.sort_order || 0),
      gallery: isPublic ? toLines(draft.gallery) : [],
      results: toLines(draft.results),
      tech: toLines(draft.tech),
      highlights: draft.highlights.filter((h) => h.value.trim() && h.label.trim()),
      client_name: isPublic ? draft.client_name.trim() : "",
      link: isPublic ? draft.link.trim() : "",
    }
    delete data.id
    save.mutate(data, {
      onSuccess: () => {
        toast({ title: draft.is_published ? "Project published ✅" : "Draft saved" })
        onDone()
      },
      onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <fieldset>
        <legend className="text-sm font-medium mb-2">Can we name this client?</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(VISIBILITY) as ProjectVisibility[]).map((v) => (
            <label
              key={v}
              className={cn(
                "rounded-2xl border p-4 cursor-pointer transition-colors",
                draft.visibility === v ? "border-primary bg-primary/5" : "border-foreground/15 hover:border-primary/40",
              )}
            >
              <input type="radio" name="visibility" value={v} checked={draft.visibility === v} onChange={() => set("visibility", v)} className="sr-only" />
              <span className="flex items-center gap-2 font-semibold mb-1">
                <span className="text-primary">{VISIBILITY[v].icon}</span>
                {VISIBILITY[v].title}
              </span>
              <span className="block text-xs text-foreground/60 leading-relaxed">{VISIBILITY[v].text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Project title *" wide>
          <input required minLength={3} maxLength={140} value={draft.title} onChange={text("title")} placeholder="E.g. Loan Management System" className={inputClass} />
        </Field>
        {isPublic ? (
          <>
            <Field label="Client name" hint="As the client wants to be named">
              <input maxLength={140} value={draft.client_name} onChange={text("client_name")} className={inputClass} />
            </Field>
            <Field label="Live link" hint="Optional">
              <input type="url" maxLength={300} value={draft.link} onChange={text("link")} placeholder="https://" className={inputClass} />
            </Field>
          </>
        ) : (
          <Field label="Describe the client without naming them *" hint="Type, size or place, never a detail that points to one organisation" wide>
            <input
              required
              maxLength={140}
              value={draft.client_description}
              onChange={text("client_description")}
              placeholder="E.g. A microfinance institution in Dar es Salaam"
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Service">
          <select value={draft.category} onChange={(e) => set("category", e.target.value as ProjectCategory)} className={inputClass}>
            {(Object.keys(PROJECT_CATEGORIES) as ProjectCategory[]).map((c) => (
              <option key={c} value={c}>
                {PROJECT_CATEGORIES[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => set("status", e.target.value as ProjectStatus)} className={inputClass}>
            {(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sector">
          <input maxLength={80} value={draft.sector} onChange={text("sector")} placeholder="Education, Finance, Health..." className={inputClass} />
        </Field>
        <Field label="Location">
          <input maxLength={80} value={draft.location} onChange={text("location")} placeholder="Dodoma, Tanzania" className={inputClass} />
        </Field>
        <Field label="Year">
          <input type="number" min={2000} max={2100} value={draft.year} onChange={text("year")} className={inputClass} />
        </Field>
        <Field label="Order" hint="Lower numbers show first">
          <input type="number" min={0} value={draft.sort_order} onChange={text("sort_order")} className={inputClass} />
        </Field>
      </div>

      <Field label="Summary for the card *" hint="One or two sentences: what it does for the client">
        <textarea required rows={2} maxLength={240} value={draft.summary} onChange={text("summary")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>

      <fieldset className="rounded-2xl border border-foreground/10 p-4">
        <legend className="px-1 text-sm font-semibold">Results in numbers (optional, up to 3)</legend>
        <p className="text-xs text-foreground/55 mb-3">Only numbers you can stand behind, e.g. “1,200 · students managed”, “3 days → 10 min · to prepare results”.</p>
        <div className="space-y-2">
          {highlights.map((h, i) => (
            <div key={i} className="grid grid-cols-[110px_1fr] gap-2">
              <input
                value={h.value}
                maxLength={20}
                placeholder="1,200"
                aria-label={`Number ${i + 1}`}
                onChange={(e) => {
                  const next = highlights.map((x, j) => (j === i ? { ...x, value: e.target.value } : x))
                  set("highlights", next)
                }}
                className={inputClass}
              />
              <input
                value={h.label}
                maxLength={60}
                placeholder="students managed"
                aria-label={`What number ${i + 1} means`}
                onChange={(e) => {
                  const next = highlights.map((x, j) => (j === i ? { ...x, label: e.target.value } : x))
                  set("highlights", next)
                }}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <Field label="The challenge" hint="What the client struggled with before">
        <textarea rows={3} value={draft.challenge} onChange={text("challenge")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>
      <Field label="What we built">
        <textarea rows={4} value={draft.solution} onChange={text("solution")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>
      <Field label="The result" hint="One outcome per line">
        <textarea rows={3} value={draft.results} onChange={text("results")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>
      <Field label="Technology" hint="One per line">
        <textarea rows={3} value={draft.tech} onChange={text("tech")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>

      <div className="grid sm:grid-cols-[1fr_220px] gap-4">
        <Field label="What the client said (optional)">
          <textarea rows={2} value={draft.testimonial} onChange={text("testimonial")} className={cn(inputClass, "text-sm resize-y")} />
        </Field>
        <Field label="Said by" hint={isPublic ? "Name and role" : "Role only, e.g. Operations Manager"}>
          <input maxLength={120} value={draft.testimonial_author} onChange={text("testimonial_author")} className={inputClass} />
        </Field>
      </div>

      {isPublic ? (
        <>
          <ImageField value={draft.cover_image} onChange={(url) => set("cover_image", url)} label="Main screenshot" />
          <Field label="More screenshots" hint="Image links, one per line (upload with the field above, then paste here)">
            <textarea rows={3} value={draft.gallery} onChange={text("gallery")} className={cn(inputClass, "text-sm resize-y font-mono")} />
          </Field>
        </>
      ) : (
        <p className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-900">
          No screenshots for confidential work: even a blurred screen can show a logo or a name. The website shows a neutral card instead.
        </p>
      )}

      <label className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 h-[46px] cursor-pointer">
        <span className="text-sm font-medium">Show large at the top</span>
        <Switch checked={draft.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
      </label>

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

export default function ProjectsAdminPage() {
  const { toast } = useToast()
  const done = useProjectsDone()
  const { data: projects = [], isLoading, isError, refetch } = useProjectsAdmin()
  const [editing, setEditing] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<AdminProject | null>(null)
  const setPublished = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      dashboardRequest<AdminProject>(`/projects/${id}/${published ? "publish" : "unpublish"}/`, { method: "POST" }),
    onSuccess: done,
  })
  const remove = useMutation({ mutationFn: (id: string) => dashboardRequest<void>(`/projects/${id}/`, { method: "DELETE" }), onSuccess: done })

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Our work on the website. Name a client only with their written permission; tell the rest as confidential work."
        action={
          <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            New project
          </button>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          text="Add the work you can show, and the confidential work described without the client's name."
          action={
            <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              Add the first project
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className="glass rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
              <button type="button" onClick={() => setEditing(toDraft(p))} className="flex-1 min-w-0 text-left group">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {p.is_published ? (
                    <Pill className="bg-primary/15 text-primary border-primary/30">Live</Pill>
                  ) : (
                    <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Draft</Pill>
                  )}
                  {p.visibility === "public" ? (
                    <Pill className="bg-sky-500/15 text-sky-700 border-sky-500/30">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Pill>
                  ) : (
                    <Pill className="bg-foreground/10 text-foreground/70 border-foreground/15">
                      <Lock className="h-3 w-3 mr-1" />
                      Confidential
                    </Pill>
                  )}
                  {p.is_featured && (
                    <Pill className="bg-accent/15 text-accent border-accent/30">
                      <Star className="h-3 w-3 mr-1" />
                      Top
                    </Pill>
                  )}
                </div>
                <p className="font-semibold group-hover:text-primary transition-colors">{p.title}</p>
                <p className="text-xs text-foreground/55 mt-0.5">
                  {PROJECT_CATEGORIES[p.category]} · {p.visibility === "public" ? p.client_name || p.sector || "—" : p.client_description}
                </p>
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPublished.mutate(
                      { id: p.id, published: !p.is_published },
                      {
                        onSuccess: () => toast({ title: p.is_published ? "Unpublished" : "Published ✅" }),
                        onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: serverMessage(error, "Please try again.") }),
                      },
                    )
                  }
                  disabled={setPublished.isPending}
                  className={buttonGhost}
                >
                  {p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {p.is_published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" onClick={() => setEditing(toDraft(p))} className={buttonGhost}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {p.is_published && (
                  <a href={`/projects/${p.slug}`} target="_blank" rel="noopener" className={buttonGhost} aria-label="View on website">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button type="button" onClick={() => setDeleting(p)} className={cn(buttonGhost, "hover:text-red-500")} aria-label="Delete">
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
            <SheetTitle>{editing?.id ? "Edit project" : "New project"}</SheetTitle>
            <SheetDescription>Tell the story as the problem, what we built and what changed. Clients buy results.</SheetDescription>
          </SheetHeader>
          {editing && <ProjectEditor key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.title}" will be deleted permanently. To just hide it, use "Unpublish".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast({ title: "Project deleted" }),
                  onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: serverMessage(error, "Please try again.") }),
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
