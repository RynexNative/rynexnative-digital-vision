export type PackageCategory = "website" | "mobile-app" | "system" | "security" | "training" | "care" | "other"

export type ServicePackage = {
  id: string
  slug: string
  name: string
  category: PackageCategory
  tier: string
  audience: string
  tagline: string
  description: string
  cover_image: string
  /** TZS; null means a tailored quote */
  price: number | null
  price_label: string
  price_note: string
  features: string[]
  experience: string[]
  delivery_time: string
  support: string
  guarantee: string
  badge: string
  is_featured: boolean
  /** Added value for a limited time (never a discount); empty when none */
  bonus: string
  bonus_ends_at: string | null
}

export type PreferredContact = "whatsapp" | "call" | "email"

export type InquiryInput = {
  name: string
  phone: string
  email: string
  company: string
  message: string
  preferred_contact: PreferredContact
  website: string
}

export const PACKAGE_CATEGORIES: Record<PackageCategory, string> = {
  website: "Websites",
  "mobile-app": "Mobile apps",
  system: "Business systems",
  security: "Cybersecurity",
  training: "Training",
  care: "Care & support",
  other: "Other",
}

export const CONTACT_OPTIONS: Record<PreferredContact, string> = {
  whatsapp: "WhatsApp",
  call: "Phone call",
  email: "Email",
}

export const WHATSAPP_NUMBER = "255687544999"

export function formatAmount(price: number) {
  return `TZS ${new Intl.NumberFormat("en-US").format(price)}`
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" })

export function formatBonusEnd(iso: string | null) {
  return iso ? dateFormatter.format(new Date(iso)) : ""
}

export function packageWhatsAppLink(pkg?: Pick<ServicePackage, "name">, name?: string) {
  const intro = name ? `Hello RynexNative, my name is ${name}.` : "Hello RynexNative."
  const text = pkg ? `${intro} I'm interested in the ${pkg.name} package. Can we talk?` : `${intro} I'd like to talk about a project.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/** Categories in a stable order, keeping only those that have packages */
export function usedCategories(packages: ServicePackage[]) {
  const present = new Set(packages.map((p) => p.category))
  return (Object.keys(PACKAGE_CATEGORIES) as PackageCategory[]).filter((c) => present.has(c))
}
