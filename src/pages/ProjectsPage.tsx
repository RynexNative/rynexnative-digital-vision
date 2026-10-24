import { useState } from "react"
import { Briefcase, MessageCircle } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { WHATSAPP_NUMBER } from "@/features/packages/types"
import { useProjects } from "@/features/projects/api"
import { ConfidentialProjectCard, ConfidentialityNote, PublicProjectCard } from "@/features/projects/components"
import { FALLBACK_PROJECTS, PROJECT_CATEGORIES, type ProjectCategory } from "@/features/projects/types"
import { cn } from "@/lib/utils"

const WALKTHROUGH = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello RynexNative, I would like a private walkthrough of your work.")}`

export default function ProjectsPage() {
  useDocumentTitle("Our Work")
  const { data, isLoading, isError } = useProjects()
  const projects = data ?? (isError ? FALLBACK_PROJECTS : [])
  const categories = (Object.keys(PROJECT_CATEGORIES) as ProjectCategory[]).filter((c) => projects.some((p) => p.category === c))
  const [category, setCategory] = useState<ProjectCategory | "all">("all")
  const visible = projects.filter((p) => category === "all" || p.category === category)
  const shown = visible.filter((p) => p.visibility === "public")
  const confidential = visible.filter((p) => p.visibility === "confidential")
  const sectors = new Set(projects.map((p) => p.sector).filter(Boolean))

  return (
    <SiteLayout>
      <section className="surface-dark page-hero relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <Briefcase className="h-4 w-4" />
            Our work
          </p>
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-white mb-5">
            Systems people <span className="text-primary">rely on every day</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            A few projects we can show in full, and more we describe without naming the client, because protecting their privacy is part of the job.
          </p>
          {projects.length > 0 && (
            <p className="mt-6 text-sm text-slate-400">
              {projects.length} project{projects.length === 1 ? "" : "s"} shown{sectors.size > 0 && ` · ${sectors.size} sector${sectors.size === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {categories.length > 1 && (
          <div role="tablist" aria-label="Filter by service" className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-start md:justify-center">
            {(["all", ...categories] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "h-10 px-4 rounded-full border text-sm font-medium whitespace-nowrap transition-colors",
                  category === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50",
                )}
              >
                {c === "all" ? "All work" : PROJECT_CATEGORIES[c]}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-6" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="glass rounded-3xl h-[420px] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {shown.length > 0 && (
              <div className="space-y-6">
                {shown.map((project) => (
                  <PublicProjectCard key={project.slug} project={project} large />
                ))}
              </div>
            )}
            {confidential.length > 0 && (
              <>
                <h2 className="text-2xl font-bold font-poppins mt-14 mb-2">Shared without client names</h2>
                <p className="text-foreground/70 mb-6">What we built and what changed, without anything that identifies the client.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {confidential.map((project) => (
                    <ConfidentialProjectCard key={project.slug} project={project} />
                  ))}
                </div>
              </>
            )}
            <ConfidentialityNote className="mt-12" />
            <div className="text-center mt-8">
              <a
                href={WALKTHROUGH}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 rounded-xl bg-[#25D366] text-white font-semibold inline-flex items-center gap-2 hover:bg-[#1ebe5b]"
              >
                <MessageCircle className="h-5 w-5" />
                Ask for a private walkthrough
              </a>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  )
}
