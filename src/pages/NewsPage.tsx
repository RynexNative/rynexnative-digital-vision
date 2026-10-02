import { useMemo, useState } from "react"
import { Newspaper } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useNewsList } from "@/features/news/api"
import { NewsCard } from "@/features/news/components"
import { CardSkeleton } from "@/features/events/components"
import { NEWS_CATEGORIES, type NewsCategory } from "@/features/news/types"
import { cn } from "@/lib/utils"

export default function NewsPage() {
  useDocumentTitle("Habari")
  const { data = [], isLoading, isError, refetch } = useNewsList()
  const [category, setCategory] = useState<NewsCategory | "all">("all")

  const usedCategories = useMemo(() => Array.from(new Set(data.map((p) => p.category))), [data])
  const posts = category === "all" ? data : data.filter((p) => p.category === category)
  const [featured, ...rest] = posts

  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-foreground/10" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <Newspaper className="h-4 w-4" />
            Habari za RynexNative
          </p>
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-white mb-5">
            Habari &{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Matangazo</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl">
            Project mpya tulizozindua, matangazo ya kampuni na makala kuhusu teknolojia Tanzania.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {usedCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Aina ya habari">
            {(["all", ...usedCategories] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-4 h-9 rounded-full text-sm font-medium border whitespace-nowrap transition-colors",
                  category === c ? "bg-primary text-primary-foreground border-primary" : "border-foreground/15 text-foreground/75 hover:border-primary/50 hover:text-primary",
                )}
              >
                {c === "all" ? "Zote" : NEWS_CATEGORIES[c]}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="glass rounded-3xl p-10 text-center max-w-lg mx-auto">
            <p className="font-semibold mb-2">Imeshindikana kupakia habari</p>
            <button type="button" onClick={() => refetch()} className="text-primary font-semibold hover:underline">
              Jaribu tena
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center max-w-lg mx-auto">
            <Newspaper className="h-10 w-10 text-foreground/30 mx-auto mb-3" />
            <p className="font-semibold">Habari zitakuja hivi karibuni</p>
            <p className="text-sm text-foreground/60 mt-1">Jiunge na newsletter chini ya ukurasa upate taarifa kwanza.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <NewsCard post={featured} featured />
            </div>
            {rest.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SiteLayout>
  )
}
