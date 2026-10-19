import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <SiteLayout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="eyebrow">Error 404</p>
        <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">Page not found</h1>
        <p className="text-lg text-muted-foreground mb-8">The page you are looking for has moved or no longer exists.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </SiteLayout>
  );
};

export default NotFound;
