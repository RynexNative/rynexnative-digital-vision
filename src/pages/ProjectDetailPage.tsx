import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Briefcase, Calculator, CheckCircle2, ExternalLink, Gem, Lock, MapPin, MessageCircle, Quote } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { RichText } from "@/features/content/RichText"
import { WHATSAPP_NUMBER } from "@/features/packages/types"
import { useProject, useProjects } from "@/features/projects/api"
import { ConfidentialProjectCard, ConfidentialityNote, Highlights, PublicProjectCard } from "@/features/projects/components"
import { PROJECT_CATEGORIES, PROJECT_STATUS, clientLine } from "@/features/projects/types"
import { imageUrl } from "@/lib/media"

export default function ProjectDetailPage() {
  const { slug = "" } = useParams()
  const { data: project, isLoading, isError } = useProject(slug)
  const { data: all = [] } = useProjects()
  useDocumentTitle(project ? `${project.title} · Our Work` : "Our Work")

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse" aria-busy="true">
          <div className="h-10 w-2/3 bg-foreground/10 rounded mb-4" />
          <div className="h-5 w-1/2 bg-foreground/10 rounded mb-10" />
          <div className="h-72 rounded-3xl bg-foreground/10" />
        </div>
      </SiteLayout>
    )
  }

  if (isError || !project) {
    return (
      <SiteLayout>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <Briefcase className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-poppins mb-3">Project not found</h1>
          <Link to="/projects" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            <ArrowLeft className="h-4 w-4" />
            See all our work
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const isPublic = project.visibility === "public"
  const images = isPublic ? [project.cover_image, ...project.gallery].filter(Boolean) : []
  const others = all.filter((p) => p.slug !== project.slug).slice(0, 3)
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello RynexNative, I saw your ${project.title} project and would like something similar.`,
  )}`
  const facts = [
    ["Client", clientLine(project)],
    ["Service", PROJECT_CATEGORIES[project.category]],
    ["Sector", project.sector],
    ["Location", project.location],
    ["Year", project.year ? String(project.year) : ""],
    ["Status", PROJECT_STATUS[project.status]],
  ].filter(([, value]) => value)

  return (
    <SiteLayout>
      <section className="surface-dark page-hero">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Our work
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
              {PROJECT_CATEGORIES[project.category]}
            </span>
            {!isPublic && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold">
                <Lock className="h-3.5 w-3.5" />
                Client confidential
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-poppins text-white mb-4">{project.title}</h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl">{project.summary}</p>
          <p className="mt-4 text-sm text-slate-400 inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {[clientLine(project), project.location].filter(Boolean).join(" · ")}
          </p>
          {project.link && (
            <div className="mt-6">
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-5 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2 hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4" />
                Visit the live system
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {images[0] && (
          <img
            src={imageUrl(images[0], 1400)}
            alt={`${project.title} screenshot`}
            width={1400}
            height={788}
            className="w-full rounded-3xl border border-border shadow-lg mb-10 bg-muted"
          />
        )}

        <Highlights project={project} className="mb-10 max-w-2xl" />

        <div className="grid lg:grid-cols-[1fr_280px] gap-10">
          <div className="space-y-10">
            {project.challenge && (
              <section>
                <h2 className="text-2xl font-bold font-poppins mb-3">The challenge</h2>
                <RichText text={project.challenge} className="text-foreground/80 leading-relaxed space-y-3" />
              </section>
            )}
            {project.solution && (
              <section>
                <h2 className="text-2xl font-bold font-poppins mb-3">What we built</h2>
                <RichText text={project.solution} className="text-foreground/80 leading-relaxed space-y-3" />
              </section>
            )}
            {project.results.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold font-poppins mb-3">The result</h2>
                <ul className="space-y-2">
                  {project.results.map((r) => (
                    <li key={r} className="flex gap-2.5 text-foreground/80">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {project.testimonial && (
              <figure className="glass rounded-3xl p-6 md:p-8">
                <Quote className="h-8 w-8 text-primary/40 mb-3" />
                <blockquote className="text-lg leading-relaxed">{project.testimonial}</blockquote>
                {project.testimonial_author && <figcaption className="mt-3 text-sm text-foreground/60">— {project.testimonial_author}</figcaption>}
              </figure>
            )}
            {images.length > 1 && (
              <section>
                <h2 className="text-2xl font-bold font-poppins mb-4">Screens</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {images.slice(1).map((src) => (
                    <img key={src} src={imageUrl(src, 900)} alt="" loading="lazy" className="w-full rounded-2xl border border-border bg-muted" />
                  ))}
                </div>
              </section>
            )}
            {!isPublic && <ConfidentialityNote />}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 self-start">
            <dl className="glass rounded-3xl p-5 space-y-3 text-sm">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-foreground/55 text-xs uppercase tracking-wider font-semibold">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
              {project.tech.length > 0 && (
                <div>
                  <dt className="text-foreground/55 text-xs uppercase tracking-wider font-semibold mb-1.5">Technology</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                      <span key={t} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20">
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <div className="glass rounded-3xl p-5">
              <p className="font-semibold mb-1">Need something similar?</p>
              <p className="text-sm text-foreground/70 mb-4">Tell us what you need. We reply the same working day.</p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-[#25D366] text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1ebe5b] mb-2"
              >
                <MessageCircle className="h-4 w-4" />
                Talk to us
              </a>
              <Link to="/packages" className="w-full h-11 rounded-xl glass font-semibold inline-flex items-center justify-center gap-2 hover:text-primary mb-2">
                <Gem className="h-4 w-4" />
                See packages
              </Link>
              <Link to="/estimate" className="w-full h-11 rounded-xl glass font-semibold inline-flex items-center justify-center gap-2 hover:text-primary">
                <Calculator className="h-4 w-4" />
                Get an estimate
              </Link>
            </div>
          </aside>
        </div>

        {others.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold font-poppins mb-5">More of our work</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {others.map((p) => (p.visibility === "public" ? <PublicProjectCard key={p.slug} project={p} /> : <ConfidentialProjectCard key={p.slug} project={p} />))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  )
}
