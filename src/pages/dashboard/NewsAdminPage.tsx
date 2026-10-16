import { useState } from "react"
import { Link } from "react-router-dom"
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import { useDeleteNews, useNewsAdmin, useSaveNews, useSetNewsPublished, type NewsInput } from "@/features/dashboard/api"
import { ImageField } from "@/features/dashboard/ImageField"
import { buttonGhost, buttonPrimary, inputClass } from "@/features/dashboard/styles"
import type { DashboardNews } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill, SearchInput } from "@/features/dashboard/ui"
import { NewsCover } from "@/features/news/components"
import { NEWS_CATEGORIES, formatNewsDate, type NewsCategory } from "@/features/news/types"
import { useToast } from "@/hooks/use-toast"
import { errorMessage, validationMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Draft = NewsInput & { id?: string }

const EMPTY: Draft = { slug: "", title: "", excerpt: "", body: "", cover_image: "", category: "announcement", is_published: false }

function NewsEditor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const { toast } = useToast()
  const save = useSaveNews()
  const [draft, setDraft] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const { id, ...data } = draft
        save.mutate(
          { id, data: { ...data, slug: data.slug || slugify(data.title), title: data.title.trim(), excerpt: data.excerpt.trim() } },
          {
            onSuccess: () => {
              toast({ title: draft.is_published ? "Post published ✅" : "Draft saved" })
              onDone()
            },
            onError: (error) =>
              toast({ variant: "destructive", title: "Could not save", description: validationMessage(error) ?? errorMessage(error, "Please try again.") }),
          },
        )
      }}
      className="space-y-5 pb-4"
    >
      <ImageField value={draft.cover_image} onChange={(url) => set("cover_image", url)} />
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Title *</span>
        <input
          required
          minLength={3}
          maxLength={200}
          value={draft.title}
          onChange={(e) => {
            set("title", e.target.value)
            if (!slugTouched) set("slug", slugify(e.target.value))
          }}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Category</span>
        <select value={draft.category} onChange={(e) => set("category", e.target.value as NewsCategory)} className={inputClass}>
          {(Object.keys(NEWS_CATEGORIES) as NewsCategory[]).map((c) => (
            <option key={c} value={c}>
              {NEWS_CATEGORIES[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">Summary *</span>
        <span className="block text-xs text-foreground/50 mb-1.5">1–2 sentences shown on cards and when shared</span>
        <textarea required minLength={10} maxLength={400} rows={3} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={cn(inputClass, "resize-y")} />
        <span className="block text-xs mt-1 text-right text-foreground/40">{draft.excerpt.length}/400</span>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">Full story</span>
        <span className="block text-xs text-foreground/50 mb-1.5">Blank line = new paragraph · "## " = subheading · "- " = list</span>
        <textarea rows={12} value={draft.body} onChange={(e) => set("body", e.target.value)} className={cn(inputClass, "resize-y text-sm leading-relaxed")} />
      </label>
      <details className="rounded-xl border border-foreground/10 px-4 py-3">
        <summary className="text-sm font-medium cursor-pointer">Link settings</summary>
        <label className="block mt-3">
          <span className="block text-xs text-foreground/60 mb-1.5">rynexnative.com/#/news/</span>
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

export default function NewsAdminPage() {
  const { toast } = useToast()
  const { data: posts = [], isLoading, isError, refetch } = useNewsAdmin()
  const setPublished = useSetNewsPublished()
  const remove = useDeleteNews()
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all")
  const [q, setQ] = useState("")
  const [editing, setEditing] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState<DashboardNews | null>(null)

  const drafts = posts.filter((p) => !p.is_published).length
  const visible = posts.filter(
    (p) => (filter === "all" || (filter === "published") === p.is_published) && (!q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase())),
  )

  return (
    <>
      <PageHeader
        title="News"
        subtitle="Announcements, new projects and articles for the website."
        action={
          <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
            <Plus className="h-4 w-4" />
            New post
          </button>
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: `All (${posts.length})` },
            { id: "published", label: `Live (${posts.length - drafts})` },
            { id: "draft", label: `Drafts (${drafts})` },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search posts..." />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={posts.length ? "Nothing matches" : "No posts yet"}
          action={
            !posts.length && (
              <button type="button" onClick={() => setEditing(EMPTY)} className={buttonPrimary}>
                <Plus className="h-4 w-4" />
                Write the first one
              </button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((post) => (
            <li key={post.id} className="glass rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <button type="button" onClick={() => setEditing({ ...post })} className="flex items-center gap-4 flex-1 min-w-0 text-left group">
                <NewsCover src={post.cover_image} alt="" width={240} className="w-24 h-16 rounded-xl flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {post.is_published ? (
                      <Pill className="bg-primary/15 text-primary border-primary/30">Live</Pill>
                    ) : (
                      <Pill className="bg-foreground/10 text-foreground/60 border-foreground/15">Draft</Pill>
                    )}
                    <span className="text-xs text-foreground/50">{NEWS_CATEGORIES[post.category]}</span>
                  </div>
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">{post.title}</p>
                  <p className="text-xs text-foreground/50">
                    {post.is_published ? `Published ${formatNewsDate(post.published_at)}` : `Edited ${formatNewsDate(post.updated_at)}`}
                  </p>
                </div>
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPublished.mutate(
                      { id: post.id, published: !post.is_published },
                      { onSuccess: () => toast({ title: post.is_published ? "Unpublished" : "Published ✅" }) },
                    )
                  }
                  className={buttonGhost}
                >
                  {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {post.is_published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" onClick={() => setEditing({ ...post })} className={buttonGhost}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {post.is_published && (
                  <Link to={`/news/${post.slug}`} target="_blank" className={buttonGhost} aria-label="View on website">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <button type="button" onClick={() => setDeleting(post)} className={cn(buttonGhost, "hover:text-red-500")} aria-label="Delete">
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
            <SheetTitle>{editing?.id ? "Edit post" : "New post"}</SheetTitle>
            <SheetDescription>A good photo and a short title attract more readers.</SheetDescription>
          </SheetHeader>
          {editing && <NewsEditor key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.title}" will be deleted permanently. To just hide it, use "Unpublish".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleting && remove.mutate(deleting.id, { onSuccess: () => toast({ title: "Post deleted" }) })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
