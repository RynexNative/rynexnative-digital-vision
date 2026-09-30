import { Github, Instagram, Mail, Send } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useSectionNav } from "@/hooks/use-section-nav"
import { apiPost, errorMessage } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/


export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  const handleSubscribe = async () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || isSubscribing) return

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address."
      })
      return
    }

    setIsSubscribing(true)
    try {
      const { status } = await apiPost<{ status: "subscribed" | "already_subscribed" }>(
        "/api/newsletter/",
        { email: trimmedEmail }
      )
      const alreadySubscribed = status === "already_subscribed"

      toast({
        title: alreadySubscribed ? "Already subscribed" : "Thank you for subscribing!",
        description: alreadySubscribed
          ? "This email is already on our list."
          : "We'll keep you updated."
      })
      setEmail("")
    } catch (error) {
      console.error('Error subscribing:', error)
      toast({
        variant: "destructive",
        title: "Subscription failed",
        description: errorMessage(error, "Something went wrong. Please try again.")
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  const scrollTo = useSectionNav()

  // Links either scroll to a home page section (see Index.tsx for ids) or open a page
  const footerLinks: Record<string, ({ label: string; target: string } | { label: string; to: string })[]> = {
    company: [
      { label: "About Us", target: "about" },
      { label: "Our Founder", target: "founder" },
      { label: "Testimonials", target: "testimonials" },
      { label: "Contact", target: "contact" }
    ],
    services: [
      { label: "Software Development", target: "services" },
      { label: "Mobile Apps", target: "services" },
      { label: "Cybersecurity", target: "services" },
      { label: "AI Solutions", target: "services" }
    ],
    resources: [
      { label: "Tahadhari za Usalama", to: "/tahadhari" },
      { label: "Project Estimator", to: "/estimate" },
      { label: "Case Studies", target: "portfolio" },
      { label: "Support", target: "contact" }
    ]
  }

  const socialLinks = [
    { icon: <Github className="h-5 w-5" />, href: "https://github.com/rynexnative", label: "GitHub" },
    { icon: <Instagram className="h-5 w-5" />, href: "https://www.instagram.com/rynexnative", label: "Instagram" },
    { icon: <Mail className="h-5 w-5" />, href: "mailto:info@rynexnative.com", label: "Email" }
  ]

  return (
    <footer className="bg-background border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="sm:col-span-3 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" 
                  alt="RynexNative Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold font-poppins bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  RynexNative
                </span>
              </div>
              
              <p className="text-foreground/80 mb-6 leading-relaxed">
                Building intelligent solutions for a connected world through innovative technology 
                and exceptional engineering expertise.
              </p>
              
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    {...(social.href.startsWith('http') ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="w-10 h-10 bg-card hover:bg-primary/10 rounded-lg flex items-center justify-center transition-colors group"
                  >
                    <div className="text-foreground/60 group-hover:text-primary transition-colors">
                      {social.icon}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            {([
              ["Company", footerLinks.company],
              ["Services", footerLinks.services],
              ["Resources", footerLinks.resources]
            ] as const).map(([title, links]) => (
              <div key={title}>
                <h3 className="font-semibold text-foreground mb-4">{title}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {"to" in link ? (
                        <Link
                          to={link.to}
                          className="text-foreground/70 hover:text-primary transition-colors text-sm"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => scrollTo(link.target)}
                          className="text-foreground/70 hover:text-primary transition-colors text-sm text-left"
                        >
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-8 border-t border-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold text-foreground mb-2">Stay Updated</h3>
              <p className="text-foreground/70 text-sm">
                Get the latest insights on technology trends and project updates.
              </p>
            </div>
            <div className="flex w-full md:w-auto max-w-md">
              <input
                type="email"
                aria-label="Email address"
                maxLength={254}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-card border border-foreground/20 rounded-l-lg focus:outline-none focus:border-primary text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />
              <button 
                className="px-6 py-2 bg-gradient-primary text-white rounded-r-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
                onClick={handleSubscribe}
                disabled={isSubscribing || !email}
              >
                {isSubscribing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Subscribe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-foreground/60">
            <div>
              © {new Date().getFullYear()} RynexNative. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span>Proudly built with cutting-edge technology</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}