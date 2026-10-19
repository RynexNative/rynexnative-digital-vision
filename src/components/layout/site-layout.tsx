import type { ReactNode } from "react"
import { Navigation } from "@/components/ui/navigation"
import { Footer } from "@/components/ui/footer"
import { cn } from "@/lib/utils"

export function SiteLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-h-screen bg-background font-inter flex flex-col", className)}>
      <Navigation />
      {/* Room for the floating navigation; dark page headers slide under it (.page-hero) */}
      <main className="flex-1 pt-[5.5rem]">{children}</main>
      <Footer />
    </div>
  )
}
