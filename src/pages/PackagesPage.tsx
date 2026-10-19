import { useState } from "react"
import { Link } from "react-router-dom"
import { Calculator, Gem, MessageCircle } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { usePackages } from "@/features/packages/api"
import { CategoryTabs, PackageCard, PackageCardSkeleton, ProcessSteps, TrustPromises } from "@/features/packages/components"
import { PACKAGE_FAQ } from "@/features/packages/content"
import { packageWhatsAppLink, usedCategories, type PackageCategory } from "@/features/packages/types"
import { cn } from "@/lib/utils"

export default function PackagesPage() {
  useDocumentTitle("Service Packages")
  const { data = [], isLoading, isError, refetch } = usePackages()
  const categories = usedCategories(data)
  const [picked, setPicked] = useState<PackageCategory | null>(null)
  const category = picked && categories.includes(picked) ? picked : categories[0]
  const packages = data.filter((p) => p.category === category)

  return (
    <SiteLayout>
      <section className="surface-dark page-hero relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <Gem className="h-4 w-4" />
            Service packages
          </p>
          <h1 className="text-4xl md:text-6xl font-bold font-poppins text-white mb-5">
            The right level for{" "}
            <span className="text-primary">where you are going</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Every business is at a different stage. Choose the level that fits yours. Whatever you choose, you get the same care, honesty and
            attention to quality.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {Array.from({ length: 3 }, (_, i) => <PackageCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="font-semibold mb-2">Could not load the packages</p>
            <button type="button" onClick={() => refetch()} className="text-primary font-semibold hover:underline">
              Try again
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center max-w-2xl mx-auto">
            <Gem className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-xl font-semibold mb-2">Our packages are being prepared</p>
            <p className="text-foreground/70 mb-6">Tell us what you need and we will recommend the right level for you.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={packageWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 rounded-xl bg-[#25D366] text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1ebe5b]"
              >
                <MessageCircle className="h-5 w-5" />
                Talk to us on WhatsApp
              </a>
              <Link to="/estimate" className="h-12 px-6 rounded-xl glass font-semibold inline-flex items-center justify-center gap-2 hover:text-primary">
                <Calculator className="h-5 w-5" />
                Get an estimate
              </Link>
            </div>
          </div>
        ) : (
          <>
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
            <p className="text-center text-sm text-foreground/60 mt-8">
              Not sure which level fits?{" "}
              <a href={packageWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                Ask us on WhatsApp
              </a>{" "}
              and we will give you an honest recommendation.
            </p>
          </>
        )}

        <section className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-3">What you can count on</h2>
            <p className="text-foreground/70 text-lg">The way we work does not change with the size of the project.</p>
          </div>
          <TrustPromises />
        </section>

        <section className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-3">How we work together</h2>
            <p className="text-foreground/70 text-lg">Simple, transparent steps from the first conversation to launch and beyond.</p>
          </div>
          <ProcessSteps />
        </section>

        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-6 text-center">Questions clients ask</h2>
          <Accordion type="single" collapsible className="glass rounded-3xl px-6">
            {PACKAGE_FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`q${i}`} className={i === PACKAGE_FAQ.length - 1 ? "border-b-0" : undefined}>
                <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="text-foreground/75 leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </SiteLayout>
  )
}
