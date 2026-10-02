import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ChevronRight, Newspaper } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { ShareButtons } from "@/components/share-buttons"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { RichText } from "@/features/content/RichText"
import { useNewsList, useNewsPost } from "@/features/news/api"
import { NewsCard, NewsCover } from "@/features/news/components"
import { NEWS_CATEGORIES, formatNewsDate, newsUrl } from "@/features/news/types"

export default function NewsDetailPage() {
  const { slug } = useParams()
  const { data: post, isLoading, isError } = useNewsPost(slug)
  const { data: all = [] } = useNewsList()
  useDocumentTitle(post?.title ?? "Habari")

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse" aria-busy="true">
          <div className="aspect-[16/9] rounded-3xl bg-foreground/10 mb-8" />
          <div className="h-10 w-4/5 bg-foreground/10 rounded mb-4" />
          <div className="h-5 w-full bg-foreground/10 rounded" />
        </div>
      </SiteLayout>
    )
  }

  if (isError || !post) {
    return (
      <SiteLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <Newspaper className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-poppins mb-3">Habari haikupatikana</h1>
          <Link to="/habari" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Habari zote
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const related = all.filter((p) => p.slug !== post.slug).slice(0, 3)

  return (
    <SiteLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-foreground/50 mb-6">
          <Link to="/" className="hover:text-primary">Nyumbani</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/habari" className="hover:text-primary">Habari</Link>
        </nav>
        <div className="flex items-center gap-2 text-sm mb-4">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{NEWS_CATEGORIES[post.category]}</span>
          <time dateTime={post.published_at ?? undefined} className="text-foreground/50">{formatNewsDate(post.published_at)}</time>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-poppins leading-tight mb-5">{post.title}</h1>
        <p className="text-lg md:text-xl text-foreground/75 leading-relaxed mb-8">{post.excerpt}</p>
        {post.cover_image && (
          <NewsCover src={post.cover_image} alt={post.title} width={1200} className="w-full aspect-[16/9] rounded-3xl mb-8" />
        )}
        <RichText text={post.body ?? ""} className="text-lg leading-relaxed text-foreground/85" />
        <div className="mt-10 pt-8 border-t border-foreground/10">
          <p className="font-semibold mb-3">Share habari hii</p>
          <ShareButtons title={post.title} text={post.excerpt} url={newsUrl(post.slug)} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-foreground/10 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <h2 className="text-2xl font-bold font-poppins mb-8">Habari nyingine</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  )
}
