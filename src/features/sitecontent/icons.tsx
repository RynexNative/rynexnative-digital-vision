import {
  Award,
  Clock,
  FileCheck2,
  GraduationCap,
  Handshake,
  Heart,
  Home,
  KeyRound,
  LifeBuoy,
  Lock,
  MapPin,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

/** Must match ICONS in the backend (apps/sitecontent/models.py) */
export const CONTENT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  handshake: { icon: Handshake, label: "Handshake" },
  shield: { icon: ShieldCheck, label: "Shield" },
  file: { icon: FileCheck2, label: "Agreement" },
  map: { icon: MapPin, label: "Location" },
  lifebuoy: { icon: LifeBuoy, label: "Support" },
  key: { icon: KeyRound, label: "Key" },
  users: { icon: Users, label: "People" },
  clock: { icon: Clock, label: "Time" },
  heart: { icon: Heart, label: "Heart" },
  home: { icon: Home, label: "Home" },
  phone: { icon: Phone, label: "Phone" },
  graduation: { icon: GraduationCap, label: "Training" },
  sparkles: { icon: Sparkles, label: "Quality" },
  lock: { icon: Lock, label: "Lock" },
  award: { icon: Award, label: "Award" },
  rocket: { icon: Rocket, label: "Rocket" },
}

export function ContentIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (CONTENT_ICONS[name] ?? CONTENT_ICONS.sparkles).icon
  return <Icon className={className} aria-hidden="true" />
}
