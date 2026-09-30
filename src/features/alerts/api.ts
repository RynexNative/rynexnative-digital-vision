import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/api"
import { fallbackAlerts } from "./fallback-alerts"
import type { SecurityAlert } from "./types"

type AlertsResult = {
  alerts: SecurityAlert[]
  /** True when the starter alerts are shown because the API could not be reached */
  isFallback: boolean
}

async function fetchPublishedAlerts(): Promise<AlertsResult> {
  try {
    const alerts = await apiGet<SecurityAlert[]>("/api/alerts/")
    if (alerts.length === 0) return { alerts: fallbackAlerts, isFallback: true }
    return { alerts, isFallback: false }
  } catch (error) {
    console.warn("Using starter alerts:", error)
    return { alerts: fallbackAlerts, isFallback: true }
  }
}

export function usePublishedAlerts() {
  return useQuery({
    queryKey: ["security-alerts", "published"],
    queryFn: fetchPublishedAlerts,
    staleTime: 5 * 60 * 1000,
  })
}
