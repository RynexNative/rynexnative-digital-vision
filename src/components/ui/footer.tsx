import { Zap, Github, Linkedin, Twitter, Mail, Send } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleSubscribe = async () => {
    if (!email) return
    
    setIsSubscribing(true)
    try {
      // Save email subscription to Supabase
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: email,
          subscribed_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving subscription:', error)
      }

      alert('Thank you for subscribing! We\'ll keep you updated.')
      setEmail("")
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('Thank you for subscribing! We\'ll keep you updated.')
      setEmail("")
    } finally {
      setIsSubscribing(false)
    }
  }

  const footerLinks = {
    company: [
      { label: "About Us", href: "#about" },
      { label: "Our Team", href: "#team" },
      { label: "Careers", href: "#careers" },
      { label: "News", href: "#news" }
    ],
    services: [
      { label: "Software Development", href: "#services" },
      { label: "Mobile Apps", href: "#services" },
      { label: "Cybersecurity", href: "#services" },
      { label: "AI Solutions", href: "#services" }
    ],
    resources: [
      { label: "Blog", href: "#blog" },
      { label: "Case Studies", href: "#portfolio" },
      { label: "Documentation", href: "#docs" },
      { label: "Support", href: "#support" }
    ],
    legal: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Cookie Policy", href: "#cookies" },
      { label: "GDPR", href: "#gdpr" }
    ]
  }

  const socialLinks = [
    { icon: <Github className="h-5 w-5" />, href: "#", label: "GitHub" },
    { icon: <Linkedin className="h-5 w-5" />, href: "#", label: "LinkedIn" },
    { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter" },
    { icon: <Mail className="h-5 w-5" />, href: "#", label: "Email" }
  ]

  return (
    <footer className="bg-background border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" 
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
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Services</h3>
              <ul className="space-y-3">
                {footerLinks.services.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-foreground/70 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-card border border-foreground/20 rounded-l-lg focus:outline-none focus:border-primary text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
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
              © 2024 RynexNative. All rights reserved.
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