import { Suspense, useEffect, useState, type ReactNode } from "react"
import { NavLink, Route, Routes, useLocation } from "react-router-dom"
import {
  Activity,
  BarChart3,
  Briefcase,
  FileText,
  Settings,
  Building2,
  Calculator,
  CreditCard,
  Globe,
  LifeBuoy,
  Server,
  CalendarDays,
  ExternalLink,
  Gem,
  Inbox,
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
import { excludeThisBrowser } from "@/lib/track"
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
const PackagesAdminPage = lazyWithReload(() => import("./PackagesAdminPage"))
const PackageRequestsPage = lazyWithReload(() => import("./PackageRequestsPage"))
const OperationsPage = lazyWithReload(() => import("./OperationsPage"))
const ClientsPage = lazyWithReload(() => import("./ClientsPage"))
const SupportPage = lazyWithReload(() => import("./SupportPage"))
const DomainsPage = lazyWithReload(() => import("./DomainsPage"))
const ServersPage = lazyWithReload(() => import("./ServersPage"))
const SubscriptionsPage = lazyWithReload(() => import("./SubscriptionsPage"))
const BillingPage = lazyWithReload(() => import("./BillingPage"))
const DocumentPage = lazyWithReload(() => import("./DocumentPage"))
const InsightsPage = lazyWithReload(() => import("./InsightsPage"))
const SettingsPage = lazyWithReload(() => import("./SettingsPage"))
const ProjectsAdminPage = lazyWithReload(() => import("./ProjectsAdminPage"))

type NavItem = { to: string; label: string; icon: ReactNode; badge?: number; group: string; /** For the narrow mobile bar */ short?: string }

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

  // The team's own visits to the website should not count in Insights
  useEffect(() => {
    excludeThisBrowser()
  }, [])

  const items: NavItem[] = [
    { group: "", to: "/admin", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { group: "Sales", to: "/admin/requests", label: "Requests", icon: <Inbox className="h-5 w-5" />, badge: stats?.packages?.inquiries_new },
    { group: "Sales", to: "/admin/billing", label: "Quotes & invoices", short: "Invoices", icon: <FileText className="h-5 w-5" /> },
    { group: "Operations", to: "/admin/operations", label: "Operations", icon: <Activity className="h-5 w-5" />, badge: stats?.operations?.attention },
    { group: "", to: "/admin/insights", label: "Insights", icon: <BarChart3 className="h-5 w-5" /> },
    { group: "Content & events", to: "/admin/events", label: "Events", icon: <CalendarDays className="h-5 w-5" />, badge: stats?.events?.to_verify },
    { group: "Sales", to: "/admin/estimates", label: "Estimates", icon: <Calculator className="h-5 w-5" />, badge: stats?.estimates.new },
    { group: "Sales", to: "/admin/messages", label: "Messages", icon: <Mail className="h-5 w-5" />, badge: stats?.messages.new },
    { group: "Sales", to: "/admin/packages", label: "Packages", icon: <Gem className="h-5 w-5" /> },
    { group: "Operations", to: "/admin/clients", label: "Clients", icon: <Building2 className="h-5 w-5" /> },
    { group: "Operations", to: "/admin/support", label: "Support", icon: <LifeBuoy className="h-5 w-5" /> },
    { group: "Operations", to: "/admin/domains", label: "Domains", icon: <Globe className="h-5 w-5" /> },
    { group: "Operations", to: "/admin/servers", label: "Servers", icon: <Server className="h-5 w-5" /> },
    { group: "Operations", to: "/admin/subscriptions", label: "Subscriptions", icon: <CreditCard className="h-5 w-5" /> },
    { group: "Content & events", to: "/admin/projects", label: "Projects", icon: <Briefcase className="h-5 w-5" /> },
    { group: "Content & events", to: "/admin/news", label: "News", icon: <Newspaper className="h-5 w-5" />, badge: stats?.news?.drafts },
    { group: "Content & events", to: "/admin/alerts", label: "Alerts", icon: <ShieldAlert className="h-5 w-5" />, badge: stats?.alerts.drafts },
    { group: "Content & events", to: "/admin/subscribers", label: "Subscribers", icon: <Users className="h-5 w-5" /> },
    { group: "Content & events", to: "/admin/scan", label: "Scan tickets", icon: <ScanLine className="h-5 w-5" /> },
    { group: "Settings", to: "/admin/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ]
  // The sidebar and the "More" sheet show the items grouped
  const GROUPS = ["", "Sales", "Operations", "Content & events", "Settings"]
  const grouped = (list: NavItem[]) => GROUPS.map((g) => ({ group: g, items: list.filter((i) => i.group === g) })).filter((g) => g.items.length)
  // Mobile bottom bar shows the first four; the rest live under "More"
  const primaryItems = items.slice(0, 4)
  const moreItems = items.slice(4)
  const moreBadge = moreItems.reduce((sum, item) => sum + (item.badge ?? 0), 0)
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors",
      isActive ? "bg-primary/15 text-primary" : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
    )

  const badge = (count?: number) =>
    count ? (
      <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
        {count > 99 ? "99+" : count}
      </span>
    ) : null

  return (
    <div className="min-h-screen section-muted font-inter lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 border-r border-border bg-background sticky top-0 h-screen p-4">
        <div className="flex items-center gap-2.5 px-2 mb-5 mt-1">
          <img src="/logo-64.webp" alt="" className="w-8 h-8" />
          <div>
            <p className="font-bold font-poppins leading-tight">RynexNative</p>
            <p className="text-xs text-primary font-semibold">Dashboard</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto -mx-1 px-1 space-y-3 pb-2" aria-label="Dashboard">
          {grouped(items).map(({ group, items: groupItems }) => (
            <div key={group || "main"} className="space-y-0.5">
              {group && <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/40">{group}</p>}
              {groupItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/admin"} className={navClass}>
                  {item.icon}
                  {item.label}
                  {badge(item.badge)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-border pt-3">
          <p className="px-3 pb-2 text-xs text-foreground/50 truncate">Signed in as {user?.name}</p>
          <div className="grid grid-cols-2 gap-1">
            <a href="/" target="_blank" rel="noopener" className={cn(navClass({ isActive: false }), "gap-2")}>
              <ExternalLink className="h-4 w-4" />
              Website
            </a>
            <button type="button" onClick={() => logout.mutate()} className={cn(navClass({ isActive: false }), "gap-2")}>
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="lg:hidden sticky top-0 z-30 glass backdrop-blur-xl flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <img src="/logo-64.webp" alt="" className="w-7 h-7" />
          <span className="font-bold font-poppins">Dashboard</span>
        </div>
        <button type="button" onClick={() => logout.mutate()} className="h-9 px-3 rounded-lg glass inline-flex items-center gap-1.5 text-sm">
          <LogOut className="h-4 w-4" />
          Log out
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
              <Route path="alerts" element={<AlertsAdminPage />} />
              <Route path="estimates" element={<EstimatesAdminPage />} />
              <Route path="messages" element={<MessagesAdminPage />} />
              <Route path="subscribers" element={<SubscribersAdminPage />} />
              <Route path="news" element={<NewsAdminPage />} />
              <Route path="events" element={<EventsAdminPage />} />
              <Route path="events/:id" element={<EventRegistrationsPage />} />
              <Route path="scan" element={<CheckInPage />} />
              <Route path="packages" element={<PackagesAdminPage />} />
              <Route path="requests" element={<PackageRequestsPage />} />
              <Route path="operations" element={<OperationsPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="domains" element={<DomainsPage />} />
              <Route path="servers" element={<ServersPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="billing/:id" element={<DocumentPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="projects" element={<ProjectsAdminPage />} />
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
            {item.short ?? item.label}
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
          More
          {moreBadge > 0 && (
            <span className="absolute top-2 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {moreBadge > 9 ? "9+" : moreBadge}
            </span>
          )}
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="lg:hidden rounded-t-3xl max-h-[85svh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <nav className="grid grid-cols-2 gap-2" aria-label="More">
            {grouped(moreItems).map(({ group, items: groupItems }) => (
              <div key={group} className="col-span-2 grid grid-cols-2 gap-2">
                <p className="col-span-2 pt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/40">{group}</p>
                {groupItems.map((item) => (
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
              </div>
            ))}
            <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 h-14 px-4 rounded-2xl glass text-sm font-medium">
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
