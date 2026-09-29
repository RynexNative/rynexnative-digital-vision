// Price list for the project estimator.
// All amounts are in Tanzanian Shillings (TZS). Adjust these numbers to match
// your real pricing; the estimator UI and calculations update automatically.

export type ScaleId = "small" | "medium" | "large"

export type Scale = {
  id: ScaleId
  label: string
  description: string
  min: number
  max: number
  weeks: [number, number]
}

export type ProjectTypeId = "website" | "ecommerce" | "mobile-app" | "management-system" | "web-app" | "security-audit"

export type ProjectType = {
  id: ProjectTypeId
  label: string
  tagline: string
  icon: "globe" | "cart" | "smartphone" | "school" | "layout" | "shield"
  scales: Scale[]
  features: FeatureId[]
  /** Security audits have no visual design step */
  hasDesign: boolean
}

export type FeatureId =
  | "mobile-money"
  | "accounts"
  | "admin-dashboard"
  | "sms"
  | "bilingual"
  | "reports"
  | "integrations"
  | "branding"
  | "content"
  | "offline"
  | "push-notifications"
  | "retest"
  | "training"

export type Feature = {
  id: FeatureId
  label: string
  description: string
  min: number
  max: number
  /** Extra weeks this feature adds */
  weeks: number
}

export const FEATURES: Record<FeatureId, Feature> = {
  "mobile-money": {
    id: "mobile-money",
    label: "Mobile money payments",
    description: "M-Pesa, Mixx by Yas, Airtel Money and card payments",
    min: 600_000,
    max: 1_200_000,
    weeks: 1,
  },
  accounts: {
    id: "accounts",
    label: "User accounts & login",
    description: "Sign up, login, password reset and user profiles",
    min: 400_000,
    max: 800_000,
    weeks: 1,
  },
  "admin-dashboard": {
    id: "admin-dashboard",
    label: "Admin dashboard",
    description: "Manage content, users and orders without touching code",
    min: 700_000,
    max: 1_500_000,
    weeks: 1,
  },
  sms: {
    id: "sms",
    label: "SMS notifications",
    description: "Automatic SMS for orders, reminders and alerts",
    min: 300_000,
    max: 600_000,
    weeks: 0.5,
  },
  bilingual: {
    id: "bilingual",
    label: "English & Kiswahili",
    description: "Full content in both languages with a language switch",
    min: 300_000,
    max: 700_000,
    weeks: 0.5,
  },
  reports: {
    id: "reports",
    label: "Reports & analytics",
    description: "Charts, exports to Excel/PDF and key business numbers",
    min: 500_000,
    max: 1_200_000,
    weeks: 1,
  },
  integrations: {
    id: "integrations",
    label: "Connect to existing systems",
    description: "APIs, accounting software or government systems",
    min: 800_000,
    max: 2_000_000,
    weeks: 1.5,
  },
  branding: {
    id: "branding",
    label: "Logo & branding",
    description: "Logo, colours and a simple brand guide",
    min: 300_000,
    max: 700_000,
    weeks: 0.5,
  },
  content: {
    id: "content",
    label: "Content writing",
    description: "We write the text for your pages",
    min: 200_000,
    max: 500_000,
    weeks: 0.5,
  },
  offline: {
    id: "offline",
    label: "Works offline",
    description: "Keeps working with poor or no internet and syncs later",
    min: 1_000_000,
    max: 2_500_000,
    weeks: 2,
  },
  "push-notifications": {
    id: "push-notifications",
    label: "Push notifications",
    description: "Send updates straight to your users' phones",
    min: 400_000,
    max: 900_000,
    weeks: 0.5,
  },
  retest: {
    id: "retest",
    label: "Re-test after fixes",
    description: "We verify every issue is properly fixed",
    min: 500_000,
    max: 1_000_000,
    weeks: 0.5,
  },
  training: {
    id: "training",
    label: "Staff security training",
    description: "Practical session on phishing, passwords and safe habits",
    min: 600_000,
    max: 1_200_000,
    weeks: 0.5,
  },
}

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: "website",
    label: "Company Website",
    tagline: "Show your business online and get more customers",
    icon: "globe",
    hasDesign: true,
    features: ["content", "branding", "bilingual", "admin-dashboard", "sms"],
    scales: [
      { id: "small", label: "Starter", description: "1–5 pages", min: 800_000, max: 1_500_000, weeks: [1, 2] },
      { id: "medium", label: "Business", description: "6–12 pages, blog or news", min: 1_500_000, max: 3_000_000, weeks: [2, 4] },
      { id: "large", label: "Corporate", description: "13+ pages, multiple sections", min: 3_000_000, max: 6_000_000, weeks: [4, 6] },
    ],
  },
  {
    id: "ecommerce",
    label: "Online Shop",
    tagline: "Sell products online and get paid by mobile money",
    icon: "cart",
    hasDesign: true,
    features: ["mobile-money", "accounts", "admin-dashboard", "sms", "reports", "bilingual", "branding", "content"],
    scales: [
      { id: "small", label: "Small shop", description: "Up to 50 products", min: 2_500_000, max: 5_000_000, weeks: [3, 5] },
      { id: "medium", label: "Growing store", description: "50–500 products, categories, discounts", min: 5_000_000, max: 9_000_000, weeks: [5, 8] },
      { id: "large", label: "Marketplace", description: "500+ products or multiple sellers", min: 9_000_000, max: 15_000_000, weeks: [8, 12] },
    ],
  },
  {
    id: "mobile-app",
    label: "Mobile App",
    tagline: "Android & iOS app your customers can install",
    icon: "smartphone",
    hasDesign: true,
    features: ["accounts", "mobile-money", "push-notifications", "offline", "admin-dashboard", "sms", "bilingual", "reports"],
    scales: [
      { id: "small", label: "Simple app", description: "Up to 5 screens", min: 4_000_000, max: 8_000_000, weeks: [4, 6] },
      { id: "medium", label: "Standard app", description: "6–15 screens, backend", min: 8_000_000, max: 15_000_000, weeks: [6, 10] },
      { id: "large", label: "Advanced app", description: "15+ screens, real-time features", min: 15_000_000, max: 30_000_000, weeks: [10, 16] },
    ],
  },
  {
    id: "management-system",
    label: "Management System",
    tagline: "School, clinic, stock, HR or SACCOS management",
    icon: "school",
    hasDesign: true,
    features: ["accounts", "reports", "sms", "mobile-money", "offline", "integrations", "bilingual"],
    scales: [
      { id: "small", label: "Essentials", description: "2–3 modules, one branch", min: 3_000_000, max: 6_000_000, weeks: [4, 6] },
      { id: "medium", label: "Complete", description: "4–7 modules, user roles", min: 6_000_000, max: 12_000_000, weeks: [6, 10] },
      { id: "large", label: "Enterprise", description: "8+ modules, multiple branches", min: 12_000_000, max: 25_000_000, weeks: [10, 16] },
    ],
  },
  {
    id: "web-app",
    label: "Custom Web App",
    tagline: "A platform or tool built around your exact process",
    icon: "layout",
    hasDesign: true,
    features: ["accounts", "admin-dashboard", "mobile-money", "reports", "integrations", "sms", "bilingual"],
    scales: [
      { id: "small", label: "MVP", description: "Core features to launch fast", min: 3_000_000, max: 6_000_000, weeks: [3, 6] },
      { id: "medium", label: "Full product", description: "Complete features and roles", min: 6_000_000, max: 12_000_000, weeks: [6, 10] },
      { id: "large", label: "Large platform", description: "Complex workflows at scale", min: 12_000_000, max: 25_000_000, weeks: [10, 16] },
    ],
  },
  {
    id: "security-audit",
    label: "Security Audit",
    tagline: "Find weaknesses before attackers do",
    icon: "shield",
    hasDesign: false,
    features: ["retest", "training"],
    scales: [
      { id: "small", label: "Website check", description: "One website or web app", min: 1_000_000, max: 2_500_000, weeks: [1, 2] },
      { id: "medium", label: "App + API", description: "Web/mobile app and its API", min: 2_500_000, max: 5_000_000, weeks: [2, 3] },
      { id: "large", label: "Full organisation", description: "Network, systems and staff", min: 5_000_000, max: 10_000_000, weeks: [3, 5] },
    ],
  },
]

export type DesignId = "template" | "custom"
export const DESIGN_OPTIONS: { id: DesignId; label: string; description: string; multiplier: number; extraWeeks: number }[] = [
  { id: "template", label: "Clean & proven", description: "Modern layout adapted to your brand. Faster and cheaper.", multiplier: 1, extraWeeks: 0 },
  { id: "custom", label: "Fully custom design", description: "Unique design made from scratch, with mockups for approval.", multiplier: 1.25, extraWeeks: 1 },
]

export type TimelineId = "flexible" | "standard" | "urgent"
export const TIMELINE_OPTIONS: { id: TimelineId; label: string; description: string; multiplier: number; weeksFactor: number }[] = [
  { id: "flexible", label: "Flexible", description: "No fixed deadline. 5% discount.", multiplier: 0.95, weeksFactor: 1.2 },
  { id: "standard", label: "Standard", description: "Normal pace with regular updates.", multiplier: 1, weeksFactor: 1 },
  { id: "urgent", label: "Urgent", description: "Priority team, delivered about 30% faster.", multiplier: 1.3, weeksFactor: 0.7 },
]

/** Optional monthly care plan shown next to the one-off estimate */
export const CARE_PLAN = {
  label: "Hosting, backups & support",
  monthly: 100_000,
}
