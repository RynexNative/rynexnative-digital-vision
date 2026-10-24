import { Link } from "react-router-dom"
import { ArrowRight, MessageCircle } from "lucide-react"
import { useProjects } from "@/features/projects/api"
import { ConfidentialProjectCard, ConfidentialityNote, PublicProjectCard } from "@/features/projects/components"
import { FALLBACK_PROJECTS } from "@/features/projects/types"
import { WHATSAPP_NUMBER } from "@/features/packages/types"

const WALKTHROUGH = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello RynexNative, I would like a private walkthrough of a system similar to what I need.",
)}`

export function PortfolioSection() {
  const { data, isError } = useProjects()
  const projects = data ?? (isError ? FALLBACK_PROJECTS : [])
  const shown = projects.filter((p) => p.visibility === "public")
  const confidential = projects.filter((p) => p.visibility === "confidential")

  return (
    <section id="portfolio" className="py-20 md:py-24 section-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="eyebrow">Our work</p>
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Work we are <span className="text-primary">proud of</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Real systems running for schools, businesses and institutions in Tanzania. Some we can show you; most we keep private for our clients.
          </p>
        </div>

        {data === undefined && !isError ? (
          <div className="grid lg:grid-cols-2 gap-6" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="glass rounded-3xl h-[420px] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {shown.length > 0 && (
              <div className={shown.length === 1 ? "" : "grid lg:grid-cols-2 gap-6"}>
                {shown.slice(0, 2).map((project) => (
                  <PublicProjectCard key={project.slug} project={project} large={shown.length === 1} />
                ))}
              </div>
            )}

            {confidential.length > 0 && (
              <>
                <h3 className="text-xl font-bold font-poppins mt-14 mb-5">More of our work, shared without client names</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {confidential.slice(0, 6).map((project) => (
                    <ConfidentialProjectCard key={project.slug} project={project} />
                  ))}
                </div>
              </>
            )}

            <ConfidentialityNote className="mt-10" />
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <Link
            to="/projects"
            className="h-12 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90"
          >
            See all projects
            <ArrowRight className="h-4 w-4" />
          </Link>
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
