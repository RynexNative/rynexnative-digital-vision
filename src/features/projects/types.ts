export type ProjectVisibility = "public" | "confidential"
export type ProjectCategory = "website" | "system" | "mobile" | "security" | "ai" | "cloud" | "other"
export type ProjectStatus = "live" | "in_development" | "supported" | "completed"

export type Project = {
  slug: string
  title: string
  visibility: ProjectVisibility
  category: ProjectCategory
  status: ProjectStatus
  sector: string
  location: string
  year: number | null
  /** Empty for confidential projects */
  client_name: string
  /** How a confidential client is described, e.g. "A microfinance institution" */
  client_description: string
  link: string
  gallery: string[]
  summary: string
  challenge: string
  solution: string
  results: string[]
  highlights: { value: string; label: string }[]
  tech: string[]
  testimonial: string
  testimonial_author: string
  cover_image: string
  is_featured: boolean
  published_at: string | null
}

export const PROJECT_CATEGORIES: Record<ProjectCategory, string> = {
  website: "Websites",
  system: "Management systems",
  mobile: "Mobile apps",
  security: "Cybersecurity",
  ai: "AI & data",
  cloud: "Cloud & infrastructure",
  other: "Other",
}

export const PROJECT_STATUS: Record<ProjectStatus, string> = {
  live: "Live",
  in_development: "In development",
  supported: "Live · supported by us",
  completed: "Delivered",
}

/** Who the project was for, without ever naming a confidential client */
export function clientLine(project: Project) {
  if (project.visibility === "public") return project.client_name || project.sector
  return project.client_description || `A client in ${project.sector || "Tanzania"}`
}

/** The school system, shown if the API cannot be reached so the section is never empty */
export const FALLBACK_PROJECTS: Project[] = [
  {
    slug: "school-management-system",
    title: "School Management System",
    visibility: "public",
    category: "system",
    status: "live",
    sector: "Education",
    location: "Tanzania",
    year: null,
    client_name: "",
    client_description: "",
    link: "https://school.rynexnative.com",
    gallery: [],
    summary: "One system for student records, attendance, exams, results and school fees.",
    challenge: "",
    solution: "",
    results: [],
    highlights: [],
    tech: ["React + Vite", "Django", "PostgreSQL", "FastAPI"],
    testimonial: "",
    testimonial_author: "",
    cover_image: "/projects/school-management-system.webp",
    is_featured: true,
    published_at: null,
  },
]
