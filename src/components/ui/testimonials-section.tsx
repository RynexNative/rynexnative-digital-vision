import { Star, Quote } from "lucide-react"
import Founder from './Founder.jsx'

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Julio Shirima",
      role: "CTO, TechFlow Solutions",
      company: "TechFlow Solutions",
      image: "https://scontent.fdod1-1.fna.fbcdn.net/v/t39.30808-1/475462801_622684644033842_8671174030927481850_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=106&ccb=1-7&_nc_sid=1d2534&_nc_ohc=ibsuN4vg0mgQ7kNvwHlt-QN&_nc_oc=AdmKDoShKs8AtqqOGKCUIEvuIIhboBHcesmvumrcglcwfZk7m57Q_Q6GWut8PfnFw_0&_nc_zt=24&_nc_ht=scontent.fdod1-1.fna&_nc_gid=BuDNedn2fsFbezttc92Czg&oh=00_AfT6nN4y_BLJ4dHE7f44S4MWdTa65c6K9IoXBJIauFvw8g&oe=688E243C",
      rating: 5,
      content: "RynexNative transformed our legacy system into a modern, scalable platform. Their expertise in cloud migration and security implementation exceeded our expectations. The team's dedication and technical prowess are unmatched.",
      project: "Cloud Migration & Security Audit"
    },
    {
      name: "Deogratius W. Massawe",
      role: "CEO, Yiit",
      company: "YIIT",
      image: "https://scontent.fdod1-1.fna.fbcdn.net/v/t39.30808-1/336665234_207885211940070_3678893893919180023_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=111&ccb=1-7&_nc_sid=e99d92&_nc_ohc=i1DYqGTY9doQ7kNvwGn9yjt&_nc_oc=AdlXhAR0FCNv10X3CDrWM1Md0q6NhPAy8ApjvBOFouekOzZxbzSY2pAjhaweD0aFjD8&_nc_zt=24&_nc_ht=scontent.fdod1-1.fna&_nc_gid=wWbEec_oVXXXUV0z5gbxgw&oh=00_AfQF_qV0afALR4YxyTW8xdmHjdu2MHkpHqxX8PYcShlmJg&oe=688E3350",
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

  const castoinfo =
  {
    name: "Casto S. Shirima",
    rating: 5,
  }


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


          <div className="text-center mb-16 p-10">
            <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-3xl font-bold p-4">
              Meet the Founder
            </h2>

            <div className="glass rounded-lg p-7 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">

              {/* Founder Image */}
              <div className="flex justify-center items-center">
                <img
                  src="https://scontent.fdod1-1.fna.fbcdn.net/v/t39.30808-1/459134632_122131539800364312_4254526476636648097_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=103&ccb=1-7&_nc_sid=1d2534&_nc_ohc=1_Rtpms6qZQQ7kNvwH6-xXa&_nc_oc=AdlrXeQnpneA0PVDQnL50QLiQh6e3ISXLRrY0Z4KngZSUz35OepMvWm1qW7FRsypPfM&_nc_zt=24&_nc_ht=scontent.fdod1-1.fna&_nc_gid=fhE8bUzcYkZbQ9K1AzXFjQ&oh=00_AfSCTv4JwTadqNwlhECkjyDExr6CDKCCPQrKYviSZGbf9g&oe=688E0EEE"
                  alt="Founder of RynexNative"
                  className="w-48 h-48 rounded-full object-cover border-2 border-primary/20"
                />
                
              </div>
              

              {/* Founder Info */}
              <div className="relative overflow-hidden group text-left md:col-span-2 lg:col-span-2">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="h-12 w-12 text-primary" />
                </div>

                <div className="flex mb-6">
                  {[...Array(castoinfo.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>

                <h3 className="font-semibold text-lg">{castoinfo.name}</h3>

                <blockquote className="text-foreground/80 leading-relaxed mb-6 relative z-10">
                  "Casto is the visionary behind RynexNative, a passionate technologist, ethical hacker,
                  and advocate for digital transformation in Africa. With a mission to innovate and secure the digital space,
                  Casto has led numerous initiatives in system development, mobile innovation, and cybersecurity solutions.
                  My dream is to empower Africa through technology, foster home-grown innovations, and protect the digital future of our people."
                </blockquote>
                <div className="mb-6">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20">
                  CEO - Rynexnative, Fullstack Developer
                  </span>
                </div>
              </div>
            </div>
          </div>




        </div>
      </div>
    </section>
  )
}