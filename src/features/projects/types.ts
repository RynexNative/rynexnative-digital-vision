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

export type TrackRecord = {
  show_projects: boolean
  show_track_record: boolean
  /** Already rounded down by the server, e.g. "50+" */
  totals: { key: string; label: string; display: string }[]
  by_service: { label: string; display: string; count: number }[]
  by_client_type: { label: string; display: string; count: number }[]
  sectors: string[]
  min_group: number
}
