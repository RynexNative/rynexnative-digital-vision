import { Star, Quote } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO, TechFlow Solutions",
      company: "TechFlow Solutions",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      content: "RynexNative transformed our legacy system into a modern, scalable platform. Their expertise in cloud migration and security implementation exceeded our expectations. The team's dedication and technical prowess are unmatched.",
      project: "Cloud Migration & Security Audit"
    },
    {
      name: "Marcus Rodriguez",
      role: "CEO, InnovateLab",
      company: "InnovateLab",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      content: "Working with RynexNative on our mobile app was incredible. They delivered a feature-rich, intuitive application that our users love. Their agile approach and constant communication made the entire process seamless.",
      project: "iOS & Android App Development"
    },
    {
      name: "Dr. Emily Watson",
      role: "Director of IT, MedCore",
      company: "MedCore Healthcare",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      content: "The AI-powered healthcare platform RynexNative built for us has revolutionized our patient care delivery. Their understanding of healthcare compliance and technical innovation is remarkable.",
      project: "AI Healthcare Platform"
    }
  ]

  return (
    <section id="testimonials" className="py-20 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Client <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Testimonials</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it - hear from the leaders who've experienced our impact firsthand
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="group glass rounded-3xl p-8 hover-lift relative overflow-hidden"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-12 w-12 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-foreground/80 leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </blockquote>

              {/* Project Type */}
              <div className="mb-6">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20">
                  {testimonial.project}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center">
                <img 
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-primary/20"
                />
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-foreground/60">{testimonial.role}</div>
                  <div className="text-sm text-primary">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold font-poppins text-foreground mb-4">
              Trusted by Industry Leaders
            </h3>
            <p className="text-foreground/80">
              Join the growing list of companies that rely on our expertise
            </p>
          </div>
          
          <div className="glass rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
              {/* Company Logos Placeholder */}
              <div className="text-center">
                <div className="w-24 h-12 bg-gradient-primary/20 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-primary">TechFlow</span>
                </div>
              </div>
              <div className="text-center">
                <div className="w-24 h-12 bg-gradient-card/20 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-accent">InnovateLab</span>
                </div>
              </div>
              <div className="text-center">
                <div className="w-24 h-12 bg-gradient-primary/20 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-electric-teal">MedCore</span>
                </div>
              </div>
              <div className="text-center">
                <div className="w-24 h-12 bg-gradient-card/20 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-tech-purple">DataSync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}