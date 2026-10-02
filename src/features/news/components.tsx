import { Link } from "react-router-dom"
import { ArrowRight, Newspaper } from "lucide-react"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import { NEWS_CATEGORIES, formatNewsDate, type NewsPost } from "./types"

export function NewsCover({ src, alt, width, className }: { src: string; alt: string; width: number; className?: string }) {
  if (!src) {
    return (
      <div className={cn("bg-gradient-to-br from-primary/25 via-accent/15 to-tech-purple/20 flex items-center justify-center", className)}>
        <Newspaper className="h-10 w-10 text-foreground/30" aria-hidden="true" />
      </div>
    )
  }
  return <img src={imageUrl(src, width)} alt={alt} loading="lazy" decoding="async" className={cn("object-cover", className)} />
}

export function NewsCard({ post, featured = false }: { post: NewsPost; featured?: boolean }) {
  return (
    <Link
      to={`/habari/${post.slug}`}
      className={cn(
        "group glass rounded-3xl overflow-hidden flex flex-col hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        featured && "md:flex-row",
      )}
    >
      <div className={cn("relative overflow-hidden", featured ? "md:w-1/2 aspect-[16/9] md:aspect-auto" : "aspect-[16/9]")}>
        <NewsCover
          src={post.cover_image}
          alt=""
          width={featured ? 900 : 600}
          className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className={cn("p-6 flex flex-col flex-1", featured && "md:p-8 md:justify-center")}>
        <div className="flex items-center gap-2 text-xs mb-3">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{NEWS_CATEGORIES[post.category]}</span>
          <time dateTime={post.published_at ?? undefined} className="text-foreground/50">
            {formatNewsDate(post.published_at)}
          </time>
        </div>
        <h3 className={cn("font-bold font-poppins group-hover:text-primary transition-colors mb-2", featured ? "text-2xl md:text-3xl" : "text-lg")}>
          {post.title}
        </h3>
        <p className={cn("text-foreground/70 leading-relaxed", featured ? "md:text-lg" : "text-sm line-clamp-3")}>{post.excerpt}</p>
        <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Soma zaidi
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  )
}
