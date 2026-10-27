import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import type { Testimonial, WhyChooseUsContent } from "./types"

export function useWhyChooseUs() {
  return useQuery({
    queryKey: ["content", "why-choose-us"],
    queryFn: () => apiGet<WhyChooseUsContent>("/api/content/why-choose-us/"),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["content", "testimonials"],
    queryFn: () => apiGet<Testimonial[]>("/api/content/testimonials/"),
    staleTime: 5 * 60 * 1000,
  })
}
