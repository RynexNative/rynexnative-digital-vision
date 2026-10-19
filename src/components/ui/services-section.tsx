import { Code, Smartphone, Shield, Brain, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ServicesSection() {
  const services = [{
    icon: <Code className="h-7 w-7" />,
    title: "Software Development",
    description: "Custom web applications, enterprise software, and API development using cutting-edge technologies.",
    features: ["Full-Stack Development", "API Integration", "Database Design", "Cloud Architecture"],
  }, {
    icon: <Smartphone className="h-7 w-7" />,
    title: "Mobile App Development",
    description: "Native iOS & Android apps and cross-platform solutions that deliver exceptional user experiences.",
    features: ["iOS Development", "Android Development", "React Native", "Flutter"],
  }, {
    icon: <Shield className="h-7 w-7" />,
    title: "Cyber Security Solutions",
    description: "Comprehensive security audits, penetration testing, and robust protection strategies.",
    features: ["Security Audits", "Penetration Testing", "Compliance", "Risk Assessment"],
  }, {
    icon: <Brain className="h-7 w-7" />,
    title: "AI & Machine Learning",
    description: "Intelligent automation, predictive analytics, and AI-powered solutions for modern businesses.",
    features: ["Machine Learning", "Natural Language Processing", "Computer Vision", "Predictive Analytics"],
  }, {
    icon: <Cloud className="h-7 w-7" />,
    title: "Cloud Solutions",
    description: "Scalable cloud infrastructure, migration services, and serverless architectures.",
    features: ["AWS/Azure/GCP", "DevOps", "Serverless", "Migration"],
  }, {
    icon: <Zap className="h-7 w-7" />,
    title: "IoT Development",
    description: "Connected devices, smart systems, and IoT platforms that bridge physical and digital worlds.",
    features: ["Device Integration", "IoT Platforms", "Edge Computing", "Real-time Analytics"],
  }];
  return <section id="services" className="py-20 md:py-24 section-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="eyebrow">What we do</p>
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Our <span className="text-primary">Services</span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Comprehensive technology solutions designed to accelerate your digital transformation journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => <div key={index} className="group glass rounded-3xl p-8 hover-lift cursor-pointer relative overflow-hidden">
              <div className="relative z-10">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-6 group-hover:bg-primary group-hover:scale-105 transition-all duration-300">
                  <div className="text-primary group-hover:text-primary-foreground transition-colors">
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
                  {service.features.map((feature, idx) => <div key={idx} className="flex items-center text-sm text-foreground/70">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                      {feature}
                    </div>)}
                </div>

                {/* CTA */}
                <Button variant="outline" className="w-full rounded-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => document.getElementById('contact')?.scrollIntoView({
              behavior: 'smooth'
            })}>
                  Learn More
                </Button>
              </div>
            </div>)}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-foreground/80 mb-6">
            Don't see what you're looking for? We create custom solutions for unique challenges.
          </p>
          <Button size="lg" onClick={() => document.getElementById('contact')?.scrollIntoView({
          behavior: 'smooth'
        })} className="rounded-full h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90">
            Discuss Your Project
          </Button>
        </div>
      </div>
    </section>;
}