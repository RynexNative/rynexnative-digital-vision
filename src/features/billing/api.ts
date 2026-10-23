import { useMutation, useQueryClient } from "@tanstack/react-query"
import { query, useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { dashboardFile, dashboardRequest } from "@/lib/api"
import type { BillingDocument, BusinessProfile, Payment } from "./types"

const base = "/billing/documents/"

export const useDocuments = (params: Record<string, string>) =>
  useDashboardQuery<BillingDocument[]>(["dashboard", "billing", "list", params], `${base}${query(params)}`)

export const useDocument = (id: string | undefined) =>
  useDashboardQuery<BillingDocument>(["dashboard", "billing", "doc", id], `${base}${id}/`, Boolean(id))

export const useBusinessProfile = () => useDashboardQuery<BusinessProfile>(["dashboard", "billing", "profile"], "/billing/profile/")

/** After any change: refresh lists, the document, Operations (unpaid/overdue) and request cards */
function useBillingDone() {
  const invalidate = useInvalidate()
  const queryClient = useQueryClient()
  return (doc?: BillingDocument) => {
    if (doc) queryClient.setQueryData(["dashboard", "billing", "doc", doc.id], doc)
    invalidate("billing", "ops", "inquiries", "stats", "insights")
  }
}

export type DocumentInput = Partial<Omit<BillingDocument, "client">> & { client?: string | null }

export function useSaveDocument() {
  const done = useBillingDone()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: DocumentInput }) =>
      id ? dashboardRequest<BillingDocument>(`${base}${id}/`, { method: "PATCH", body: data }) : dashboardRequest<BillingDocument>(base, { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useDeleteDocument() {
  const done = useBillingDone()
  return useMutation({
    mutationFn: (id: string) => dashboardRequest<void>(`${base}${id}/`, { method: "DELETE" }),
    onSuccess: () => done(),
  })
}

/** convert (quote → invoice) and send (email with PDF) */
export function useDocumentAction(action: "convert" | "send") {
  const done = useBillingDone()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: Record<string, unknown> }) =>
      dashboardRequest<BillingDocument>(`${base}${id}/${action}/`, { method: "POST", body: body ?? {} }),
    onSuccess: done,
  })
}

export function useQuoteFromRequest() {
  const done = useBillingDone()
  return useMutation({
    mutationFn: (inquiry: string) => dashboardRequest<BillingDocument>(`${base}from-request/`, { method: "POST", body: { inquiry } }),
    onSuccess: done,
  })
}

export function useAddPayment() {
  const done = useBillingDone()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Payment, "id" | "created_at"> }) =>
      dashboardRequest<BillingDocument>(`${base}${id}/payments/`, { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useDeletePayment() {
  const done = useBillingDone()
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId: string }) =>
      dashboardRequest<BillingDocument>(`${base}${id}/payments/${paymentId}/`, { method: "DELETE" }),
    onSuccess: done,
  })
}

export function useSaveProfile() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (data: Partial<BusinessProfile>) => dashboardRequest<BusinessProfile>("/billing/profile/", { method: "PUT", body: data }),
    onSuccess: () => invalidate("billing"),
  })
}

/** Opens the PDF in a new tab, or saves it when `download` is set. */
export async function openPdf(doc: Pick<BillingDocument, "id" | "number">, download = false) {
  // Open the tab first: browsers block pop-ups that are opened after an await
  const tab = download ? null : window.open("", "_blank")
  try {
    const blob = await dashboardFile(`${base}${doc.id}/pdf/`)
    const url = URL.createObjectURL(blob)
    if (tab) {
      tab.location.href = url
    } else {
      const link = document.createElement("a")
      link.href = url
      link.download = `RynexNative-${doc.number}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    tab?.close()
    throw error
  }
}
