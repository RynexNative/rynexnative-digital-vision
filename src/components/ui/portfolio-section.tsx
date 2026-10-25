import { Link } from "react-router-dom"
import { ArrowRight, MessageCircle } from "lucide-react"
import { useProjects, useTrackRecord } from "@/features/projects/api"
import { ConfidentialProjectCard, ConfidentialityNote, PublicProjectCard, TrackRecordPanel } from "@/features/projects/components"
import { WHATSAPP_NUMBER } from "@/features/packages/types"

const WALKTHROUGH = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello RynexNative, I would like a private walkthrough of a system similar to what I need.",
)}`

/** Our work: honest totals and, when switched on in the dashboard, selected projects. */
export function PortfolioSection() {
  const { data: record } = useTrackRecord()
  const showProjects = record?.show_projects ?? false
  const { data: projects = [] } = useProjects()
  const shown = showProjects ? projects.filter((p) => p.visibility === "public") : []
  const confidential = showProjects ? projects.filter((p) => p.visibility === "confidential") : []
  const showNumbers = Boolean(record?.show_track_record && record.totals.length)

  return (
    <section id="portfolio" className="py-20 md:py-24 section-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="eyebrow">Our work</p>
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            A track record built on <span className="text-primary">trust</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Systems running every day for schools, businesses and institutions in Tanzania. We keep our clients' names and systems private, so
            here is our work in numbers.
          </p>
        </div>

        {showNumbers && record && <TrackRecordPanel record={record} />}

        {shown.length > 0 && (
          <div className={shown.length === 1 ? "mt-12" : "mt-12 grid lg:grid-cols-2 gap-6"}>
            {shown.slice(0, 2).map((project) => (
              <PublicProjectCard key={project.slug} project={project} large={shown.length === 1} />
            ))}
          </div>
        )}

        {confidential.length > 0 && (
          <>
            <h3 className="text-xl font-bold font-poppins mt-12 mb-5">Selected work, shared without client names</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {confidential.slice(0, 3).map((project) => (
                <ConfidentialProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </>
        )}

        <ConfidentialityNote className="mt-10" />

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          {showProjects && projects.length > 0 && (
            <Link
              to="/projects"
              className="h-12 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90"
            >
              See selected projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <a
            href={WALKTHROUGH}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-6 rounded-xl glass border-primary/30 font-semibold inline-flex items-center justify-center gap-2 hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            Ask for a private walkthrough
          </a>
        </div>
      </div>
    </section>
  )
}
