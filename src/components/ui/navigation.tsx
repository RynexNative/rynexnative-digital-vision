import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [{
    label: "About",
    href: "#about"
  }, {
    label: "Services",
    href: "#services"
  }, {
    label: "Portfolio",
    href: "#portfolio"
  }, {
    label: "Testimonials",
    href: "#testimonials"
  }, {
    label: "Contact",
    href: "#contact"
  }];
  return <nav className="fixed top-0 w-full z-50 glass backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <img src="/lovable-uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" alt="RynexNative Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold font-poppins bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                RynexNative
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map(item => <a key={item.label} href={item.href} className="text-foreground/80 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-primary/10">
                  {item.label}
                </a>)}
            </div>
          </div>

          {/* Desktop CTA & Theme Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button onClick={() => document.getElementById('contact')?.scrollIntoView({
            behavior: 'smooth'
          })} className="neu-button border-primary/20 text-slate-900">
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button onClick={() => setIsOpen(!isOpen)} className="text-foreground hover:text-primary">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background/95 backdrop-blur-xl rounded-lg mt-2">
              {navItems.map(item => <a key={item.label} href={item.href} className="text-foreground/80 hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200" onClick={() => setIsOpen(false)}>
                  {item.label}
                </a>)}
              <div className="pt-2">
                <Button className="w-full neu-button border-primary/20" onClick={() => {
              document.getElementById('contact')?.scrollIntoView({
                behavior: 'smooth'
              });
              setIsOpen(false);
            }}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>}
      </div>
    </nav>;
}