import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Routes, Route, useParams } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { PageLoader } from "@/components/ui/loading-spinner";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { lazyWithReload } from "@/lib/lazy-with-reload";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Secondary pages are loaded on demand to keep the home page fast
const AlertsPage = lazyWithReload(() => import("./pages/AlertsPage"));
const AlertDetailPage = lazyWithReload(() => import("./pages/AlertDetailPage"));
const EstimatePage = lazyWithReload(() => import("./pages/EstimatePage"));
const DashboardApp = lazyWithReload(() => import("./pages/dashboard/DashboardApp"));
const NewsPage = lazyWithReload(() => import("./pages/NewsPage"));
const NewsDetailPage = lazyWithReload(() => import("./pages/NewsDetailPage"));
const EventsPage = lazyWithReload(() => import("./pages/EventsPage"));
const EventDetailPage = lazyWithReload(() => import("./pages/EventDetailPage"));
const TicketPage = lazyWithReload(() => import("./pages/TicketPage"));
const PackagesPage = lazyWithReload(() => import("./pages/PackagesPage"));
const PackageDetailPage = lazyWithReload(() => import("./pages/PackageDetailPage"));

// Links shared before the site moved to English paths (e.g. #/matukio/...) keep working
function LegacyRedirect({ to }: { to: string }) {
  const { slug } = useParams();
  return <Navigate to={slug ? `${to}/${slug}` : to} replace />;
}

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Remove plain anchors (e.g. "#contact") from the URL to prevent auto-scrolling,
    // but keep router paths like "#/alerts" which the HashRouter depends on
    const { hash } = window.location;
    if (hash && !hash.startsWith('#/')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <ScrollToTop />
          <FloatingWhatsApp />
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/alerts/:slug" element={<AlertDetailPage />} />
              <Route path="/estimate" element={<EstimatePage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/packages/:slug" element={<PackageDetailPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:slug" element={<NewsDetailPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailPage />} />
              <Route path="/ticket/:id" element={<TicketPage />} />
              <Route path="/tahadhari/:slug?" element={<LegacyRedirect to="/alerts" />} />
              <Route path="/habari/:slug?" element={<LegacyRedirect to="/news" />} />
              <Route path="/matukio/:slug?" element={<LegacyRedirect to="/events" />} />
              <Route path="/tiketi/:slug" element={<LegacyRedirect to="/ticket" />} />
              <Route path="/admin/*" element={<DashboardApp />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
