import { Suspense, useEffect, useState, type ReactNode } from "react"
import { NavLink, Route, Routes, useLocation } from "react-router-dom"
import {
  Calculator,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MoreHorizontal,
  Newspaper,
  ScanLine,
  ShieldAlert,
  Users,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCurrentUser, useLogout, useStats } from "@/features/dashboard/api"
import { ErrorState } from "@/features/dashboard/ui"
import { ErrorBoundary } from "@/components/layout/error-boundary"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { lazyWithReload } from "@/lib/lazy-with-reload"
import { cn } from "@/lib/utils"
import LoginPage from "./LoginPage"

const OverviewPage = lazyWithReload(() => import("./OverviewPage"))
const AlertsAdminPage = lazyWithReload(() => import("./AlertsAdminPage"))
const EstimatesAdminPage = lazyWithReload(() => import("./EstimatesAdminPage"))
const MessagesAdminPage = lazyWithReload(() => import("./MessagesAdminPage"))
const SubscribersAdminPage = lazyWithReload(() => import("./SubscribersAdminPage"))
const NewsAdminPage = lazyWithReload(() => import("./NewsAdminPage"))
const EventsAdminPage = lazyWithReload(() => import("./EventsAdminPage"))
const EventRegistrationsPage = lazyWithReload(() => import("./EventRegistrationsPage"))
const CheckInPage = lazyWithReload(() => import("./CheckInPage"))

type NavItem = { to: string; label: string; icon: ReactNode; badge?: number }

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta")
    meta.name = "robots"
    meta.content = "noindex, nofollow"
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
}

function Shell() {
  const { data: user } = useCurrentUser()
  const { data: stats } = useStats()
  const logout = useLogout()
  const { pathname } = useLocation()

  // Braces matter: newer browsers return a Promise from scrollTo, and an effect must
  // return nothing or a cleanup function (React would call the Promise and crash)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const items: NavItem[] = [
    { to: "/admin", label: "Muhtasari", icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: "/admin/matukio", label: "Matukio", icon: <CalendarDays className="h-5 w-5" />, badge: stats?.events?.to_verify },
    { to: "/admin/maombi", label: "Maombi", icon: <Calculator className="h-5 w-5" />, badge: stats?.estimates.new },
    { to: "/admin/ujumbe", label: "Ujumbe", icon: <Mail className="h-5 w-5" />, badge: stats?.messages.new },
    { to: "/admin/habari", label: "Habari", icon: <Newspaper className="h-5 w-5" />, badge: stats?.news?.drafts },
    { to: "/admin/tahadhari", label: "Tahadhari", icon: <ShieldAlert className="h-5 w-5" />, badge: stats?.alerts.drafts },
    { to: "/admin/wanachama", label: "Wanachama", icon: <Users className="h-5 w-5" /> },
    { to: "/admin/scan", label: "Scan tiketi", icon: <ScanLine className="h-5 w-5" /> },
  ]
  // Mobile bottom bar shows the first four; the rest live under "Zaidi"
  const primaryItems = items.slice(0, 4)
  const moreItems = items.slice(4)
  const moreBadge = moreItems.reduce((sum, item) => sum + (item.badge ?? 0), 0)
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
      isActive ? "bg-primary/15 text-primary" : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
    )

  const badge = (count?: number) =>
    count ? (
      <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
        {count > 99 ? "99+" : count}
      </span>
    ) : null

  return (
    <div className="min-h-screen bg-background font-inter lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 border-r border-foreground/10 bg-card/30 sticky top-0 h-screen p-4">
        <div className="flex items-center gap-2.5 px-2 mb-8 mt-2">
          <img src="/uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" alt="" className="w-8 h-8" />
          <div>
            <p className="font-bold font-poppins leading-tight">RynexNative</p>
            <p className="text-xs text-primary font-semibold">Dashboard</p>
          </div>
        </div>
        <nav className="space-y-1 flex-1" aria-label="Dashboard">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/admin"} className={navClass}>
              {item.icon}
              {item.label}
              {badge(item.badge)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-foreground/10 pt-4 space-y-1">
          <a href="/#/" target="_blank" rel="noopener" className={navClass({ isActive: false })}>
            <ExternalLink className="h-5 w-5" />
            Fungua website
          </a>
          <button type="button" onClick={() => logout.mutate()} className={cn(navClass({ isActive: false }), "w-full")}>
            <LogOut className="h-5 w-5" />
            Toka
          </button>
          <p className="px-3 pt-2 text-xs text-foreground/50 truncate">Umeingia kama {user?.name}</p>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="lg:hidden sticky top-0 z-30 glass backdrop-blur-xl flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <img src="/uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" alt="" className="w-7 h-7" />
          <span className="font-bold font-poppins">Dashboard</span>
        </div>
        <button type="button" onClick={() => logout.mutate()} className="h-9 px-3 rounded-lg glass inline-flex items-center gap-1.5 text-sm">
          <LogOut className="h-4 w-4" />
          Toka
        </button>
      </header>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-28 lg:pb-10">
        <div className="max-w-5xl mx-auto">
          {/* Keyed by page so moving to another section clears an earlier error */}
          <ErrorBoundary key={pathname} compact>
          <Suspense
            fallback={
              <div className="py-20 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            }
          >
            <Routes>
              <Route index element={<OverviewPage />} />
              <Route path="tahadhari" element={<AlertsAdminPage />} />
              <Route path="maombi" element={<EstimatesAdminPage />} />
              <Route path="ujumbe" element={<MessagesAdminPage />} />
              <Route path="wanachama" element={<SubscribersAdminPage />} />
              <Route path="habari" element={<NewsAdminPage />} />
              <Route path="matukio" element={<EventsAdminPage />} />
              <Route path="matukio/:id" element={<EventRegistrationsPage />} />
              <Route path="scan" element={<CheckInPage />} />
              <Route path="*" element={<OverviewPage />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom navigation (mobile) */}
      <nav
        aria-label="Dashboard"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-foreground/10 bg-background/95 backdrop-blur-xl grid grid-cols-5 pb-[env(safe-area-inset-bottom)]"
      >
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium",
                isActive ? "text-primary" : "text-foreground/60",
              )
            }
          >
            {item.icon}
            {item.label}
            {item.badge ? (
              <span className="absolute top-2 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium",
            moreItems.some((i) => pathname.startsWith(i.to)) ? "text-primary" : "text-foreground/60",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Zaidi
          {moreBadge > 0 && (
            <span className="absolute top-2 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {moreBadge > 9 ? "9+" : moreBadge}
            </span>
          )}
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="lg:hidden rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Zaidi</SheetTitle>
          </SheetHeader>
          <nav className="grid grid-cols-2 gap-2" aria-label="Zaidi">
            {moreItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn("flex items-center gap-3 h-14 px-4 rounded-2xl glass text-sm font-medium", isActive && "text-primary border-primary/40")
                }
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
            <a href="/#/" target="_blank" rel="noopener" className="flex items-center gap-3 h-14 px-4 rounded-2xl glass text-sm font-medium">
              <ExternalLink className="h-5 w-5" />
              Website
            </a>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function DashboardApp() {
  useDocumentTitle("Dashboard")
  useNoIndex()
  const { data: user, isLoading, isError, refetch } = useCurrentUser()

  if (isLoading) return <FullScreenSpinner />
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full">
          <ErrorState onRetry={() => refetch()} />
        </div>
      </div>
    )
  }
  return user ? <Shell /> : <LoginPage />
}
