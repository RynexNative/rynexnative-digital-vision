import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calculator, Menu, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSectionNav } from "@/hooks/use-section-nav";
import { cn } from "@/lib/utils";

type NavItem = { label: string; section: string } | { label: string; to: string };

const navItems: NavItem[] = [
  { label: "About", section: "about" },
  { label: "Services", section: "services" },
  { label: "Portfolio", section: "portfolio" },
  { label: "Tahadhari", to: "/tahadhari" },
  { label: "Contact", section: "contact" },
];

const itemClassName =
  "text-foreground/80 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-primary/10";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const goToSection = useSectionNav();
  const { pathname } = useLocation();

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const renderItem = (item: NavItem, mobile: boolean) => {
    const className = cn(itemClassName, mobile && "block w-full text-left text-base");
    if ("to" in item) {
      const active = pathname.startsWith(item.to);
      return (
        <Link
          key={item.label}
          to={item.to}
          aria-current={active ? "page" : undefined}
          className={cn(className, "inline-flex items-center gap-1.5", active && "text-primary bg-primary/10")}
        >
          <ShieldAlert className="h-4 w-4" />
          {item.label}
        </Link>
      );
    }
    return (
      <button
        key={item.label}
        type="button"
        onClick={() => {
          goToSection(item.section);
          setIsOpen(false);
        }}
        className={className}
      >
        {item.label}
      </button>
    );
  };

  return <nav className="fixed top-0 w-full z-50 glass backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" onClick={() => pathname === "/" && window.scrollTo({ top: 0, behavior: "smooth" })} className="flex-shrink-0 flex items-center space-x-3">
            <img src="/uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" alt="RynexNative Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold font-poppins bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RynexNative
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2 ml-10">
            {navItems.map(item => renderItem(item, false))}
          </div>

          {/* Desktop CTA & Theme Toggle */}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            <Button asChild className="bg-gradient-primary text-white font-semibold hover:opacity-90 shadow-lg shadow-primary/20">
              <Link to="/estimate">
                <Calculator className="mr-2 h-4 w-4" />
                Get Estimate
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              className="p-2 text-foreground hover:text-primary"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background/95 backdrop-blur-xl rounded-lg mt-2 mb-3 border border-foreground/10">
              {navItems.map(item => renderItem(item, true))}
              <div className="pt-2">
                <Button asChild className="w-full bg-gradient-primary text-white font-semibold hover:opacity-90">
                  <Link to="/estimate">
                    <Calculator className="mr-2 h-4 w-4" />
                    Get Estimate
                  </Link>
                </Button>
              </div>
            </div>
          </div>}
      </div>
    </nav>;
}
