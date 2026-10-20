import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Gem } from "lucide-react"
import { usePackages } from "@/features/packages/api"
import { CategoryTabs, PackageCard, TrustPromises } from "@/features/packages/components"
import { usedCategories, type PackageCategory } from "@/features/packages/types"
import { useNearViewport } from "@/hooks/use-near-viewport"
import { cn } from "@/lib/utils"

/** Service packages on the home page. Hidden until at least one package is published. */
export function PackagesSection() {
  const [ref, near] = useNearViewport<HTMLDivElement>()
  const { data = [] } = usePackages({ enabled: near })
  const categories = usedCategories(data)
  const [picked, setPicked] = useState<PackageCategory | null>(null)
  // An empty marker until the visitor scrolls close, so the request waits until then
  if (data.length === 0) return <div ref={ref} aria-hidden="true" />

  const category = picked && categories.includes(picked) ? picked : categories[0]
  const packages = data.filter((p) => p.category === category).slice(0, 3)

  return (
    <section id="packages" className="py-20 relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4">
            <Gem className="h-4 w-4" />
            Service packages
          </p>
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-4">
            Quality at{" "}
            <span className="text-primary">every level</span>
          </h2>
          <p className="text-lg text-foreground/80">
            Choose the level that matches where your business is today. Every client gets the same care, honesty and attention to detail.
          </p>
        </div>

        <div className="mb-10">
          <CategoryTabs categories={categories} value={category} onChange={setPicked} />
        </div>

        <div
          className={cn(
            "grid gap-6 pt-4 items-stretch",
            packages.length === 1 ? "max-w-md mx-auto" : packages.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>

        <div className="mt-12">
          <TrustPromises compact />
        </div>

        <div className="text-center mt-10">
          <Link to="/packages" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl glass font-semibold hover:text-primary">
            All packages, our process & FAQ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
