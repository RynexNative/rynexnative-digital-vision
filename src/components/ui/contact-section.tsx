import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiPost, errorMessage } from "@/lib/api";
export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiPost("/api/contact/", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        message: formData.message.trim()
      });
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours."
      });
      setFormData({
        name: "",
        email: "",
        company: "",
        message: ""
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      // Keep the form data so the user can retry
      toast({
        variant: "destructive",
        title: "Message not sent",
        description: errorMessage(error, "Something went wrong. Please try again or email us at info@rynexnative.com.")
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  return <section id="contact" className="py-20 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-poppins mb-6">
            Let's Start Building
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Something Amazing
            </span>
          </h2>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Ready to transform your ideas into reality? Get in touch and let's discuss your next project.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold font-poppins mb-6 text-foreground">
                Get in Touch
              </h3>
              <p className="text-foreground/80 leading-relaxed mb-8">
                Whether you have a specific project in mind or just want to explore possibilities, 
                we're here to help turn your vision into reality.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Email Us</div>
                  <a href="mailto:info@rynexnative.com" className="text-primary hover:underline">info@rynexnative.com</a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Call Us</div>
                  <div className="text-primary">
                    <a href="tel:+255687544999" className="hover:underline">(+255) 687-544-999</a><br />
                    <a href="tel:+255655439496" className="hover:underline">(+255) 655-439-496</a>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Visit Us</div>
                  <div className="text-foreground/70">
                    Tanzania, Dodoma<br />
                    Dodoma Mjini, Miyuji
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Response Time</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Email Inquiries:</span>
                  <span className="text-primary font-semibold">Within 4 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Project Proposals:</span>
                  <span className="text-primary font-semibold">Within 24 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Emergency Support:</span>
                  <span className="text-primary font-semibold">Immediate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name *
                  </label>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required maxLength={100} className="glass border-foreground/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required maxLength={254} className="glass border-foreground/20 focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company
                </label>
                <Input name="company" value={formData.company} onChange={handleChange} placeholder="Your company" maxLength={100} className="glass border-foreground/20 focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Details *
                </label>
                <Textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us about your project, timeline, and goals..." rows={5} required maxLength={5000} className="glass border-foreground/20 focus:border-primary resize-none" />
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full neu-button text-lg py-4 group border-primary/20 text-slate-800">
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className="text-xs text-foreground/60 text-center">
                We only use your details to respond to your inquiry.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>;
}