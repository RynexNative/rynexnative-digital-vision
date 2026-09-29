import type { ReactNode } from "react"
import { Navigation } from "@/components/ui/navigation"
import { Footer } from "@/components/ui/footer"
import { cn } from "@/lib/utils"

export function SiteLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-h-screen bg-background font-inter flex flex-col", className)}>
      <Navigation />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  )
}
