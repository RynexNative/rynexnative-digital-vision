import { Code, Smartphone, Shield, Brain, Cloud, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ServicesSection() {
  const services = [
    {
      icon: <Code className="h-10 w-10" />,
      title: "Software Development",
      description: "Custom web applications, enterprise software, and API development using cutting-edge technologies.",
      features: ["Full-Stack Development", "API Integration", "Database Design", "Cloud Architecture"],
      color: "primary"
    },
    {
      icon: <Smartphone className="h-10 w-10" />,
      title: "Mobile App Development",
      description: "Native iOS & Android apps and cross-platform solutions that deliver exceptional user experiences.",
      features: ["iOS Development", "Android Development", "React Native", "Flutter"],
      color: "accent"
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Cyber Security Solutions",
      description: "Comprehensive security audits, penetration testing, and robust protection strategies.",
      features: ["Security Audits", "Penetration Testing", "Compliance", "Risk Assessment"],
      color: "electric-teal"
    },
    {
      icon: <Brain className="h-10 w-10" />,
      title: "AI & Machine Learning",
      description: "Intelligent automation, predictive analytics, and AI-powered solutions for modern businesses.",
      features: ["Machine Learning", "Natural Language Processing", "Computer Vision", "Predictive Analytics"],
      color: "tech-purple"
    },
    {
      icon: <Cloud className="h-10 w-10" />,
      title: "Cloud Solutions",
      description: "Scalable cloud infrastructure, migration services, and serverless architectures.",
      features: ["AWS/Azure/GCP", "DevOps", "Serverless", "Migration"],
      color: "cyber-blue"
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: "IoT Development",
      description: "Connected devices, smart systems, and IoT platforms that bridge physical and digital worlds.",
      features: ["Device Integration", "IoT Platforms", "Edge Computing", "Real-time Analytics"],
      color: "primary"
    }
  ]

  return (
    <section id="services" className="py-20 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Our <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Comprehensive technology solutions designed to accelerate your digital transformation journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group glass rounded-3xl p-8 hover-lift cursor-pointer relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${service.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${service.color}/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`text-${service.color}`}>
                    {service.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold font-poppins mb-4 text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-foreground/80 leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-foreground/70">
                      <div className={`w-1.5 h-1.5 bg-${service.color} rounded-full mr-3`}></div>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button variant="outline" className={`w-full glass border-${service.color}/30 hover:border-${service.color}/50 group-hover:bg-${service.color}/10`}>
                  Learn More
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-foreground/80 mb-6">
            Don't see what you're looking for? We create custom solutions for unique challenges.
          </p>
          <Button size="lg" className="neu-button px-8 py-4 border-primary/20">
            Discuss Your Project
          </Button>
        </div>
      </div>
    </section>
  )
}