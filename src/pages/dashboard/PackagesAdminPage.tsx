import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ExternalLink, Eye, EyeOff, Gift, Inbox, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react"
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
import { slugify } from "@/features/alerts/types"
import { useDeletePackage, usePackagesAdmin, useSavePackage, useSetPackagePublished, type PackageInput } from "@/features/dashboard/api"
import { ImageField } from "@/features/dashboard/ImageField"
import type { DashboardPackage } from "@/features/dashboard/types"
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pill } from "@/features/dashboard/ui"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { PACKAGE_CATEGORIES, formatAmount, type PackageCategory } from "@/features/packages/types"
import { useToast } from "@/hooks/use-toast"
import { errorMessage, validationMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Draft = Omit<PackageInput, "price" | "features" | "experience" | "bonus_ends_at" | "sort_order"> & {
  id?: string
  price: string
  features: string
  experience: string
  bonus_ends_at: string
  sort_order: string
}

const EMPTY: Draft = {
  slug: "",
  name: "",
  category: "website",
  tier: "",
  audience: "",
  tagline: "",
  description: "",
  cover_image: "",
  price: "",
  price_label: "Starting from",
  price_note: "one-time",
  features: "",
  experience: "",
  delivery_time: "",
  support: "",
  guarantee: "",
  badge: "",
  is_featured: false,
  bonus: "",
  bonus_ends_at: "",
  sort_order: "1",
  is_published: false,
}

const toLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean)

/** ISO -> value for <input type="datetime-local"> in the browser's time zone */
function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toDraft(p: DashboardPackage): Draft {
  return {
    ...p,
    price: p.price === null ? "" : String(p.price),
    features: p.features.join("\n"),
    experience: p.experience.join("\n"),
    bonus_ends_at: toLocalInput(p.bonus_ends_at),
    sort_order: String(p.sort_order),
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={cn("block text-sm font-medium", hint ? "mb-1" : "mb-1.5")}>{label}</span>
      {hint && <span className="block text-xs text-foreground/50 mb-1.5">{hint}</span>}
      {children}
    </label>
  )
}

function PackageEditor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const { toast } = useToast()
  const save = useSavePackage()
  const [draft, setDraft] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const text = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value as never)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: PackageInput = {
      ...draft,
      slug: draft.slug || slugify(draft.name),
      name: draft.name.trim(),
      price: draft.price.trim() ? Number(draft.price) : null,
      features: toLines(draft.features),
      experience: toLines(draft.experience),
      bonus: draft.bonus.trim(),
      bonus_ends_at: draft.bonus_ends_at ? new Date(draft.bonus_ends_at).toISOString() : null,
      sort_order: Number(draft.sort_order || 0),
    }
    delete (data as { id?: string }).id
    save.mutate(
      { id: draft.id, data },
      {
        onSuccess: () => {
          toast({ title: draft.is_published ? "Package published ✅" : "Draft saved" })
          onDone()
        },
        onError: (error) =>
          toast({ variant: "destructive", title: "Could not save", description: validationMessage(error) ?? errorMessage(error, "Please try again.") }),
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <ImageField value={draft.cover_image} onChange={(url) => set("cover_image", url)} label="Cover image (optional)" />

      <div className="grid sm:grid-cols-[1fr,180px] gap-4">
        <Field label="Package name *">
          <input
            required
            minLength={2}
            maxLength={120}
            value={draft.name}
            placeholder="E.g. Professional Website"
            onChange={(e) => {
              set("name", e.target.value)
              if (!slugTouched) set("slug", slugify(e.target.value))
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Level">
          <input maxLength={40} value={draft.tier} onChange={text("tier")} placeholder="Essential, Signature..." className={inputClass} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Service">
          <select value={draft.category} onChange={(e) => set("category", e.target.value as PackageCategory)} className={inputClass}>
            {(Object.keys(PACKAGE_CATEGORIES) as PackageCategory[]).map((c) => (
              <option key={c} value={c}>
                {PACKAGE_CATEGORIES[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Order" hint="Lower numbers show first">
          <input type="number" min={0} value={draft.sort_order} onChange={text("sort_order")} className={inputClass} />
        </Field>
      </div>

      <Field label="Who it is for" hint="Speak to the client's situation, e.g. Growing businesses ready to sell online">
        <input maxLength={160} value={draft.audience} onChange={text("audience")} className={inputClass} />
      </Field>
      <Field label="Tagline" hint="The feeling or result in one sentence">
        <input maxLength={200} value={draft.tagline} onChange={text("tagline")} className={inputClass} />
      </Field>

      <fieldset className="rounded-2xl border border-foreground/10 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Investment</legend>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Shown before">
            <input maxLength={40} value={draft.price_label} onChange={text("price_label")} placeholder="Starting from" className={inputClass} />
          </Field>
          <Field label="Price (TZS)">
            <input type="number" min={0} step={1000} value={draft.price} onChange={text("price")} placeholder="Tailored quote" className={inputClass} />
          </Field>
          <Field label="Shown after">
            <input maxLength={60} value={draft.price_note} onChange={text("price_note")} placeholder="one-time / per month" className={inputClass} />
          </Field>
        </div>
        <p className="text-xs text-foreground/50">Leave the price empty for premium work you price after a conversation ("Tailored to you").</p>
      </fieldset>

      <Field label="What's included" hint="One item per line. The first six show on the card">
        <textarea rows={6} value={draft.features} onChange={text("features")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>
      <Field label="What the client will experience" hint="Feelings and outcomes, one per line, e.g. You always know what stage your project is in">
        <textarea rows={4} value={draft.experience} onChange={text("experience")} className={cn(inputClass, "text-sm resize-y")} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Delivery time">
          <input maxLength={60} value={draft.delivery_time} onChange={text("delivery_time")} placeholder="2–4 weeks" className={inputClass} />
        </Field>
        <Field label="Support">
          <input maxLength={120} value={draft.support} onChange={text("support")} placeholder="3 months of free support" className={inputClass} />
        </Field>
      </div>
      <Field label="Our promise" hint="A guarantee that builds trust, e.g. We revise the design until you are happy">
        <input maxLength={200} value={draft.guarantee} onChange={text("guarantee")} className={inputClass} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <Field label="Card label" hint="E.g. Most chosen, Premium">
          <input maxLength={30} value={draft.badge} onChange={text("badge")} className={inputClass} />
        </Field>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 h-[46px] cursor-pointer">
          <span className="text-sm font-medium">Highlight this package</span>
          <Switch checked={draft.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
        </label>
      </div>

      <fieldset className="rounded-2xl border border-accent/30 bg-accent/5 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold inline-flex items-center gap-1.5">
          <Gift className="h-4 w-4 text-accent" />
          Limited-time bonus (optional)
        </legend>
        <p className="text-xs text-foreground/60 -mt-1">
          Add value instead of cutting the price, e.g. "Free logo design" or "3 extra months of support". It disappears from the website by itself
          when it ends.
        </p>
        <div className="grid sm:grid-cols-[1fr,220px] gap-4">
          <Field label="Bonus">
            <input maxLength={200} value={draft.bonus} onChange={text("bonus")} className={inputClass} />
          </Field>
          <Field label="Ends (optional)">
            <input type="datetime-local" value={draft.bonus_ends_at} onChange={text("bonus_ends_at")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <Field label="Full description" hint={'Blank line = new paragraph · "## " = subheading · "- " = list'}>
        <textarea rows={8} value={draft.description} onChange={text("description")} className={cn(inputClass, "resize-y text-sm leading-relaxed")} />
      </Field>

      <details className="rounded-xl border border-foreground/10 px-4 py-3">
        <summary className="text-sm font-medium cursor-pointer">Link settings</summary>
        <label className="block mt-3">
          <span className="block text-xs text-foreground/60 mb-1.5">rynexnative.com/#/packages/</span>
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

export default function PackagesAdminPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: packages = [], isLoading, isError, refetch } = usePackagesAdmin()
  const setPublished = useSetPackagePublished()
  const remove = useDeletePackage()
  const [editing, setEditing] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<DashboardPackage | null>(null)

  // /admin/packages?new=1 opens the editor straight away (from the overview button)
  useEffect(() => {
    if (searchParams.get("new")) {
      setEditing(EMPTY)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const groups = (Object.keys(PACKAGE_CATEGORIES) as PackageCategory[])
    .map((category) => ({ category, items: packages.filter((p) => p.category === category) }))
    .filter((g) => g.items.length > 0)
  const drafts = packages.filter((p) => !p.is_published).length

  return (
    <>
      <PageHeader
        title="Packages"
        subtitle="Service levels shown on the website. Lead with quality, experience and trust."
        action={
          <div className="flex gap-2">
            <Link to="/admin/requests" className={cn(buttonGhost, "h-11 px-4")}>
              <Inbox className="h-4 w-4" />
              Requests
            </Link>
            <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              New package
            </button>
          </div>
        }
      />

      {drafts > 0 && !isLoading && (
        <p className="glass rounded-2xl p-4 mb-5 text-sm">
          <strong>{drafts}</strong> package(s) are drafts. Review the content and prices, then publish them to show them on the website.
        </p>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : packages.length === 0 ? (
        <EmptyState
          title="No packages yet"
          text="Create levels like Essential, Professional and Signature for each service."
          action={
            <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              Create the first one
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="font-semibold text-lg mb-3">{PACKAGE_CATEGORIES[group.category]}</h2>
              <ul className="space-y-3">
                {group.items.map((pkg) => (
                  <li key={pkg.id} className="glass rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <button type="button" onClick={() => setEditing(toDraft(pkg))} className="flex-1 min-w-0 text-left group">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {pkg.is_published ? (
                          <Pill className="bg-primary/15 text-primary border-primary/30">Live</Pill>
                        ) : (
                          <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Draft</Pill>
                        )}
                        {pkg.is_featured && (
                          <Pill className="bg-accent/15 text-accent border-accent/30">
                            <Star className="h-3 w-3 mr-1" />
                            Highlighted
                          </Pill>
                        )}
                        {pkg.bonus && (
                          <Pill className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                            <Gift className="h-3 w-3 mr-1" />
                            Bonus
                          </Pill>
                        )}
                        {pkg.tier && <span className="text-xs text-foreground/50">{pkg.tier}</span>}
                      </div>
                      <p className="font-semibold group-hover:text-primary transition-colors">{pkg.name}</p>
                      <p className="text-xs text-foreground/50 mt-0.5">
                        {pkg.price === null ? "Tailored quote" : `${pkg.price_label ? `${pkg.price_label} ` : ""}${formatAmount(pkg.price)}`}
                        {" · "}
                        {pkg.inquiries} request{pkg.inquiries === 1 ? "" : "s"}
                      </p>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPublished.mutate(
                            { id: pkg.id, published: !pkg.is_published },
                            {
                              onSuccess: () => toast({ title: pkg.is_published ? "Unpublished" : "Published ✅" }),
                              onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: errorMessage(error, "Please try again.") }),
                            },
                          )
                        }
                        disabled={setPublished.isPending}
                        className={buttonGhost}
                      >
                        {pkg.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {pkg.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" onClick={() => setEditing(toDraft(pkg))} className={buttonGhost}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      {pkg.is_published && (
                        <Link to={`/packages/${pkg.slug}`} target="_blank" className={buttonGhost} aria-label="View on website">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                      <button type="button" onClick={() => setDeleting(pkg)} className={cn(buttonGhost, "hover:text-red-500")} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>{editing?.id ? "Edit package" : "New package"}</SheetTitle>
            <SheetDescription>Describe the experience and the result, not only the features. Clients buy how it will feel.</SheetDescription>
          </SheetHeader>
          {editing && <PackageEditor key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this package?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" will be deleted permanently. Requests already received are kept. To just hide it, use "Unpublish".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast({ title: "Package deleted" }),
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
