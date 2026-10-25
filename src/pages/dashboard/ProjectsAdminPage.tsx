import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BarChart3, ExternalLink, Eye, EyeOff, Globe, Loader2, Lock, Pencil, Plus, Save, Star, Trash2 } from "lucide-react"
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
import { CLIENT_KINDS, SERVICE_TYPES } from "@/features/operations/types"
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
  type TrackRecord,
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

type PortfolioSettings = { show_projects: boolean; show_track_record: boolean; team_size: number }
type EarlierWork = {
  id: number
  service_type: string
  service_label: string
  client_kind: string
  client_label: string
  sector: string
  projects: number
  clients: number
  still_supported: number
  note: string
}
const EMPTY_ROW = { service_type: "software", client_kind: "school", sector: "", projects: "", clients: "", still_supported: "", note: "" }

/**
 * Work that is not in Operations, entered as groups ("software for schools: 18 projects for 15 schools")
 * so the website's numbers and breakdowns are complete without entering each client.
 */
function EarlierWorkTable() {
  const { toast } = useToast()
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  const { data: rows = [], isLoading } = useDashboardQuery<EarlierWork[]>(["dashboard", "earlier-work"], "/earlier-work/")
  const [row, setRow] = useState(EMPTY_ROW)
  const [editingId, setEditingId] = useState<number | null>(null)
  const done = () => {
    invalidate("earlier-work", "portfolio")
    queryClient.invalidateQueries({ queryKey: ["projects", "track-record"] })
  }
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      editingId
        ? dashboardRequest<EarlierWork>(`/earlier-work/${editingId}/`, { method: "PATCH", body })
        : dashboardRequest<EarlierWork>("/earlier-work/", { method: "POST", body }),
    onSuccess: () => {
      done()
      setRow(EMPTY_ROW)
      setEditingId(null)
      toast({ title: "Saved ✅" })
    },
    onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
  })
  const remove = useMutation({
    mutationFn: (id: number) => dashboardRequest<void>(`/earlier-work/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      done()
      toast({ title: "Removed" })
    },
  })
  const set = (key: keyof typeof EMPTY_ROW) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setRow((r) => ({ ...r, [key]: e.target.value }))
  const total = rows.reduce((sum, r) => ({ projects: sum.projects + r.projects, clients: sum.clients + r.clients }), { projects: 0, clients: 0 })

  return (
    <div className="mt-6 border-t border-border pt-5">
      <h3 className="font-semibold">Earlier work not in Operations</h3>
      <p className="text-xs text-foreground/60 mb-3">
        Enter it in groups, not client by client, e.g. “Software & web systems · School · Education · 18 projects for 15 schools”. It is added to the
        numbers and to “What we have built” and “Who we work with”. Notes are for the team only.
      </p>

      {isLoading ? null : rows.length > 0 ? (
        <div className="overflow-x-auto -mx-1 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-foreground/55">
                <th className="font-semibold py-2 px-1">Service</th>
                <th className="font-semibold py-2 px-1">Client type</th>
                <th className="font-semibold py-2 px-1">Sector</th>
                <th className="font-semibold py-2 px-1 text-right">Projects</th>
                <th className="font-semibold py-2 px-1 text-right">Clients</th>
                <th className="font-semibold py-2 px-1 text-right">Supported</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className={cn(editingId === r.id && "bg-primary/5")}>
                  <td className="py-2 px-1">
                    {r.service_label}
                    {r.note && <span className="block text-xs text-foreground/50">{r.note}</span>}
                  </td>
                  <td className="py-2 px-1">{r.client_label}</td>
                  <td className="py-2 px-1">{r.sector || "—"}</td>
                  <td className="py-2 px-1 text-right tabular-nums">{r.projects}</td>
                  <td className="py-2 px-1 text-right tabular-nums">{r.clients}</td>
                  <td className="py-2 px-1 text-right tabular-nums">{r.still_supported}</td>
                  <td className="py-2 px-1 text-right whitespace-nowrap">
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => {
                        setEditingId(r.id)
                        setRow({
                          service_type: r.service_type,
                          client_kind: r.client_kind,
                          sector: r.sector,
                          projects: String(r.projects),
                          clients: String(r.clients),
                          still_supported: String(r.still_supported),
                          note: r.note,
                        })
                      }}
                      className="h-8 w-8 rounded-lg text-foreground/50 hover:text-primary inline-flex items-center justify-center"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => remove.mutate(r.id)}
                      className="h-8 w-8 rounded-lg text-foreground/50 hover:text-red-600 inline-flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2 px-1" colSpan={3}>
                  Total
                </td>
                <td className="py-2 px-1 text-right tabular-nums">{total.projects}</td>
                <td className="py-2 px-1 text-right tabular-nums">{total.clients}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate({
            ...row,
            sector: row.sector.trim(),
            note: row.note.trim(),
            projects: Number(row.projects),
            clients: Number(row.clients),
            still_supported: Number(row.still_supported || 0),
          })
        }}
        className="rounded-xl border border-foreground/10 p-3 grid grid-cols-2 lg:grid-cols-[1.3fr_1.1fr_1fr_80px_80px_90px] gap-2 items-end"
      >
        <Field label="Service">
          <select value={row.service_type} onChange={set("service_type")} className={inputClass}>
            {Object.entries(SERVICE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Client type">
          <select value={row.client_kind} onChange={set("client_kind")} className={inputClass}>
            {Object.entries(CLIENT_KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sector">
          <input value={row.sector} onChange={set("sector")} maxLength={80} placeholder="Education" className={inputClass} />
        </Field>
        <Field label="Projects">
          <input required type="number" min={1} value={row.projects} onChange={set("projects")} className={inputClass} />
        </Field>
        <Field label="Clients">
          <input required type="number" min={1} value={row.clients} onChange={set("clients")} className={inputClass} />
        </Field>
        <Field label="Supported">
          <input type="number" min={0} value={row.still_supported} onChange={set("still_supported")} placeholder="0" className={inputClass} />
        </Field>
        <div className="col-span-2 lg:col-span-6 flex flex-col sm:flex-row gap-2">
          <input value={row.note} onChange={set("note")} maxLength={200} placeholder="Note for the team (optional, never shown)" className={cn(inputClass, "flex-1")} />
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setRow(EMPTY_ROW)
                }}
                className="h-[46px] px-4 rounded-xl glass font-medium"
              >
                Cancel
              </button>
            )}
            <button type="submit" disabled={save.isPending} className={cn(buttonPrimary, "h-[46px]")}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Save" : "Add group"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
type PortfolioStatus = { settings: PortfolioSettings; exact: { projects: number; clients: number; supported: number }; website: TrackRecord }

/** What the website shows about our work: the two switches, and the numbers as visitors will see them. */
function WebsiteDisplay() {
  const { toast } = useToast()
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useDashboardQuery<PortfolioStatus>(["dashboard", "portfolio"], "/portfolio/")
  const [teamSize, setTeamSize] = useState<number | null>(null)
  const save = useMutation({
    mutationFn: (body: Partial<PortfolioSettings>) => dashboardRequest<PortfolioStatus>("/portfolio/", { method: "PUT", body }),
    onSuccess: (status) => {
      queryClient.setQueryData(["dashboard", "portfolio"], status)
      invalidate("portfolio")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onError: (error) => toast({ variant: "destructive", title: "Could not save", description: serverMessage(error, "Please try again.") }),
  })

  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (isLoading || !data) return <ListSkeleton rows={1} />
  const { settings, exact, website } = data
  const toggle = (key: "show_projects" | "show_track_record", value: boolean, message: string) =>
    save.mutate({ [key]: value }, { onSuccess: () => toast({ title: message, description: "The website updates in a few minutes." }) })

  return (
    <section className="glass rounded-2xl p-5 mb-6">
      <h2 className="font-semibold text-lg mb-4">On the website</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <label className="flex items-start justify-between gap-3 rounded-xl border border-foreground/10 p-4 cursor-pointer">
          <span>
            <span className="block font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Show our numbers
            </span>
            <span className="block text-xs text-foreground/60 mt-0.5">Totals counted from Operations, rounded down. Small groups are never listed.</span>
          </span>
          <Switch
            checked={settings.show_track_record}
            disabled={save.isPending}
            onCheckedChange={(v) => toggle("show_track_record", v, v ? "Numbers shown" : "Numbers hidden")}
            aria-label="Show our numbers"
          />
        </label>
        <label className="flex items-start justify-between gap-3 rounded-xl border border-foreground/10 p-4 cursor-pointer">
          <span>
            <span className="block font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Show projects
            </span>
            <span className="block text-xs text-foreground/60 mt-0.5">
              Off: no project is sent to the website at all, even published ones. They stay here for later.
            </span>
          </span>
          <Switch
            checked={settings.show_projects}
            disabled={save.isPending}
            onCheckedChange={(v) => toggle("show_projects", v, v ? "Published projects are now shown" : "Projects hidden from the website")}
            aria-label="Show projects"
          />
        </label>
      </div>

      <p className="text-sm font-medium mb-2">What visitors see</p>
      {website.totals.length ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {website.totals.map((t) => (
            <span key={t.key} className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-sm">
              <b className="text-primary">{t.display}</b> {t.label.toLowerCase()}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-800 bg-amber-500/10 rounded-xl p-3 mb-2">
          Nothing to show yet: add your clients and their services in Operations, or enter the earlier work below.
        </p>
      )}
      <p className="text-xs text-foreground/55 mb-5">
        Exact counts (only you see these): {exact.projects} projects · {exact.clients} clients · {exact.supported} still supported.
        {!settings.show_track_record && " Numbers are switched off, so none of this is on the website."}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(
            { team_size: teamSize ?? settings.team_size },
            {
              onSuccess: () => {
                setTeamSize(null)
                toast({ title: "Saved ✅" })
              },
            },
          )
        }}
        className="flex items-end gap-3 max-w-sm"
      >
        <Field label="Team members" hint="0 hides it">
          <input type="number" min={0} value={teamSize ?? settings.team_size} onChange={(e) => setTeamSize(Number(e.target.value))} className={inputClass} />
        </Field>
        <button type="submit" disabled={save.isPending || teamSize === null} className={cn(buttonPrimary, "h-[46px]")}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </form>

      <EarlierWorkTable />
    </section>
  )
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
        subtitle="Choose what the website shows about our work. Projects stay here even when they are hidden."
        action={
          <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            New project
          </button>
        }
      />

      <WebsiteDisplay />

      <h2 className="font-semibold text-lg mb-3">Projects</h2>
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
