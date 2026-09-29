import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { fallbackAlerts } from "./fallback-alerts"
import type { SecurityAlert } from "./types"

export const ALERT_COLUMNS =
  "id, slug, title, summary, description, category, severity, signs, prevention, if_affected, is_published, published_at"

type AlertsResult = {
  alerts: SecurityAlert[]
  /** True when the starter alerts are shown because the database could not be read */
  isFallback: boolean
}

async function fetchPublishedAlerts(): Promise<AlertsResult> {
  const { data, error } = await supabase
    .from("security_alerts")
    .select(ALERT_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(100)

  if (error || !data || data.length === 0) {
    if (error) console.warn("Using starter alerts:", error.message)
    return { alerts: fallbackAlerts, isFallback: true }
  }
  return { alerts: data as SecurityAlert[], isFallback: false }
}

export function usePublishedAlerts() {
  return useQuery({
    queryKey: ["security-alerts", "published"],
    queryFn: fetchPublishedAlerts,
    staleTime: 5 * 60 * 1000,
  })
}
