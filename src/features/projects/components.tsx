import { Link } from "react-router-dom"
import { ArrowRight, Building2, CheckCircle2, ExternalLink, Info, Lock, MapPin, ShieldCheck } from "lucide-react"
import { imageUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import { PROJECT_CATEGORIES, PROJECT_STATUS, clientLine, type Project, type TrackRecord } from "./types"

function StatusDot({ project }: { project: Project }) {
  const live = project.status !== "in_development"
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
      <span className={cn("h-2 w-2 rounded-full", live ? "bg-emerald-500" : "bg-amber-500")} aria-hidden="true" />
      {PROJECT_STATUS[project.status]}
    </span>
  )
}

export function Highlights({ project, className, compact = false }: { project: Project; className?: string; compact?: boolean }) {
  if (!project.highlights.length) return null
  return (
    <dl className={cn("grid gap-3 grid-cols-[repeat(auto-fit,minmax(130px,1fr))]", className)}>
      {project.highlights.map((h) => (
        <div key={h.label} className="rounded-2xl bg-primary/5 border border-primary/15 p-3">
          <dt className="sr-only">{h.label}</dt>
          <dd className={cn("font-bold font-poppins text-primary leading-tight", compact ? "text-lg" : "text-xl md:text-2xl")}>{h.value}</dd>
          <dd className="text-xs text-foreground/65 mt-0.5">{h.label}</dd>
        </div>
      ))}
    </dl>
  )
}

/** A project we may show in full: screenshot, client and a link to the case study. */
export function PublicProjectCard({ project, large = false }: { project: Project; large?: boolean }) {
  return (
    <article className={cn("group glass rounded-3xl overflow-hidden flex flex-col hover-lift", large && "lg:flex-row")}>
      <Link
        to={`/projects/${project.slug}`}
        className={cn("relative block overflow-hidden bg-muted aspect-[16/9]", large && "lg:aspect-auto lg:w-[55%] lg:min-h-[340px]")}
        tabIndex={-1}
        aria-hidden="true"
      >
        {project.cover_image ? (
          <img
            src={imageUrl(project.cover_image, 1000)}
            alt=""
            width={800}
            height={450}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <span className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
        )}
        <span className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-semibold">
          {PROJECT_CATEGORIES[project.category]}
        </span>
      </Link>
      <div className={cn("p-6 md:p-7 flex flex-col flex-1", large && "lg:p-9")}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          <StatusDot project={project} />
          {(project.sector || project.location) && (
            <span className="inline-flex items-center gap-1 text-xs text-foreground/60">
              <MapPin className="h-3.5 w-3.5" />
              {[project.sector, project.location].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
        <h3 className={cn("font-bold font-poppins mb-2", large ? "text-2xl md:text-3xl" : "text-xl")}>
          <Link to={`/projects/${project.slug}`} className="hover:text-primary transition-colors">
            {project.title}
          </Link>
        </h3>
        {project.client_name && <p className="text-sm font-medium text-foreground/70 mb-2">For {project.client_name}</p>}
        <p className="text-foreground/75 leading-relaxed mb-5">{project.summary}</p>
        {large && <Highlights project={project} className="mb-6" />}
        {project.tech.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-6" aria-label="Technology">
            {project.tech.map((t) => (
              <li key={t} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-3">
          <Link
            to={`/projects/${project.slug}`}
            className="h-11 px-5 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2 hover:opacity-90"
          >
            Read the case study
            <ArrowRight className="h-4 w-4" />
          </Link>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-4 rounded-xl glass border-primary/30 font-semibold inline-flex items-center gap-2 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              Visit live
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

/** A project told without naming the client or showing their system. */
export function ConfidentialProjectCard({ project }: { project: Project }) {
  return (
    <article className="glass rounded-3xl p-6 flex flex-col h-full hover-lift">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5" />
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-xs font-semibold text-foreground/70">
          <Lock className="h-3.5 w-3.5" />
          Client confidential
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{PROJECT_CATEGORIES[project.category]}</p>
      <h3 className="text-lg font-bold font-poppins mb-1">
        <Link to={`/projects/${project.slug}`} className="hover:text-primary transition-colors">
          {project.title}
        </Link>
      </h3>
      <p className="text-sm text-foreground/60 mb-3">{clientLine(project)}</p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-4">{project.summary}</p>
      {project.highlights.length > 0 ? (
        <Highlights project={project} className="mb-4" compact />
      ) : (
        project.results.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {project.results.slice(0, 3).map((r) => (
              <li key={r} className="flex gap-2 text-sm text-foreground/75">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        )
      )}
      <div className="mt-auto pt-2 flex items-center justify-between gap-3">
        <StatusDot project={project} />
        <Link to={`/projects/${project.slug}`} className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
          Read more <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

/** Why most of our work is shown without names, and how to see more. */
export function ConfidentialityNote({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5", className)}>
      <span className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <div className="flex-1">
        <h3 className="font-bold font-poppins text-lg mb-1">Most of our work is confidential, and we keep it that way</h3>
        <p className="text-foreground/75 text-sm leading-relaxed">
          Many of our clients are institutions whose systems hold sensitive data, so we do not publish their names or screens. The way we protect
          their privacy is the way we will protect yours. Ask us for a private walkthrough, or to speak with a client who has agreed to be a
          reference.
        </p>
      </div>
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: TrackRecord["by_service"] }) {
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.count))
  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between gap-3 text-sm mb-1">
              <span>{row.label}</span>
              <span className="font-semibold tabular-nums">{row.display}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Our work in honest totals: nothing that points to one client. */
export function TrackRecordPanel({ record, className }: { record: TrackRecord; className?: string }) {
  if (record.totals.length === 0) return null
  return (
    <div className={className}>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {record.totals.slice(0, 4).map((t) => (
          // Label first in the markup (valid <dl>), number shown on top
          <div key={t.key} className="glass rounded-3xl p-5 md:p-6 text-center flex flex-col-reverse">
            <dt className="text-sm text-foreground/70 mt-1">{t.label}</dt>
            <dd className="text-3xl md:text-4xl font-bold font-poppins text-primary">{t.display}</dd>
          </div>
        ))}
      </dl>
      {(record.by_service.length > 0 || record.by_client_type.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Breakdown title="What we have built" rows={record.by_service} />
          <Breakdown title="Who we work with" rows={record.by_client_type} />
        </div>
      )}
      {record.sectors.length > 0 && (
        <p className="text-sm text-foreground/70 mt-4 text-center">
          <span className="font-semibold text-foreground">Sectors: </span>
          {record.sectors.join(" · ")}
        </p>
      )}
      <p className="text-xs text-foreground/55 mt-3 flex items-start justify-center gap-1.5 text-center">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        Counted from our client records and rounded down. Groups with fewer than {record.min_group} clients are not listed, so no client can be
        identified.
      </p>
    </div>
  )
}
