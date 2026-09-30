import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { PageLoader } from "@/components/ui/loading-spinner";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { API_URL } from "@/lib/api";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Secondary pages are loaded on demand to keep the home page fast
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const AlertDetailPage = lazy(() => import("./pages/AlertDetailPage"));
const EstimatePage = lazy(() => import("./pages/EstimatePage"));

const queryClient = new QueryClient();

// The team now manages content in the Django admin on the API server
const AdminRedirect = () => {
  useEffect(() => {
    window.location.replace(`${API_URL}/admin/`);
  }, []);
  return <PageLoader />;
};

const App = () => {
  useEffect(() => {
    // Remove plain anchors (e.g. "#contact") from the URL to prevent auto-scrolling,
    // but keep router paths like "#/tahadhari" which the HashRouter depends on
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tahadhari" element={<AlertsPage />} />
              <Route path="/tahadhari/:slug" element={<AlertDetailPage />} />
              <Route path="/estimate" element={<EstimatePage />} />
              <Route path="/admin" element={<AdminRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
